
import React, { useMemo } from 'react';
import { CircuitComponent } from '../../types';
import { LayoutDataMap, getAllPinPositions } from '../../utils/circuitUtils';
import { DrawingState } from '../../types/canvasTypes';

interface PinOverlayProps {
  components: CircuitComponent[];
  layoutData: LayoutDataMap;
  drawingState: DrawingState | null;
  onPinClick: (e: React.MouseEvent, compId: string, pinName: string, x: number, y: number) => void;
}

const PinOverlay: React.FC<PinOverlayProps> = ({
  components,
  layoutData,
  drawingState,
  onPinClick
}) => {
  const pinHitAreas = useMemo(() => {
    const areas: React.JSX.Element[] = [];
    components.forEach(comp => {
      const pins = getAllPinPositions(comp, layoutData);
      pins.forEach(pin => {
         const isDrawingSource = drawingState?.componentId === comp.id && drawingState?.pinName === pin.name;
         areas.push(
           <div
             key={`${comp.id}-${pin.name}`}
             className={`absolute w-4 h-4 rounded-full cursor-crosshair transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-200 
               ${isDrawingSource ? 'bg-green-500 scale-125 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'opacity-0 hover:opacity-100 bg-cyan-400/50 hover:bg-cyan-400 hover:scale-125 hover:shadow-[0_0_8px_cyan]'}
             `}
             style={{ left: pin.x, top: pin.y }}
             title={`${comp.label || comp.type}: ${pin.name}`}
             onMouseDown={(e) => onPinClick(e, comp.id, pin.name, pin.x, pin.y)}
           />
         );
      });
    });
    return areas;
  }, [components, layoutData, drawingState, onPinClick]);

  return <>{pinHitAreas}</>;
};

export default PinOverlay;
