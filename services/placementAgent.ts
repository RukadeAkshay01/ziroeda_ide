
import { CircuitComponent, WokwiConnection } from "../types";
import { STATIC_COMPONENT_DATA } from "../utils/static-component-data";
import { 
  TYPE_CATEGORIES, 
  GRID_SIZE, 
  HUB_X, 
  HUB_Y, 
  FIRST_COL_GAP, 
  COL_SPACING,
  MAX_PER_COL,
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

interface LayoutItem {
    comp: CircuitComponent;
    idealY: number;
    height: number;
    width: number;
    hasResistor?: boolean;
    resistorId?: string;
}

/**
 * Main Layout Engine
 */
export const optimizePlacement = async (
  components: CircuitComponent[],
  connections: WokwiConnection[],
  existingComponents: CircuitComponent[] = [] 
): Promise<CircuitComponent[]> => {
  
  // 1. Identify Hub
  const hub = components.find(c => TYPE_CATEGORIES[c.type] === 'HUB');
  
  // If no hub, return components as-is (or maybe just grid them, but as-is is safer)
  if (!hub) return components;

  // Clone to avoid mutation side-effects during calculation
  const layout = components.map(c => ({ ...c }));
  const layoutHub = layout.find(c => c.id === hub.id)!;

  // 2. Place Hub Center
  layoutHub.x = HUB_X;
  layoutHub.y = HUB_Y;
  const hubHeight = STATIC_COMPONENT_DATA[layoutHub.type]?.height || 200;
  const hubWidth = STATIC_COMPONENT_DATA[layoutHub.type]?.width || 300;

  // 3. Filter Categories
  const passives = layout.filter(c => TYPE_CATEGORIES[c.type] === 'PASSIVE');
  const inputs = layout.filter(c => TYPE_CATEGORIES[c.type] === 'INPUT');
  const outputs = layout.filter(c => TYPE_CATEGORIES[c.type] === 'OUTPUT');

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

  /**
   * Distributes components in multiple columns (Grid) to prevent infinite vertical growth.
   * @param comps List of components to place
   * @param startX The starting X coordinate (closest to hub)
   * @param direction -1 for Left (Inputs), 1 for Right (Outputs)
   */
  const distributeSide = (comps: CircuitComponent[], startX: number, direction: number) => {
      if (comps.length === 0) return;

      const items: LayoutItem[] = comps.map(comp => {
          const spec = STATIC_COMPONENT_DATA[comp.type] || { width: 100, height: 100 };
          const idealY = findHubPinY(comp.id) || (HUB_Y + hubHeight / 2);
          
          // Check for resistor
          let resistorId: string | undefined;
          const rConn = connections.find(conn => 
            (conn[0].startsWith(comp.id) && passives.some(p => conn[1].startsWith(p.id))) ||
            (conn[1].startsWith(comp.id) && passives.some(p => conn[0].startsWith(p.id)))
          );
          if (rConn) {
              resistorId = rConn[0].startsWith(comp.id) ? rConn[1].split(':')[0] : rConn[0].split(':')[0];
          }

          return {
              comp,
              idealY,
              height: spec.height,
              width: spec.width,
              hasResistor: !!resistorId,
              resistorId
          };
      });

      // 1. Sort by ideal Y
      items.sort((a, b) => a.idealY - b.idealY);

      // 2. Chunk into columns
      // If we have 10 items and MAX_PER_COL=5, we get 2 cols.
      // Col 0: items 0-4 (Top pins)
      // Col 1: items 5-9 (Bottom pins)
      // We place Col 0 closest to Hub? Or Col 1?
      // Usually, we want the shortest wires.
      // Top pins (low Y) are usually Digital. Bottom pins (high Y) are Analog/Power.
      // If we split vertically, we just place chunks into columns moving OUTWARDS.
      
      const chunkedItems: LayoutItem[][] = [];
      for (let i = 0; i < items.length; i += MAX_PER_COL) {
          chunkedItems.push(items.slice(i, i + MAX_PER_COL));
      }

      chunkedItems.forEach((chunk, colIndex) => {
           // Calculate Column X
           // Col 0 is closest to hub: startX
           // Col 1 is further: startX + (dir * COL_SPACING)
           const colX = startX + (colIndex * COL_SPACING * direction);
           
           // Calculate Vertical Center for this chunk
           // We simply stack them with buffer
           let stackHeight = 0;
           chunk.forEach((item, idx) => {
              if (idx > 0) stackHeight += VERTICAL_BUFFER;
              stackHeight += item.height;
           });
           
           // Center the stack relative to Hub Y
           const hubCenterY = HUB_Y + (hubHeight / 2);
           const startY = hubCenterY - (stackHeight / 2);

           let currentY = startY;

           chunk.forEach(item => {
                // Snap to Grid
                item.comp.x = Math.round(colX / GRID_SIZE) * GRID_SIZE;
                item.comp.y = Math.round(currentY / GRID_SIZE) * GRID_SIZE;

                // Handle Resistor Placement
                if (item.hasResistor && item.resistorId) {
                    const res = layout.find(r => r.id === item.resistorId);
                    if (res) {
                        const rSpec = STATIC_COMPONENT_DATA[res.type] || { width: 60, height: 20 };
                        
                        if (direction === 1) { 
                            // Right Side (Outputs): Hub -> Resistor -> Component
                            // Resistor goes between Hub and Comp.
                            // X = CompX - gap
                            res.x = item.comp.x - RESISTOR_GAP;
                        } else {
                            // Left Side (Inputs): Component -> Resistor -> Hub
                            // Resistor goes between Comp and Hub.
                            // X = CompX + Width + Gap
                            res.x = item.comp.x + item.width + 40; // Small offset
                        }
                        
                        res.y = item.comp.y + (item.height / 2) - (rSpec.height / 2);
                        res.rotation = 0;
                    }
                }

                currentY += item.height + VERTICAL_BUFFER;
           });
      });
  };

  // 4. Distribute Inputs (Left of Hub)
  // startX is FIRST_COL_GAP to the left of Hub Center? No, left of Hub Edge.
  // Hub is at HUB_X.
  distributeSide(inputs, HUB_X - FIRST_COL_GAP, -1);

  // 5. Distribute Outputs (Right of Hub)
  distributeSide(outputs, HUB_X + hubWidth + FIRST_COL_GAP, 1);

  // 6. Cleanup Orphan Passives
  let orphanY = HUB_Y + hubHeight + 100;
  passives.forEach(r => {
      if (r.x === 0 && r.y === 0) { 
          r.x = HUB_X + 100;
          r.y = orphanY;
          orphanY += 40;
      }
  });

  // 7. Cleanup Unknown Components
  const unknownComponents = layout.filter(c => !TYPE_CATEGORIES[c.type]);
  let unknownX = HUB_X - FIRST_COL_GAP;
  let unknownY = HUB_Y + hubHeight + 200; 
  
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
