
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
  'wokwi-led': {
    width: 28, // Better visual match
    height: 48,
    pins: [
      { name: 'A', x: 10, y: 46 }, // Anode leg
      { name: 'C', x: 18, y: 46 }  // Cathode leg
    ]
  },
  'wokwi-resistor': {
    width: 100,
    height: 20,
    pins: [
      { name: '1', x: 0, y: 10 },
      { name: '2', x: 100, y: 10 }
    ]
  },
  'wokwi-pushbutton': {
    width: 50,
    height: 50,
    pins: [
      { name: '1.l', x: 0, y: 14 },
      { name: '2.l', x: 0, y: 36 },
      { name: '1.r', x: 50, y: 14 },
      { name: '2.r', x: 50, y: 36 }
    ]
  },
  'wokwi-potentiometer': {
    width: 50,
    height: 60,
    pins: [
        { name: 'GND', x: 5, y: 55 },
        { name: 'SIG', x: 25, y: 55 },
        { name: 'VCC', x: 45, y: 55 }
    ]
  },
  'wokwi-servo': {
    width: 100,
    height: 100,
    pins: [
        { name: 'GND', x: 10, y: 100 },
        { name: 'VCC', x: 25, y: 100 },
        { name: 'PWM', x: 40, y: 100 }
    ]
  },
  'wokwi-hc-sr04': {
      width: 80,
      height: 40,
      pins: [
          { name: 'VCC', x: 10, y: 36 },
          { name: 'TRIG', x: 30, y: 36 },
          { name: 'ECHO', x: 50, y: 36 },
          { name: 'GND', x: 70, y: 36 }
      ]
  },
  'wokwi-lcd1602': {
    width: 180,
    height: 80,
    pins: [
      { name: 'VCC', x: 10, y: 10 },
      { name: 'GND', x: 25, y: 10 },
      { name: 'SDA', x: 40, y: 10 },
      { name: 'SCL', x: 55, y: 10 }
    ]
  },
  'wokwi-dht22': {
    width: 60,
    height: 80,
    pins: [
      { name: 'VCC', x: 10, y: 80 },
      { name: 'SDA', x: 30, y: 80 }, 
      { name: 'NC', x: 40, y: 80 },
      { name: 'GND', x: 50, y: 80 }
    ]
  }
};

export function getComponentDimensions(type: string) {
    const key = type.startsWith('wokwi-') ? type : `wokwi-${type}`;
    const spec = STATIC_COMPONENT_DATA[key];
    if (spec) return { width: spec.width, height: spec.height };
    return { width: 100, height: 100 };
}

export function getComponentSpec(type: string) {
    const key = type.startsWith('wokwi-') ? type : `wokwi-${type}`;
    return STATIC_COMPONENT_DATA[key] || null;
}
