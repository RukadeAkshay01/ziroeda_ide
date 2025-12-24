/**
 * @file AVRRunner.ts
 * @description
 * Helper class to set up the AVR8js CPU and peripherals for an ATmega328P (Arduino Uno).
 */

import {
    CPU,
    avrInstruction,
    AVRTimer,
    timer0Config,
    timer1Config,
    timer2Config,
    AVRIOPort,
    portBConfig,
    portCConfig,
    portDConfig,
    AVRUSART,
    usart0Config,
    AVRADC,
    adcConfig,
    AVRTWI,
    twiConfig,
    TWIEventHandler
} from 'avr8js';
import { WS2812Decoder } from './WS2812Decoder';
import { SSD1306 } from './SSD1306';
import { I2CDevice } from './I2CDevice';

export class AVRRunner {
    readonly program = new Uint16Array(0x8000);
    readonly cpu: CPU;
    readonly timer0: AVRTimer;
    readonly timer1: AVRTimer;
    readonly timer2: AVRTimer;
    readonly portB: AVRIOPort;
    readonly portC: AVRIOPort;
    readonly portD: AVRIOPort;
    readonly usart: AVRUSART;
    readonly adc: AVRADC;
    readonly twi: AVRTWI;

    public onSerialOutput: (byte: number) => void = () => { };

    // Track high cycles for each port/pin to calculate duty cycle
    // Map: PortName -> PinIndex -> HighCycles
    private pinHighCycles: Record<string, number[]> = {
        'B': new Array(8).fill(0),
        'C': new Array(8).fill(0),
        'D': new Array(8).fill(0)
    };

    // Track when the pin last toggled (cycle count)
    private pinLastToggleCycle: Record<string, number[]> = {
        'B': new Array(8).fill(0),
        'C': new Array(8).fill(0),
        'D': new Array(8).fill(0)
    };

    // Track last rising edge cycle for pulse width measurement
    private pinLastRisingEdge: Record<string, number[]> = {
        'B': new Array(8).fill(0),
        'C': new Array(8).fill(0),
        'D': new Array(8).fill(0)
    };

    // Track last calculated pulse width (in cycles)
    private pinLastPulseWidth: Record<string, number[]> = {
        'B': new Array(8).fill(0),
        'C': new Array(8).fill(0),
        'D': new Array(8).fill(0)
    };

    // Track current state to handle "currently high" calculation
    private pinState: Record<string, number> = {
        'B': 0,
        'C': 0,
        'D': 0
    };

    private lastCycleCount = 0;
    private currentCycle = 0;

    // --- NeoPixel Support ---
    private neopixelDecoders: Map<string, WS2812Decoder> = new Map();
    public onNeoPixelFrame: (pinId: string, pixels: Uint32Array) => void = () => { };

    // --- I2C / TWI Support ---
    private i2cDevices: I2CDevice[] = [];
    private activeI2CDevice: I2CDevice | null = null;

    private twiEventHandler: TWIEventHandler = {
        start: (repeated) => {
            // Repeated start: if we have an active device, we might want to keep it?
            // Or just notify everyone?
            // Usually START resets the state, address comes next.
            this.i2cDevices.forEach(d => d.start());
            this.twi.completeStart();
        },
        stop: () => {
            this.activeI2CDevice = null;
            this.twi.completeStop();
        },
        connectToSlave: (addr, write) => {
            let ack = false;
            this.activeI2CDevice = null;

            // Find a device that acknowledges this address
            for (const device of this.i2cDevices) {
                if (device.connect(addr, write)) {
                    this.activeI2CDevice = device;
                    ack = true;
                    break;
                }
            }
            this.twi.completeConnect(ack);
        },
        writeByte: (value) => {
            const ack = this.activeI2CDevice ? this.activeI2CDevice.writeByte(value) : false;
            this.twi.completeWrite(ack);
        },
        readByte: (ack) => {
            const value = this.activeI2CDevice ? this.activeI2CDevice.readByte(ack) : 0xFF;
            this.twi.completeRead(value);
        }
    };

    constructor(hex: Uint8Array) {
        // Load program into memory
        this.loadProgram(hex);

        // Initialize CPU
        this.cpu = new CPU(this.program);

        // Initialize Peripherals
        this.timer0 = new AVRTimer(this.cpu, timer0Config);
        this.timer1 = new AVRTimer(this.cpu, timer1Config);
        this.timer2 = new AVRTimer(this.cpu, timer2Config);

        this.portB = new AVRIOPort(this.cpu, portBConfig);
        this.portC = new AVRIOPort(this.cpu, portCConfig);
        this.portD = new AVRIOPort(this.cpu, portDConfig);

        this.usart = new AVRUSART(this.cpu, usart0Config, 16e6);
        this.usart.onByteTransmit = (value) => this.onSerialOutput(value);

        this.adc = new AVRADC(this.cpu, adcConfig);

        // Initialize TWI with 100kHz
        this.twi = new AVRTWI(this.cpu, twiConfig, 100000);
        this.twi.eventHandler = this.twiEventHandler;

        // Add listeners for efficient duty cycle tracking
        this.attachPortListener('B', this.portB);
        this.attachPortListener('C', this.portC);
        this.attachPortListener('D', this.portD);
    }

    private attachPortListener(portName: string, port: AVRIOPort) {
        port.addListener((value) => {
            // console.log(`[AVRRunner] Port ${portName} write: ${value}`);
            const oldVal = this.pinState[portName];
            const changed = oldVal ^ value;
            this.pinState[portName] = value;

            for (let i = 0; i < 8; i++) {
                if (changed & (1 << i)) {
                    // Pin state changed
                    const isHigh = !!(value & (1 << i));
                    const wasHigh = !!(oldVal & (1 << i));

                    // Pulse Width Measurement
                    if (isHigh) {
                        // Rising Edge
                        this.pinLastRisingEdge[portName][i] = this.cpu.cycles;
                    } else {
                        // Falling Edge
                        const start = this.pinLastRisingEdge[portName][i];
                        if (start > 0) {
                            const width = this.cpu.cycles - start;
                            this.pinLastPulseWidth[portName][i] = width;
                        }
                    }

                    // Duty Cycle Tracking (Legacy)
                    // If it WAS high, add the duration to the counter
                    if (wasHigh) {
                        const duration = this.cpu.cycles - this.pinLastToggleCycle[portName][i];
                        this.pinHighCycles[portName][i] += duration;
                    }

                    // Update last toggle time
                    this.pinLastToggleCycle[portName][i] = this.cpu.cycles;
                }

                // Notify NeoPixel Decoders
                const key = `${portName}:${i}`;
                const decoder = this.neopixelDecoders.get(key);
                if (decoder) {
                    // console.log(`[AVRRunner] Updating decoder for ${key}, State: ${!!(value & (1 << i))}`);
                    decoder.update(this.cpu.cycles, !!(value & (1 << i)));
                }
            }
        });
    }

    private loadProgram(hex: Uint8Array) {
        // avr8js expects 16-bit words
        for (let i = 0; i < hex.length; i += 2) {
            const low = hex[i];
            const high = hex[i + 1] || 0;
            this.program[i / 2] = low | (high << 8);
        }
    }

    execute(cycles: number) {
        // if (this.cpu.cycles % 1000000 < cycles) console.log(`[AVRRunner] Heartbeat: ${this.cpu.cycles} cycles`);

        let cyclesExecuted = 0;
        this.lastCycleCount = cycles;
        const startCycles = this.cpu.cycles;

        // Reset counters for this frame
        this.pinHighCycles['B'].fill(0);
        this.pinHighCycles['C'].fill(0);
        this.pinHighCycles['D'].fill(0);

        // If a pin is currently HIGH, its "start time" for this frame is effectively NOW.
        ['B', 'C', 'D'].forEach(portName => {
            for (let i = 0; i < 8; i++) {
                if (this.pinState[portName] & (1 << i)) {
                    this.pinLastToggleCycle[portName][i] = startCycles;
                }
            }
        });

        while (cyclesExecuted < cycles) {
            avrInstruction(this.cpu);
            this.cpu.tick();
            cyclesExecuted++;
        }

        this.currentCycle = this.cpu.cycles;
    }

    setPin(portName: 'B' | 'C' | 'D', pin: number, state: boolean) {
        // console.log(`[AVRRunner] setPin ${portName}${pin} = ${state}`);
        const port = portName === 'B' ? this.portB : portName === 'C' ? this.portC : this.portD;
        if (port) {
            port.setPin(pin, state);
        } else {
            console.warn(`[AVRRunner] Port ${portName} not found!`);
        }
    }

    setAnalogInput(channel: number, voltage: number) {
        this.adc.channelValues[channel] = voltage;
    }

    getPinDutyCycle(portName: 'B' | 'C' | 'D', pin: number): number {
        if (this.lastCycleCount === 0) return 0;

        let highCycles = this.pinHighCycles[portName][pin];

        // If currently high, add the time since last toggle (or start of frame)
        if (this.pinState[portName] & (1 << pin)) {
            highCycles += (this.currentCycle - this.pinLastToggleCycle[portName][pin]);
        }

        return highCycles / this.lastCycleCount;
    }

    getPinPulseWidth(portName: 'B' | 'C' | 'D', pin: number): number {
        const widthCycles = this.pinLastPulseWidth[portName][pin];
        if (widthCycles === 0) return 0;
        // 16MHz clock -> 1/16e6 seconds per cycle
        return widthCycles / 16000000;
    }

    attachNeoPixel(portName: 'B' | 'C' | 'D', pin: number) {
        const key = `${portName}:${pin}`;
        if (this.neopixelDecoders.has(key)) return;

        const decoder = new WS2812Decoder();
        decoder.onFrame = (pixels) => {
            this.onNeoPixelFrame(key, pixels);
        };
        this.neopixelDecoders.set(key, decoder);
    }

    attachI2C(device: I2CDevice) {
        this.i2cDevices.push(device);
    }

    attachOLED(ssd1306: SSD1306) {
        // Backward compatibility / convenience
        this.attachI2C(ssd1306);
    }

    getPinState(portName: 'B' | 'C' | 'D', pin: number): number {
        return (this.pinState[portName] & (1 << pin)) ? 1 : 0;
    }

    attachPinListener(portName: 'B' | 'C' | 'D', pin: number, callback: (state: boolean) => void) {
        const port = portName === 'B' ? this.portB : portName === 'C' ? this.portC : this.portD;
        if (port) {
            let lastValue = ((port.pinState as any) & (1 << pin)) ? true : false;
            port.addListener((value: number) => {
                const isHigh = !!(value & (1 << pin));
                if (isHigh !== lastValue) {
                    lastValue = isHigh;
                    callback(isHigh);
                }
            });
        }
    }
}
