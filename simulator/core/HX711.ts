export class HX711 {
    private weight: number = 0;
    private currentVal: number = 0;
    private sckState: boolean = false;
    private bitIndex: number = 0;
    private dataCallback: ((state: boolean) => void) | null = null;

    // HX711 sends 24 bits of data.
    // The value is 2's complement.

    constructor() {
        this.setWeight(0);
    }

    attach(callback: (state: boolean) => void) {
        this.dataCallback = callback;
        this.updateDataPin(); // Initial state
    }

    private updateDataPin() {
        if (this.dataCallback) {
            this.dataCallback(false);
        }
    }

    setWeight(grams: number) {
        this.weight = grams;
        // Calibration Factor adjusted to 420 (Standard for 5kg Load Cell)
        // 5000g * 420 = 2,100,000 (Very safe, fits 24-bit range 8.3M)

        const calibrationFactor = 420;
        this.currentVal = Math.floor(grams * calibrationFactor);

        console.log(`[HX711] Set Weight: ${grams}g -> Raw: ${this.currentVal}`);

        // HX711 is 24-bit signed. 
        if (this.currentVal > 0x7FFFFF) this.currentVal = 0x7FFFFF;
        if (this.currentVal < -0x800000) this.currentVal = -0x800000;
    }

    onSCKChange(state: boolean) {
        // console.log(`[HX711] SCK: ${state}`);
        if (state && !this.sckState) {
            // Rising Edge
            this.handleRisingEdge();
        }
        this.sckState = state;
    }

    private handleRisingEdge() {
        // If we are in "Ready" state (DOUT Low), we start shifting.

        if (this.bitIndex < 24) {
            // Shift out bit (MSB first)
            const bit = (this.currentVal >> (23 - this.bitIndex)) & 1;
            if (this.dataCallback) this.dataCallback(bit === 1);

            this.bitIndex++;
        } else {
            // Pulses 25-27 (Gain control)
            // DOUT should be High
            if (this.dataCallback) this.dataCallback(true);
            this.bitIndex++;
        }
    }

    update() {
        // If we finished a packet (e.g. enough time passed without SCK), reset?
        // Real HX711 waits for DOUT to go Low to signal ready.
        // In simulation, we can just always be ready after the read sequence is done.

        if (this.bitIndex >= 25) { // Reset after 25+ pulses
            // In reality, it resets when SCK goes low for >60us (Power down) or just after the pulses.
            // Let's just reset if we went past 24 bits and SCK is low.
            if (!this.sckState) {
                this.bitIndex = 0;
                // Signal Ready (Low)
                if (this.dataCallback) this.dataCallback(false);
            }
        } else if (this.bitIndex === 0 && !this.sckState) {
            // Ensure we are Low (Ready) if idle
            if (this.dataCallback) this.dataCallback(false);
        }
    }
}
