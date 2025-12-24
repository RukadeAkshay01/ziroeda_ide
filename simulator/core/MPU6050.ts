import { I2CDevice } from './I2CDevice';

export class MPU6050 implements I2CDevice {
    private registers = new Uint8Array(128);
    private registerPointer = 0;
    private state: 'IDLE' | 'WRITE_REGISTER_INDEX' | 'WRITE_DATA' | 'READ_DATA' = 'IDLE';

    // Sensor Data
    private accelX = 0;
    private accelY = 0;
    private accelZ = 0;
    private gyroX = 0;
    private gyroY = 0;
    private gyroZ = 0;
    private temp = 0;

    constructor() {
        this.reset();
    }

    reset() {
        this.registers.fill(0);
        this.registers[0x75] = 0x68; // WHO_AM_I
        this.registers[0x6B] = 0x40; // PWR_MGMT_1 (Sleep mode default)
        this.state = 'IDLE';
    }

    setAccel(x: number, y: number, z: number) {
        this.accelX = x;
        this.accelY = y;
        this.accelZ = z;
        this.updateRegisters();
    }

    setGyro(x: number, y: number, z: number) {
        this.gyroX = x;
        this.gyroY = y;
        this.gyroZ = z;
        this.updateRegisters();
    }

    setTemperature(t: number) {
        this.temp = t;
        this.updateRegisters();
    }

    private updateRegisters() {
        // Convert physical values to 16-bit 2's complement
        // Accel: 16384 LSB/g (default +/- 2g)
        // Gyro: 131 LSB/deg/s (default +/- 250 deg/s)
        // Temp: 340 LSB/degC + 36.53

        const toInt16 = (val: number) => {
            const int = Math.floor(val);
            return [(int >> 8) & 0xFF, int & 0xFF];
        };

        const [axH, axL] = toInt16(this.accelX * 16384);
        const [ayH, ayL] = toInt16(this.accelY * 16384);
        const [azH, azL] = toInt16(this.accelZ * 16384);

        const [gxH, gxL] = toInt16(this.gyroX * 131);
        const [gyH, gyL] = toInt16(this.gyroY * 131);
        const [gzH, gzL] = toInt16(this.gyroZ * 131);

        const [tH, tL] = toInt16(this.temp * 340 + 12410); // 36.53 * 340 = 12420 approx

        this.registers[0x3B] = axH; this.registers[0x3C] = axL;
        this.registers[0x3D] = ayH; this.registers[0x3E] = ayL;
        this.registers[0x3F] = azH; this.registers[0x40] = azL;

        this.registers[0x41] = tH; this.registers[0x42] = tL;

        this.registers[0x43] = gxH; this.registers[0x44] = gxL;
        this.registers[0x45] = gyH; this.registers[0x46] = gyL;
        this.registers[0x47] = gzH; this.registers[0x48] = gzL;
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
        // Reset internal state if needed, but usually state is set on connect
    }

    writeByte(byte: number): boolean {
        if (this.state === 'WRITE_REGISTER_INDEX') {
            this.registerPointer = byte;
            this.state = 'WRITE_DATA';
            return true;
        } else if (this.state === 'WRITE_DATA') {
            if (this.registerPointer < 128) {
                this.registers[this.registerPointer] = byte;
                this.registerPointer++;
            }
            return true;
        }
        return false;
    }

    readByte(ack: boolean): number {
        let val = 0;
        if (this.registerPointer < 128) {
            val = this.registers[this.registerPointer];
        }
        if (ack) {
            this.registerPointer++;
        }
        return val;
    }
}
