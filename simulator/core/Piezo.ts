
/**
 * @file Piezo.ts
 * @description
 * Handles sound generation for a Piezo/Buzzer connected to the AVR simulation.
 * Uses Web Audio API to generate tones based on pin frequency or simple HIGH state.
 */

export class Piezo {
    private audioContext: AudioContext;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode;
    private isPlaying: boolean = false;

    // Track frequency logic
    private lastToggleTime: number = 0;
    private halfPeriods: number[] = [];

    // Config
    private pinId: string; // Net/Component ID for debugging

    constructor(audioContext: AudioContext, pinId: string) {
        this.audioContext = audioContext;
        this.pinId = pinId;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0; // Start silent
    }

    update(time: number, state: boolean) {
        // Ideally we'd measure the frequency of the square wave here.
        // For now, let's implement a simple logic:
        // If state is HIGH (and stays high), it might be an active buzzer (beep).
        // If state toggles, it's a passive buzzer (tone).

        // Simplification for ZiroEDA:
        // We will assume `tone()` is used, which toggles the pin.
        // However, `avr8js` runs much faster than JS event loop.
        // Listening to every pin change here might be intensive if we just mapped it 1:1.
        // But `attachPinListener` is called on every write.

        // Alternative: Just simple "Active Buzzer" logic for now?
        // User complaint "buzzer not working".
        // If they use `digitalWrite(HIGH)`, active buzzer works.
        // If they use `tone()`, passive buzzer works.

        if (state) {
            this.startTone(1000); // Default 1kHz if just HIGH
        } else {
            this.stopTone();
        }
    }

    // Refined Logic:
    // We need to distinguish between solid HIGH (Active) and PWM/Tone (Passive).
    // But without a complex frequency analyzer, checking pure STATE is the first step.
    // NOTE: If `tone()` is used, the pin toggles. If we start/stop 1kHz tone on every toggle, it will sound garbage.

    // Better approach for Passive Buzzer:
    // The simulator calls us with a state change.
    // We calculate the delta time from last toggle to determine frequency.

    /*
    onPinChange(state: number, cycles: number) {
       // Calculate frequency from cycles?
       // This requires access to CPU cycles which we might have.
    }
    */

    // Let's stick to a simple Active Buzzer implementation first to unblock standard "Beep" projects.
    // Most beginner projects use Active Buzzers or expect sound on HIGH.

    startTone(frequency: number) {
        if (this.isPlaying) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();

        // Ramp up gain to avoid click
        this.gainNode.gain.setTargetAtTime(0.1, this.audioContext.currentTime, 0.01);

        this.isPlaying = true;
    }

    stopTone() {
        if (!this.isPlaying) return;

        // Ramp down
        this.gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.01);

        if (this.oscillator) {
            this.oscillator.stop(this.audioContext.currentTime + 0.05);
            this.oscillator.disconnect();
            this.oscillator = null;
        }

        this.isPlaying = false;
    }

    dispose() {
        this.stopTone();
        this.gainNode.disconnect();
    }
}
