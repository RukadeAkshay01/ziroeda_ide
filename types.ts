
export type ComponentType =
  | 'wokwi-arduino-uno'
  | 'wokwi-arduino-nano'
  | 'wokwi-arduino-mega'
  | 'wokwi-resistor'
  | 'wokwi-led'
  | 'wokwi-pushbutton'
  | 'wokwi-slide-switch'
  | 'wokwi-potentiometer'
  | 'wokwi-dht22'
  | 'wokwi-hc-sr04'
  | 'wokwi-pir-motion-sensor'
  | 'wokwi-photoresistor-sensor'
  | 'wokwi-mpu6050'
  | 'wokwi-neopixel'
  | 'wokwi-led-ring'
  | 'wokwi-7segment'
  | 'wokwi-buzzer'
  | 'wokwi-servo'
  | 'wokwi-lcd1602'
  | 'wokwi-ssd1306'
  | 'wokwi-membrane-keypad'
  | 'wokwi-ky-040'
  | 'wokwi-ds1307'
  | 'wokwi-hx711'
  | 'wokwi-heart-beat-sensor'
  | 'wokwi-ir-receiver'
  | 'wokwi-ky-023'
  | string;

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
  code?: string;
  name?: string;
  attrs?: Record<string, string | number | boolean>;
}

// Tuple: ["sourceID:pinName", "targetID:pinName", "color"]
export type WokwiConnection = [string, string, string];

export interface Connection {
  from: string;       // componentId
  to: string;         // componentId
  fromPort?: string;
  toPort?: string;
  color?: string;
}

export interface CircuitDesign {
  components: CircuitComponent[];
  connections: Connection[];
  arduinoCode?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

export interface DesignResponse {
  explanation: string;
  projectName?: string;
  arduinoCode: string;
  components: CircuitComponent[];
  connections: WokwiConnection[];
}

export interface Point {
  x: number;
  y: number;
}

export interface DebugLogEntry {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'error';
  summary: string;
  payload: any;
}
