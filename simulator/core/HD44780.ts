/**
 * @file HD44780.ts
 * @description
 * Simulates the HD44780 LCD controller protocol (4-bit mode).
 * Listens to AVR pins via event listeners to capture fast pulses.
 */

import { AVRRunner } from './AVRRunner';

interface PinMapping {
    port: 'B' | 'C' | 'D';
    bit: number;
}

export class HD44780 {
    private runner: AVRRunner;
    private _rows: number;
    private _cols: number;
    private _buffer: string[] = [];
    private _cursorRow: number = 0;
    private _cursorCol: number = 0;

    // Pin Mappings
    private rs: PinMapping;
    private en: PinMapping;
    private d4: PinMapping;
    private d5: PinMapping;
    private d6: PinMapping;
    private d7: PinMapping;

    // Current Pin States (cached)
    private pinState: Record<string, number> = { 'B': 0, 'C': 0, 'D': 0 };

    // 4-bit mode state
    private _nibbleHigh: number | null = null;
    private _lastEnState: boolean = false;
    private _fourBitMode: boolean = false;

    constructor(runner: AVRRunner, rs: number, en: number, d4: number, d5: number, d6: number, d7: number, rows: number = 2, cols: number = 16) {
        this.runner = runner;
        this._rows = rows;
        this._cols = cols;

        this.rs = this.mapPin(rs);
        this.en = this.mapPin(en);
        this.d4 = this.mapPin(d4);
        this.d5 = this.mapPin(d5);
        this.d6 = this.mapPin(d6);
        this.d7 = this.mapPin(d7);

        // Initialize buffer
        this.clear();

        // Attach Listeners
        this.runner.portB.addListener((val) => this.onPortChange('B', val));
        this.runner.portC.addListener((val) => this.onPortChange('C', val));
        this.runner.portD.addListener((val) => this.onPortChange('D', val));

        // Initial state
        this.pinState['B'] = this.runner.cpu.data[0x25];
        this.pinState['C'] = this.runner.cpu.data[0x28];
        this.pinState['D'] = this.runner.cpu.data[0x2b];
    }

    private mapPin(pin: number): PinMapping {
        if (pin >= 0 && pin <= 7) return { port: 'D', bit: pin };
        if (pin >= 8 && pin <= 13) return { port: 'B', bit: pin - 8 };
        if (pin >= 14 && pin <= 19) return { port: 'C', bit: pin - 14 };
        return { port: 'D', bit: 0 }; // Fallback
    }

    private onPortChange(port: 'B' | 'C' | 'D', value: number) {
        this.pinState[port] = value;

        // Check EN pin
        if (this.en.port === port) {
            const enVal = !!(value & (1 << this.en.bit));

            // Falling Edge Detection
            if (this._lastEnState && !enVal) {
                this.latch();
            }
            this._lastEnState = enVal;
        }
    }

    private getPinValue(mapping: PinMapping): number {
        return (this.pinState[mapping.port] & (1 << mapping.bit)) ? 1 : 0;
    }

    private latch() {
        const rs = this.getPinValue(this.rs);
        const d4 = this.getPinValue(this.d4);
        const d5 = this.getPinValue(this.d5);
        const d6 = this.getPinValue(this.d6);
        const d7 = this.getPinValue(this.d7);

        const nibble = (d7 << 3) | (d6 << 2) | (d5 << 1) | d4;

        // console.log(`[HD44780] Latch! RS=${rs} Nibble=${nibble.toString(16)} Mode=${this._fourBitMode ? '4bit' : '8bit'}`);

        if (!this._fourBitMode) {
            // 8-bit mode (but only 4 pins connected)
            // In this mode, we interpret the nibble as the High Nibble of the byte,
            // and assume the Low Nibble is 0 (since D0-D3 are not connected).
            // This allows handling the initialization sequence: 0x3, 0x3, 0x3, 0x2.
            const byte = (nibble << 4);

            if (rs) {
                // Data in 8-bit mode (rare during init, but possible)
                console.log(`[HD44780] Data (8-bit): 0x${byte.toString(16)}`);
                this.handleData(byte);
            } else {
                console.log(`[HD44780] Command (8-bit): 0x${byte.toString(16)}`);
                this.handleCommand(byte);
            }
        } else {
            // 4-bit mode
            if (this._nibbleHigh === null) {
                this._nibbleHigh = nibble;
            } else {
                const byte = (this._nibbleHigh << 4) | nibble;
                this._nibbleHigh = null;

                if (rs) {
                    console.log(`[HD44780] Data: 0x${byte.toString(16)} ('${String.fromCharCode(byte)}')`);
                    this.handleData(byte);
                } else {
                    console.log(`[HD44780] Command: 0x${byte.toString(16)}`);
                    this.handleCommand(byte);
                }
            }
        }
    }

    private handleCommand(cmd: number) {
        // Function Set Detection
        if ((cmd & 0xF0) === 0x20) {
            // Function Set: 4-bit mode
            // DL (Bit 4) = 0
            if ((cmd & 0x10) === 0x00) {
                this._fourBitMode = true;
                console.log("[HD44780] Switched to 4-bit mode");
            }
        } else if ((cmd & 0xF0) === 0x30) {
            // Function Set: 8-bit mode
            // DL (Bit 4) = 1
            if ((cmd & 0x10) === 0x10) {
                this._fourBitMode = false;
                this._nibbleHigh = null; // Reset nibble buffer
                console.log("[HD44780] Switched to 8-bit mode");
            }
        }

        if (cmd === 0x01) {
            this.clear();
        } else if (cmd === 0x02) {
            this._cursorRow = 0;
            this._cursorCol = 0;
        } else if (cmd & 0x80) {
            const addr = cmd & 0x7F;
            if (addr >= 0x40) {
                this._cursorRow = 1;
                this._cursorCol = addr - 0x40;
            } else {
                this._cursorRow = 0;
                this._cursorCol = addr;
            }
        }
    }

    private handleData(char: number) {
        if (this._cursorRow < this._rows && this._cursorCol < this._cols) {
            const rowStr = this._buffer[this._cursorRow];
            // Ensure we don't go out of bounds if rowStr is shorter than expected (shouldn't happen with fixed init)
            if (this._cursorCol < rowStr.length) {
                const newRow = rowStr.substring(0, this._cursorCol) + String.fromCharCode(char) + rowStr.substring(this._cursorCol + 1);
                this._buffer[this._cursorRow] = newRow;
                this._cursorCol++;
            }
        }
    }

    private clear() {
        this._buffer = [];
        for (let i = 0; i < this._rows; i++) {
            this._buffer[i] = " ".repeat(this._cols);
        }
        this._cursorRow = 0;
        this._cursorCol = 0;
    }

    public getBuffer(): string[] {
        return this._buffer;
    }
}
