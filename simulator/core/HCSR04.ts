import { AVRRunner } from './AVRRunner';
import { CPU } from 'avr8js';

export class HCSR04 {
    private runner: AVRRunner;
    private cpu: CPU;
    private trigPin: number;
    private echoPin: number;
    private distanceCm: number = 100; // Default distance

    // State Machine
    private state: 'IDLE' | 'TRIGGER_HIGH' | 'PROCESSING' | 'ECHO_HIGH' = 'IDLE';
    private stateStartTime: number = 0;
    private echoDurationCycles: number = 0;
    private processingDelayCycles: number = 8000; // ~500us delay

    constructor(runner: AVRRunner, trigPin: number, echoPin: number) {
        this.runner = runner;
        this.cpu = runner.cpu;
        this.trigPin = trigPin;
        this.echoPin = echoPin;

        // Attach listener to TRIG pin
        const { port, bit } = this.getPinInfo(trigPin);
        if (port) {
            this.runner.attachPinListener(port, bit, (state) => this.onTrigChange(state));
        }
    }

    setDistance(cm: number) {
        this.distanceCm = Math.max(2, Math.min(400, cm));
    }

    private onTrigChange(state: boolean) {
        const currentTime = this.cpu.cycles;

        if (this.state === 'IDLE' && state) {
            // Rising edge of Trigger
            this.state = 'TRIGGER_HIGH';
            this.stateStartTime = currentTime;
            // console.log('[HCSR04] Trigger Rising Edge');
        } else if (this.state === 'TRIGGER_HIGH' && !state) {
            // Falling edge of Trigger
            // Start Processing (Delay before Echo)
            this.state = 'PROCESSING';
            this.stateStartTime = currentTime;
            // console.log('[HCSR04] Trigger Falling Edge -> Processing');
        }
    }

    update(cycles: number) {
        const currentTime = this.cpu.cycles;

        if (this.state === 'PROCESSING') {
            if (currentTime - this.stateStartTime >= this.processingDelayCycles) {
                // End of Processing, Start Echo
                this.state = 'ECHO_HIGH';
                this.stateStartTime = currentTime;

                // Calculate Echo duration
                // Speed of sound: 343 m/s = 0.0343 cm/us -> ~29.15 us/cm (one way) -> ~58.3 us/cm (round trip)
                // 16 cycles per us (16MHz)
                // cycles = cm * 58.3 * 16 = cm * 932.8
                // Using 933 for better precision with standard float math on Arduino side
                this.echoDurationCycles = Math.round(this.distanceCm * 933);

                // Set ECHO High
                this.writePin(this.echoPin, true);
                // console.log(`[HCSR04] Echo START (Dist: ${this.distanceCm}cm, Cycles: ${this.echoDurationCycles})`);
            }
        } else if (this.state === 'ECHO_HIGH') {
            if (currentTime - this.stateStartTime >= this.echoDurationCycles) {
                // End of Echo pulse
                this.writePin(this.echoPin, false);
                this.state = 'IDLE';
                // console.log('[HCSR04] Echo END');
            }
        }
    }

    private getPinInfo(pin: number): { port: 'B' | 'C' | 'D' | null, bit: number } {
        if (pin >= 0 && pin <= 7) return { port: 'D', bit: pin };
        if (pin >= 8 && pin <= 13) return { port: 'B', bit: pin - 8 };
        if (pin >= 14 && pin <= 19) return { port: 'C', bit: pin - 14 };
        return { port: null, bit: 0 };
    }

    private writePin(pin: number, high: boolean) {
        const { port, bit } = this.getPinInfo(pin);
        if (port) {
            this.runner.setPin(port, bit, high);
        }
    }
}
