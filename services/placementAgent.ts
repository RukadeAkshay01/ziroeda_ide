
import { CircuitComponent, WokwiConnection } from "../types";
import { STATIC_COMPONENT_DATA } from "../utils/static-component-data";
import { 
  TYPE_CATEGORIES, 
  GRID_SIZE, 
  HUB_X, 
  HUB_Y, 
  INPUT_GAP, 
  OUTPUT_GAP, 
  RESISTOR_GAP, 
  VERTICAL_BUFFER 
} from "./layoutConfig";

/**
 * Helper to get the local (x,y) of a specific pin on a component type.
 * Handles normalization (e.g. D13 -> 13).
 */
function getPinOffset(type: string, pinName: string): { x: number, y: number } {
  const spec = STATIC_COMPONENT_DATA[type] || STATIC_COMPONENT_DATA['wokwi-arduino-uno'];
  
  // Normalize pinName (remove D prefix if Arduino to match static data)
  let cleanName = pinName;
  if (type.includes('arduino')) {
      cleanName = cleanName.replace(/^D(\d+)$/i, '$1');
  }

  const pin = spec.pins.find(p => 
      p.name === pinName || 
      p.name === cleanName ||
      p.name.toUpperCase() === cleanName.toUpperCase()
  );

  // Default to center if pin not found
  if (!pin) return { x: spec.width / 2, y: spec.height / 2 };
  return { x: pin.x, y: pin.y };
}

/**
 * Main Layout Engine
 */
export const optimizePlacement = async (
  components: CircuitComponent[],
  connections: WokwiConnection[],
  existingComponents: CircuitComponent[] = [] 
): Promise<CircuitComponent[]> => {
  
  // 1. Identify Components
  const hub = components.find(c => TYPE_CATEGORIES[c.type] === 'HUB');
  
  // If no hub, return components as-is
  if (!hub) return components;

  // Clone to avoid mutation side-effects during calculation
  const layout = components.map(c => ({ ...c }));
  const layoutHub = layout.find(c => c.id === hub.id)!;

  // 2. Place Hub Center
  layoutHub.x = HUB_X;
  layoutHub.y = HUB_Y;

  // 3. Filter Categories
  const passives = layout.filter(c => TYPE_CATEGORIES[c.type] === 'PASSIVE');
  const inputs = layout.filter(c => TYPE_CATEGORIES[c.type] === 'INPUT');
  const outputs = layout.filter(c => TYPE_CATEGORIES[c.type] === 'OUTPUT');

  // Map to track calculated Y positions to detect overlaps
  const occupiedSlots: { x: number, yStart: number, yEnd: number }[] = [];

  // Register the Hub's position
  occupiedSlots.push({ 
      x: HUB_X, 
      yStart: HUB_Y, 
      yEnd: HUB_Y + (STATIC_COMPONENT_DATA[layoutHub.type]?.height || 240) 
  });

  const checkOverlapAndShift = (x: number, y: number, height: number): number => {
    let safeY = y;
    let collision = true;
    const SAFETY_PAD = VERTICAL_BUFFER;

    while (collision) {
      collision = false;
      for (const slot of occupiedSlots) {
        if (Math.abs(slot.x - x) < 200) {
           if (safeY < slot.yEnd + SAFETY_PAD && (safeY + height) > slot.yStart - SAFETY_PAD) {
             collision = true;
             safeY = slot.yEnd + SAFETY_PAD;
           }
        }
      }
    }
    occupiedSlots.push({ x, yStart: safeY, yEnd: safeY + height });
    return safeY;
  };

  // Helper: Find Y-coordinate of the pin on the Hub that this component connects to.
  const findHubPinY = (compId: string): number | null => {
    // 1. Direct Connection?
    const directConn = connections.find(conn => {
       const [src, tgt] = conn;
       return (src.startsWith(compId) && tgt.startsWith(layoutHub.id)) || 
              (tgt.startsWith(compId) && src.startsWith(layoutHub.id));
    });

    if (directConn) {
       const hubPinPart = directConn[0].startsWith(layoutHub.id) ? directConn[0] : directConn[1];
       const pinName = hubPinPart.split(':')[1];
       const offset = getPinOffset(layoutHub.type, pinName);
       return layoutHub.y + offset.y;
    }

    // 2. Through a Passive? (Component -> Passive -> Hub)
    const passiveConn = connections.find(conn => {
        const [src, tgt] = conn;
        return (src.startsWith(compId) && passives.some(p => tgt.startsWith(p.id))) ||
               (tgt.startsWith(compId) && passives.some(p => src.startsWith(p.id)));
    });

    if (passiveConn) {
        const passiveId = passiveConn[0].startsWith(compId) ? passiveConn[1].split(':')[0] : passiveConn[0].split(':')[0];
        // Does this passive connect to Hub?
        const resistorToHub = connections.find(conn => {
            const [src, tgt] = conn;
            return (src.startsWith(passiveId) && tgt.startsWith(layoutHub.id)) ||
                   (tgt.startsWith(passiveId) && src.startsWith(layoutHub.id));
        });

        if (resistorToHub) {
            const hubPinPart = resistorToHub[0].startsWith(layoutHub.id) ? resistorToHub[0] : resistorToHub[1];
            const pinName = hubPinPart.split(':')[1];
            const offset = getPinOffset(layoutHub.type, pinName);
            return layoutHub.y + offset.y;
        }
    }

    return null;
  };

  // --------------------------------------------------------------------------
  // 4. Place Outputs (Right Side)
  // --------------------------------------------------------------------------
  const sortedOutputs = outputs.map(comp => ({ comp, targetY: findHubPinY(comp.id) || HUB_Y }));
  sortedOutputs.sort((a, b) => a.targetY - b.targetY);

  sortedOutputs.forEach(({ comp, targetY }) => {
     const compSpec = STATIC_COMPONENT_DATA[comp.type] || { width: 100, height: 100, pins: [] };
     
     const hasResistor = connections.some(conn => 
       (conn[0].startsWith(comp.id) || conn[1].startsWith(comp.id)) && 
       passives.some(p => conn[0].startsWith(p.id) || conn[1].startsWith(p.id))
     );

     const hubWidth = STATIC_COMPONENT_DATA[layoutHub.type]?.width || 330;
     const baseX = HUB_X + hubWidth + OUTPUT_GAP + (hasResistor ? RESISTOR_GAP : 0);
     const pinOffset = compSpec.height / 2;
     let finalY = targetY - pinOffset;
     finalY = Math.round(finalY / GRID_SIZE) * GRID_SIZE;
     finalY = checkOverlapAndShift(baseX, finalY, compSpec.height);
     
     comp.x = baseX;
     comp.y = finalY;

     if (hasResistor) {
         const rConn = connections.find(conn => 
            (conn[0].startsWith(comp.id) && passives.some(p => conn[1].startsWith(p.id))) ||
            (conn[1].startsWith(comp.id) && passives.some(p => conn[0].startsWith(p.id)))
         );
         if (rConn) {
             const rId = rConn[0].startsWith(comp.id) ? rConn[1].split(':')[0] : rConn[0].split(':')[0];
             const resistor = layout.find(r => r.id === rId);
             if (resistor) {
                 resistor.x = baseX - RESISTOR_GAP + 20; 
                 resistor.y = finalY + (compSpec.height / 2) - 10;
                 resistor.rotation = 0;
                 occupiedSlots.push({ x: resistor.x, yStart: resistor.y, yEnd: resistor.y + 20 });
             }
         }
     }
  });

  // --------------------------------------------------------------------------
  // 5. Place Inputs (Left Side)
  // --------------------------------------------------------------------------
  const sortedInputs = inputs.map(comp => ({ comp, targetY: findHubPinY(comp.id) || HUB_Y }));
  sortedInputs.sort((a, b) => a.targetY - b.targetY);

  sortedInputs.forEach(({ comp, targetY }) => {
    const compSpec = STATIC_COMPONENT_DATA[comp.type] || { width: 100, height: 100, pins: [] };
    const baseX = HUB_X - INPUT_GAP;
    const pinOffset = compSpec.height / 2;
    let finalY = targetY - pinOffset;
    
    finalY = Math.round(finalY / GRID_SIZE) * GRID_SIZE;
    finalY = checkOverlapAndShift(baseX, finalY, compSpec.height);

    comp.x = baseX;
    comp.y = finalY;
  });

  // --------------------------------------------------------------------------
  // 6. Cleanup Remaining Passives
  // --------------------------------------------------------------------------
  let orphanY = HUB_Y + 300;
  passives.forEach(r => {
      if (r.x === 0 && r.y === 0) {
          r.x = HUB_X + 100;
          r.y = orphanY;
          orphanY += 40;
      }
  });

  // --------------------------------------------------------------------------
  // 7. Cleanup Unknown Components
  // --------------------------------------------------------------------------
  const unknownComponents = layout.filter(c => !TYPE_CATEGORIES[c.type]);
  let unknownX = HUB_X - INPUT_GAP;
  let unknownY = HUB_Y + 400; 
  
  unknownComponents.forEach(c => {
      if (c.x === 0 && c.y === 0) {
          const spec = STATIC_COMPONENT_DATA[c.type] || { width: 100, height: 100 };
          c.x = unknownX;
          c.y = unknownY;
          unknownY += spec.height + VERTICAL_BUFFER;
      }
  });

  return layout;
};
