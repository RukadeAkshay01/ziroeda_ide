/**
 * MembraneKeypad.ts
 * - Synchronous updates required for correct simulation of matrix scanning
 * - Includes redundant setPin avoidance
 * - Robust isMcuDrivingLow
 */

import { AVRRunner } from './AVRRunner';
import { AVRIOPort } from 'avr8js';

type PinMapIn = { port: number, bit: number };
type PortName = 'B' | 'C' | 'D';

export class MembraneKeypad {
    private keys: boolean[][] = []; // 4x4 matrix of pressed states

    // Map of keypad pin name ('R1'...'C4') to { port: 'B' | 'C' | 'D', pin: number }
    private pinMapping: Map<string, { port: PortName, pin: number }> = new Map();

    private listeners: Array<{ port: AVRIOPort, listener: (value: number) => void }> = [];

    // keep last applied simulated state to avoid redundant runner.setPin calls
    private lastApplied: Map<string, boolean> = new Map();

    // Reentrancy guard
    private isUpdating = false;

    constructor(
        private runner: AVRRunner,
        pins: Map<string, PinMapIn>
    ) {
        // Convert generic port numbers to 'B', 'C', 'D'
        for (const [name, pin] of pins.entries()) {
            let portName: PortName | null = null;
            if (pin.port === 0x25) portName = 'B';
            else if (pin.port === 0x28) portName = 'C';
            else if (pin.port === 0x2B) portName = 'D';

            if (portName) {
                this.pinMapping.set(name, { port: portName, pin: pin.bit });
            }
        }

        // Attach listeners for immediate updates
        const portNames: PortName[] = ['B', 'C', 'D'];
        portNames.forEach(name => {
            const hasPinOnPort = Array.from(this.pinMapping.values()).some(m => m.port === name);
            if (hasPinOnPort) {
                const port = name === 'B' ? runner.portB : name === 'C' ? runner.portC : runner.portD;
                const listener = () => {
                    this.update();
                };
                port.addListener(listener);
                this.listeners.push({ port, listener });
            }
        });

        // Initialize 4x4 matrix
        for (let r = 0; r < 4; r++) {
            this.keys[r] = [false, false, false, false];
        }
    }

    setKey(key: string, pressed: boolean) {
        const layout = [
            ['1', '2', '3', 'A'],
            ['4', '5', '6', 'B'],
            ['7', '8', '9', 'C'],
            ['*', '0', '#', 'D']
        ];

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (layout[r][c] === key) {
                    this.keys[r][c] = pressed;
                    this.update();
                    return;
                }
            }
        }
    }

    private isMcuDrivingLow(portName: PortName, pin: number): boolean {
        const port = portName === 'B' ? this.runner.portB : portName === 'C' ? this.runner.portC : this.runner.portD;
        // @ts-ignore
        const config = (port as any).portConfig;
        if (!config) return false;

        const ddrAddr = config.DDR;
        const portAddr = config.PORT;

        const ddr = this.runner.cpu.data[ddrAddr];
        const portVal = this.runner.cpu.data[portAddr];

        return ((ddr & (1 << pin)) !== 0) && ((portVal & (1 << pin)) === 0);
    }

    update() {
        // Critical: Synchronous update. 
        // If we delay (e.g. requestAnimationFrame), the MCU will have moved to scan the next row
        // by the time we react, causing missed key presses.

        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            const activeLowPins = new Set<string>();

            // 1) Check for pressed keys and simulate shorts
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (!this.keys[r][c]) continue;

                    const rowPinName = `R${r + 1}`;
                    const colPinName = `C${c + 1}`;
                    const rowMap = this.pinMapping.get(rowPinName);
                    const colMap = this.pinMapping.get(colPinName);

                    if (rowMap && colMap) {
                        const rowDrivenLow = this.isMcuDrivingLow(rowMap.port, rowMap.pin);
                        const colDrivenLow = this.isMcuDrivingLow(colMap.port, colMap.pin);

                        if (rowDrivenLow) activeLowPins.add(colPinName);
                        if (colDrivenLow) activeLowPins.add(rowPinName);
                    }
                }
            }

            // 2) Apply states efficiently
            this.pinMapping.forEach((map, name) => {
                const shouldBeLow = activeLowPins.has(name);
                const desiredLevel = !shouldBeLow; // true = HIGH (pullup), false = LOW (driven)

                // Cache check to avoid expensive setPin calls if state hasn't changed
                const prev = this.lastApplied.get(name);
                if (prev === desiredLevel) {
                    return;
                }
                this.lastApplied.set(name, desiredLevel);
                this.runner.setPin(map.port, map.pin, desiredLevel);
            });

        } finally {
            this.isUpdating = false;
        }
    }

    dispose() {
        this.listeners.forEach(({ port, listener }) => {
            port.removeListener(listener);
        });
        this.listeners = [];
        this.lastApplied.clear();
        this.pinMapping.clear();
    }
}
