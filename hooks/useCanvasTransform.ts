import React, { useState, useCallback, RefObject } from 'react';
import { getComponentDimensions } from '../utils/static-component-data';

export const useCanvasTransform = (containerRef: RefObject<HTMLDivElement | null>) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, transform.scale + delta), 5);
    const scaleFactor = newScale / transform.scale;
    const newX = mouseX - (mouseX - transform.x) * scaleFactor;
    const newY = mouseY - (mouseY - transform.y) * scaleFactor;
    setTransform({ x: newX, y: newY, scale: newScale });
  }, [transform]);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
          x: (clientX - rect.left - transform.x) / transform.scale,
          y: (clientY - rect.top - transform.y) / transform.scale
      };
  }, [transform]);

  const pan = useCallback((deltaX: number, deltaY: number) => {
      setTransform(prev => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }));
  }, []);

  const zoomToFit = useCallback((components: any[]) => {
      if (!containerRef.current) return;
      if (components.length === 0) {
          setTransform({ x: 0, y: 0, scale: 1 });
          return;
      }
      
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 60;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      components.forEach(c => {
        // Fallback to static dimensions if specific instance dimensions aren't available
        let { width, height } = c;
        if (!width || !height) {
           const dims = getComponentDimensions(c.type);
           width = dims.width;
           height = dims.height;
        }
        
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.x + width > maxX) maxX = c.x + width;
        if (c.y + height > maxY) maxY = c.y + height;
      });

      if (minX === Infinity) return;

      const contentW = maxX - minX;
      const contentH = maxY - minY;
      const containerW = rect.width - (padding * 2);
      const containerH = rect.height - (padding * 2);

      const scaleX = containerW / contentW;
      const scaleY = containerH / contentH;
      // Cap zoom at 1.2x to prevent single components from becoming gigantic, min 0.2x
      const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.2);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Calculate translate to center the content
      // centerScreen = centerContent * scale + translate
      const tx = (rect.width / 2) - (centerX * scale);
      const ty = (rect.height / 2) - (centerY * scale);

      setTransform({ x: tx, y: ty, scale });
  }, []);

  return {
      transform,
      handleWheel,
      getCanvasCoords,
      pan,
      zoomToFit
  };
};