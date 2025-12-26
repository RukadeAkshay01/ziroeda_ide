
export const GRID_SIZE = 20;

// Hub Position: Shifted slightly right to account for typically larger input clusters on the left
export const HUB_X = 700;
export const HUB_Y = 400;

// Grid Layout Constants
export const FIRST_COL_GAP = 350; // Distance from Hub to the first column of components
export const COL_SPACING = 250;   // Horizontal distance between columns
export const MAX_PER_COL = 6;     // Maximum components per vertical column before wrapping

export const RESISTOR_GAP = 120;
export const VERTICAL_BUFFER = 140; // Vertical space between component centers

/**
 * Categories for layout logic
 */
export const TYPE_CATEGORIES: Record<string, 'HUB' | 'INPUT' | 'OUTPUT' | 'PASSIVE'> = {
  // Microcontrollers
  'wokwi-arduino-uno': 'HUB',
  'wokwi-arduino-nano': 'HUB',
  'wokwi-arduino-mega': 'HUB',

  // Inputs / Sensors
  'wokwi-pushbutton': 'INPUT',
  'wokwi-potentiometer': 'INPUT',
  'wokwi-slide-switch': 'INPUT',
  'wokwi-membrane-keypad': 'INPUT',
  'wokwi-ky-040': 'INPUT',

  'wokwi-dht22': 'INPUT',
  'wokwi-hc-sr04': 'INPUT',
  'wokwi-pir-motion-sensor': 'INPUT',
  'wokwi-photoresistor-sensor': 'INPUT',
  'wokwi-mpu6050': 'INPUT',

  // Outputs / Actuators
  'wokwi-led': 'OUTPUT',
  'wokwi-neopixel': 'OUTPUT',
  'wokwi-7segment': 'OUTPUT',
  'wokwi-buzzer': 'OUTPUT',
  'wokwi-servo': 'OUTPUT',
  'wokwi-lcd1602': 'OUTPUT',
  'wokwi-ssd1306': 'OUTPUT',

  // Passives & Others
  'wokwi-resistor': 'PASSIVE',
};
