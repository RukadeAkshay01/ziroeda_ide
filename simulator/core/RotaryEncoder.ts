import { AVRRunner } from './AVRRunner';

export class RotaryEncoder {
    private runner: AVRRunner;
    private pinCLK: number;
    private pinDT: number;
    private pinSW: number;

    private state: 'IDLE' | 'CW_STEP_1' | 'CW_STEP_2' | 'CW_STEP_3' | 'CCW_STEP_1' | 'CCW_STEP_2' | 'CCW_STEP_3' = 'IDLE';
    private lastUpdate: number = 0;
    private stepDelay: number = 2000; // Cycles between signal changes (adjust for speed)

    constructor(runner: AVRRunner, pinCLK: number, pinDT: number, pinSW: number) {
        this.runner = runner;
        this.pinCLK = pinCLK;
        this.pinDT = pinDT;
        this.pinSW = pinSW;

        // Initial State: Both High (Pull-up)
        this.writePins(true, true);
        this.writeSW(true);
    }

    rotateCW() {
        // Queue a CW rotation sequence
        // Sequence: CLK Low -> DT Low -> CLK High -> DT High
        // Or simpler: CLK falls while DT is High
        this.state = 'CW_STEP_1';
        this.lastUpdate = this.runner.cpu.cycles;
    }

    rotateCCW() {
        // Queue a CCW rotation sequence
        // Sequence: DT Low -> CLK Low -> DT High -> CLK High
        // Or simpler: CLK falls while DT is Low
        this.state = 'CCW_STEP_1';
        this.lastUpdate = this.runner.cpu.cycles;
    }

    pressButton(pressed: boolean) {
        this.writeSW(!pressed); // Active Low
    }

    update(cycles: number) {
        if (this.state === 'IDLE') return;

        if (cycles - this.lastUpdate < this.stepDelay) return;
        this.lastUpdate = cycles;

        switch (this.state) {
            case 'CW_STEP_1':
                // CLK Low, DT High
                this.writePins(false, true);
                this.state = 'CW_STEP_2';
                break;
            case 'CW_STEP_2':
                // CLK Low, DT Low
                this.writePins(false, false);
                this.state = 'CW_STEP_3';
                break;
            case 'CW_STEP_3':
                // CLK High, DT Low
                this.writePins(true, false);
                this.state = 'IDLE';
                // Final: Both High
                this.writePins(true, true);
                break;

            case 'CCW_STEP_1':
                // CLK High, DT Low
                this.writePins(true, false);
                this.state = 'CCW_STEP_2';
                break;
            case 'CCW_STEP_2':
                // CLK Low, DT Low
                this.writePins(false, false);
                this.state = 'CCW_STEP_3';
                break;
            case 'CCW_STEP_3':
                // CLK Low, DT High
                this.writePins(false, true);
                this.state = 'IDLE';
                // Final: Both High
                this.writePins(true, true);
                break;
        }
    }

    private writePins(clk: boolean, dt: boolean) {
        const clkInfo = this.getPinInfo(this.pinCLK);
        const dtInfo = this.getPinInfo(this.pinDT);

        if (clkInfo.port) this.runner.setPin(clkInfo.port, clkInfo.bit, clk);
        if (dtInfo.port) this.runner.setPin(dtInfo.port, dtInfo.bit, dt);
    }

    private writeSW(high: boolean) {
        const swInfo = this.getPinInfo(this.pinSW);
        if (swInfo.port) this.runner.setPin(swInfo.port, swInfo.bit, high);
    }

    private getPinInfo(pin: number): { port: 'B' | 'C' | 'D' | null, bit: number } {
        if (pin >= 0 && pin <= 7) return { port: 'D', bit: pin };
        if (pin >= 8 && pin <= 13) return { port: 'B', bit: pin - 8 };
        if (pin >= 14 && pin <= 19) return { port: 'C', bit: pin - 14 };
        return { port: null, bit: 0 };
    }
}
