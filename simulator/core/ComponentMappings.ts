import { CircuitComponent } from '@/types';
import { CircuitSimulator } from '../core/Simulator';

export type ComponentMapping = {
    update: (
        component: CircuitComponent,
        element: any, // Using any for the raw Web Component
        simulator: CircuitSimulator
    ) => void;
    reset?: (
        component: CircuitComponent,
        element: any
    ) => void;
    onInput?: (
        component: CircuitComponent,
        element: any,
        simulator: CircuitSimulator,
        isDown: boolean
    ) => void;
    onEvent?: (
        component: CircuitComponent,
        element: any,
        simulator: CircuitSimulator,
        eventName: string,
        detail: any
    ) => void;
};

export const COMPONENT_MAPPINGS: Record<string, ComponentMapping> = {
    // --- Arduino Uno ---
    'arduino_uno': {
        update: (comp, el, simulator) => {
            // Power LED always on
            if (el.ledPower !== true) {
                el.ledPower = true;
            }

            // LED 13 (Built-in) - Port B, Bit 5
            const led13State = simulator.getPinVoltage(comp.id, '13') > 2.5;
            if (el.led13 !== led13State) el.led13 = led13State;

            // TX/RX LEDs (Pins 1 and 0)
            const txState = simulator.getPinVoltage(comp.id, '1') > 2.5; // TX
            const rxState = simulator.getPinVoltage(comp.id, '0') > 2.5; // RX

            if (el.ledTX !== txState) el.ledTX = txState;
            if (el.ledRX !== rxState) el.ledRX = rxState;
        },
        reset: (comp, el) => {
            el.ledPower = false;
            el.led13 = false;
            el.ledTX = false;
            el.ledRX = false;
        }
    },
    'wokwi-arduino-uno': { update: (c, e, s) => COMPONENT_MAPPINGS['arduino_uno'].update(c, e, s), reset: (c, e) => COMPONENT_MAPPINGS['arduino_uno'].reset?.(c, e) },

    // --- Arduino Nano ---
    'arduino_nano': {
        update: (comp, el, simulator) => {
            COMPONENT_MAPPINGS['arduino_uno'].update(comp, el, simulator);
        },
        reset: (c, e) => COMPONENT_MAPPINGS['arduino_uno'].reset?.(c, e)
    },
    'wokwi-arduino-nano': { update: (c, e, s) => COMPONENT_MAPPINGS['arduino_nano'].update(c, e, s), reset: (c, e) => COMPONENT_MAPPINGS['arduino_nano'].reset?.(c, e) },

    // --- Arduino Mega ---
    'arduino_mega': {
        update: (comp, el, simulator) => {
            COMPONENT_MAPPINGS['arduino_uno'].update(comp, el, simulator);
        },
        reset: (c, e) => COMPONENT_MAPPINGS['arduino_uno'].reset?.(c, e)
    },
    'wokwi-arduino-mega': { update: (c, e, s) => COMPONENT_MAPPINGS['arduino_mega'].update(c, e, s), reset: (c, e) => COMPONENT_MAPPINGS['arduino_mega'].reset?.(c, e) },

    // --- LEDs ---
    'led': {
        update: (comp, el, simulator) => {
            const anodeV = simulator.getPinVoltage(comp.id, 'anode') || simulator.getPinVoltage(comp.id, 'A') || simulator.getPinVoltage(comp.id, '1') || 0;
            const cathodeV = simulator.getPinVoltage(comp.id, 'cathode') || simulator.getPinVoltage(comp.id, 'C') || simulator.getPinVoltage(comp.id, '2') || 0;
            const duty = simulator.getPinDutyCycle(comp.id, 'anode') || simulator.getPinDutyCycle(comp.id, 'A') || simulator.getPinDutyCycle(comp.id, '1') || 0;

            let isLit = false;
            let brightness = 1.0;

            if (duty > 0.01) {
                isLit = true;
                brightness = duty;
            } else {
                const vDiff = Math.abs(anodeV - cathodeV);
                if (vDiff > 1.8) {
                    isLit = true;
                    brightness = 1.0;
                }
            }

            if (el) {
                if (el.value !== isLit) el.value = isLit;
                if (el.brightness !== brightness) el.brightness = brightness;
            }
        },
        reset: (comp, el) => {
            el.value = false;
            el.brightness = 0;
        }
    },
    'wokwi-led': { update: (c, e, s) => COMPONENT_MAPPINGS['led'].update(c, e, s), reset: (c, e) => COMPONENT_MAPPINGS['led'].reset?.(c, e) },

    // --- LCD 1602 ---
    'lcd1602': {
        update: (comp, el, simulator) => {
            const lcdBuffer = simulator.getLCDBuffer();
            if (lcdBuffer) {
                const fullText = lcdBuffer.join('\n');
                if (el.text !== fullText) {
                    el.text = fullText;
                    if (!el.backlight) {
                        el.color = 'black';
                        el.background = 'green';
                        el.backlight = true;
                        el.cursor = false;
                        el.blink = false;
                    }
                }
            }
        },
        reset: (comp, el) => {
            el.text = '';
            el.backlight = false;
            el.cursor = false;
            el.blink = false;
        }
    },
    'wokwi-lcd1602': { update: (c, e, s) => COMPONENT_MAPPINGS['lcd1602'].update(c, e, s), reset: (c, e) => COMPONENT_MAPPINGS['lcd1602'].reset?.(c, e) },

    // --- OLED (SSD1306) ---
    'oled': {
        update: (comp, el, simulator) => {
            const buffer = simulator.getOLEDFrame();
            if (buffer) {
                // Convert 1-bit vertical page buffer to RGBA ImageData
                const width = 128;
                const height = 64;
                const rgbaBuffer = new Uint8ClampedArray(width * height * 4);

                for (let i = 0; i < 1024; i++) {
                    const byte = buffer[i];
                    const page = Math.floor(i / 128);
                    const col = i % 128;

                    for (let bit = 0; bit < 8; bit++) {
                        const pixelOn = (byte >> bit) & 1;
                        const y = page * 8 + bit;
                        const x = col;

                        // Safety check
                        if (y < height && x < width) {
                            const index = (y * width + x) * 4;
                            if (pixelOn) {
                                rgbaBuffer[index] = 0;     // R
                                rgbaBuffer[index + 1] = 255; // G
                                rgbaBuffer[index + 2] = 255; // B (Cyan)
                                rgbaBuffer[index + 3] = 255; // A
                            } else {
                                rgbaBuffer[index] = 0;
                                rgbaBuffer[index + 1] = 0;
                                rgbaBuffer[index + 2] = 0;
                                rgbaBuffer[index + 3] = 255; // Opaque Black
                            }
                        }
                    }
                }

                el.imageData = new ImageData(rgbaBuffer, width, height);
                if (el.redraw) el.redraw();
            }
        },
        reset: (comp, el) => {
            if (el.imageData) {
                // Create transparent black image data
                const width = 128;
                const height = 64;
                el.imageData = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
                el.redraw?.();
            }
        }
    },
    'wokwi-ssd1306': { update: (c, e, s) => COMPONENT_MAPPINGS['oled'].update(c, e, s), reset: (c, e) => COMPONENT_MAPPINGS['oled'].reset?.(c, e) },

    // --- Pushbutton ---
    'pushbutton': {
        update: () => { },
        onEvent: (comp, el, simulator, name, detail) => {
            if (name === 'input' || name === 'change' || name === 'mousedown' || name === 'mouseup' || name === 'pointerdown' || name === 'pointerup') {
                let isDown = el.down || el.value === true || el.value === 'true';
                if (name === 'mousedown' || name === 'pointerdown') isDown = true;
                if (name === 'mouseup' || name === 'pointerup') isDown = false;

                const pins = ['1.l', '1.r', '2.l', '2.r'];
                if (isDown) {
                    let hasGND = false;
                    let hasVCC = false;
                    for (const pin of pins) {
                        const v = simulator.getPinVoltage(comp.id, pin);
                        if (v < 0.5) hasGND = true;
                        if (v > 4.0) hasVCC = true;
                    }
                    let targetState = false;
                    if (hasGND) targetState = false;
                    else if (hasVCC) targetState = true;
                    pins.forEach(pin => simulator.setInput(comp.id, pin, targetState));
                } else {
                    let hasGND = false;
                    let hasVCC = false;
                    for (const pin of pins) {
                        const v = simulator.getPinVoltage(comp.id, pin);
                        if (v < 0.5) hasGND = true;
                        if (v > 4.0) hasVCC = true;
                    }
                    let releaseState = true;
                    if (hasGND) releaseState = true;
                    else if (hasVCC) releaseState = false;
                    pins.forEach(pin => simulator.setInput(comp.id, pin, releaseState));
                }
            }
        }
    },
    'wokwi-pushbutton': { update: () => { }, onEvent: (c, e, s, n, d) => COMPONENT_MAPPINGS['pushbutton'].onEvent!(c, e, s, n, d) },

    // --- NeoPixel ---
    'wokwi-neopixel': {
        update: (comp, el, simulator) => {
            const state = simulator.getNeoPixelState(comp.id);
            if (state && state.length > 0) {
                const c = state[0];
                const r = ((c >> 16) & 0xFF) / 255;
                const g = ((c >> 8) & 0xFF) / 255;
                const b = (c & 0xFF) / 255;

                if (el.r !== r) el.r = r;
                if (el.g !== g) el.g = g;
                if (el.b !== b) el.b = b;

                // Add "Glow" effect for perceived brightness
                const intensity = (r + g + b) / 3;
                if (intensity > 0) {
                    const glowColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.8)`;
                    el.style.filter = `drop-shadow(0 0 ${4 + intensity * 6}px ${glowColor})`;
                } else {
                    el.style.filter = 'none';
                }
            } else {
                if (el.r !== 0) el.r = 0;
                if (el.g !== 0) el.g = 0;
                if (el.b !== 0) el.b = 0;
                el.style.filter = 'none';
            }
        },
        reset: (comp, el) => {
            el.r = 0;
            el.g = 0;
            el.b = 0;
            el.style.filter = 'none';
        }
    },
    'neopixel': { update: (c, e, s) => COMPONENT_MAPPINGS['wokwi-neopixel'].update(c, e, s), reset: (c, e) => COMPONENT_MAPPINGS['wokwi-neopixel'].reset?.(c, e) },

    // --- 7-Segment Display ---
    'wokwi-7segment': {
        update: (comp, el, simulator) => {
            const com1 = simulator.getPinVoltage(comp.id, 'COM.1');
            const com2 = simulator.getPinVoltage(comp.id, 'COM.2');
            const comV = (com1 + com2) / 2; // Average or just pick one

            const segments = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'];
            const segmentValues = segments.map(seg => {
                const segV = simulator.getPinVoltage(comp.id, seg);
                const diff = Math.abs(segV - comV);
                // Threshold of ~2V for visibility, max at 5V
                return Math.max(0, Math.min(1, (diff - 1.5) / 2.5));
            });

            // Set individual segment properties if the element supports them
            // Convention: el.a, el.b, ..., el.dot
            if (el) {
                el.a = segmentValues[0] > 0.5;
                el.b = segmentValues[1] > 0.5;
                el.c = segmentValues[2] > 0.5;
                el.d = segmentValues[3] > 0.5;
                el.e = segmentValues[4] > 0.5;
                el.f = segmentValues[5] > 0.5;
                el.g = segmentValues[6] > 0.5;
                el.dot = segmentValues[7] > 0.5;

                // Also set an aggregate values array if needed
                el.values = segmentValues;
            }
        },
        reset: (comp, el) => {
            if (el) {
                ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dot'].forEach(p => el[p] = false);
                el.values = [0, 0, 0, 0, 0, 0, 0, 0];
            }
        }
    },

    // --- Servo Motor ---
    'wokwi-servo': {
        update: (comp, el, simulator) => {
            const pw = simulator.getPinPulseWidth(comp.id, 'PWM') || 0;

            // Standard hobby servo: 1ms to 2ms
            if (pw < 0.0004) return;

            const angle = ((pw - 0.001) / 0.001) * 180;
            const finalAngle = Math.max(0, Math.min(180, Math.round(angle)));

            if (!isNaN(finalAngle)) {
                // console.log(`[Servo] ${comp.id} Pulse: ${(pw*1000).toFixed(2)}ms, Angle: ${finalAngle}`);
                if (el.angle !== finalAngle) el.angle = finalAngle;
                if (el.getAttribute('angle') !== String(finalAngle)) {
                    el.setAttribute('angle', String(finalAngle));
                }
            }
        },
        reset: (comp, el) => {
            if (el) {
                el.angle = 0;
                el.setAttribute('angle', '0');
            }
        }
    },
};
