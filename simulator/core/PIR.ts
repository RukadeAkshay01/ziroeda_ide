import { AVRRunner } from './AVRRunner';

export class PIR {
    private runner: AVRRunner;
    private pin: number;
    private detected: boolean = false;

    constructor(runner: AVRRunner, pin: number) {
        this.runner = runner;
        this.pin = pin;
    }

    setMotion(detected: boolean) {
        this.detected = detected;
        this.updatePin();
    }

    private updatePin() {
        const { port, bit } = this.getPinInfo(this.pin);
        if (port) {
            // PIR output is usually HIGH when motion detected
            console.log(`[PIR] Setting Pin ${this.pin} (${port}:${bit}) to ${this.detected ? 'HIGH' : 'LOW'}`);
            this.runner.setPin(port, bit, this.detected);
        }
    }

    private getPinInfo(pin: number): { port: 'B' | 'C' | 'D' | null, bit: number } {
        if (pin >= 0 && pin <= 7) return { port: 'D', bit: pin };
        if (pin >= 8 && pin <= 13) return { port: 'B', bit: pin - 8 };
        if (pin >= 14 && pin <= 19) return { port: 'C', bit: pin - 14 };
        return { port: null, bit: 0 };
    }
}
