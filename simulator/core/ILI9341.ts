export class ILI9341 {
    public buffer: Uint16Array;
    private width: number = 240;
    private height: number = 320;

    // SPI State Machine
    private state: 'COMMAND' | 'DATA' = 'COMMAND';
    private currentCommand: number = 0;
    private dataIndex: number = 0;

    // Address Window
    private colStart: number = 0;
    private colEnd: number = 239;
    private rowStart: number = 0;
    private rowEnd: number = 319;

    // Cursor
    private cursorX: number = 0;
    private cursorY: number = 0;

    constructor() {
        this.buffer = new Uint16Array(this.width * this.height);
    }

    // Called when CS is LOW and DC is LOW (Command) or HIGH (Data)
    // But usually SPI just sends bytes. The DC pin state determines if it's command or data.
    // So we need a method that takes the byte AND the DC pin state.
    transfer(byte: number, dcState: boolean): number {
        if (!dcState) {
            // Command Mode
            this.currentCommand = byte;
            this.dataIndex = 0;
            this.state = 'COMMAND';
            this.handleCommand(byte);
        } else {
            // Data Mode
            this.state = 'DATA';
            this.handleData(byte);
        }
        return 0; // MISO usually 0 for display
    }

    private handleCommand(cmd: number) {
        switch (cmd) {
            case 0x2A: // CASET (Column Address Set)
            case 0x2B: // PASET (Page Address Set)
            case 0x2C: // RAMWR (Memory Write)
                this.dataIndex = 0;
                break;
            // Add other commands as needed
        }
    }

    private casetBuffer: number[] = [];
    private pasetBuffer: number[] = [];

    private handleData(byte: number) {
        switch (this.currentCommand) {
            case 0x2A: // CASET
                this.casetBuffer.push(byte);
                if (this.casetBuffer.length === 4) {
                    this.colStart = (this.casetBuffer[0] << 8) | this.casetBuffer[1];
                    this.colEnd = (this.casetBuffer[2] << 8) | this.casetBuffer[3];
                    this.cursorX = this.colStart;
                    this.casetBuffer = [];
                }
                break;

            case 0x2B: // PASET
                this.pasetBuffer.push(byte);
                if (this.pasetBuffer.length === 4) {
                    this.rowStart = (this.pasetBuffer[0] << 8) | this.pasetBuffer[1];
                    this.rowEnd = (this.pasetBuffer[2] << 8) | this.pasetBuffer[3];
                    this.cursorY = this.rowStart;
                    this.pasetBuffer = [];
                }
                break;

            case 0x2C: // RAMWR
                // Pixels are 16-bit (565). We receive 2 bytes per pixel.
                // We need to buffer the first byte.
                if (this.dataIndex % 2 === 0) {
                    this.tempHighByte = byte;
                } else {
                    const color = (this.tempHighByte << 8) | byte;
                    this.writePixel(color);
                }
                this.dataIndex++;
                break;
        }
    }

    private tempHighByte: number = 0;

    private writePixel(color: number) {
        if (this.cursorX >= 0 && this.cursorX < this.width && this.cursorY >= 0 && this.cursorY < this.height) {
            this.buffer[this.cursorY * this.width + this.cursorX] = color;
        }

        this.cursorX++;
        if (this.cursorX > this.colEnd) {
            this.cursorX = this.colStart;
            this.cursorY++;
            if (this.cursorY > this.rowEnd) {
                this.cursorY = this.rowStart;
            }
        }
    }
}
