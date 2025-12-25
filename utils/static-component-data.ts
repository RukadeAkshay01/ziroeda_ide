
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
    width: 274.318110239478,
    height: 201.600000002394,
    pins: [
      { name: "A5.2", x: 87, y: 9 }, { name: "A4.2", x: 97, y: 9 }, { name: "AREF", x: 106, y: 9 }, { name: "GND.1", x: 115.5, y: 9 },
      { name: "13", x: 125, y: 9 }, { name: "12", x: 134.5, y: 9 }, { name: "11", x: 144, y: 9 }, { name: "10", x: 153.5, y: 9 },
      { name: "9", x: 163, y: 9 }, { name: "8", x: 173, y: 9 }, { name: "7", x: 189, y: 9 }, { name: "6", x: 198.5, y: 9 },
      { name: "5", x: 208, y: 9 }, { name: "4", x: 217.5, y: 9 }, { name: "3", x: 227, y: 9 }, { name: "2", x: 236.5, y: 9 },
      { name: "1", x: 246, y: 9 }, { name: "0", x: 255.5, y: 9 }, { name: "IOREF", x: 131, y: 191.5 }, { name: "RESET", x: 140.5, y: 191.5 },
      { name: "3.3V", x: 150, y: 191.5 }, { name: "5V", x: 160, y: 191.5 }, { name: "GND.2", x: 169.5, y: 191.5 }, { name: "GND.3", x: 179, y: 191.5 },
      { name: "VIN", x: 188.5, y: 191.5 }, { name: "A0", x: 208, y: 191.5 }, { name: "A1", x: 217.5, y: 191.5 }, { name: "A2", x: 227, y: 191.5 },
      { name: "A3", x: 236.5, y: 191.5 }, { name: "A4", x: 246, y: 191.5 }, { name: "A5", x: 255.5, y: 191.5 }
    ]
  },
  'wokwi-arduino-nano': {
    width: 169.70078740359,
    height: 67.27559055198,
    pins: [
      { name: "12", x: 19.7, y: 4.8 }, { name: "11", x: 29.3, y: 4.8 }, { name: "10", x: 38.9, y: 4.8 }, { name: "9", x: 48.5, y: 4.8 },
      { name: "8", x: 58.1, y: 4.8 }, { name: "7", x: 67.7, y: 4.8 }, { name: "6", x: 77.3, y: 4.8 }, { name: "5", x: 86.9, y: 4.8 },
      { name: "4", x: 96.5, y: 4.8 }, { name: "3", x: 106.1, y: 4.8 }, { name: "2", x: 115.7, y: 4.8 }, { name: "GND.2", x: 125.3, y: 4.8 },
      { name: "RESET.2", x: 134.9, y: 4.8 }, { name: "0", x: 144.5, y: 4.8 }, { name: "1", x: 154.1, y: 4.8 }, { name: "13", x: 19.7, y: 62.4 },
      { name: "3.3V", x: 29.3, y: 62.4 }, { name: "AREF", x: 38.9, y: 62.4 }, { name: "A0", x: 48.5, y: 62.4 }, { name: "A1", x: 58.1, y: 62.4 },
      { name: "A2", x: 67.7, y: 62.4 }, { name: "A3", x: 77.3, y: 62.4 }, { name: "A4", x: 86.9, y: 62.4 }, { name: "A5", x: 96.5, y: 62.4 },
      { name: "A6", x: 106.1, y: 62.4 }, { name: "A7", x: 115.7, y: 62.4 }, { name: "5V", x: 125.3, y: 62.4 }, { name: "RESET", x: 134.9, y: 62.4 },
      { name: "GND.1", x: 144.5, y: 62.4 }, { name: "VIN", x: 154.1, y: 62.4 }, { name: "12.2", x: 163.7, y: 43.2 }, { name: "5V.2", x: 154.1, y: 43.2 },
      { name: "13.2", x: 163.7, y: 33.6 }, { name: "11.2", x: 154.1, y: 33.6 }, { name: "RESET.3", x: 163.7, y: 24 }, { name: "GND.3", x: 154.1, y: 24 }
    ]
  },
  'wokwi-arduino-mega': {
    width: 388.006299217206,
    height: 192.00000000228,
    pins: [
      { name: "SCL", x: 90, y: 9 }, { name: "SDA", x: 100, y: 9 }, { name: "AREF", x: 109, y: 9 }, { name: "GND.1", x: 119, y: 9 },
      { name: "13", x: 129, y: 9 }, { name: "12", x: 138, y: 9 }, { name: "11", x: 148, y: 9 }, { name: "10", x: 157.5, y: 9 },
      { name: "9", x: 167.5, y: 9 }, { name: "8", x: 177, y: 9 }, { name: "7", x: 190, y: 9 }, { name: "6", x: 200, y: 9 },
      { name: "5", x: 209.5, y: 9 }, { name: "4", x: 219, y: 9 }, { name: "3", x: 228.5, y: 9 }, { name: "2", x: 238, y: 9 },
      { name: "1", x: 247.5, y: 9 }, { name: "0", x: 257.5, y: 9 }, { name: "14", x: 270.5, y: 9 }, { name: "15", x: 280, y: 9 },
      { name: "16", x: 289.5, y: 9 }, { name: "17", x: 299, y: 9 }, { name: "18", x: 308.5, y: 9 }, { name: "19", x: 318.5, y: 9 },
      { name: "20", x: 328, y: 9 }, { name: "21", x: 337.5, y: 9 }, { name: "5V.1", x: 361, y: 8 }, { name: "5V.2", x: 371, y: 8 },
      { name: "22", x: 361, y: 17.5 }, { name: "23", x: 371, y: 17.5 }, { name: "24", x: 361, y: 27.25 }, { name: "25", x: 371, y: 27.25 },
      { name: "26", x: 361, y: 36.75 }, { name: "27", x: 371, y: 36.75 }, { name: "28", x: 361, y: 46.25 }, { name: "29", x: 371, y: 46.25 },
      { name: "30", x: 361, y: 56 }, { name: "31", x: 371, y: 56 }, { name: "32", x: 361, y: 65.5 }, { name: "33", x: 371, y: 65.5 },
      { name: "34", x: 361, y: 75 }, { name: "35", x: 371, y: 75 }, { name: "36", x: 361, y: 84.5 }, { name: "37", x: 371, y: 84.5 },
      { name: "38", x: 361, y: 94.25 }, { name: "39", x: 371, y: 94.25 }, { name: "40", x: 361, y: 103.75 }, { name: "41", x: 371, y: 103.75 },
      { name: "42", x: 361, y: 113.5 }, { name: "43", x: 371, y: 113.5 }, { name: "44", x: 361, y: 123 }, { name: "45", x: 371, y: 123 },
      { name: "46", x: 361, y: 132.75 }, { name: "47", x: 371, y: 132.75 }, { name: "48", x: 361, y: 142.25 }, { name: "49", x: 371, y: 142.25 },
      { name: "50", x: 361, y: 152 }, { name: "51", x: 371, y: 152 }, { name: "52", x: 361, y: 161.5 }, { name: "53", x: 371, y: 161.5 },
      { name: "GND.4", x: 361, y: 171.25 }, { name: "GND.5", x: 371, y: 171.25 }, { name: "IOREF", x: 136, y: 184.5 }, { name: "RESET", x: 145.5, y: 184.5 },
      { name: "3.3V", x: 155, y: 184.5 }, { name: "5V", x: 164.5, y: 184.5 }, { name: "GND.2", x: 174.25, y: 184.5 }, { name: "GND.3", x: 183.75, y: 184.5 },
      { name: "VIN", x: 193.5, y: 184.5 }, { name: "A0", x: 208.5, y: 184.5 }, { name: "A1", x: 218, y: 184.5 }, { name: "A2", x: 227.5, y: 184.5 },
      { name: "A3", x: 237.25, y: 184.5 }, { name: "A4", x: 246.75, y: 184.5 }, { name: "A5", x: 256.25, y: 184.5 }, { name: "A6", x: 266, y: 184.5 },
      { name: "A7", x: 275.5, y: 184.5 }, { name: "A8", x: 290.25, y: 184.5 }, { name: "A9", x: 300, y: 184.5 }, { name: "A10", x: 309.5, y: 184.5 },
      { name: "A11", x: 319.25, y: 184.5 }, { name: "A12", x: 328.75, y: 184.5 }, { name: "A13", x: 338.5, y: 184.5 }, { name: "A14", x: 348, y: 184.5 },
      { name: "A15", x: 357.75, y: 184.5 }
    ]
  },
  'wokwi-led': {
    width: 40,
    height: 50,
    pins: [{ name: "A", x: 25, y: 42 }, { name: "C", x: 15, y: 42 }]
  },
  'wokwi-resistor': {
    width: 59.130708662119496,
    height: 11.3385826773,
    pins: [{ name: "1", x: 0, y: 14 }, { name: "2", x: 58.8, y: 14 }]
  },
  'wokwi-pushbutton': {
    width: 67.2831496070982,
    height: 45.3543307092,
    pins: [{ name: "1.l", x: 0, y: 13 }, { name: "2.l", x: 0, y: 32 }, { name: "1.r", x: 67, y: 13 }, { name: "2.r", x: 67, y: 32 }]
  },
  'wokwi-slide-switch': {
    width: 40,
    height: 20,
    pins: [{ name: '1', x: 5, y: 20 }, { name: '2', x: 20, y: 20 }, { name: '3', x: 35, y: 20 }]
  },
  'wokwi-potentiometer': {
    width: 75.590551182,
    height: 75.590551182,
    pins: [{ name: "GND", x: 29, y: 68.5 }, { name: "SIG", x: 39, y: 68.5 }, { name: "VCC", x: 49, y: 68.5 }]
  },
  'wokwi-membrane-keypad': {
    width: 180,
    height: 230,
    pins: [
      { name: "R1", x: 76.5, y: 338 }, { name: "R2", x: 86, y: 338 }, { name: "R3", x: 95.75, y: 338 }, { name: "R4", x: 105.25, y: 338 },
      { name: "C1", x: 115, y: 338 }, { name: "C2", x: 124.5, y: 338 }, { name: "C3", x: 134, y: 338 }
    ]
  },
  'wokwi-servo': {
    width: 170.0787401595,
    height: 119.54645669433299,
    pins: [{ name: "GND", x: 0, y: 50 }, { name: "V+", x: 0, y: 59.5 }, { name: "PWM", x: 0, y: 69 }]
  },
  'wokwi-hc-sr04': {
    width: 170.0787401595,
    height: 94.4881889775,
    pins: [{ name: "VCC", x: 71.3, y: 94.5 }, { name: "TRIG", x: 81.3, y: 94.5 }, { name: "ECHO", x: 91.3, y: 94.5 }, { name: "GND", x: 101.3, y: 94.5 }]
  },
  'wokwi-lcd1602': {
    width: 270,
    height: 70,
    pins: [
      { name: "VSS", x: 20, y: 15 }, { name: "VDD", x: 34, y: 15 }, { name: "V0", x: 48, y: 15 }, { name: "RS", x: 62, y: 15 },
      { name: "RW", x: 76, y: 15 }, { name: "E", x: 90, y: 15 }, { name: "D0", x: 104, y: 15 }, { name: "D1", x: 118, y: 15 },
      { name: "D2", x: 132, y: 15 }, { name: "D3", x: 146, y: 15 }, { name: "D4", x: 160, y: 15 }, { name: "D5", x: 174, y: 15 },
      { name: "D6", x: 188, y: 15 }, { name: "D7", x: 202, y: 15 }, { name: "A", x: 216, y: 15 }, { name: "K", x: 230, y: 15 }
    ]
  },
  'wokwi-ssd1306': {
    width: 150,
    height: 116,
    pins: [
      { name: "DATA", x: 36.5, y: 12.5 }, { name: "CLK", x: 45.5, y: 12.5 }, { name: "DC", x: 54.5, y: 12.5 }, { name: "RST", x: 64.5, y: 12.5 },
      { name: "CS", x: 74.5, y: 12.5 }, { name: "3V3", x: 83.5, y: 12.5 }, { name: "VIN", x: 93.5, y: 12.5 }, { name: "GND", x: 103.5, y: 12 }
    ]
  },
  'wokwi-dht22': {
    width: 57.07086614241,
    height: 116.73070866280351,
    pins: [{ name: "VCC", x: 15, y: 114.9 }, { name: "SDA", x: 24.5, y: 114.9 }, { name: "NC", x: 34.1, y: 114.9 }, { name: "GND", x: 43.8, y: 114.9 }]
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
  'wokwi-neopixel': { width: 40, height: 40, pins: [{ name: 'DOUT', x: 5, y: 35 }, { name: 'VDD', x: 15, y: 35 }, { name: 'VSS', x: 25, y: 35 }, { name: 'DIN', x: 35, y: 35 }] },
  'wokwi-buzzer': {
    width: 64.2519685047,
    height: 75.590551182,
    pins: [{ name: "1", x: 27, y: 84 }, { name: "2", x: 37, y: 84 }]
  },

  'wokwi-pir-motion-sensor': {
    width: 90.7086614184,
    height: 92.4018897648768,
    pins: [{ name: 'VCC', x: 20, y: 80 }, { name: 'OUT', x: 40, y: 80 }, { name: 'GND', x: 60, y: 80 }]
  },
  'wokwi-photoresistor-sensor': {
    width: 173.669291340645,
    height: 61.481574803879695,
    pins: [{ name: "VCC", x: 172, y: 16 }, { name: "GND", x: 172, y: 26 }, { name: "DO", x: 172, y: 35.8 }, { name: "AO", x: 172, y: 45.5 }]
  },
  'wokwi-mpu6050': {
    width: 81.63779527656,
    height: 61.228346457419995,
    pins: [
      { name: "INT", x: 7.28, y: 5.78 }, { name: "AD0", x: 16.9, y: 5.78 }, { name: "XCL", x: 26.4, y: 5.78 }, { name: "XDA", x: 36, y: 5.78 },
      { name: "SDA", x: 45.6, y: 5.78 }, { name: "SCL", x: 55.2, y: 5.78 }, { name: "GND", x: 64.8, y: 5.78 }, { name: "VCC", x: 74.4, y: 5.78 }
    ]
  }
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
