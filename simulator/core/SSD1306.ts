/**
 * @file SSD1306.ts
 * @description
 * Simulation of the SSD1306 OLED Controller (128x64).
 * Handles I2C commands to update the display buffer.
 */

export class SSD1306 {
    // 128x64 pixels, 1 bit per pixel.
    // Organized as 8 pages of 128 bytes.
    // Each byte represents a vertical column of 8 pixels.
    public buffer: Uint8Array = new Uint8Array(128 * 64 / 8);

    private addressingMode: number = 0x02; // 0: Horizontal, 1: Vertical, 2: Page (default)
    private columnStart: number = 0;
    private columnEnd: number = 127;
    private pageStart: number = 0;
    private pageEnd: number = 7;

    private currentColumn: number = 0;
    private currentPage: number = 0;

    private nextByteIsCommand: boolean = false;
    private commandState: 'IDLE' | 'SET_MEM_MODE' | 'SET_COL_ADDR_START' | 'SET_COL_ADDR_END' | 'SET_PAGE_ADDR_START' | 'SET_PAGE_ADDR_END' = 'IDLE';

    // I2C State Machine
    private state: 'CONTROL' | 'DATA' | 'COMMAND' = 'CONTROL';

    constructor() {
        this.reset();
    }

    reset() {
        this.buffer.fill(0);
        this.addressingMode = 0x02;
        this.currentColumn = 0;
        this.currentPage = 0;
        this.state = 'CONTROL';
    }

    // Process a byte received via I2C
    writeCommand(cmd: number) {
        // Handle multi-byte commands
        switch (this.commandState) {
            case 'SET_MEM_MODE':
                this.addressingMode = cmd & 0x03;
                this.commandState = 'IDLE';
                return;
            case 'SET_COL_ADDR_START':
                this.columnStart = cmd & 0x7F;
                this.commandState = 'SET_COL_ADDR_END';
                return;
            case 'SET_COL_ADDR_END':
                this.columnEnd = cmd & 0x7F;
                this.currentColumn = this.columnStart;
                this.commandState = 'IDLE';
                return;
            case 'SET_PAGE_ADDR_START':
                this.pageStart = cmd & 0x07;
                this.commandState = 'SET_PAGE_ADDR_END';
                return;
            case 'SET_PAGE_ADDR_END':
                this.pageEnd = cmd & 0x07;
                this.currentPage = this.pageStart;
                this.commandState = 'IDLE';
                return;
        }

        // Single byte commands
        if (cmd === 0x20) {
            this.commandState = 'SET_MEM_MODE';
        } else if (cmd === 0x21) {
            this.commandState = 'SET_COL_ADDR_START';
        } else if (cmd === 0x22) {
            this.commandState = 'SET_PAGE_ADDR_START';
        } else if ((cmd & 0xB0) === 0xB0) { // Set Page Start Address for Page Addressing Mode
            this.currentPage = cmd & 0x07;
        } else if ((cmd & 0x0F) === cmd) { // Set Lower Column Start Address for Page Addressing Mode
            this.currentColumn = (this.currentColumn & 0xF0) | (cmd & 0x0F);
        } else if ((cmd & 0xF0) === 0x10) { // Set Higher Column Start Address for Page Addressing Mode
            this.currentColumn = (this.currentColumn & 0x0F) | ((cmd & 0x0F) << 4);
        }
    }

    writeData(data: number) {
        if (this.currentColumn >= 128 || this.currentPage >= 8) return;

        const index = this.currentPage * 128 + this.currentColumn;
        this.buffer[index] = data;

        this.currentColumn++;
        if (this.currentColumn > this.columnEnd) {
            this.currentColumn = this.columnStart;
            this.currentPage++;
            if (this.currentPage > this.pageEnd) {
                this.currentPage = this.pageStart;
            }
        }
    }

    // --- I2C Interface Methods ---

    connect(addr: number, write: boolean): boolean {
        // SSD1306 default address is 0x3C (7-bit)
        if (addr === 0x3C) {
            console.log('[SSD1306] I2C Connect detected!');
            this.start(); // Reset state on connect
            return true; // ACK
        }
        console.log(`[SSD1306] I2C Connect ignored for addr: 0x${addr.toString(16)}`);
        return false; // NACK
    }

    start() {
        this.state = 'CONTROL';
    }

    writeByte(byte: number): boolean {
        // console.log(`[SSD1306] RX Byte: 0x${byte.toString(16)}`); // Verbose log
        if (this.state === 'CONTROL') {
            const co = (byte & 0x80) !== 0;
            const dc = (byte & 0x40) !== 0;

            if (dc) {
                this.state = 'DATA';
            } else {
                this.state = 'COMMAND';
            }

            if (co) {
                // If Co=1, next byte is also Control. 
                // But for simplicity, we'll assume standard streams where we switch mode and stay there until Stop or another Control byte?
                // Actually, the Co bit applies to the *current* byte's meaning for the *next* byte.
                // If Co=0, the following bytes are data/command.
                // If Co=1, the following byte is another control byte.
                this.state = 'CONTROL';
            }
            return true;
        }

        if (this.state === 'COMMAND') {
            // console.log(`[SSD1306] Command: 0x${byte.toString(16)}`);
            this.writeCommand(byte);
        } else {
            // console.log(`[SSD1306] Data byte received`);
            this.writeData(byte);
        }
        return true;
    }

    readByte(ack: boolean): number {
        return 0xFF; // Write-only device
    }
}
