
import { CircuitComponent, WokwiConnection } from '../types';
import { getComponentDimensions, STATIC_COMPONENT_DATA } from '../utils/static-component-data';

/**
 * Calculates the absolute world position of a pin based on current component state.
 * Uses a simplified rotation logic appropriate for the placement phase.
 */
function getPinWorldPosition(comp: CircuitComponent, pinName: string) {
    const dims = getComponentDimensions(comp.type);
    const spec = STATIC_COMPONENT_DATA[comp.type] || STATIC_COMPONENT_DATA['wokwi-arduino-uno'];
    const pin = spec.pins.find(p => p.name === pinName) || { x: dims.width/2, y: dims.height/2 };
    
    const rad = (comp.rotation || 0) * Math.PI / 180;
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    
    // Vector from center to pin
    const dx = pin.x - cx;
    const dy = pin.y - cy;
    
    // Rotate vector
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    
    return { x: comp.x + cx + rx, y: comp.y + cy + ry };
}

/**
 * Gets the center coordinate of a component.
 */
function getComponentCenter(comp: CircuitComponent) {
    const dims = getComponentDimensions(comp.type);
    return { x: comp.x + dims.width/2, y: comp.y + dims.height/2 };
}

/**
 * Main optimization function.
 * Modifies connections to prefer "near-side" pins for symmetric components.
 */
export const optimizeSmartConnections = (
  components: CircuitComponent[],
  connections: WokwiConnection[]
): { components: CircuitComponent[], connections: WokwiConnection[] } => {
    
    // Deep clone connections to avoid mutating the original reference too early
    const newConnections = connections.map(conn => [...conn] as WokwiConnection);
    
    const findComponent = (id: string) => components.find(c => c.id === id);

    // Helper: Get target position for a connection endpoint to check directionality
    const getTargetPos = (conn: WokwiConnection, myId: string) => {
        const [src, tgt] = conn;
        const other = src.startsWith(myId) ? tgt : src;
        const [otherId, otherPin] = other.split(':');
        const otherComp = findComponent(otherId);
        if (!otherComp) return null;
        return getPinWorldPosition(otherComp, otherPin);
    };

    // --- 1. RESISTORS (Swap 1 <-> 2) ---
    // Resistors are non-polarized. We can swap pin 1 and 2 to minimize wire length/crossing.
    components.filter(c => c.type === 'wokwi-resistor').forEach(res => {
        // Find all connections involving this resistor
        const myConnsIndices: number[] = [];
        newConnections.forEach((conn, idx) => {
             if (conn[0].startsWith(res.id + ':') || conn[1].startsWith(res.id + ':')) {
                 myConnsIndices.push(idx);
             }
        });
        
        let p1Target: { x: number, y: number } | null = null;
        let p2Target: { x: number, y: number } | null = null;
        let p1ConnIndex = -1;
        let p2ConnIndex = -1;

        // Map current connections
        myConnsIndices.forEach((idx) => {
             const conn = newConnections[idx];
             const part = conn[0].startsWith(res.id) ? conn[0] : conn[1];
             const pin = part.split(':')[1];
             const target = getTargetPos(conn, res.id);
             
             if (pin === '1') { p1Target = target; p1ConnIndex = idx; }
             if (pin === '2') { p2Target = target; p2ConnIndex = idx; }
        });

        // Get world positions of Pin 1 and Pin 2 (current layout)
        const p1Pos = getPinWorldPosition(res, '1');
        const p2Pos = getPinWorldPosition(res, '2');

        // Calculate current total distance
        let currentDist = 0;
        if (p1Target) currentDist += Math.hypot(p1Pos.x - p1Target.x, p1Pos.y - p1Target.y);
        if (p2Target) currentDist += Math.hypot(p2Pos.x - p2Target.x, p2Pos.y - p2Target.y);

        // Calculate swapped total distance (Pin 1 connection moves to Pin 2 pos, etc)
        let swappedDist = 0;
        if (p1Target) swappedDist += Math.hypot(p2Pos.x - p1Target.x, p2Pos.y - p1Target.y); 
        if (p2Target) swappedDist += Math.hypot(p1Pos.x - p2Target.x, p1Pos.y - p2Target.y);

        // If swapping reduces total wire length (uncrossing), do it.
        if (swappedDist < currentDist) {
            if (p1ConnIndex !== -1) {
                const c = newConnections[p1ConnIndex];
                if (c[0].startsWith(res.id)) c[0] = c[0].replace(':1', ':2');
                else c[1] = c[1].replace(':1', ':2');
            }
            if (p2ConnIndex !== -1) {
                const c = newConnections[p2ConnIndex];
                if (c[0].startsWith(res.id)) c[0] = c[0].replace(':2', ':1');
                else c[1] = c[1].replace(':2', ':1');
            }
        }
    });

    // --- 2. PUSHBUTTONS (Optimize .l vs .r) ---
    // Pushbuttons have internally connected sides. 1.l==1.r, 2.l==2.r.
    // Connect to the side closest to the target component.
    components.filter(c => c.type === 'wokwi-pushbutton').forEach(btn => {
        const btnCenter = getComponentCenter(btn);
        
        // Find connections
        const myConnsIndices: number[] = [];
        newConnections.forEach((conn, idx) => {
             if (conn[0].startsWith(btn.id + ':') || conn[1].startsWith(btn.id + ':')) {
                 myConnsIndices.push(idx);
             }
        });

        myConnsIndices.forEach(idx => {
            const conn = newConnections[idx];
            const partIndex = conn[0].startsWith(btn.id) ? 0 : 1;
            const partStr = conn[partIndex]; // e.g. "btn1:1.l"
            const [id, pin] = partStr.split(':');
            
            // We only optimize 1.x and 2.x pins
            const basePin = pin.split('.')[0]; // "1" or "2"
            if (basePin !== '1' && basePin !== '2') return;

            const target = getTargetPos(conn, btn.id);
            if (!target) return;

            // Check direction relative to button center
            const isTargetRight = target.x > btnCenter.x;
            
            // Determine optimal suffix
            const suffix = isTargetRight ? 'r' : 'l';
            const newPin = `${basePin}.${suffix}`;

            // Apply update if different
            if (newPin !== pin) {
                conn[partIndex] = `${id}:${newPin}`;
            }
        });
    });

    return { components, connections: newConnections };
};
