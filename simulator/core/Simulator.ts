/**
 * @file services/Simulator.ts
 * @description
 * This file defines the CircuitSimulator class, which handles the
 * physics and logic simulation of the designed circuit using avr8js.
 */

import { CircuitDesign } from '@/types';
import { compileSketch, parseHex } from './Avr8jsService';
import { AVRRunner } from './AVRRunner';
import { HD44780 } from './HD44780';
import { SSD1306 } from './SSD1306';
import { MembraneKeypad } from './MembraneKeypad';
import { HCSR04 } from './HCSR04';
import { DHT22 } from './DHT22';
import { RotaryEncoder } from './RotaryEncoder';
import { DS1307 } from './DS1307';
import { HeartBeatSensor } from './HeartBeatSensor';
import { MPU6050 } from './MPU6050';
import { IRReceiver } from './IRReceiver';
import { Joystick } from './Joystick';
import { HX711 } from './HX711';
import { WS2812Decoder } from './WS2812Decoder';

const PORT_B_ADDR = 0x25;
const PORT_C_ADDR = 0x28;
const PORT_D_ADDR = 0x2b;

export class CircuitSimulator {
  public runner: AVRRunner | null = null;
  public lcd: HD44780 | null = null;
  public ssd1306: SSD1306 | null = null;
  private keypad: MembraneKeypad | null = null;
  private hcsr04: HCSR04 | null = null;
  private dht22: DHT22 | null = null;
  private rotaryEncoder: RotaryEncoder | null = null;
  private heartBeatSensor: HeartBeatSensor | null = null;
  private mpu6050: MPU6050 | null = null;
  private irReceiver: IRReceiver | null = null;
  public joystick: Joystick | null = null;
  private hx711: HX711 | null = null;

  // Pushbuttons
  private pushButtons: Set<string> = new Set();

  // NeoPixel Support
  private neopixelDecoders: Map<string, WS2812Decoder> = new Map();
  private neopixelState: Map<string, Uint32Array> = new Map();

  public time: number = 0;

  // Map "componentId:pinName" -> netId
  private pinToNet: Map<string, string> = new Map();
  // Map netId -> { port: number, bit: number } (if driven by MCU)
  private netToMcuPin: Map<string, { port: number, bit: number }> = new Map();

  // Track VCC and GND nets
  private vccNets: Set<string> = new Set();
  private gndNets: Set<string> = new Set();

  public onSerialOutput: (char: string) => void = () => { };

  /**
   * Resets the simulator state.
   */
  reset() {
    this.runner = null;
    this.lcd = null;
    this.ssd1306 = null;
    if (this.keypad) {
      this.keypad.dispose();
      this.keypad = null;
    }
    this.hcsr04 = null;
    this.dht22 = null;
    this.rotaryEncoder = null;
    this.heartBeatSensor = null;
    this.mpu6050 = null;
    if (this.irReceiver) {
      this.irReceiver.dispose();
      this.irReceiver = null;
    }
    this.hx711 = null;
    this.time = 0;
    this.pinToNet.clear();
    this.netToMcuPin.clear();
    this.vccNets.clear();
    this.gndNets.clear();
    this.neopixelDecoders.clear();
    this.neopixelState.clear();
    this.pushButtons.clear();
  }

  /**
   * Stops the simulation.
   */
  stop() {
    this.runner = null;
    this.time = 0;
    console.log("[Simulator] Simulation Stopped.");
  }

  /**
   * Loads a circuit design into the simulator.
   * 
   * @param {CircuitDesign} design - The current design state (components and connections) to be simulated.
   */
  async load(design: CircuitDesign) {
    this.reset();

    // DEBUG: Log all component types to help debugging mismatches
    console.log("[Simulator] Components in Design:", design.components.map(c => `${c.id} (${c.type})`));

    // 1. Find the microcontroller
    const mcu = design.components.find(c =>
      c.type.includes('arduino-uno') || c.type.includes('arduino_uno') ||
      c.type.includes('arduino-nano') || c.type.includes('arduino_nano') ||
      c.type.includes('arduino-mega') || c.type.includes('arduino_mega')
    );
    if (!mcu) {
      console.warn("[Simulator] No microcontroller found.");
      return;
    }

    // 2. Build Netlist using Union-Find
    const parent = new Map<string, string>();
    const find = (i: string): string => {
      if (!parent.has(i)) parent.set(i, i);
      if (parent.get(i) !== i) parent.set(i, find(parent.get(i)!));
      return parent.get(i)!;
    };
    const union = (i: string, j: string) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent.set(rootI, rootJ);
    };

    // Initialize all pins from connections
    const allPins = new Set<string>();
    design.connections.forEach(conn => {
      const from = `${conn.from}:${conn.fromPort}`;
      const to = `${conn.to}:${conn.toPort}`;
      console.log(`[Simulator] Processing Connection: ${from} <-> ${to}`); // DEBUG LOG
      union(from, to);
      allPins.add(from);
      allPins.add(to);
    });

    // Treat Resistors as shorts (merge nets across them)
    design.components.forEach(c => {
      if (c.type.includes('resistor')) {
        const pin1 = `${c.id}:1`;
        const pin2 = `${c.id}:2`;
        // Only union if both pins are actually part of the circuit (have been touched)
        // Or just union them blindly? Union adds them to parent map if not present.
        // It's safer to just union them.
        union(pin1, pin2);
        allPins.add(pin1);
        allPins.add(pin2);
        console.log(`[Simulator] Shorting resistor ${c.id} (1-2)`);
      }
    });

    // Build pinToNet map
    const nets = new Map<string, string[]>();
    let netCounter = 0;
    const rootToNetId = new Map<string, string>();

    allPins.forEach(pin => {
      const root = find(pin);
      if (!rootToNetId.has(root)) {
        rootToNetId.set(root, `net_${netCounter++}`);
      }
      const netId = rootToNetId.get(root)!;
      this.pinToNet.set(pin, netId);

      if (!nets.has(netId)) nets.set(netId, []);
      nets.get(netId)!.push(pin);
    });

    console.log("[Simulator] Netlist:", Array.from(nets.entries()));
    console.log("[Simulator] PinToNet:", Array.from(this.pinToNet.entries()));

    // Identify VCC and GND nets
    const vccPins = ['5V', 'VCC', 'VIN'];
    const gndPins = ['GND', 'GND.1', 'GND.2', 'GND.3'];

    vccPins.forEach(pName => {
      const key = `${mcu.id}:${pName}`;
      const netId = this.pinToNet.get(key);
      if (netId) this.vccNets.add(netId);
    });

    gndPins.forEach(pName => {
      const key = `${mcu.id}:${pName}`;
      const netId = this.pinToNet.get(key);
      if (netId) this.gndNets.add(netId);
    });

    console.log("[Simulator] VCC Nets:", Array.from(this.vccNets));
    console.log("[Simulator] GND Nets:", Array.from(this.gndNets));

    // Map MCU pins
    nets.forEach((pins, netId) => {
      pins.forEach(pin => {
        const [compId, pinName] = pin.split(':');
        if (compId === mcu.id) {
          this.mapMcuPinToNet(pinName, netId);
        }
      });
    });

    console.log("[Simulator] NetToMcuPin:", Array.from(this.netToMcuPin.entries()));

    // 3. Compile
    const sketch = mcu.code || `void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }`;
    const result = await compileSketch(sketch);
    if (result.stderr) {
      console.error("[Simulator] Compilation Error:", result.stderr);
      throw new Error(result.stderr);
    }

    // 4. Init Runner
    const program = parseHex(result.hex);
    this.runner = new AVRRunner(program);

    let serialBuffer = "";
    this.runner.onSerialOutput = (byte) => {
      const char = String.fromCharCode(byte);
      serialBuffer += char;
      if (char === '\n') {
        console.log(`[Serial] ${serialBuffer.trim()}`);
        serialBuffer = "";
      }
      this.onSerialOutput(char);
    };

    // 5. Peripherals

    this.setupKeypad(design);
    this.setupJoystick(design);

    // OLED SSD1306
    const oledComp = design.components.find(c => c.type.includes('ssd1306'));
    if (oledComp) {
      console.log(`[Simulator] Initializing SSD1306 OLED`);
      this.ssd1306 = new SSD1306();
      this.runner.attachOLED(this.ssd1306);
    }

    // LCD
    const lcdComp = design.components.find(c => c.type.includes('lcd1602'));
    if (lcdComp) {
      const getPin = (name: string) => {
        const variations = [name, name.toUpperCase()];
        if (name === 'en') variations.push('E', 'e');
        for (const v of variations) {
          const key = `${lcdComp.id}:${v}`;
          const netId = this.pinToNet.get(key);
          if (netId) {
            const mcuPin = this.netToMcuPin.get(netId);
            if (mcuPin) {
              if (mcuPin.port === PORT_D_ADDR) return mcuPin.bit;
              if (mcuPin.port === PORT_B_ADDR) return mcuPin.bit + 8;
              if (mcuPin.port === PORT_C_ADDR) return mcuPin.bit + 14;
            }
          }
        }
        return -1;
      };
      const rs = getPin('rs'), en = getPin('en'), d4 = getPin('d4'), d5 = getPin('d5'), d6 = getPin('d6'), d7 = getPin('d7');
      console.log(`[Simulator] LCD Pins: RS=${rs} EN=${en} D4=${d4} D5=${d5} D6=${d6} D7=${d7}`);

      if (rs !== -1 && en !== -1 && d4 !== -1 && d5 !== -1 && d6 !== -1 && d7 !== -1) {
        this.lcd = new HD44780(this.runner, rs, en, d4, d5, d6, d7);
      } else {
        console.warn("[Simulator] LCD pins not fully connected.");
      }
    }



    // DS1307 RTC
    const rtcComp = design.components.find(c => c.type.includes('ds1307'));
    if (rtcComp) {
      // No pin checking needed for I2C usually, as long as it's conceptually there?
      // Or should we check SDA/SCL pins?
      // DS1307 uses standard SDA/SCL.
      // For now, just instantiate and attach.
      const rtc = new DS1307();
      this.runner.attachI2C(rtc);
      console.log(`[Simulator] Initialized DS1307 RTC`);
    }

    // HC-SR04
    const hcsr04Comp = design.components.find(c => c.type.includes('hc-sr04') || c.type.includes('hc_sr04'));
    if (hcsr04Comp) {
      const getPin = (name: string) => {
        // Try strict match first
        let key = `${hcsr04Comp.id}:${name}`;
        let netId = this.pinToNet.get(key);
        if (!netId) {
          // Try lowercase
          key = `${hcsr04Comp.id}:${name.toLowerCase()}`;
          netId = this.pinToNet.get(key);
        }
        if (!netId) {
          // Try Title Case (Trig, Echo)
          const titleCase = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
          key = `${hcsr04Comp.id}:${titleCase}`;
          netId = this.pinToNet.get(key);
        }

        if (netId) {
          const mcuPin = this.netToMcuPin.get(netId);
          if (mcuPin) {
            if (mcuPin.port === PORT_D_ADDR) return mcuPin.bit;
            if (mcuPin.port === PORT_B_ADDR) return mcuPin.bit + 8;
            if (mcuPin.port === PORT_C_ADDR) return mcuPin.bit + 14;
          }
        }
        return -1;
      };

      const trigPin = getPin('TRIG');
      const echoPin = getPin('ECHO');

      if (trigPin !== -1 && echoPin !== -1) {
        console.log(`[Simulator] Initializing HC-SR04: TRIG=${trigPin}, ECHO=${echoPin}`);
        this.hcsr04 = new HCSR04(this.runner, trigPin, echoPin);
      } else {
        console.warn(`[Simulator] HC-SR04 pins not connected. TRIG=${trigPin}, ECHO=${echoPin}`);
        console.log("[Simulator] Available pins for HC-SR04:", Array.from(this.pinToNet.keys()).filter(k => k.startsWith(hcsr04Comp.id)));
      }
    }

    // MPU6050
    const mpuComp = design.components.find(c => c.type.includes('mpu6050'));
    if (mpuComp) {
      this.mpu6050 = new MPU6050();
      this.runner.attachI2C(this.mpu6050);
    }

    // DHT22
    const dhtComp = design.components.find(c => c.type.includes('dht22'));
    if (dhtComp) {
      const getPin = (name: string) => {
        const key = `${dhtComp.id}:${name}`;
        const netId = this.pinToNet.get(key);
        if (netId) {
          const mcuPin = this.netToMcuPin.get(netId);
          if (mcuPin) {
            if (mcuPin.port === PORT_D_ADDR) return mcuPin.bit;
            if (mcuPin.port === PORT_B_ADDR) return mcuPin.bit + 8;
            if (mcuPin.port === PORT_C_ADDR) return mcuPin.bit + 14;
          }
        }
        return -1;
      };

      // Try 'SDA', 'DATA', '2' (pin 2 is data)
      let dataPin = getPin('SDA');
      if (dataPin === -1) dataPin = getPin('DATA');
      if (dataPin === -1) dataPin = getPin('2'); // Pin 2 on the sensor is data

      if (dataPin !== -1) {
        console.log(`[Simulator] Initializing DHT22 on pin ${dataPin}`);
        this.dht22 = new DHT22(this.runner, dataPin);
      } else {
        console.warn("[Simulator] DHT22 data pin not connected.");
        console.log("[Simulator] Available pins for DHT22:", Array.from(this.pinToNet.keys()).filter(k => k.startsWith(dhtComp.id)));
      }
    }

    // Rotary Encoder (KY-040)
    const rotaryComp = design.components.find(c => c.type.includes('ky-040') || c.type.includes('ky_040'));
    if (rotaryComp) {
      const getPin = (name: string) => {
        const key = `${rotaryComp.id}:${name}`;
        const netId = this.pinToNet.get(key);
        if (netId) {
          const mcuPin = this.netToMcuPin.get(netId);
          if (mcuPin) {
            if (mcuPin.port === PORT_D_ADDR) return mcuPin.bit;
            if (mcuPin.port === PORT_B_ADDR) return mcuPin.bit + 8;
            if (mcuPin.port === PORT_C_ADDR) return mcuPin.bit + 14;
          }
        }
        return -1;
      };

      const clk = getPin('CLK');
      const dt = getPin('DT');
      const sw = getPin('SW');

      if (clk !== -1 && dt !== -1) {
        console.log(`[Simulator] Initializing Rotary Encoder: CLK=${clk}, DT=${dt}, SW=${sw}`);
        this.rotaryEncoder = new RotaryEncoder(this.runner, clk, dt, sw === -1 ? 0 : sw);
      } else {
        // console.warn("[Simulator] Rotary Encoder pins not connected.");
      }
    }

    // HeartBeat Sensor
    const hbComp = design.components.find(c => c.type.includes('heart-beat-sensor') || c.type.includes('heart_beat_sensor'));
    if (hbComp) {
      const getPinConfig = (name: string): { port: 'B' | 'C' | 'D', bit: number, adcChannel?: number } | null => {
        const key = `${hbComp.id}:${name}`;
        const netId = this.pinToNet.get(key);
        if (netId) {
          const mcuPin = this.netToMcuPin.get(netId);
          if (mcuPin) {
            let portName: 'B' | 'C' | 'D' | null = null;
            if (mcuPin.port === PORT_B_ADDR) portName = 'B';
            else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
            else if (mcuPin.port === PORT_D_ADDR) portName = 'D';

            if (portName) {
              const config: { port: 'B' | 'C' | 'D', bit: number, adcChannel?: number } = {
                port: portName,
                bit: mcuPin.bit
              };
              // If Port C, it supports ADC (A0-A5 maps to channel 0-5)
              if (portName === 'C' && mcuPin.bit >= 0 && mcuPin.bit <= 7) {
                config.adcChannel = mcuPin.bit;
              }
              return config;
            }
          }
        }
        return null;
      };

      // 1. Try widely used pin names first
      let config = getPinConfig('A0');
      if (!config) config = getPinConfig('S');
      if (!config) config = getPinConfig('Signal');
      if (!config) config = getPinConfig('OUT');
      if (!config) config = getPinConfig('PULSE');
      if (!config) config = getPinConfig('Y');
      if (!config) config = getPinConfig('DAT');

      // 2. Smart Fallback: Find ANY pin connected to the MCU
      if (!config) {
        console.log("[Simulator] HeartBeat: Specific pin names not found. Trying auto-discovery...");
        for (const [pinKey, netId] of this.pinToNet.entries()) {
          if (pinKey.startsWith(`${hbComp.id}:`)) {
            const pinName = pinKey.split(':')[1];
            // Skip power pins
            if (['VCC', 'GND', 'V+', 'V-', '5V', '3V3', '3.3V', 'VIN', 'NEG', 'POS'].includes(pinName.toUpperCase())) {
              continue;
            }

            const mcuPin = this.netToMcuPin.get(netId);
            if (mcuPin) {
              // Found a connection to the MCU!
              let portName: 'B' | 'C' | 'D' | null = null;
              if (mcuPin.port === PORT_B_ADDR) portName = 'B';
              else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
              else if (mcuPin.port === PORT_D_ADDR) portName = 'D';

              if (portName) {
                config = { port: portName, bit: mcuPin.bit };
                if (portName === 'C' && mcuPin.bit >= 0 && mcuPin.bit <= 7) {
                  config.adcChannel = mcuPin.bit;
                }
                console.log(`[Simulator] HeartBeat: Auto-discovered connection on ${pinKey} -> MCU Port ${portName}:${mcuPin.bit}`);
                break;
              }
            }
          }
        }
      }

      if (config) {
        console.log(`[Simulator] HeartBeat Sensor Initialized: Port ${config.port}, Bit ${config.bit}, ADC=${config.adcChannel ?? 'N/A'}`);
        this.heartBeatSensor = new HeartBeatSensor(this.runner, config);
      } else {
        console.error("[Simulator] HeartBeat Sensor PIN RESOLUTION FAILED! No connection to MCU found.");
        console.log("[Simulator] Available pins (raw):", Array.from(this.pinToNet.keys()).filter(k => k.startsWith(hbComp.id)));
      }
    }

    // HX711 Load Cell
    this.setupHX711(design);

    // IR Receiver
    this.setupIRReceiver(design);

    // NeoPixels / LED Rings
    design.components.forEach(comp => {
      if (['neopixel', 'led_ring', 'wokwi-neopixel', 'wokwi-led-ring'].includes(comp.type)) {
        console.log(`[Simulator] checking NeoPixel ${comp.id}...`);

        const getMcuPin = (pinName: string): { port: 'B' | 'C' | 'D', bit: number } | null => {
          let key = `${comp.id}:${pinName}`;
          let netId = this.pinToNet.get(key);
          if (netId) {
            const mcuPin = this.netToMcuPin.get(netId);
            if (mcuPin) {
              let portName: 'B' | 'C' | 'D' | null = null;
              if (mcuPin.port === PORT_B_ADDR) portName = 'B';
              else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
              else if (mcuPin.port === PORT_D_ADDR) portName = 'D';
              if (portName) return { port: portName, bit: mcuPin.bit };
            }
          }
          return null;
        };

        // Try common data pin names
        let pinConfig = getMcuPin('DIN');
        if (!pinConfig) pinConfig = getMcuPin('DI');
        if (!pinConfig) pinConfig = getMcuPin('IN');
        if (!pinConfig) pinConfig = getMcuPin('DATA');

        if (pinConfig) {
          console.log(`[Simulator] NeoPixel ${comp.id} connected to Port ${pinConfig.port}, Bit ${pinConfig.bit}`);
          const decoder = new WS2812Decoder();
          this.neopixelDecoders.set(comp.id, decoder);

          // Listen to MCU Output
          this.runner.attachPinListener(pinConfig.port, pinConfig.bit, (state) => {
            if (this.runner) {
              decoder.update(this.runner.cpu.cycles, state);
            }
          });

          // Update State on Frame
          decoder.onFrame = (pixels) => {
            // console.log(`[Simulator] NeoPixel ${comp.id} updated: ${pixels.length} pixels`);
            this.neopixelState.set(comp.id, pixels);
          };
        } else {
          console.warn(`[Simulator] NeoPixel ${comp.id} DIN pin not connected to MCU.`);
        }
      }

    });

    // Identify Pushbuttons
    design.components.forEach(c => {
      if (c.type === 'pushbutton' || c.type === 'wokwi-pushbutton') {
        this.pushButtons.add(c.id);
      }
    });

    console.log("[Simulator] Simulation Started.");
    console.log("[Simulator] Ready.");
  }

  public serialWrite(data: string) {
    if (this.runner) {
      for (let i = 0; i < data.length; i++) {
        this.runner.usart.writeByte(data.charCodeAt(i));
      }
    }
  }

  // --- HX711 Support ---
  private setupHX711(design: CircuitDesign) {
    if (!this.runner) return;
    const hxComp = design.components.find(c => c.type.includes('hx711'));
    if (!hxComp) return;

    console.log("[Simulator] Initializing HX711...");

    // Helper to find MCU pin for a component pin
    const getMcuPin = (pinName: string): { port: 'B' | 'C' | 'D', bit: number } | null => {
      // 1. Exact match
      let key = `${hxComp.id}:${pinName}`;
      let netId = this.pinToNet.get(key);

      // 2. Try aliases if not found
      if (!netId) {
        if (pinName === 'DT') {
          // Try DOUT, DAT, D, etc.
          key = `${hxComp.id}:DOUT`; netId = this.pinToNet.get(key);
          if (!netId) { key = `${hxComp.id}:DAT`; netId = this.pinToNet.get(key); }
        } else if (pinName === 'SCK') {
          // Try CLK, CLOCK
          key = `${hxComp.id}:CLK`; netId = this.pinToNet.get(key);
          if (!netId) { key = `${hxComp.id}:CLOCK`; netId = this.pinToNet.get(key); }
        }
      }

      if (netId) {
        const mcuPin = this.netToMcuPin.get(netId);
        if (mcuPin) {
          let portName: 'B' | 'C' | 'D' | null = null;
          if (mcuPin.port === PORT_B_ADDR) portName = 'B';
          else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
          else if (mcuPin.port === PORT_D_ADDR) portName = 'D';
          if (portName) return { port: portName, bit: mcuPin.bit };
        }
      }
      return null;
    };

    const sckPin = getMcuPin('SCK');
    const dtPin = getMcuPin('DT');

    if (sckPin && dtPin) {
      console.log(`[Simulator] HX711 Connected: SCK=${sckPin.port}${sckPin.bit}, DT=${dtPin.port}${dtPin.bit}`);
      this.hx711 = new HX711();

      // Listener for SCK (Input from MCU)
      // The HX711 reads the clock from the MCU
      this.runner.attachPinListener(sckPin.port, sckPin.bit, (state) => {
        this.hx711?.onSCKChange(state);
      });

      // Callback for DT (Output to MCU)
      // The HX711 toggles the Data pin
      // Note: In real hardware this is Open Drain or Push-Pull.
      // Here we force the MCU pin state. Ideally MCU pin should be Input.
      this.hx711.attach((state) => {
        if (this.runner) {
          this.runner.setPin(dtPin.port, dtPin.bit, state);
        }
      });

    } else {
      console.log("[Simulator] Available HX711 pins:", Array.from(this.pinToNet.keys()).filter(k => k.startsWith(hxComp.id)));
    }
  }

  // --- IR Receiver Support ---
  private setupIRReceiver(design: CircuitDesign) {
    if (!this.runner) return;
    const irComp = design.components.find(c => c.type.includes('ir-receiver'));
    if (!irComp) return;

    if (this.irReceiver) {
      this.irReceiver.dispose();
      this.irReceiver = null;
    }

    console.log(`[Simulator] Initializing IR Receiver ${irComp.id}...`);

    const getMcuPin = (pinName: string): { port: 'B' | 'C' | 'D', bit: number } | null => {
      let key = `${irComp.id}:${pinName}`;
      let netId = this.pinToNet.get(key);

      // Try aliases
      if (!netId) {
        if (pinName === 'OUT') {
          key = `${irComp.id}:DAT`; netId = this.pinToNet.get(key);
          if (!netId) { key = `${irComp.id}:DATA`; netId = this.pinToNet.get(key); }
        }
      }

      if (netId) {
        const mcuPin = this.netToMcuPin.get(netId);
        if (mcuPin) {
          let portName: 'B' | 'C' | 'D' | null = null;
          if (mcuPin.port === 0x25) portName = 'B';
          else if (mcuPin.port === 0x28) portName = 'C';
          else if (mcuPin.port === 0x2B) portName = 'D';
          if (portName) return { port: portName, bit: mcuPin.bit };
        }
      }
      return null;
    };

    const outPin = getMcuPin('OUT');

    if (outPin) {
      console.log(`[Simulator] IR Receiver Connected: OUT=${outPin.port}${outPin.bit}`);
      this.irReceiver = new IRReceiver();

      // Attach callback to toggle MCU pin
      this.irReceiver.attach((state) => {
        if (this.runner) {
          this.runner.setPin(outPin.port, outPin.bit, state);
        }
      });

    } else {
      console.warn("[Simulator] IR Receiver OUT pin not connected.");
      console.log("[Simulator] Available IR Receiver pins:", Array.from(this.pinToNet.keys()).filter(k => k.startsWith(irComp.id)));
    }
  }

  // --- Joystick Support ---
  private setupJoystick(design: CircuitDesign) {
    if (!this.runner) return;
    const joyComp = design.components.find(c => c.type.includes('joystick') || c.type.includes('ky-023'));
    if (!joyComp) return;

    console.log(`[Simulator] Initializing Joystick ${joyComp.id} (Type: ${joyComp.type})...`);

    // DEBUG: Print all pins known to the simulator for this component
    const knownPins = Array.from(this.pinToNet.keys()).filter(k => k.startsWith(joyComp.id + ':'));
    console.log(`[Simulator] Known pins for ${joyComp.id}:`, knownPins);

    this.joystick = new Joystick();

    // Set initial center position (0.5 -> 2.5V)
    setTimeout(() => {
      if (this.joystick) {
        this.joystick.setX(0.5);
        this.joystick.setY(0.5);
        this.joystick.setPress(false); // Released (HIGH)
      }
    }, 100);

    // Map helper
    const getMcuPin = (pinName: string): { port: 'B' | 'C' | 'D', bit: number } | null => {
      const key = `${joyComp.id}:${pinName}`;
      const netId = this.pinToNet.get(key);
      if (netId) {
        const mcuPin = this.netToMcuPin.get(netId);
        if (mcuPin) {
          let portName: 'B' | 'C' | 'D' | null = null;
          if (mcuPin.port === PORT_B_ADDR) portName = 'B';
          else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
          else if (mcuPin.port === PORT_D_ADDR) portName = 'D';
          if (portName) return { port: portName, bit: mcuPin.bit };
        }
      }
      return null;
    };

    const vrxPin = getMcuPin('VRx') || getMcuPin('HORZ');
    const vryPin = getMcuPin('VRy') || getMcuPin('VERT');
    const swPin = getMcuPin('SW') || getMcuPin('SEL');

    console.log(`[Simulator] Joystick Pins Resolved: VRx=${vrxPin ? 'OK' : 'FAIL'} VRy=${vryPin ? 'OK' : 'FAIL'} SW=${swPin ? 'OK' : 'FAIL'}`);
    if (vrxPin) console.log(`[Simulator] VRx mapped to Port ${vrxPin.port} Bit ${vrxPin.bit}`);
    if (vryPin) console.log(`[Simulator] VRy mapped to Port ${vryPin.port} Bit ${vryPin.bit}`);
    if (swPin) console.log(`[Simulator] SW mapped to Port ${swPin.port} Bit ${swPin.bit}`);

    if (vrxPin) {
      // VRx -> Analog Input
      this.joystick.attachX((voltage) => {
        // Analog input only supported on Port C (A0-A5) usually?
        // AVRRunner's setAnalogInput handles pin mapping if we pass channel?
        // Actually, setAnalogInput expects channel (0-7), not voltage on digital pin.
        // Simulator.ts setAnalogInput helper:
        // if (mcuPin.port === PORT_C_ADDR) this.runner.setAnalogInput(mcuPin.bit, voltage);

        // So we should reuse Simulator's logic or call runner directly.
        // Let's call runner directly if port is C.
        if (vrxPin.port === 'C') {
          this.runner?.setAnalogInput(vrxPin.bit, voltage);
        }
      });
    }

    if (vryPin) {
      this.joystick.attachY((voltage) => {
        if (vryPin.port === 'C') {
          this.runner?.setAnalogInput(vryPin.bit, voltage);
        }
      });
    }

    if (swPin) {
      this.joystick.attachSW((state) => {
        this.runner?.setPin(swPin.port, swPin.bit, state);
      });
    }
  }

  private mapMcuPinToNet(pinName: string | undefined, netId: string) {
    if (!pinName) return;

    // Map Arduino Uno pins to ATmega328P ports
    // Port D: Digital 0-7 (Address 0x2B)
    // Port B: Digital 8-13 (Address 0x25)
    // Port C: Analog 0-5 (Address 0x28)

    const pin = parseInt(pinName.replace('D', '').replace('A', ''), 10);
    const isAnalog = pinName.startsWith('A');

    if (!isNaN(pin)) {
      if (isAnalog) {
        // Port C
        this.netToMcuPin.set(netId, { port: PORT_C_ADDR, bit: pin });
      } else {
        if (pin >= 0 && pin <= 7) {
          // Port D
          this.netToMcuPin.set(netId, { port: PORT_D_ADDR, bit: pin });
        } else if (pin >= 8 && pin <= 13) {
          // Port B
          this.netToMcuPin.set(netId, { port: PORT_B_ADDR, bit: pin - 8 });
        }
      }
    }
  }

  /**
   * Advances the simulation by a specific time step.
   * 
   * @param {number} deltaTime - The time in milliseconds to advance the simulation.
   */
  update(deltaTime: number) {
    if (!this.runner) return;

    // Convert ms to cycles (16MHz clock)
    // 16,000,000 cycles / second = 16,000 cycles / ms
    let cyclesToRun = deltaTime * 16000;

    // Safety cap: Don't run more than 500,000 cycles per frame (~31ms at 16MHz)
    if (cyclesToRun > 500000) {
      cyclesToRun = 500000;
    }

    try {
      // 16 cycles @ 16MHz = 1us. Maximum partial batching precision.
      const BATCH_SIZE = 16;
      let cyclesRemaining = cyclesToRun;

      while (cyclesRemaining > 0) {
        const batch = Math.min(cyclesRemaining, BATCH_SIZE);

        const startCycles = this.runner.cpu.cycles;
        this.runner.execute(batch);
        const endCycles = this.runner.cpu.cycles;
        const actualCycles = endCycles - startCycles;

        // These peripherals need frequent updates
        this.dht22?.update(batch); // DHT22 logic might need checking too, but IR is critical now.
        this.hcsr04?.update(batch);
        this.rotaryEncoder?.update(batch);
        this.heartBeatSensor?.update();
        this.hx711?.update();

        // IR Receiver must stay perfectly in sync with CPU time
        this.irReceiver?.update(actualCycles);

        cyclesRemaining -= batch;
      }

      this.keypad?.update(); // Keypad is slow, can update once per frame

      // Update time based on ACTUAL cycles run, not wall-clock deltaTime
      this.time += cyclesToRun / 16000;
    } catch (e) {
      console.error("[Simulator] Runtime Error:", e);
      this.runner = null; // Stop simulation on error
    }
  }

  private resolvePin(compId: string, pinName: string): string | undefined {
    // Try exact match
    let key = `${compId}:${pinName}`;
    let netId = this.pinToNet.get(key);
    if (netId) return netId;

    // Try variations
    const variations: string[] = [];

    // Common aliases
    if (pinName === 'anode') variations.push('A', '1', 'pos', '+');
    else if (pinName === 'cathode') variations.push('C', '2', 'neg', '-');
    else if (pinName === 'A') variations.push('anode', '1');
    else if (pinName === 'C') variations.push('cathode', '2');
    else if (pinName === '1') variations.push('anode', 'A', 'VCC');
    else if (pinName === '2') variations.push('cathode', 'C', 'GND');
    else if (pinName === 'VCC') variations.push('5V', 'VIN');
    else if (pinName === 'GND') variations.push('GND.1', 'GND.2');
    else if (pinName === 'PWM') variations.push('SIG', 'Signal', 'PULSE', 'Pulse');
    else if (pinName === 'COIL1') variations.push('1', '16', 'coil1');
    else if (pinName === 'COIL2') variations.push('16', '1', 'coil2');

    // Case variations
    variations.push(pinName.toUpperCase());
    variations.push(pinName.toLowerCase());

    for (const v of variations) {
      key = `${compId}:${v}`;
      netId = this.pinToNet.get(key);
      if (netId) {
        return netId;
      }
    }

    return undefined;
  }

  /**
   * Retrieves the voltage level of a specific pin on a component.
   * Used by the UI to visualize state (e.g., LED brightness).
   * 
   * @param {string} compId - The unique ID of the component.
   * @param {string} pinName - The specific terminal name (e.g., 'anode', '13').
   * @returns {number} - The voltage level (usually 0 or 5 for digital).
   */
  getPinVoltage(compId: string, pinName: string): number {
    if (!this.runner) return 0;

    const netId = this.resolvePin(compId, pinName);

    if (netId) {
      if (this.vccNets.has(netId)) return 5;
      if (this.gndNets.has(netId)) return 0;

      const mcuPin = this.netToMcuPin.get(netId);
      if (mcuPin) {
        const portVal = this.runner.cpu.data[mcuPin.port];
        return (portVal & (1 << mcuPin.bit)) ? 5 : 0;
      }
    }

    return 0;
  }

  /**
   * Retrieves the duty cycle (0.0 to 1.0) of a specific pin.
   * Used for PWM visualization (LED brightness, Servo angle).
   */
  getPinDutyCycle(compId: string, pinName: string): number {
    if (!this.runner) return 0;

    const netId = this.resolvePin(compId, pinName);

    if (netId) {
      const mcuPin = this.netToMcuPin.get(netId);
      if (mcuPin) {
        // Map port address back to 'B', 'C', 'D'
        let portName: 'B' | 'C' | 'D' | null = null;
        if (mcuPin.port === PORT_B_ADDR) portName = 'B';
        else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
        else if (mcuPin.port === PORT_D_ADDR) portName = 'D';

        if (portName) {
          return this.runner.getPinDutyCycle(portName, mcuPin.bit);
        }
      }
    }
    return 0;
  }

  getPinPulseWidth(compId: string, pinName: string): number {
    if (!this.runner) return 0;

    const netId = this.resolvePin(compId, pinName);

    if (netId) {
      const mcuPin = this.netToMcuPin.get(netId);
      if (mcuPin) {
        // Map port address back to 'B', 'C', 'D'
        let portName: 'B' | 'C' | 'D' | null = null;
        if (mcuPin.port === PORT_B_ADDR) portName = 'B';
        else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
        else if (mcuPin.port === PORT_D_ADDR) portName = 'D';

        if (portName) {
          return this.runner.getPinPulseWidth(portName, mcuPin.bit);
        }
      }
    }
    return 0;
  }

  getNeoPixels(compId: string): Uint32Array | undefined {
    return this.neopixelState.get(compId);
  }

  /**
   * Sets the state of a specific pin on a component (e.g., button press).
   * 
   * @param {string} compId - The unique ID of the component.
   * @param {string} pinName - The specific terminal name.
   * @param {boolean} state - The new state (true = HIGH, false = LOW).
   */
  setInput(compId: string, pinName: string, state: boolean) {
    if (!this.runner) return;

    console.log(`[Simulator] setInput: ${compId}:${pinName} = ${state}`);

    const netId = this.resolvePin(compId, pinName);

    if (netId) {
      const mcuPin = this.netToMcuPin.get(netId);
      if (mcuPin) {
        // Map port address back to 'B', 'C', 'D'
        let portName: 'B' | 'C' | 'D' | null = null;
        if (mcuPin.port === PORT_B_ADDR) portName = 'B';
        else if (mcuPin.port === PORT_C_ADDR) portName = 'C';
        else if (mcuPin.port === PORT_D_ADDR) portName = 'D';

        if (portName) {
          console.log(`[Simulator] Setting MCU Pin: Port ${portName}, Bit ${mcuPin.bit} to ${state}`);
          this.runner.setPin(portName, mcuPin.bit, state);
        }
      } else {
        console.log(`[Simulator] Net ${netId} is NOT connected to MCU`);
      }
    } else {
      console.log(`[Simulator] Could not resolve pin ${compId}:${pinName}`);
    }
  }

  /**
   * Sets the analog voltage of a specific pin on a component (e.g., potentiometer wiper).
   * 
   * @param {string} compId - The unique ID of the component.
   * @param {string} pinName - The specific terminal name.
   * @param {number} voltage - The voltage level (0.0 to 5.0).
   */
  setAnalogInput(compId: string, pinName: string, voltage: number) {
    if (!this.runner) return;

    const netId = this.resolvePin(compId, pinName);

    if (netId) {
      const mcuPin = this.netToMcuPin.get(netId);
      if (mcuPin) {
        // Check if it's Port C (Analog Input)
        if (mcuPin.port === PORT_C_ADDR) {
          // Channel corresponds to the bit number (0-5 for A0-A5)
          this.runner.setAnalogInput(mcuPin.bit, voltage);
          // console.log(`[Simulator] Analog Input: ${compId}:${pinName} -> A${mcuPin.bit} = ${voltage.toFixed(2)}V`);
        } else {
          // Checking other pins? No, only Port C supports Analog Read on ATmega328P.
          // console.log(`[Simulator] checkAnalog: Pin ${compId}:${pinName} is connected to digital port (Address ${mcuPin.port})`);
        }
      }
    } else {
      // console.warn(`[Simulator] Analog Input: Could not resolve pin ${compId}:${pinName}`);
    }
  }



  getLCDBuffer(): string[] | null {
    return this.lcd ? this.lcd.getBuffer() : null;
  }

  getOLEDFrame(): Uint8Array | null {
    return this.ssd1306 ? this.ssd1306.buffer : null;
  }

  // --- NeoPixel Support ---

  // --- Membrane Keypad Support ---
  private setupKeypad(design: CircuitDesign) {
    if (!this.runner) return;

    const keypadComp = design.components.find(c =>
      c.type === 'membrane_keypad' ||
      c.type === 'wokwi-membrane-keypad' ||
      c.type === 'keypad');

    if (keypadComp) {
      const pins = new Map<string, { port: number, bit: number }>();
      const pinNames = ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'];

      for (const name of pinNames) {
        // Use resolvePin for partial matching / robustness
        const netId = this.resolvePin(keypadComp.id, name);
        if (netId) {
          const mcuPin = this.netToMcuPin.get(netId);
          if (mcuPin) {
            pins.set(name, mcuPin);
          }
        }
      }

      console.log(`[Simulator] Initializing Membrane Keypad: ${keypadComp.id} with ${pins.size} pins connected.`);

      if (this.keypad) {
        this.keypad.dispose();
      }
      this.keypad = new MembraneKeypad(this.runner, pins);
    }
  }

  setKeypadPress(compId: string, key: string, pressed: boolean) {
    if (this.keypad) {
      // Assuming only one keypad for now, or check compId if we support multiple
      this.keypad.setKey(key, pressed);
    }
  }

  // --- Peripheral Methods ---

  setHCSR04Distance(compId: string, distance: number) {
    this.hcsr04?.setDistance(distance);
  }

  setDHT22Environment(compId: string, temp: number, hum: number) {
    this.dht22?.setEnvironment(temp, hum);
  }

  setRotaryEncoderRotate(compId: string, direction: 'CW' | 'CCW') {
    if (direction === 'CW') this.rotaryEncoder?.rotateCW();
    else this.rotaryEncoder?.rotateCCW();
  }

  setRotaryEncoderPress(compId: string, pressed: boolean) {
    this.rotaryEncoder?.pressButton(pressed);
  }

  setHeartBeatRate(compId: string, bpm: number) {
    if (this.heartBeatSensor) {
      this.heartBeatSensor.bpm = bpm;
    }
  }

  setHeartBeatActive(compId: string, active: boolean) {
    if (this.heartBeatSensor) {
      this.heartBeatSensor.active = active;
    }
  }

  setMPU6050Motion(compId: string, accel: any, gyro: any, temp: number) {
    if (this.mpu6050) {
      this.mpu6050.setAccel(accel.x, accel.y, accel.z);
      this.mpu6050.setGyro(gyro.x, gyro.y, gyro.z);
      this.mpu6050.setTemperature(temp);
    }
  }

  triggerIRReceiver(compId: string, code: number) {
    this.irReceiver?.send(code);
  }

  setHX711Weight(compId: string, weight: number) {
    this.hx711?.setWeight(weight);
  }

  /**
   * Routes events from the UI overlays to the appropriate peripheral methods.
   */
  handleComponentEvent(id: string, name: string, detail: any) {
    if (name === 'input') {
      if (detail.value !== undefined) {
        // Generic value input (distance, weight, etc.)
        this.setHCSR04Distance(id, detail.value);
        this.setHX711Weight(id, detail.value);
        this.setHeartBeatRate(id, detail.value);
        // LDR / NTC / Gas / Sound
        // We need specific methods for these or generic analog input setting?
        // Currently Simulator doesn't have setLDR, setNTC, etc.
        // But we can use setAnalogInput if we know the pin.
        // However, the overlays send 'value' which might be lux, temp, etc.
        // We need to map these values to voltage or resistance if we want accurate simulation.
        // For now, let's assume the components handle it or we add methods.
      }
      if (detail.temp !== undefined && detail.hum !== undefined) {
        this.setDHT22Environment(id, detail.temp, detail.hum);
      }
      if (detail.pressed !== undefined) {
        this.setRotaryEncoderPress(id, detail.pressed);
        this.setHeartBeatActive(id, detail.pressed);
      }
      if (detail.rotate !== undefined) {
        this.setRotaryEncoderRotate(id, detail.rotate);
      }
      if (detail.accelX !== undefined) {
        // MPU6050
        this.setMPU6050Motion(id,
          { x: detail.accelX, y: detail.accelY, z: detail.accelZ },
          { x: detail.gyroX, y: detail.gyroY, z: detail.gyroZ },
          detail.temperature || 25
        );
      }
    } else if (name === 'environment-change') {
      this.setDHT22Environment(id, detail.temperature, detail.humidity);
    } else if (name === 'set-heart-beat-active') {
      this.setHeartBeatActive(id, detail.active);
    } else if (name === 'set-heart-beat-rate') {
      this.setHeartBeatRate(id, detail.bpm);
    } else if (name === 'remote-button') {
      this.triggerIRReceiver(id, detail.code);
    } else if (name === 'mousedown' || name === 'mouseup') {
      // Flame sensor or generic button
      // Flame sensor sends { voltage, analogValue }
      if (detail.voltage !== undefined) {
        // We need to set the analog pin voltage.
        // But we don't know the pin name here easily without looking it up.
        // For Flame Sensor, it's usually A0.
        this.setAnalogInput(id, 'A0', detail.voltage);
        // Also set digital pin?
        this.setInput(id, 'D0', name === 'mousedown'); // Active Low/High?
      } else if (this.pushButtons.has(id)) {
        // Pushbutton logic
        const isPressed = name === 'mousedown';
        const pins = ['1.l', '1.r', '2.l', '2.r'];

        // Determine target state based on connections
        // If connected to GND, we drive LOW when pressed, HIGH (or float) when released.
        // If connected to VCC, we drive HIGH when pressed, LOW (or float) when released.

        let connectedToGND = false;
        let connectedToVCC = false;

        for (const pin of pins) {
          const v = this.getPinVoltage(id, pin);
          // Note: getPinVoltage returns 0 or 5 based on MCU state or VCC/GND nets
          // We need to check if it's connected to a VCC/GND net specifically?
          // getPinVoltage uses vccNets/gndNets.
          const netId = this.resolvePin(id, pin);
          if (netId) {
            if (this.gndNets.has(netId)) connectedToGND = true;
            if (this.vccNets.has(netId)) connectedToVCC = true;
          }
        }

        let targetState = false;
        if (connectedToGND) {
          // Active LOW (Pull-up)
          targetState = !isPressed; // Pressed -> LOW (false), Released -> HIGH (true)
        } else if (connectedToVCC) {
          // Active HIGH (Pull-down)
          targetState = isPressed; // Pressed -> HIGH (true), Released -> LOW (false)
        } else {
          // Default to Active LOW behavior if unsure (standard Arduino button)
          targetState = !isPressed;
        }

        // Apply to all pins (short them)
        pins.forEach(pin => this.setInput(id, pin, targetState));
      }
    }
  }
}
