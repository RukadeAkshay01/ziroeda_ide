
import React, { useState, useRef, useMemo, useLayoutEffect, useEffect, useCallback } from 'react';
import { CircuitComponent, WokwiConnection, Point } from '../types';
import ComponentRenderer from './ComponentRenderer';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';
import { 
    calculateDefaultRoutes, 
    getWireColor, 
    LayoutDataMap, 
    ComponentLayoutData, 
    getAllPinPositions, 
    getPinExitVector,
    pointsToSvgPath,
    updateRouteWithDrag
} from '../utils/circuitUtils';
import { getComponentDimensions } from '../utils/static-component-data';

interface CanvasProps {
  components: CircuitComponent[];
  connections: WokwiConnection[];
  isLoading: boolean;
  onComponentMove: (id: string, x: number, y: number) => void;
  onConnectionCreated?: (sourceId: string, sourcePin: string, targetId: string, targetPin: string) => void;
  simulationPinStates?: Record<string, number>;
}

interface DrawingState {
  componentId: string;
  pinName: string;
  startX: number;
  startY: number;
  startDirection: 'H' | 'V'; 
}

interface WireDragState {
  wireIndex: string;
  segmentIndex: number;
  orientation: 'H' | 'V';
}

type DragMode = 'IDLE' | 'PAN' | 'COMPONENT' | 'WIRE';

const Canvas: React.FC<CanvasProps> = ({ 
  components, 
  connections, 
  isLoading, 
  onComponentMove, 
  onConnectionCreated,
  simulationPinStates
}) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragMode, setDragMode] = useState<DragMode>('IDLE');
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [selectedWireIndex, setSelectedWireIndex] = useState<string | null>(null);
  const [wireDragState, setWireDragState] = useState<WireDragState | null>(null);
  const [wireRoutes, setWireRoutes] = useState<Map<string, Point[]>>(new Map());
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const componentRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [layoutData, setLayoutData] = useState<LayoutDataMap>(new Map());

  // Propagate pin states to Wokwi components
  useEffect(() => {
    if (!simulationPinStates) return;

    connections.forEach(([src, tgt]) => {
      const [srcId, srcPin] = src.split(':');
      const [tgtId, tgtPin] = tgt.split(':');

      // Check if one side is a microcontroller (uno) and the other is a target component
      const unoId = components.find(c => c.id === srcId && c.type === 'wokwi-arduino-uno') ? srcId : 
                    components.find(c => c.id === tgtId && c.type === 'wokwi-arduino-uno') ? tgtId : null;
      
      if (unoId) {
        const pin = unoId === srcId ? srcPin : tgtPin;
        const targetId = unoId === srcId ? tgtId : srcId;
        const targetPin = unoId === srcId ? tgtPin : srcPin;
        
        const pinValue = simulationPinStates[pin] ?? 0;
        const targetEl = componentRefs.current.get(targetId);
        
        if (targetEl) {
          // Special cases for Wokwi components
          // LED, Resistor, etc.
          (targetEl as any).value = pinValue;
          // For LEDs, pinValue 1 means HIGH, so it lights up
          if (targetEl.tagName.toLowerCase() === 'wokwi-led') {
            (targetEl as any).value = pinValue === 1;
          }
        }
      }
    });
  }, [simulationPinStates, connections, components]);

  const componentStructure = useMemo(() => {
    return components.map(c => `${c.id}:${c.type}:${c.rotation}`).join('|');
  }, [components]);

  const measureComponents = useCallback(() => {
    let hasChanges = false;
    const newLayout = new Map<string, ComponentLayoutData>(layoutData);
    components.forEach((comp) => {
        const el = componentRefs.current.get(comp.id);
        if (el) {
            const width = el.offsetWidth;
            const height = el.offsetHeight;
            const pinInfo = (el as any).pinInfo || [];
            const existing = newLayout.get(comp.id);
            if (!existing || existing.width !== width || existing.height !== height || existing.pins?.length !== pinInfo.length) {
                newLayout.set(comp.id, { width, height, pins: pinInfo });
                hasChanges = true;
            }
        }
    });
    if (hasChanges) setLayoutData(newLayout);
  }, [components, layoutData]);

  useLayoutEffect(() => { measureComponents(); }, [componentStructure]); 
  useEffect(() => {
      if (components.length === 0) return;
      const interval = setInterval(measureComponents, 500);
      const timeout = setTimeout(() => clearInterval(interval), 3000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [components.length, measureComponents]);

  const setComponentRef = (id: string) => (el: HTMLElement | null) => {
      if (el) componentRefs.current.set(id, el);
      else componentRefs.current.delete(id);
  };

  useEffect(() => {
    const defaults = calculateDefaultRoutes(components, connections, layoutData);
    setWireRoutes(new Map(defaults));
  }, [components, connections, layoutData]);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, transform.scale + delta), 5);
    setTransform(prev => ({ ...prev, scale: newScale }));
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
          x: (clientX - rect.left - transform.x) / transform.scale,
          y: (clientY - rect.top - transform.y) / transform.scale
      };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      if (drawingState) {
        setDrawingState(null);
      } else {
        setDragMode('PAN');
        setSelectedWireIndex(null);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handleComponentMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (drawingState) return;
    setDragMode('COMPONENT');
    setDraggedComponentId(id);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleWireClick = (e: React.MouseEvent, index: string) => {
    e.stopPropagation();
    if (drawingState) return;
    setSelectedWireIndex(index);
  };

  const handleWireHandleMouseDown = (e: React.MouseEvent, wireIndex: string, segmentIndex: number) => {
      e.stopPropagation();
      const points = wireRoutes.get(wireIndex);
      if (!points) return;

      if (points.length === 2) {
          const p0 = points[0];
          const p1 = points[1];
          const orientation = Math.abs(p0.x - p1.x) > Math.abs(p0.y - p1.y) ? 'H' : 'V';
          const newPoints = [p0, { ...p0 }, { ...p1 }, p1];
          setWireRoutes(prev => new Map(prev).set(wireIndex, newPoints));
          setDragMode('WIRE');
          setWireDragState({ wireIndex, segmentIndex: 1, orientation });
      } else {
          if (segmentIndex === 0 || segmentIndex === points.length - 2) return;
          const p1 = points[segmentIndex];
          const p2 = points[segmentIndex + 1];
          const orientation = Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y) ? 'H' : 'V';
          setDragMode('WIRE');
          setWireDragState({ wireIndex, segmentIndex, orientation });
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragMode === 'IDLE') {
        const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
        setMousePos(canvasCoords);
        return; 
    }
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(canvasCoords); 

    if (dragMode === 'COMPONENT' && draggedComponentId) {
        const component = components.find(c => c.id === draggedComponentId);
        if (component) {
            const scale = transform.scale;
            onComponentMove(draggedComponentId, component.x + (deltaX / scale), component.y + (deltaY / scale));
        }
    } else if (dragMode === 'WIRE' && wireDragState) {
        const { wireIndex, segmentIndex, orientation } = wireDragState;
        const currentPoints = wireRoutes.get(wireIndex);
        if (currentPoints) {
            const newPoints = updateRouteWithDrag(currentPoints, segmentIndex, canvasCoords, orientation);
            setWireRoutes(prev => new Map(prev).set(wireIndex, newPoints));
        }
    } else if (dragMode === 'PAN') {
        setTransform(prev => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }));
    }
  };

  const handleMouseUp = () => {
    setDragMode('IDLE');
    setDraggedComponentId(null);
    setWireDragState(null);
  };

  const handlePinClick = (e: React.MouseEvent, compId: string, pinName: string, x: number, y: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (drawingState) {
      if (drawingState.componentId !== compId) { 
          onConnectionCreated?.(drawingState.componentId, drawingState.pinName, compId, pinName);
      }
      setDrawingState(null);
    } else {
      const component = components.find(c => c.id === compId);
      let startDirection: 'H' | 'V' = 'H';
      if (component) {
          const vec = getPinExitVector(component, pinName, layoutData);
          if (Math.abs(vec.y) > Math.abs(vec.x)) startDirection = 'V';
      }
      setDrawingState({ componentId: compId, pinName, startX: x, startY: y, startDirection });
      setMousePos({ x, y });
    }
  };

  const getPreviewPath = () => {
    if (!drawingState) return '';
    const { startX, startY, startDirection } = drawingState;
    const { x: endX, y: endY } = mousePos;
    if (startDirection === 'V') return `M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`;
    return `M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY}`;
  };

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
             onMouseDown={(e) => handlePinClick(e, comp.id, pin.name, pin.x, pin.y)}
           />
         );
      });
    });
    return areas;
  }, [components, layoutData, drawingState]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-slate-900 overflow-hidden bg-grid shadow-inner ${dragMode === 'PAN' ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
      {!isLoading && components.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 select-none pointer-events-none">
          <div className="text-center" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
            <p className="text-lg">AI Circuit Architect</p>
            <p className="text-sm opacity-70">"Connect an LED to pin 13"</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-slate-800/90 backdrop-blur rounded-lg p-2 z-50 border border-slate-700 shadow-lg">
        <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.25, 5) }))} className="p-2 hover:bg-slate-700 text-white rounded"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.25, 0.1) }))} className="p-2 hover:bg-slate-700 text-white rounded"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={() => setTransform({ x: 0, y: 0, scale: 1 })} className="p-2 hover:bg-slate-700 text-white rounded"><Home className="w-5 h-5" /></button>
      </div>

      <div 
        className="absolute inset-0 origin-top-left will-change-transform"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: dragMode !== 'PAN' ? 'transform 0.2s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none' 
        }}
      >
        {components.map((comp) => {
          const dynamic = layoutData.get(comp.id);
          const staticDims = getComponentDimensions(comp.type);
          const width = dynamic ? dynamic.width : staticDims.width;
          const height = dynamic ? dynamic.height : staticDims.height;
          const isDraggingThis = draggedComponentId === comp.id;

          return (
            <div
              key={comp.id}
              onMouseDown={(e) => handleComponentMouseDown(e, comp.id)}
              className={`absolute group cursor-move ${isDraggingThis ? '' : 'transition-all duration-500 ease-in-out'}`}
              style={{
                left: `${comp.x}px`,
                top: `${comp.y}px`,
                width: `${width}px`,
                height: `${height}px`,
                transform: `rotate(${comp.rotation || 0}deg)`,
                zIndex: isDraggingThis ? 100 : 20
              }}
            >
              <div className="absolute -top-8 left-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap border border-slate-700">
                {comp.label || comp.type}
              </div>
              <ComponentRenderer ref={setComponentRef(comp.id)} component={comp} />
            </div>
          );
        })}

        <svg className="absolute top-0 left-0 overflow-visible z-30 pointer-events-none" style={{ width: 1, height: 1 }}>
          {connections.map((conn, idx) => {
            const indexStr = `${idx}`;
            const points = wireRoutes.get(indexStr);
            if (!points) return null;
            
            const pathData = pointsToSvgPath(points);
            const color = getWireColor(conn);
            const isSelected = selectedWireIndex === indexStr;
            
            return (
              <g key={`wire-${idx}`} onClick={(e) => handleWireClick(e, indexStr)}>
                <path d={pathData} stroke="transparent" strokeWidth="12" fill="none" className="cursor-pointer pointer-events-auto" />
                {isSelected && <path d={pathData} stroke="#22d3ee" strokeWidth="8" fill="none" strokeOpacity="0.4" strokeLinecap="round" />}
                <path d={pathData} stroke="#000000" strokeWidth="6" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={pathData} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none" />

                {isSelected && points.map((p, i) => {
                    if (i === points.length - 1) return null;
                    const nextP = points[i+1];
                    const midX = (p.x + nextP.x) / 2;
                    const midY = (p.y + nextP.y) / 2;
                    if (points.length !== 2 && (i === 0 || i === points.length - 2)) return null;
                    if (Math.abs(p.x - nextP.x) < 10 && Math.abs(p.y - nextP.y) < 10) return null;

                    return (
                        <circle
                            key={`handle-${i}`}
                            cx={midX}
                            cy={midY}
                            r={6}
                            fill="white"
                            stroke="#0ea5e9"
                            strokeWidth="2"
                            className="cursor-grab hover:scale-125 transition-transform pointer-events-auto"
                            onMouseDown={(e) => handleWireHandleMouseDown(e, indexStr, i)}
                        />
                    );
                })}
              </g>
            );
          })}
          
          {drawingState && (
            <g className="pointer-events-none">
               <circle cx={drawingState.startX} cy={drawingState.startY} r="4" fill="#06b6d4" />
               <path d={getPreviewPath()} stroke="#06b6d4" strokeWidth="3" fill="none" strokeDasharray="5,5" className="drop-shadow-md" />
               <circle cx={mousePos.x} cy={mousePos.y} r="4" fill="#06b6d4" />
            </g>
          )}
        </svg>

        {pinHitAreas}
      </div>
    </div>
  );
};

export default Canvas;
