export class Joystick {
    // Callbacks to update the MCU pins
    private onXChange: ((voltage: number) => void) | null = null;
    private onYChange: ((voltage: number) => void) | null = null;
    private onSWChange: ((state: boolean) => void) | null = null;

    constructor() { }

    attachX(callback: (voltage: number) => void) {
        this.onXChange = callback;
    }

    attachY(callback: (voltage: number) => void) {
        this.onYChange = callback;
    }

    attachSW(callback: (state: boolean) => void) {
        this.onSWChange = callback;
    }

    setX(value: number) {
        // Value is -1 to 1 (from UI typically) or 0 to 1?
        // Let's assume input is 0.0 to 1.0 where 0.5 is center.
        // Map to 0-5V
        if (this.onXChange) {
            this.onXChange(value * 5.0);
        }
    }

    setY(value: number) {
        if (this.onYChange) {
            this.onYChange(value * 5.0);
        }
    }

    setPress(pressed: boolean) {
        // Active LOW usually?
        // Let's assume the switch connects to GND when pressed.
        // So Pressed = FALSE (LOW), Released = TRUE (HIGH) if pulled up.
        // Or simpler: just pass the boolean state and let Simulator decide polarity.
        // Standard module: Pressed = LOW (connects to ground).
        // Let's assume input 'pressed' is true when user presses it.
        // So output should be LOW.
        if (this.onSWChange) {
            this.onSWChange(!pressed); // Invert: Press(true) -> Pin(LOW/false)
        }
    }
}
