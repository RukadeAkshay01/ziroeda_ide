import { AVRRunner } from './AVRRunner';
import { CPU } from 'avr8js';

export class DHT22 {
    private runner: AVRRunner;
    private cpu: CPU;
    private pin: number;
    private temperature: number = 24.0;
    private humidity: number = 50.0;

    // Simplified State Machine
    private state: 'IDLE' | 'RESPONSE_LOW' | 'RESPONSE_HIGH' | 'SENDING_DATA' | 'RESPONSE_END' = 'IDLE';
    private stateStartTime: number = 0;

    // Data Transmission
    private data: Uint8Array = new Uint8Array(5);
    private currentBit: number = 0;
    private lastBitTime: number = 0;

    constructor(runner: AVRRunner, pin: number) {
        this.runner = runner;
        this.cpu = runner.cpu;
        this.pin = pin;

        // console.log(`[DHT22] FRESH Init on pin ${pin}`);

        // Attach listener for Start Signal (MCU pulls LOW)
        const { port, bit } = this.getPinInfo(pin);
        if (port) {
            this.runner.attachPinListener(port, bit, (state) => this.onPinChange(state));
        }
    }

    setEnvironment(temp: number, hum: number) {
        this.temperature = Math.max(-40, Math.min(80, temp));
        this.humidity = Math.max(0, Math.min(100, hum));
    }

    private onPinChange(state: boolean) {
        const now = this.cpu.cycles;
        // console.log(`[DHT22] Pin change: ${state ? 'HIGH' : 'LOW'} at ${now}, State: ${this.state}`);

        // MCU pulls LOW to request data (Start Signal)
        if (this.state === 'IDLE' && !state) {
            // console.log(`[DHT22] Start Signal Detected (LOW) at ${now}`);
            this.stateStartTime = now;
        }
        // MCU releases line (HIGH) - End of Start Signal
        else if (this.state === 'IDLE' && state) {
            const duration = now - this.stateStartTime;
            // console.log(`[DHT22] Pin went HIGH. Duration since LOW: ${duration} cycles`);
            // Valid start signal is usually >1ms (16000 cycles)
            // We'll be generous and accept >500us (8000 cycles)
            if (duration > 8000) {
                // console.log(`[DHT22] Valid Start Signal (${duration} cycles). Preparing Response.`);
                this.startResponse();
            }
        }
    }

    private startResponse() {
        this.prepareData();
        this.state = 'RESPONSE_LOW';
        // Wait 10us (160 cycles) to simulate the MCU release time.
        this.stateStartTime = this.cpu.cycles + 160;
    }

    update(cycles: number) {
        const now = this.cpu.cycles;

        if (this.state === 'IDLE') return;

        if (this.state === 'RESPONSE_LOW') {
            if (now >= this.stateStartTime) {
                // Sensor pulls LOW for 80us (1280 cycles)
                this.writePin(false);
                if (now - this.stateStartTime >= 1280) {
                    this.state = 'RESPONSE_HIGH';
                    this.stateStartTime = now;
                    // console.log(`[DHT22] Response LOW done. Switching to HIGH.`);
                }
            }
        } else if (this.state === 'RESPONSE_HIGH') {
            // Sensor pulls HIGH for 80us (1280 cycles)
            this.writePin(true);
            if (now - this.stateStartTime >= 1280) {
                this.state = 'SENDING_DATA';
                this.currentBit = 0;
                this.lastBitTime = now;
                // console.log(`[DHT22] Response HIGH done. Starting Data Transmission.`);
            }
        } else if (this.state === 'SENDING_DATA') {
            this.sendData(now);
        } else if (this.state === 'RESPONSE_END') {
            // End of transmission: Pull LOW for 50us (800 cycles)
            this.writePin(false);
            if (now - this.stateStartTime >= 800) {
                this.state = 'IDLE';
                this.writePin(true); // Release bus
                // console.log(`[DHT22] End Signal Complete. Bus Released.`);
            }
        }
    }

    private sendData(now: number) {
        // Data Transmission Logic:
        // Each bit starts with 50us LOW
        // Then 26-28us HIGH for '0', or 70us HIGH for '1'

        const timeSinceBitStart = now - this.lastBitTime;
        const bitIndex = Math.floor(this.currentBit / 8);
        const bitPos = 7 - (this.currentBit % 8);
        const bitValue = (this.data[bitIndex] >> bitPos) & 1;

        const T_LOW = 50 * 16; // 800 cycles
        const T_HIGH_0 = 27 * 16; // 432 cycles
        const T_HIGH_1 = 70 * 16; // 1120 cycles
        const T_HIGH = bitValue ? T_HIGH_1 : T_HIGH_0;

        if (timeSinceBitStart < T_LOW) {
            // Phase 1: LOW
            this.writePin(false);
        } else if (timeSinceBitStart < T_LOW + T_HIGH) {
            // Phase 2: HIGH
            this.writePin(true);
        } else {
            // Bit Complete
            this.currentBit++;
            this.lastBitTime = now;

            if (this.currentBit >= 40) {
                // console.log(`[DHT22] Transmission Complete. Sending End Signal.`);
                this.state = 'RESPONSE_END';
                this.stateStartTime = now;
                this.writePin(false); // Start pulling LOW
            }
        }
    }

    private prepareData() {
        const h = Math.round(this.humidity * 10);
        const t = Math.round(Math.abs(this.temperature) * 10);

        this.data[0] = (h >> 8) & 0xFF;
        this.data[1] = h & 0xFF;
        this.data[2] = (t >> 8) & 0xFF;
        this.data[3] = t & 0xFF;
        if (this.temperature < 0) this.data[2] |= 0x80;

        // Checksum
        this.data[4] = (this.data[0] + this.data[1] + this.data[2] + this.data[3]) & 0xFF;
        // console.log(`[DHT22] Data Prepared: [${this.data[0]}, ${this.data[1]}, ${this.data[2]}, ${this.data[3]}, ${this.data[4]}]`);
    }

    private getPinInfo(pin: number): { port: 'B' | 'C' | 'D' | null, bit: number } {
        if (pin >= 0 && pin <= 7) return { port: 'D', bit: pin };
        if (pin >= 8 && pin <= 13) return { port: 'B', bit: pin - 8 };
        if (pin >= 14 && pin <= 19) return { port: 'C', bit: pin - 14 };
        return { port: null, bit: 0 };
    }

    private writePin(high: boolean) {
        // console.log(`[DHT22] writePin(${high})`);
        const { port, bit } = this.getPinInfo(this.pin);
        if (port) {
            this.runner.setPin(port, bit, high);
        }
    }
}
