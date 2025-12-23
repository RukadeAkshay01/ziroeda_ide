
/**
 * @file simulationService.ts
 * @description Manages the avr8js simulation lifecycle and C++ compilation.
 */

import { 
  CPU, 
  avrInstruction, 
  AVRTimer, 
  AVRIOPort, 
  AVRUSART,
  portBConfig, 
  portCConfig, 
  portDConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  usart0Config
} from 'avr8js';

export interface SimulationUpdate {
  pinStates: Record<string, number>; // Mapping of Arduino Pin -> Value (0 or 1)
  serialOutput: string; // Buffer of text printed to Serial during this frame
}

export class AVRRunner {
  readonly cpu: any;
  readonly timers: AVRTimer[];
  readonly usart: AVRUSART;
  readonly portB: any;
  readonly portC: any;
  readonly portD: any;
  
  private animationFrame: number | null = null;
  private onUpdate: (update: SimulationUpdate) => void;
  private serialBuffer: string = "";

  constructor(hex: string, onUpdate: (update: SimulationUpdate) => void) {
    this.onUpdate = onUpdate;
    
    // Parse HEX to program memory
    const program = new Uint16Array(16384);
    this.loadHex(hex, program);

    this.cpu = new CPU(program);
    
    // Instantiate timers
    this.timers = [
      new AVRTimer(this.cpu, timer0Config),
      new AVRTimer(this.cpu, timer1Config),
      new AVRTimer(this.cpu, timer2Config),
    ];

    // Instantiate USART (Serial) - assuming 16MHz clock
    this.usart = new AVRUSART(this.cpu, usart0Config, 16e6);
    
    // Hook into Serial output
    this.usart.onByteTransmit = (value) => {
      this.serialBuffer += String.fromCharCode(value);
    };

    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
  }

  private loadHex(hex: string, program: Uint16Array) {
    const lines = hex.split('\n');
    for (const line of lines) {
      if (line.startsWith(':') && line.substr(7, 2) === '00') {
        const bytes = parseInt(line.substr(1, 2), 16);
        const addr = parseInt(line.substr(3, 4), 16);
        for (let i = 0; i < bytes; i += 2) {
          const word =
            parseInt(line.substr(9 + i * 2 + 2, 2), 16) << 8 |
            parseInt(line.substr(9 + i * 2, 2), 16);
          program[addr / 2 + i / 2] = word;
        }
      }
    }
  }

  // Send data from the UI to the Arduino (RX)
  serialWrite(data: string) {
     for (let i = 0; i < data.length; i++) {
       this.usart.writeByte(data.charCodeAt(i));
     }
  }

  execute() {
    // Run ~250,000 instructions per frame (~15MHz / 60fps)
    for (let i = 0; i < 250000; i++) {
      avrInstruction(this.cpu);
      for (const timer of this.timers) {
        timer.tick();
      }
    }

    // Capture Pin States
    const pinStates: Record<string, number> = {};
    for (let i = 0; i < 8; i++) pinStates[i.toString()] = (this.portD.pinState(i) ? 1 : 0);
    for (let i = 0; i < 6; i++) pinStates[(i + 8).toString()] = (this.portB.pinState(i) ? 1 : 0);
    for (let i = 0; i < 6; i++) pinStates[(i + 14).toString()] = (this.portC.pinState(i) ? 1 : 0);

    // Send update to UI
    this.onUpdate({ 
      pinStates, 
      serialOutput: this.serialBuffer 
    });
    
    // Clear buffer for next frame
    this.serialBuffer = "";

    this.animationFrame = requestAnimationFrame(() => this.execute());
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

/**
 * Calls the Wokwi compilation API to turn C++ into HEX.
 */
export async function compileArduinoCode(code: string): Promise<string> {
  const response = await fetch('https://hexcoder.wokwi.com/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: 'uno', sketch: code }),
  });

  const result = await response.json();
  if (result.stdout && result.success === false) {
    throw new Error(result.stdout);
  }
  if (!result.hex) {
    throw new Error("Compilation failed: No HEX returned.");
  }
  return result.hex;
}
