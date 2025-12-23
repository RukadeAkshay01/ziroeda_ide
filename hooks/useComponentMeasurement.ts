
import { useState, useMemo, useLayoutEffect, useEffect, useCallback, RefObject } from 'react';
import { CircuitComponent } from '../types';
import { LayoutDataMap, ComponentLayoutData } from '../utils/circuitUtils';

export const useComponentMeasurement = (
    components: CircuitComponent[], 
    componentRefs: RefObject<Map<string, HTMLElement>>
) => {
  const [layoutData, setLayoutData] = useState<LayoutDataMap>(new Map());

  const componentStructure = useMemo(() => {
    return components.map(c => `${c.id}:${c.type}:${c.rotation}`).join('|');
  }, [components]);

  const measureComponents = useCallback(() => {
    if (!componentRefs.current) return;
    let hasChanges = false;
    const newLayout = new Map<string, ComponentLayoutData>(layoutData);
    components.forEach((comp) => {
        const el = componentRefs.current?.get(comp.id);
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
  }, [components, layoutData, componentRefs]);

  useLayoutEffect(() => { measureComponents(); }, [componentStructure]); 
  
  useEffect(() => {
      if (components.length === 0) return;
      const interval = setInterval(measureComponents, 500);
      const timeout = setTimeout(() => clearInterval(interval), 3000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [components.length, measureComponents]);

  return { layoutData };
};
