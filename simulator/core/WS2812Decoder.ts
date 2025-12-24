/**
 * @file WS2812Decoder.ts
 * @description
 * Decodes WS2812 (NeoPixel) protocol from pin state changes.
 * 
 * WS2812 Timing (approximate):
 * - T0H: 0.4us
 * - T0L: 0.85us
 * - T1H: 0.8us
 * - T1L: 0.45us
 * - RES: > 50us
 * 
 * CPU Clock: 16MHz => 1 cycle = 0.0625us
 * - T0H: ~6.4 cycles
 * - T0L: ~13.6 cycles
 * - T1H: ~12.8 cycles
 * - T1L: ~7.2 cycles
 * - RES: > 800 cycles
 */

export class WS2812Decoder {
    private lastCycle: number = 0;
    private lastState: boolean = false;

    private currentByte: number = 0;
    private bitCount: number = 0;
    private pixels: number[] = []; // Int32 colors (0xRRGGBB) or similar

    // We'll store raw RGB values
    private buffer: Uint8Array = new Uint8Array(0);
    private bufferIndex: number = 0;

    public onFrame: (pixels: Uint32Array) => void = () => { };

    constructor(private cpuFrequency: number = 16000000) { }

    reset() {
        this.pixels = [];
        this.bufferIndex = 0;
        this.bitCount = 0;
        this.currentByte = 0;
        this.lastCycle = 0;
        this.lastState = false;
    }

    // Called whenever the pin changes state
    update(cycle: number, state: boolean) {
        if (this.lastCycle === 0) {
            this.lastCycle = cycle;
            this.lastState = state;
            return;
        }

        const delta = cycle - this.lastCycle;
        this.lastCycle = cycle;

        // console.log(`[WS2812] State: ${state}, Delta: ${delta}`);

        if (state === false) {
            // Transitioned High -> Low. `delta` is the duration of the High pulse.
            // Check if it's a T0H or T1H
            // 0.4us = ~6 cycles
            // 0.8us = ~13 cycles
            // Let's use ranges.

            // 16MHz:
            // T0H (0.4us) = 6.4 cycles. Range: 2-10
            // T1H (0.8us) = 12.8 cycles. Range: 11-20

            if (delta >= 2 && delta <= 10) {
                this.recordBit(0);
            } else if (delta >= 11 && delta <= 35) { // Increased range slightly
                this.recordBit(1);
            } else {
                // Invalid high pulse
                // console.warn(`[WS2812] Invalid High Pulse: ${delta} cycles`);
            }
        } else {
            // Transitioned Low -> High. `delta` is the duration of the Low pulse.
            // Reset is > 50us (> 800 cycles).
            if (delta > 400) { // 400 cycles = 25us, good enough threshold
                this.emitFrame();
            }
        }

        this.lastState = state;
    }

    private recordBit(bit: number) {
        // console.log(`[WS2812] Bit: ${bit}`);
        this.currentByte = (this.currentByte << 1) | bit;
        this.bitCount++;

        if (this.bitCount === 8) {
            this.pixels.push(this.currentByte);
            this.currentByte = 0;
            this.bitCount = 0;
        }
    }

    private emitFrame() {
        if (this.pixels.length > 0) {
            // console.log(`[WS2812] Frame Emitted: ${this.pixels.length / 3} pixels`);
            // Convert to Uint32Array (0x00RRGGBB or similar)
            // WS2812 usually sends GRB
            const count = Math.floor(this.pixels.length / 3);
            const result = new Uint32Array(count);

            for (let i = 0; i < count; i++) {
                const g = this.pixels[i * 3 + 0];
                const r = this.pixels[i * 3 + 1];
                const b = this.pixels[i * 3 + 2];
                // Pack as 0xAABBGGRR (little endian) or just standard RGB int
                // Wokwi element usually expects standard hex or similar.
                // Let's pack as 0xFFRRGGBB (Full Alpha)
                result[i] = 0xFF000000 | (r << 16) | (g << 8) | b;
            }

            this.onFrame(result);
            this.pixels = [];
            this.bitCount = 0;
            this.currentByte = 0;
        }
    }
}
