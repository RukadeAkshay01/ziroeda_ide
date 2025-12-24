import { I2CDevice } from './I2CDevice';

export class DS1307 implements I2CDevice {
    private registers = new Uint8Array(64); // 00h-07h: Time/Date, 08h-3Fh: RAM
    private registerPointer = 0;
    private state: 'IDLE' | 'WRITE_REGISTER_INDEX' | 'WRITE_DATA' | 'READ_DATA' = 'IDLE';

    constructor() {
        this.reset();
    }

    reset() {
        this.registers.fill(0);
        // Initialize with a default time or system time?
        // Let's initialize with system time for convenience
        this.setTime(new Date());
    }

    setTime(date: Date) {
        const decToBcd = (val: number) => ((Math.floor(val / 10) << 4) | (val % 10));

        this.registers[0] = decToBcd(date.getSeconds()); // CH bit is bit 7, 0=Oscillator On
        this.registers[1] = decToBcd(date.getMinutes());
        this.registers[2] = decToBcd(date.getHours()); // 24-hour mode assumed for simplicity
        this.registers[3] = decToBcd(date.getDay() + 1); // 1-7 (1=Sunday)
        this.registers[4] = decToBcd(date.getDate());
        this.registers[5] = decToBcd(date.getMonth() + 1);
        this.registers[6] = decToBcd(date.getFullYear() - 2000);
    }

    // --- I2CDevice Implementation ---

    connect(addr: number, write: boolean): boolean {
        if (addr === 0x68) {
            this.state = write ? 'WRITE_REGISTER_INDEX' : 'READ_DATA';
            return true;
        }
        return false;
    }

    start() {
        // Reset internal state if needed
    }

    writeByte(byte: number): boolean {
        if (this.state === 'WRITE_REGISTER_INDEX') {
            this.registerPointer = byte & 0x3F; // Limit to 64 bytes
            this.state = 'WRITE_DATA';
            return true;
        } else if (this.state === 'WRITE_DATA') {
            if (this.registerPointer < 64) {
                this.registers[this.registerPointer] = byte;
                this.registerPointer++;
            }
            return true;
        }
        return false;
    }

    readByte(ack: boolean): number {
        let val = 0;
        if (this.registerPointer < 64) {
            val = this.registers[this.registerPointer];
        }
        if (ack) {
            this.registerPointer++;
            if (this.registerPointer >= 64) this.registerPointer = 0; // Wrap around?
        }
        return val;
    }
}
