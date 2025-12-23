
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CircuitComponent, WokwiConnection } from '../types';
import { useCanvasTransform } from '../hooks/useCanvasTransform';
import { useWireRouting } from '../hooks/useWireRouting';
import { useComponentMeasurement } from '../hooks/useComponentMeasurement';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';

import WireOverlay from './canvas/WireOverlay';
import PinOverlay from './canvas/PinOverlay';
import ComponentLayer from './canvas/ComponentLayer';

interface CanvasProps {
  components: CircuitComponent[];
  connections: WokwiConnection[];
  isLoading: boolean;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onComponentMove: (id: string, x: number, y: number) => void;
  onDragEnd?: () => void;
  onConnectionCreated?: (sourceId: string, sourcePin: string, targetId: string, targetPin: string) => void;
  simulationPinStates?: Record<string, number>;
}

export interface CanvasHandle {
  zoomToFit: () => void;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ 
  components, 
  connections, 
  isLoading, 
  selectedComponentId,
  onSelectComponent,
  onComponentMove, 
  onDragEnd,
  onConnectionCreated,
  simulationPinStates
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentRefs = useRef<Map<string, HTMLElement>>(new Map());

  // 1. Core Canvas Logic Hooks
  const { transform, handleWheel, getCanvasCoords, pan, zoomToFit } = useCanvasTransform(containerRef);
  const { layoutData } = useComponentMeasurement(components, componentRefs);
  const { wireRoutes, setWireRoutes } = useWireRouting(components, connections, layoutData);

  // Expose zoomToFit to parent via ref
  useImperativeHandle(ref, () => ({
    zoomToFit: () => zoomToFit(components)
  }));

  // 2. Interaction Logic Hook
  const {
    dragMode,
    draggedComponentId,
    selectedWireIndex,
    drawingState,
    mousePos,
    handlers
  } = useCanvasInteractions({
    components,
    layoutData,
    transform,
    getCanvasCoords,
    pan,
    wireRoutes,
    setWireRoutes,
    onSelectComponent,
    onComponentMove,
    onDragEnd,
    onConnectionCreated
  });

  // 3. Propagate Simulation States
  useEffect(() => {
    if (!simulationPinStates) return;
    connections.forEach(([src, tgt]) => {
      const [srcId, srcPin] = src.split(':');
      const [tgtId, tgtPin] = tgt.split(':');
      const unoId = components.find(c => c.id === srcId && c.type === 'wokwi-arduino-uno') ? srcId : 
                    components.find(c => c.id === tgtId && c.type === 'wokwi-arduino-uno') ? tgtId : null;
      
      if (unoId) {
        const pin = unoId === srcId ? srcPin : tgtPin;
        const targetId = unoId === srcId ? tgtId : srcId;
        const pinValue = simulationPinStates[pin] ?? 0;
        const targetEl = componentRefs.current.get(targetId);
        
        if (targetEl) {
          (targetEl as any).value = pinValue;
          if (targetEl.tagName.toLowerCase() === 'wokwi-led') {
            (targetEl as any).value = pinValue === 1;
          }
        }
      }
    });
  }, [simulationPinStates, connections, components]);

  const setComponentRef = (id: string) => (el: HTMLElement | null) => {
      if (el) componentRefs.current.set(id, el);
      else componentRefs.current.delete(id);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-slate-900 overflow-hidden shadow-inner ${dragMode === 'PAN' ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px)',
        backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`
      }}
      onWheel={handleWheel}
      onMouseDown={handlers.handleMouseDown}
      onMouseMove={handlers.handleMouseMove}
      onMouseUp={handlers.handleMouseUp}
      onMouseLeave={handlers.handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
             <p className="text-cyan-400 font-mono animate-pulse">Routing Circuits...</p>
          </div>
        </div>
      )}

      <div 
        className="absolute inset-0 origin-top-left will-change-transform"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: dragMode !== 'PAN' ? 'transform 0.2s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none' 
        }}
      >
        <ComponentLayer 
          components={components}
          layoutData={layoutData}
          draggedComponentId={draggedComponentId}
          selectedComponentId={selectedComponentId}
          onComponentMouseDown={handlers.handleComponentMouseDown}
          setComponentRef={setComponentRef}
        />

        <WireOverlay 
          connections={connections}
          wireRoutes={wireRoutes}
          selectedWireIndex={selectedWireIndex}
          drawingState={drawingState}
          mousePos={mousePos}
          onWireClick={handlers.handleWireClick}
          onWireHandleMouseDown={handlers.handleWireHandleMouseDown}
        />

        <PinOverlay 
          components={components}
          layoutData={layoutData}
          drawingState={drawingState}
          onPinClick={handlers.handlePinClick}
        />
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
