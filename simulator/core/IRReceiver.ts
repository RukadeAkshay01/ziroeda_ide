export class IRReceiver {
    private transitions: { cycle: number; state: boolean }[] = [];
    private pinCallback: ((state: boolean) => void) | null = null;
    private lastCycle = 0;
    private currentIndex = 0;

    constructor(private clockFreq: number = 16000000) { }

    attach(callback: (state: boolean) => void) {
        this.pinCallback = callback;
        // Initial state is HIGH (Idle)
        if (this.pinCallback) this.pinCallback(true);
    }

    send(code: number) {
        if (!this.pinCallback) return;

        // Clear existing transitions to avoid overlap.
        this.transitions = [];
        this.currentIndex = 0;
        this.lastCycle = 0; // Reset cycle count for new transmission

        let currentCycle = 1000; // Start a bit in the future

        const usToCycles = (us: number) => Math.round((us * this.clockFreq) / 1000000);

        const addPulse = (markUs: number, spaceUs: number) => {
            // Mark (Burst) -> Output LOW
            this.transitions.push({ cycle: currentCycle, state: false });
            currentCycle += usToCycles(markUs);

            // Space (Silence) -> Output HIGH
            this.transitions.push({ cycle: currentCycle, state: true });
            currentCycle += usToCycles(spaceUs);
        };

        // NEC Protocol
        // Leader
        addPulse(9000, 4500);

        // 32 bits
        for (let i = 0; i < 32; i++) {
            const bit = (code >> (31 - i)) & 1;

            if (bit) {
                // Bit 1
                addPulse(562, 1687);
            } else {
                // Bit 0
                addPulse(562, 562);
            }
        }

        // Stop bit
        this.transitions.push({ cycle: currentCycle, state: false });
        currentCycle += usToCycles(562);
        this.transitions.push({ cycle: currentCycle, state: true });

        console.log(`[IRReceiver] Queued ${this.transitions.length} transitions for code 0x${code.toString(16)}`);
    }

    update(cycles: number) {
        if (this.currentIndex >= this.transitions.length) return;

        this.lastCycle += cycles;

        // Process all transitions that are due
        while (this.currentIndex < this.transitions.length) {
            const transition = this.transitions[this.currentIndex];
            if (this.lastCycle >= transition.cycle) {
                if (this.pinCallback) {
                    // console.log(`[IRReceiver] Transition: ${transition.state} at cycle ${transition.cycle}`);
                    this.pinCallback(transition.state);
                }
                this.currentIndex++;
            } else {
                break;
            }
        }
    }

    dispose() {
        this.pinCallback = null;
        this.transitions = [];
    }
}
