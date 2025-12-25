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
        }
    },
    'wokwi-lcd1602': { update: (c, e, s) => COMPONENT_MAPPINGS['lcd1602'].update(c, e, s) },

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
        }
    },
    'wokwi-ssd1306': { update: (c, e, s) => COMPONENT_MAPPINGS['oled'].update(c, e, s) },

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
};
