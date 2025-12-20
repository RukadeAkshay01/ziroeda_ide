
export type ComponentType = 
  | 'wokwi-arduino-uno'
  | 'wokwi-led'
  | 'wokwi-resistor'
  | 'wokwi-pushbutton'
  | 'wokwi-potentiometer'
  | 'wokwi-servo'
  | 'wokwi-buzzer'
  | 'wokwi-lcd1602'
  | 'wokwi-7segment'
  | 'wokwi-dht22'
  | 'wokwi-hc-sr04';

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
