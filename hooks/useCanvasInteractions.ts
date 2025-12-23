import React, { useState, useRef } from 'react';
import { CircuitComponent, Point } from '../types';
import { LayoutDataMap, getPinExitVector, updateRouteWithDrag } from '../utils/circuitUtils';
import { DragMode, DrawingState, WireDragState } from '../types/canvasTypes';

interface UseCanvasInteractionsProps {
  components: CircuitComponent[];
  layoutData: LayoutDataMap;
  transform: { scale: number };
  getCanvasCoords: (x: number, y: number) => Point;
  pan: (dx: number, dy: number) => void;
  wireRoutes: Map<string, Point[]>;
  setWireRoutes: React.Dispatch<React.SetStateAction<Map<string, Point[]>>>;
  onSelectComponent: (id: string | null) => void;
  onComponentMove: (id: string, x: number, y: number) => void;
  onDragEnd?: () => void;
  onConnectionCreated?: (sourceId: string, sourcePin: string, targetId: string, targetPin: string) => void;
}

export const useCanvasInteractions = ({
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
}: UseCanvasInteractionsProps) => {
  
  const lastMousePos = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // State
  const [dragMode, setDragMode] = useState<DragMode>('IDLE');
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [selectedWireIndex, setSelectedWireIndex] = useState<string | null>(null);
  const [wireDragState, setWireDragState] = useState<WireDragState | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      if (drawingState) {
        setDrawingState(null);
      } else {
        onSelectComponent(null);
        setSelectedWireIndex(null);
        setDragMode('PAN');
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handleComponentMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (drawingState) return;
    onSelectComponent(id);
    setDragMode('COMPONENT');
    setDraggedComponentId(id);
    hasMovedRef.current = false;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleWireClick = (e: React.MouseEvent, index: string) => {
    e.stopPropagation();
    if (drawingState) return;
    setSelectedWireIndex(index);
    onSelectComponent(null);
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
        hasMovedRef.current = true;
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
        pan(deltaX, deltaY);
    }
  };

  const handleMouseUp = () => {
    if (dragMode === 'COMPONENT' && hasMovedRef.current && onDragEnd) {
      onDragEnd();
    }
    setDragMode('IDLE');
    setDraggedComponentId(null);
    setWireDragState(null);
    hasMovedRef.current = false;
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

  return {
    dragMode,
    draggedComponentId,
    selectedWireIndex,
    wireDragState,
    drawingState,
    mousePos,
    handlers: {
      handleMouseDown,
      handleComponentMouseDown,
      handleWireClick,
      handleWireHandleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handlePinClick
    }
  };
};