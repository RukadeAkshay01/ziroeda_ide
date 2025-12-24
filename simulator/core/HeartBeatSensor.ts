import { AVRRunner } from "./AVRRunner";

export interface HeartBeatPinConfig {
    port: 'B' | 'C' | 'D'; // Port Name
    bit: number;           // Bit index (0-7)
    adcChannel?: number;   // Optional ADC channel (0-7) if available
}

export class HeartBeatSensor {
    private runner: AVRRunner;
    private pinConfig: HeartBeatPinConfig;

    public bpm: number = 60;
    public active: boolean = false;

    private pulseWidth: number = 100; // ms
    private lastBeatTime: number = 0; // ms
    private isHigh: boolean = false;

    constructor(runner: AVRRunner, config: HeartBeatPinConfig) {
        this.runner = runner;
        this.pinConfig = config;
    }

    update() {
        if (Math.random() < 0.001) console.log(`[HeartBeatSensor] Update Loop Alive. Active=${this.active}, isHigh=${this.isHigh}`);

        if (!this.active) {
            if (this.isHigh) {
                this.setPin(0); // Ensure low if inactive
                this.isHigh = false;
            }
            return;
        }

        // Calculate time in ms based on CPU cycles
        // 16MHz = 16,000,000 cycles / second = 16,000 cycles / ms
        const timeMs = this.runner.cpu.cycles / 16000;

        const beatInterval = 60000 / this.bpm; // ms per beat

        if (timeMs - this.lastBeatTime >= beatInterval) {
            this.lastBeatTime = timeMs;
            console.log(`[HeartBeatSensor] Beat! BPM: ${this.bpm}, Interval: ${beatInterval.toFixed(2)}ms (Time: ${timeMs.toFixed(2)})`);
            this.setPin(5.0); // High (5V)
            this.isHigh = true;
        } else if (this.isHigh && timeMs - this.lastBeatTime >= this.pulseWidth) {
            this.setPin(0); // Low (0V)
            this.isHigh = false;
        }
    }

    private setPin(voltage: number) {
        // 1. Digital Write (Universal support)
        const isHigh = voltage > 2.5;
        this.runner.setPin(this.pinConfig.port, this.pinConfig.bit, isHigh);

        // 2. Analog Write (If ADC is available on this pin)
        // This supports 'analogRead()' usage
        if (this.pinConfig.adcChannel !== undefined && this.pinConfig.adcChannel >= 0) {
            this.runner.setAnalogInput(this.pinConfig.adcChannel, voltage);
        }
    }
}
