
import React from 'react';
import { CircuitComponent } from '../../types';
import { LayoutDataMap } from '../../utils/circuitUtils';
import ComponentRenderer from '../ComponentRenderer';

interface ComponentLayerProps {
  components: CircuitComponent[];
  layoutData: LayoutDataMap;
  draggedComponentId: string | null;
  selectedComponentId: string | null;
  onComponentMouseDown: (e: React.MouseEvent, id: string) => void;
  onComponentTouchStart?: (e: React.TouchEvent, id: string) => void;
  setComponentRef: (id: string) => (el: HTMLElement | null) => void;
}

const ComponentLayer: React.FC<ComponentLayerProps> = ({
  components,
  layoutData,
  draggedComponentId,
  selectedComponentId,
  onComponentMouseDown,
  onComponentTouchStart,
  setComponentRef
}) => {
  return (
    <>
      {components.map((comp) => {
        const isDraggingThis = draggedComponentId === comp.id;
        const isSelected = selectedComponentId === comp.id;
        const flipX = comp.attributes?.flipX ? -1 : 1;
        const flipY = comp.attributes?.flipY ? -1 : 1;
        const rotation = comp.rotation || 0;

        return (
          <div
            key={comp.id}
            onMouseDown={(e) => onComponentMouseDown(e, comp.id)}
            onTouchStart={(e) => onComponentTouchStart?.(e, comp.id)}
            className={`absolute group cursor-move ${isDraggingThis ? '' : 'transition-all duration-500 ease-in-out'}`}
            style={{
              left: `${comp.x}px`,
              top: `${comp.y}px`,
              // We do not enforce width/height here; we let the inner ComponentRenderer (and thus the Wokwi element) dictate size.
              // This fixes the issue where the bounding box didn't match the component SVG size.
              transform: `rotate(${rotation}deg) scaleX(${flipX}) scaleY(${flipY})`,
              zIndex: isDraggingThis ? 100 : 20
            }}
          >
            {isSelected && (
              <div
                className="absolute -inset-2 border-2 border-cyan-400 rounded-lg pointer-events-none animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                style={{ zIndex: -1 }}
              />
            )}
            <div
              className="absolute -top-8 left-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap border border-slate-700"
              style={{ transform: `translateX(-50%) rotate(${-rotation}deg) scaleX(${flipX}) scaleY(${flipY})` }}
            >
              {comp.label || comp.type}
            </div>
            <ComponentRenderer ref={setComponentRef(comp.id)} component={comp} />
          </div>
        );
      })}
    </>
  );
};

export default ComponentLayer;
