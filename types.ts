
export type ComponentType = 
  | 'wokwi-arduino-uno'
  | 'wokwi-arduino-nano'
  | 'wokwi-arduino-mega'
  | 'wokwi-resistor'
  | 'wokwi-led'
  | 'wokwi-7segment'
  | 'wokwi-led-ring'
  | 'wokwi-neopixel'
  | 'wokwi-neopixel-matrix'
  | 'wokwi-pushbutton'
  | 'wokwi-slide-switch'
  | 'wokwi-tilt-switch'
  | 'wokwi-potentiometer'
  | 'wokwi-slide-potentiometer'
  | 'wokwi-membrane-keypad'
  | 'wokwi-rotary-dialer'
  | 'wokwi-buzzer'
  | 'wokwi-servo'
  | 'wokwi-lcd1602'
  | 'wokwi-lcd2004'
  | 'wokwi-ssd1306'
  | 'wokwi-dht22'
  | 'wokwi-hc-sr04'
  | 'wokwi-analog-joystick'
  | 'wokwi-ir-receiver'
  | 'wokwi-ir-remote'
  | 'wokwi-pir-motion-sensor'
  | 'wokwi-photoresistor-sensor'
  | 'wokwi-ntc-temperature-sensor'
  | 'wokwi-gas-sensor'
  | 'wokwi-ds1307'
  | 'wokwi-mpu6050'
  | 'wokwi-ky-040'
  | 'wokwi-flame-sensor'
  | 'wokwi-heart-beat-sensor'
  | 'wokwi-big-sound-sensor'
  | 'wokwi-small-sound-sensor';

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  attributes: Record<string, string | number | boolean>;
  label?: string;
  width?: number;
  height?: number;
}

// Tuple: ["sourceID:pinName", "targetID:pinName", "color"]
export type WokwiConnection = [string, string, string];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

export interface DesignResponse {
  explanation: string;
  arduinoCode: string;
  components: CircuitComponent[];
  connections: WokwiConnection[];
}

export interface Point {
  x: number;
  y: number;
}
