
import { useState, useEffect } from 'react';
import { CircuitComponent, WokwiConnection, Point } from '../types';
import { LayoutDataMap, calculateDefaultRoutes } from '../utils/circuitUtils';

export const useWireRouting = (
    components: CircuitComponent[], 
    connections: WokwiConnection[], 
    layoutData: LayoutDataMap
) => {
  const [wireRoutes, setWireRoutes] = useState<Map<string, Point[]>>(new Map());

  useEffect(() => {
    const defaults = calculateDefaultRoutes(components, connections, layoutData);
    setWireRoutes(new Map(defaults));
  }, [components, connections, layoutData]);

  return { wireRoutes, setWireRoutes };
};
