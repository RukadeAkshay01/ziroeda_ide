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
  zoomAtPoint: (x: number, y: number, scale: number) => void;
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
  onConnectionCreated,
  zoomAtPoint
}: UseCanvasInteractionsProps) => {

  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragStartCanvasPos = useRef({ x: 0, y: 0 });
  const componentStartPos = useRef({ x: 0, y: 0 });
  const wireStartPoints = useRef<Point[]>([]);
  const hasMovedRef = useRef(false);

  // Touch State
  const lastTouchDistance = useRef<number | null>(null);
  const isPinching = useRef(false);

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

    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    dragStartCanvasPos.current = canvasCoords;

    const component = components.find(c => c.id === id);
    if (component) {
      componentStartPos.current = { x: component.x, y: component.y };
    }
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

    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    dragStartCanvasPos.current = canvasCoords;
    wireStartPoints.current = points;
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
      const totalDeltaX = canvasCoords.x - dragStartCanvasPos.current.x;
      const totalDeltaY = canvasCoords.y - dragStartCanvasPos.current.y;

      onComponentMove(
        draggedComponentId,
        componentStartPos.current.x + totalDeltaX,
        componentStartPos.current.y + totalDeltaY
      );
    } else if (dragMode === 'WIRE' && wireDragState) {
      const { wireIndex, segmentIndex, orientation } = wireDragState;
      const currentPoints = wireStartPoints.current;
      if (currentPoints.length > 0) {
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

  const handlePinClick = (e: React.MouseEvent | React.TouchEvent, compId: string, pinName: string, x: number, y: number) => {
    e.stopPropagation();
    // e.preventDefault(); // Removed to allow scrolling if needed, handled in touch handlers
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

  // --- Touch Handlers ---

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to stop scrolling/zooming by browser
    // e.preventDefault(); // Handled by CSS touch-action: none

    if (e.touches.length === 2) {
      // Pinch Zoom Start
      isPinching.current = true;
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
      setDragMode('IDLE'); // Stop panning/dragging if zooming
    } else if (e.touches.length === 1) {
      // Pan or Drag Start
      isPinching.current = false;
      const touch = e.touches[0];

      // Check if touching a component (simple hit test or rely on component touch handler)
      // For now, assume PAN unless component handler fired
      if (dragMode === 'IDLE') {
        setDragMode('PAN');
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching.current) {
      // Pinch Zoom
      const dist = getDistance(e.touches[0], e.touches[1]);
      if (lastTouchDistance.current) {
        const delta = dist - lastTouchDistance.current;
        const center = getCenter(e.touches[0], e.touches[1]);

        // Zoom sensitivity
        const zoomFactor = 0.005;
        const newScale = transform.scale + delta * zoomFactor;

        zoomAtPoint(center.x, center.y, newScale);
      }
      lastTouchDistance.current = dist;
    } else if (e.touches.length === 1 && !isPinching.current) {
      // Pan or Drag
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePos.current.x;
      const deltaY = touch.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: touch.clientX, y: touch.clientY };

      const canvasCoords = getCanvasCoords(touch.clientX, touch.clientY);
      setMousePos(canvasCoords);

      if (dragMode === 'PAN') {
        pan(deltaX, deltaY);
      } else if (dragMode === 'COMPONENT' && draggedComponentId) {
        hasMovedRef.current = true;
        const totalDeltaX = canvasCoords.x - dragStartCanvasPos.current.x;
        const totalDeltaY = canvasCoords.y - dragStartCanvasPos.current.y;

        onComponentMove(
          draggedComponentId,
          componentStartPos.current.x + totalDeltaX,
          componentStartPos.current.y + totalDeltaY
        );
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      lastTouchDistance.current = null;
    }

    if (e.touches.length === 0) {
      if (dragMode === 'COMPONENT' && hasMovedRef.current && onDragEnd) {
        onDragEnd();
      }
      setDragMode('IDLE');
      setDraggedComponentId(null);
      hasMovedRef.current = false;
    }
  };

  // Component Touch Handler (to be attached to components)
  const handleComponentTouchStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    onSelectComponent(id);
    setDragMode('COMPONENT');
    setDraggedComponentId(id);
    hasMovedRef.current = false;
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };

    const canvasCoords = getCanvasCoords(touch.clientX, touch.clientY);
    dragStartCanvasPos.current = canvasCoords;

    const component = components.find(c => c.id === id);
    if (component) {
      componentStartPos.current = { x: component.x, y: component.y };
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
      handlePinClick,
      // Touch Handlers
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleComponentTouchStart
    }
  };
};