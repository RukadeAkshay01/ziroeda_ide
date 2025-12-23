
export const GRID_SIZE = 20;

// Adjusted for better visibility on standard screens with sidebars open
export const HUB_X = 450; 
export const HUB_Y = 300;

// Tighter spacing to keep components within view
export const INPUT_GAP = 300; 
export const OUTPUT_GAP = 300; 
export const RESISTOR_GAP = 120; 
export const VERTICAL_BUFFER = 80;

/**
 * Categories for layout logic
 */
export const TYPE_CATEGORIES: Record<string, 'HUB' | 'INPUT' | 'OUTPUT' | 'PASSIVE'> = {
  // Microcontrollers
  'wokwi-arduino-uno': 'HUB',
  'wokwi-arduino-nano': 'HUB',
  'wokwi-arduino-mega': 'HUB',
  'wokwi-esp32-devkit-v1': 'HUB',
  
  // Inputs / Sensors
  'wokwi-pushbutton': 'INPUT',
  'wokwi-potentiometer': 'INPUT',
  'wokwi-slide-potentiometer': 'INPUT',
  'wokwi-analog-joystick': 'INPUT',
  'wokwi-membrane-keypad': 'INPUT',
  'wokwi-rotary-dialer': 'INPUT',
  'wokwi-slide-switch': 'INPUT',
  'wokwi-tilt-switch': 'INPUT',
  'wokwi-ky-040': 'INPUT',
  'wokwi-ir-receiver': 'INPUT',
  
  'wokwi-dht22': 'INPUT',
  'wokwi-hc-sr04': 'INPUT',
  'wokwi-pir-motion-sensor': 'INPUT',
  'wokwi-photoresistor-sensor': 'INPUT',
  'wokwi-ntc-temperature-sensor': 'INPUT',
  'wokwi-gas-sensor': 'INPUT',
  'wokwi-ds1307': 'INPUT',
  'wokwi-mpu6050': 'INPUT',
  'wokwi-flame-sensor': 'INPUT',
  'wokwi-heart-beat-sensor': 'INPUT',
  'wokwi-big-sound-sensor': 'INPUT',
  'wokwi-small-sound-sensor': 'INPUT',

  // Outputs / Actuators
  'wokwi-led': 'OUTPUT',
  'wokwi-neopixel': 'OUTPUT',
  'wokwi-neopixel-matrix': 'OUTPUT',
  'wokwi-led-ring': 'OUTPUT',
  'wokwi-7segment': 'OUTPUT',
  'wokwi-buzzer': 'OUTPUT',
  
  'wokwi-servo': 'OUTPUT',
  
  'wokwi-lcd1602': 'OUTPUT',
  'wokwi-lcd2004': 'OUTPUT',
  'wokwi-ssd1306': 'OUTPUT',

  // Passives & Others
  'wokwi-resistor': 'PASSIVE',
  'wokwi-capacitor': 'PASSIVE',
  'wokwi-ir-remote': 'PASSIVE', // Visual only, usually
};
