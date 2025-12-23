
export interface DrawingState {
  componentId: string;
  pinName: string;
  startX: number;
  startY: number;
  startDirection: 'H' | 'V'; 
}

export interface WireDragState {
  wireIndex: string;
  segmentIndex: number;
  orientation: 'H' | 'V';
}

export type DragMode = 'IDLE' | 'PAN' | 'COMPONENT' | 'WIRE';
