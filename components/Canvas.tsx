
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { CircuitComponent, WokwiConnection } from '../types';
import { useCanvasTransform } from '../hooks/useCanvasTransform';
import { useWireRouting } from '../hooks/useWireRouting';
import { useComponentMeasurement } from '../hooks/useComponentMeasurement';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { COMPONENT_MAPPINGS } from '../simulator/core/ComponentMappings';
import { CircuitSimulator } from '../simulator/core/Simulator';

import WireOverlay from './canvas/WireOverlay';
import PinOverlay from './canvas/PinOverlay';
import ComponentLayer from './canvas/ComponentLayer';
import { SensorOverlays } from './canvas/sensor-overlays/SensorOverlays';

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
  onComponentEvent?: (id: string, name: string, detail: any) => void;
  simulator?: CircuitSimulator;
  isSimulating?: boolean;
  isReadOnly?: boolean;
}

export interface CanvasHandle {
  zoomToFit: () => void;
  updateVisuals: (simulator: CircuitSimulator) => void;
  resetVisuals: () => void;
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
  simulationPinStates,
  onComponentEvent,
  simulator,
  isSimulating,
  isReadOnly = false
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Prepare component positions for overlays
  const componentPositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    components.forEach(c => {
      pos[c.id] = { x: c.x, y: c.y };
    });
    return pos;
  }, [components]);

  // 1. Core Canvas Logic Hooks
  const { transform, handleWheel, getCanvasCoords, pan, zoomToFit, zoomAtPoint } = useCanvasTransform(containerRef);
  const { layoutData } = useComponentMeasurement(components, componentRefs);
  const { wireRoutes, setWireRoutes } = useWireRouting(components, connections, layoutData);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    zoomToFit: () => zoomToFit(components),
    updateVisuals: (simulator: CircuitSimulator) => {
      components.forEach(comp => {
        const mapping = COMPONENT_MAPPINGS[comp.type];
        if (mapping) {
          const el = componentRefs.current.get(comp.id);
          if (el) {
            mapping.update(comp, el, simulator);
          }
        }
      });
    },
    resetVisuals: () => {
      components.forEach(comp => {
        const mapping = COMPONENT_MAPPINGS[comp.type];
        if (mapping && mapping.reset) {
          const el = componentRefs.current.get(comp.id);
          if (el) {
            mapping.reset(comp, el);
          }
        }
      });
    }
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
    onConnectionCreated,
    zoomAtPoint,
    isReadOnly
  });

  // 3. Propagate Simulation States (Legacy - now handled by updateVisuals)
  useEffect(() => {
    // This is now handled by the onTick callback calling updateVisuals
  }, [simulationPinStates, connections, components]);

  const setComponentRef = (id: string) => (el: HTMLElement | null) => {
    if (el) componentRefs.current.set(id, el);
    else componentRefs.current.delete(id);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-dark-800 overflow-hidden shadow-inner ${dragMode === 'PAN' ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1.5px, transparent 1.5px)',
        backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
        touchAction: 'none'
      }}
      onWheel={handleWheel}
      onMouseDown={handlers.handleMouseDown}
      onMouseMove={handlers.handleMouseMove}
      onMouseUp={handlers.handleMouseUp}
      onMouseLeave={handlers.handleMouseUp}
      onTouchStart={handlers.handleTouchStart}
      onTouchMove={handlers.handleTouchMove}
      onTouchEnd={handlers.handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400"></div>
            <p className="text-brand-400 font-mono animate-pulse">Routing Circuits...</p>
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
        {/* Layer 1 (Bottom): Base Wires - Behind components to reduce clutter */}
        <WireOverlay
          layer="bottom"
          connections={connections}
          wireRoutes={wireRoutes}
          selectedWireIndex={selectedWireIndex}
          drawingState={drawingState}
          mousePos={mousePos}
          onWireClick={handlers.handleWireClick}
          onWireHandleMouseDown={handlers.handleWireHandleMouseDown}
        />

        {/* Layer 2 (Middle): Components */}
        <ComponentLayer
          components={components}
          layoutData={layoutData}
          draggedComponentId={draggedComponentId}
          selectedComponentId={selectedComponentId}
          onComponentMouseDown={handlers.handleComponentMouseDown}
          onComponentTouchStart={handlers.handleComponentTouchStart}
          setComponentRef={setComponentRef}
          isSimulating={isSimulating}
          onComponentEvent={onComponentEvent}
          onSelectComponent={onSelectComponent}
        />

        {/* Layer 3 (Top): Interaction Wires - Handles & Highlights on top of components */}
        <WireOverlay
          layer="top"
          connections={connections}
          wireRoutes={wireRoutes}
          selectedWireIndex={selectedWireIndex}
          drawingState={drawingState}
          mousePos={mousePos}
          onWireClick={handlers.handleWireClick}
          onWireHandleMouseDown={handlers.handleWireHandleMouseDown}
        />

        {/* Layer 4 (Overlay): Pin Interactions */}
        <PinOverlay
          components={components}
          layoutData={layoutData}
          drawingState={drawingState}
          onPinClick={handlers.handlePinClick}
        />

        {/* Layer 5 (Interactive): Sensor Overlays */}
        <SensorOverlays
          components={components}
          layout={componentPositions}
          selectedId={selectedComponentId}
          zoom={transform.scale}
          onComponentEvent={onComponentEvent}
          simulator={simulator}
          isSimulating={isSimulating}
        />
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
