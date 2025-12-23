
import { ComponentType } from '../types';

interface PinDef {
  name: string;
  x: number; 
  y: number;
}

interface ComponentSpec {
  width: number;
  height: number;
  pins: PinDef[];
}

export const STATIC_COMPONENT_DATA: Record<string, ComponentSpec> = {
  'wokwi-arduino-uno': {
    width: 330,
    height: 240,
    pins: [
      { name: '0', x: 315, y: 15 }, 
      { name: '1', x: 302, y: 15 },
      { name: '2', x: 289, y: 15 },
      { name: '3', x: 276, y: 15 },
      { name: '4', x: 263, y: 15 },
      { name: '5', x: 250, y: 15 },
      { name: '6', x: 237, y: 15 },
      { name: '7', x: 224, y: 15 },
      { name: '8', x: 204, y: 15 },
      { name: '9', x: 191, y: 15 },
      { name: '10', x: 178, y: 15 },
      { name: '11', x: 165, y: 15 },
      { name: '12', x: 152, y: 15 },
      { name: '13', x: 139, y: 15 },
      { name: 'GND', x: 126, y: 15 }, 
      { name: 'AREF', x: 113, y: 15 },
      { name: 'SDA', x: 100, y: 15 },
      { name: 'SCL', x: 87, y: 15 },
      { name: 'A0', x: 224, y: 225 },
      { name: 'A1', x: 237, y: 225 },
      { name: 'A2', x: 250, y: 225 },
      { name: 'A3', x: 263, y: 225 },
      { name: 'A4', x: 276, y: 225 },
      { name: 'A5', x: 289, y: 225 },
      { name: 'VIN', x: 204, y: 225 },
      { name: 'GND', x: 191, y: 225 }, 
      { name: 'GND', x: 178, y: 225 }, 
      { name: '5V', x: 165, y: 225 },
      { name: '3.3V', x: 152, y: 225 },
      { name: 'RESET', x: 139, y: 225 },
      { name: 'IOREF', x: 126, y: 225 }
    ]
  },
  'wokwi-arduino-nano': { 
    width: 60, 
    height: 180, 
    pins: [
      // Left Side (Top to Bottom)
      { name: 'TX', x: 0, y: 10 }, { name: 'RX', x: 0, y: 20 }, { name: 'RST', x: 0, y: 30 }, { name: 'GND', x: 0, y: 40 },
      { name: '2', x: 0, y: 50 }, { name: '3', x: 0, y: 60 }, { name: '4', x: 0, y: 70 }, { name: '5', x: 0, y: 80 },
      { name: '6', x: 0, y: 90 }, { name: '7', x: 0, y: 100 }, { name: '8', x: 0, y: 110 }, { name: '9', x: 0, y: 120 },
      { name: '10', x: 0, y: 130 }, { name: '11', x: 0, y: 140 }, { name: '12', x: 0, y: 150 },
      // Right Side (Top to Bottom)
      { name: 'VIN', x: 60, y: 10 }, { name: 'GND', x: 60, y: 20 }, { name: 'RST', x: 60, y: 30 }, { name: '5V', x: 60, y: 40 },
      { name: 'A7', x: 60, y: 50 }, { name: 'A6', x: 60, y: 60 }, { name: 'A5', x: 60, y: 70 }, { name: 'A4', x: 60, y: 80 },
      { name: 'A3', x: 60, y: 90 }, { name: 'A2', x: 60, y: 100 }, { name: 'A1', x: 60, y: 110 }, { name: 'A0', x: 60, y: 120 },
      { name: 'REF', x: 60, y: 130 }, { name: '3.3V', x: 60, y: 140 }, { name: '13', x: 60, y: 150 }
    ] 
  },
  'wokwi-arduino-mega': { 
    width: 550, 
    height: 280, 
    pins: [
       // Top Row - Digital & Communication
       { name: '0', x: 500, y: 15 }, { name: '1', x: 488, y: 15 }, { name: '2', x: 476, y: 15 }, { name: '3', x: 464, y: 15 },
       { name: '4', x: 452, y: 15 }, { name: '5', x: 440, y: 15 }, { name: '6', x: 428, y: 15 }, { name: '7', x: 416, y: 15 },
       { name: '8', x: 396, y: 15 }, { name: '9', x: 384, y: 15 }, { name: '10', x: 372, y: 15 }, { name: '11', x: 360, y: 15 },
       { name: '12', x: 348, y: 15 }, { name: '13', x: 336, y: 15 },
       { name: 'GND', x: 324, y: 15 }, { name: 'AREF', x: 312, y: 15 }, { name: 'SDA', x: 300, y: 15 }, { name: 'SCL', x: 288, y: 15 },
       
       // Bottom Row - Power & Analog
       { name: 'A0', x: 416, y: 265 }, { name: 'A1', x: 428, y: 265 }, { name: 'A2', x: 440, y: 265 }, { name: 'A3', x: 452, y: 265 },
       { name: 'A4', x: 464, y: 265 }, { name: 'A5', x: 476, y: 265 }, { name: 'A6', x: 488, y: 265 }, { name: 'A7', x: 500, y: 265 },
       { name: 'VIN', x: 396, y: 265 }, { name: 'GND', x: 384, y: 265 }, { name: 'GND', x: 372, y: 265 }, { name: '5V', x: 360, y: 265 },
       { name: '3.3V', x: 348, y: 265 }, { name: 'RESET', x: 336, y: 265 }, { name: 'IOREF', x: 324, y: 265 },

       // Right Side Block (Digital 22-53) - Simplified representation
       { name: '22', x: 535, y: 40 }, { name: '23', x: 535, y: 52 }, 
       { name: '24', x: 535, y: 64 }, { name: '25', x: 535, y: 76 },
       { name: '50', x: 535, y: 200 }, { name: '51', x: 535, y: 212 },
       { name: '52', x: 535, y: 224 }, { name: '53', x: 535, y: 236 }
    ] 
  },
  'wokwi-led': {
    width: 28,
    height: 48,
    pins: [{ name: 'A', x: 10, y: 46 }, { name: 'C', x: 18, y: 46 }]
  },
  'wokwi-resistor': {
    width: 100,
    height: 20,
    pins: [{ name: '1', x: 0, y: 10 }, { name: '2', x: 100, y: 10 }]
  },
  'wokwi-pushbutton': {
    width: 50,
    height: 50,
    pins: [{ name: '1.l', x: 0, y: 14 }, { name: '2.l', x: 0, y: 36 }, { name: '1.r', x: 50, y: 14 }, { name: '2.r', x: 50, y: 36 }]
  },
  'wokwi-slide-switch': { 
    width: 40, 
    height: 20, 
    pins: [{ name: '1', x: 5, y: 20 }, { name: '2', x: 20, y: 20 }, { name: '3', x: 35, y: 20 }] 
  },
  'wokwi-tilt-switch': { 
    width: 20, 
    height: 40, 
    pins: [{ name: '1', x: 5, y: 40 }, { name: '2', x: 15, y: 40 }] 
  },
  'wokwi-potentiometer': {
    width: 50,
    height: 60,
    pins: [{ name: 'GND', x: 5, y: 55 }, { name: 'SIG', x: 25, y: 55 }, { name: 'VCC', x: 45, y: 55 }]
  },
  'wokwi-slide-potentiometer': { 
    width: 140, 
    height: 30, 
    pins: [{ name: 'VCC', x: 10, y: 30 }, { name: 'SIG', x: 70, y: 30 }, { name: 'GND', x: 130, y: 30 }] 
  },
  'wokwi-membrane-keypad': { 
    width: 180, 
    height: 230, 
    pins: [
      { name: 'R1', x: 40, y: 0 }, { name: 'R2', x: 54, y: 0 }, { name: 'R3', x: 68, y: 0 }, { name: 'R4', x: 82, y: 0 },
      { name: 'C1', x: 96, y: 0 }, { name: 'C2', x: 110, y: 0 }, { name: 'C3', x: 124, y: 0 }, { name: 'C4', x: 138, y: 0 }
    ] 
  },
  'wokwi-rotary-dialer': { width: 200, height: 200, pins: [{ name: '1', x: 100, y: 0 }, { name: '2', x: 120, y: 0 }] },
  'wokwi-analog-joystick': { 
    width: 80, 
    height: 80, 
    pins: [
      { name: 'GND', x: 10, y: 0 }, { name: '5V', x: 25, y: 0 }, { name: 'VRX', x: 40, y: 0 }, { name: 'VRY', x: 55, y: 0 }, { name: 'SW', x: 70, y: 0 }
    ] 
  },
  'wokwi-servo': {
    width: 100,
    height: 100,
    pins: [{ name: 'GND', x: 10, y: 100 }, { name: 'VCC', x: 25, y: 100 }, { name: 'PWM', x: 40, y: 100 }]
  },
  'wokwi-hc-sr04': {
      width: 80,
      height: 40,
      pins: [{ name: 'VCC', x: 10, y: 36 }, { name: 'TRIG', x: 30, y: 36 }, { name: 'ECHO', x: 50, y: 36 }, { name: 'GND', x: 70, y: 36 }]
  },
  'wokwi-lcd1602': {
    width: 320,
    height: 60,
    pins: [
      { name: 'VSS', x: 10, y: 10 }, { name: 'VDD', x: 25, y: 10 }, { name: 'V0', x: 40, y: 10 }, 
      { name: 'RS', x: 55, y: 10 }, { name: 'RW', x: 70, y: 10 }, { name: 'E', x: 85, y: 10 },
      { name: 'D0', x: 100, y: 10 }, { name: 'D1', x: 115, y: 10 }, { name: 'D2', x: 130, y: 10 }, { name: 'D3', x: 145, y: 10 },
      { name: 'D4', x: 160, y: 10 }, { name: 'D5', x: 175, y: 10 }, { name: 'D6', x: 190, y: 10 }, { name: 'D7', x: 205, y: 10 },
      { name: 'A', x: 220, y: 10 }, { name: 'K', x: 235, y: 10 },
      // I2C Pins if simplified
      { name: 'GND', x: 10, y: 10 }, { name: 'VCC', x: 25, y: 10 }, { name: 'SDA', x: 40, y: 10 }, { name: 'SCL', x: 55, y: 10 }
    ]
  },
  'wokwi-lcd2004': { 
      width: 350, 
      height: 100, 
      pins: [
        { name: 'VSS', x: 10, y: 10 }, { name: 'VDD', x: 25, y: 10 }, { name: 'V0', x: 40, y: 10 }, 
        { name: 'RS', x: 55, y: 10 }, { name: 'RW', x: 70, y: 10 }, { name: 'E', x: 85, y: 10 },
        { name: 'D0', x: 100, y: 10 }, { name: 'D1', x: 115, y: 10 }, { name: 'D2', x: 130, y: 10 }, { name: 'D3', x: 145, y: 10 },
        { name: 'D4', x: 160, y: 10 }, { name: 'D5', x: 175, y: 10 }, { name: 'D6', x: 190, y: 10 }, { name: 'D7', x: 205, y: 10 },
        { name: 'A', x: 220, y: 10 }, { name: 'K', x: 235, y: 10 },
        { name: 'GND', x: 10, y: 10 }, { name: 'VCC', x: 25, y: 10 }, { name: 'SDA', x: 40, y: 10 }, { name: 'SCL', x: 55, y: 10 }
      ] 
  }, 
  'wokwi-ssd1306': { 
    width: 100, 
    height: 100, 
    pins: [{ name: 'GND', x: 20, y: 5 }, { name: 'VCC', x: 40, y: 5 }, { name: 'SCL', x: 60, y: 5 }, { name: 'SDA', x: 80, y: 5 }] 
  },
  'wokwi-dht22': {
    width: 60,
    height: 80,
    pins: [{ name: 'VCC', x: 10, y: 80 }, { name: 'SDA', x: 24, y: 80 }, { name: 'NC', x: 38, y: 80 }, { name: 'GND', x: 52, y: 80 }]
  },
  'wokwi-7segment': { 
    width: 50, 
    height: 70, 
    pins: [
      { name: 'G', x: 5, y: 0 }, { name: 'F', x: 15, y: 0 }, { name: 'COM.1', x: 25, y: 0 }, { name: 'A', x: 35, y: 0 }, { name: 'B', x: 45, y: 0 },
      { name: 'E', x: 5, y: 70 }, { name: 'D', x: 15, y: 70 }, { name: 'COM.2', x: 25, y: 70 }, { name: 'C', x: 35, y: 70 }, { name: 'DP', x: 45, y: 70 }
    ] 
  },
  'wokwi-led-ring': { width: 150, height: 150, pins: [{ name: 'GND', x: 75, y: 150 }, { name: 'VCC', x: 65, y: 150 }, { name: 'DIN', x: 55, y: 150 }, { name: 'DOUT', x: 85, y: 150 }] },
  'wokwi-neopixel': { width: 40, height: 40, pins: [{ name: 'DOUT', x: 5, y: 35 }, { name: 'GND', x: 15, y: 35 }, { name: 'VCC', x: 25, y: 35 }, { name: 'DIN', x: 35, y: 35 }] },
  'wokwi-neopixel-matrix': { width: 160, height: 160, pins: [{ name: 'DIN', x: 20, y: 160 }, { name: 'VCC', x: 40, y: 160 }, { name: 'GND', x: 60, y: 160 }] },
  'wokwi-buzzer': { 
    width: 50, 
    height: 50, 
    pins: [{ name: '2', x: 15, y: 50 }, { name: '1', x: 35, y: 50 }] // 1=Pos, 2=Neg usually
  },
  'wokwi-ky-040': { 
    width: 60, 
    height: 70, 
    pins: [
      { name: 'CLK', x: 10, y: 70 }, { name: 'DT', x: 20, y: 70 }, { name: 'SW', x: 30, y: 70 }, { name: 'VCC', x: 40, y: 70 }, { name: 'GND', x: 50, y: 70 }
    ] 
  },
  'wokwi-ir-receiver': { 
    width: 30, 
    height: 40, 
    pins: [{ name: 'OUT', x: 5, y: 40 }, { name: 'GND', x: 15, y: 40 }, { name: 'VCC', x: 25, y: 40 }] 
  },
  'wokwi-ir-remote': { width: 100, height: 200, pins: [] }, // Wireless
  'wokwi-pir-motion-sensor': { 
    width: 80, 
    height: 80, 
    pins: [{ name: 'VCC', x: 20, y: 80 }, { name: 'OUT', x: 40, y: 80 }, { name: 'GND', x: 60, y: 80 }] 
  },
  'wokwi-photoresistor-sensor': { 
    width: 40, 
    height: 40, 
    pins: [{ name: 'AO', x: 5, y: 40 }, { name: 'DO', x: 15, y: 40 }, { name: 'GND', x: 25, y: 40 }, { name: 'VCC', x: 35, y: 40 }] 
  },
  'wokwi-ntc-temperature-sensor': { 
    width: 20, 
    height: 40, 
    pins: [{ name: 'A0', x: 5, y: 40 }, { name: 'D0', x: 10, y: 40 }, { name: 'GND', x: 15, y: 40 }, { name: 'VCC', x: 20, y: 40 }] 
  },
  'wokwi-gas-sensor': { 
    width: 60, 
    height: 60, 
    pins: [{ name: 'AO', x: 15, y: 60 }, { name: 'DO', x: 25, y: 60 }, { name: 'GND', x: 35, y: 60 }, { name: 'VCC', x: 45, y: 60 }] 
  },
  'wokwi-ds1307': { 
    width: 60, 
    height: 60, 
    pins: [{ name: 'DS', x: 10, y: 60 }, { name: 'SCL', x: 20, y: 60 }, { name: 'SDA', x: 30, y: 60 }, { name: 'VCC', x: 40, y: 60 }, { name: 'GND', x: 50, y: 60 }] 
  },
  'wokwi-mpu6050': { 
    width: 60, 
    height: 40, 
    pins: [
      { name: 'VCC', x: 5, y: 0 }, { name: 'GND', x: 12, y: 0 }, { name: 'SCL', x: 19, y: 0 }, { name: 'SDA', x: 26, y: 0 },
      { name: 'XDA', x: 33, y: 0 }, { name: 'XCL', x: 40, y: 0 }, { name: 'AD0', x: 47, y: 0 }, { name: 'INT', x: 54, y: 0 }
    ] 
  },
  'wokwi-big-sound-sensor': { 
    width: 60, 
    height: 30, 
    pins: [{ name: 'AO', x: 15, y: 30 }, { name: 'GND', x: 30, y: 30 }, { name: 'VCC', x: 45, y: 30 }, { name: 'DO', x: 60, y: 30 }] 
  },
  'wokwi-small-sound-sensor': { 
    width: 60, 
    height: 30, 
    pins: [{ name: 'AO', x: 15, y: 30 }, { name: 'GND', x: 30, y: 30 }, { name: 'VCC', x: 45, y: 30 }, { name: 'DO', x: 60, y: 30 }] 
  },
  'wokwi-heart-beat-sensor': { 
    width: 40, 
    height: 40, 
    pins: [{ name: 'AO', x: 10, y: 40 }, { name: 'GND', x: 20, y: 40 }, { name: 'VCC', x: 30, y: 40 }] 
  },
  'wokwi-flame-sensor': { 
    width: 40, 
    height: 30, 
    pins: [{ name: 'AO', x: 10, y: 30 }, { name: 'GND', x: 20, y: 30 }, { name: 'VCC', x: 30, y: 30 }, { name: 'DO', x: 40, y: 30 }] 
  },
};

export function getComponentDimensions(type: string) {
    const key = type.startsWith('wokwi-') ? type : `wokwi-${type}`;
    const spec = STATIC_COMPONENT_DATA[key];
    if (spec) return { width: spec.width, height: spec.height };
    // Default fallback for unknown components - make it visible enough
    return { width: 100, height: 100 };
}

export function getComponentSpec(type: string) {
    const key = type.startsWith('wokwi-') ? type : `wokwi-${type}`;
    return STATIC_COMPONENT_DATA[key] || null;
}
