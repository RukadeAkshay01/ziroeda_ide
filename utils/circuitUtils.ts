
/**
 * @file circuitUtils.ts
 * @description Utilities for pin detection and Manhattan routing logic.
 */

import { CircuitComponent, WokwiConnection, Point } from '../types';
import { getComponentSpec, getComponentDimensions } from './static-component-data';
import { rotateVector } from './mathUtils';

// Re-export for consumers
export { pointsToSvgPath } from './mathUtils';

const STUB_BASE = 30;           // Base length for wire "stubs" emerging from pins
const STUB_STEP = 12;           // Extra spacing added to parallel wires to create a bus effect

interface Vector { x: number; y: number }

export interface ResolvedPin { name: string; x: number; y: number; }

export interface ComponentLayoutData {
    width: number;
    height: number;
    pins: ResolvedPin[];
}

export type LayoutDataMap = Map<string, ComponentLayoutData>;

// --- ALIAS DEFINITIONS ---
const PIN_ALIASES: Record<string, Record<string, string>> = {
  'wokwi-pushbutton': { 
    '1': '1.l', '2': '2.l', '3': '1.r', '4': '2.r',
    'IN': '1.l', 'OUT': '2.l',
    'L': '1.l', 'R': '1.r',
    'LEFT': '1.l', 'RIGHT': '1.r'
  },
  'wokwi-potentiometer': {
    'WIPER': 'SIG', 'SIGNAL': 'SIG', 'OUTPUT': 'SIG', 'OUT': 'SIG',
    'POS': 'VCC', 'NEG': 'GND',
    '+': 'VCC', '-': 'GND', 'IN': 'VCC'
  },
  'wokwi-slide-switch': {
    'COM': '2', 'COMMON': '2', 'MIDDLE': '2',
    'L': '1', 'R': '3', 'LEFT': '1', 'RIGHT': '3'
  },
  'wokwi-relay-module': {
     'S': 'IN', 'SIGNAL': 'IN', 'SIG': 'IN'
  },
  'wokwi-servo': {
     'SIGNAL': 'PWM', 'SIG': 'PWM', 'PULSE': 'PWM', 'DATA': 'PWM',
     '5V': 'VCC', 'POS': 'VCC', '+': 'VCC', 'POWER': 'VCC',
     '-': 'GND', 'NEG': 'GND'
  },
  'wokwi-lcd1602': {
     'VCC': 'VDD', '5V': 'VDD', '+': 'VDD',
     'GND': 'VSS', '-': 'VSS',
     'LED+': 'A', 'LED-': 'K'
  },
  'wokwi-lcd2004': {
     'VCC': 'VDD', '5V': 'VDD', '+': 'VDD',
     'GND': 'VSS', '-': 'VSS',
     'LED+': 'A', 'LED-': 'K'
  },
  'wokwi-ky-040': {
      'S1': 'CLK', 'S2': 'DT', 'KEY': 'SW'
  },
  'wokwi-led': {
      'ANODE': 'A', 'CATHODE': 'C', 'POS': 'A', 'NEG': 'C'
  },
  'wokwi-buzzer': {
      'POS': '1', 'NEG': '2', '+': '1', '-': '2'
  }
};

/**
 * Normalizes a pin name using known aliases and standard transformations.
 */
function normalizePinName(componentType: string, pinName: string): string {
    if (!pinName) return '';
    let name = pinName.toUpperCase().trim();
    
    // 1. Remove common prefixes for Arduino-like pins
    if (componentType.includes('arduino')) {
        name = name.replace(/^D(\d+)$/, '$1'); // D13 -> 13
        name = name.replace(/^GPIO(\d+)$/, '$1');
    }

    // 2. Check Aliases
    const typeAliases = PIN_ALIASES[componentType];
    if (typeAliases) {
        // Direct match
        if (typeAliases[name]) return typeAliases[name];
        
        // Case-insensitive / Fuzzy check if not found directly
        const foundKey = Object.keys(typeAliases).find(k => k.toUpperCase() === name);
        if (foundKey) return typeAliases[foundKey];
    }

    return name;
}

/**
 * Determines the ideal exit direction for a wire leaving a specific pin.
 * Uses geometric proximity to the component edges.
 */
export function getPinExitVector(
  component: CircuitComponent,
  pinName: string,
  layoutData: LayoutDataMap
): Vector {
  const type = component.type;
  const normalizedPinName = normalizePinName(type, pinName);
  
  // 1. Try to find precise pin coordinates and component dimensions
  let pinX: number | undefined;
  let pinY: number | undefined;
  let compWidth: number = 0;
  let compHeight: number = 0;

  // Check dynamic layout data first (real rendered size/positions)
  const dynamic = layoutData.get(component.id);
  if (dynamic) {
    const p = dynamic.pins.find(dp => dp.name === pinName || dp.name.toUpperCase() === normalizedPinName.toUpperCase());
    if (p) {
       pinX = p.x;
       pinY = p.y;
       compWidth = dynamic.width;
       compHeight = dynamic.height;
    }
  }

  // Fallback to static data if not found dynamically
  if (pinX === undefined || pinY === undefined) {
    const spec = getComponentSpec(type);
    const dims = getComponentDimensions(type);
    compWidth = dims.width;
    compHeight = dims.height;
    
    // Attempt to match pin name (exact or normalized)
    const p = spec?.pins.find(sp => sp.name === pinName || sp.name.toUpperCase() === normalizedPinName.toUpperCase());
    if (p) {
        pinX = p.x;
        pinY = p.y;
    }
  }

  // If we found the pin, determine exit vector geometrically
  if (pinX !== undefined && pinY !== undefined) {
      // Calculate distance to each edge
      const distL = pinX;
      const distR = compWidth - pinX;
      const distT = pinY;
      const distB = compHeight - pinY;
      
      const min = Math.min(distL, distR, distT, distB);
      
      let localVector = { x: 0, y: 1 }; // Default down

      if (min === distT) localVector = { x: 0, y: -1 };      // Top Edge -> Up
      else if (min === distB) localVector = { x: 0, y: 1 };  // Bottom Edge -> Down
      else if (min === distL) localVector = { x: -1, y: 0 }; // Left Edge -> Left
      else if (min === distR) localVector = { x: 1, y: 0 };  // Right Edge -> Right
      
      return rotateVector(localVector, component.rotation || 0);
  }

  // Absolute fallback for completely unknown pins: Default Down
  return rotateVector({ x: 0, y: 1 }, component.rotation || 0);
}

/**
 * Calculates absolute world coordinates for all pins on a component.
 */
export function getAllPinPositions(
  part: CircuitComponent,
  layoutData: LayoutDataMap
): { name: string; x: number; y: number }[] {
  let pins: ResolvedPin[] = [];
  let width = 0;
  let height = 0;

  const dynamic = layoutData.get(part.id);
  if (dynamic && dynamic.pins && dynamic.pins.length > 0) {
      pins = dynamic.pins;
      width = dynamic.width;
      height = dynamic.height;
  } else {
      const spec = getComponentSpec(part.type);
      const dims = getComponentDimensions(part.type);
      width = dims.width;
      height = dims.height;
      if (spec) pins = spec.pins;
  }

  const cx = width / 2;
  const cy = height / 2;
  const rotRad = (part.rotation || 0) * (Math.PI / 180);

  return pins.map(pin => {
      const lx = pin.x;
      const ly = pin.y;
      const dx = lx - cx;
      const dy = ly - cy;
      const rx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
      const ry = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);
      return {
          name: pin.name,
          x: part.x + cx + rx,
          y: part.y + cy + ry
      };
  });
}

/**
 * Finds the absolute world position of a specific pin by name.
 */
export function getPinAbsolutePosition(
    part: CircuitComponent, 
    pinName: string, 
    layoutData: LayoutDataMap
): Point {
  const allPins = getAllPinPositions(part, layoutData);
  
  // Normalize everything to Upper Case for robust comparison
  // NOTE: normalizePinName might return mixed case from ALIAS map, so we force upper here.
  const target = normalizePinName(part.type, pinName).toUpperCase();
  const rawTarget = pinName.toUpperCase();

  // 1. Try exact match on normalized name (Checking p.name vs target)
  let pin = allPins.find(p => p.name.toUpperCase() === target);

  // 2. Try exact match on raw name
  if (!pin) {
      pin = allPins.find(p => p.name.toUpperCase() === rawTarget);
  }

  // 3. Try fuzzy containment (helpful for things like "GPIO 2" vs "2")
  if (!pin) {
      pin = allPins.find(p => {
          const pName = p.name.toUpperCase();
          return pName === target || 
                 pName.includes(target) || target.includes(pName) ||
                 pName === rawTarget ||
                 pName.includes(rawTarget) || rawTarget.includes(pName);
      });
  }

  if (!pin) {
      // FALLBACK: Return the exact center of the component
      const dims = getComponentDimensions(part.type);
      return { x: part.x + dims.width / 2, y: part.y + dims.height / 2 };
  }
  return { x: pin.x, y: pin.y };
}

/**
 * Maps pin context to a standardized wire color hex.
 */
export function getWireColor(connection: string[]): string {
  const explicitColor = connection[2] ? connection[2].toLowerCase() : '';
  const context = (connection[0] || '') + (connection[1] || '').toUpperCase();
  const colorMap: Record<string, string> = {
    'red': '#ef4444', 'black': '#475569', 'blue': '#3b82f6', 'green': '#22c55e',
    'yellow': '#eab308', 'orange': '#f97316', 'purple': '#a855f7', 'white': '#e2e8f0'
  };
  if (explicitColor && colorMap[explicitColor]) return colorMap[explicitColor];
  if (context.includes('GND') || context.includes('VSS')) return colorMap['black'];
  if (context.includes('5V') || context.includes('VCC') || context.includes('VDD')) return colorMap['red'];
  return '#22c55e'; 
}

/**
 * Groups and sorts pins exiting a component side to assign non-overlapping stubs.
 */
function computeDynamicStubs(
    components: CircuitComponent[],
    connections: WokwiConnection[],
    layoutData: LayoutDataMap
): Map<string, number> {
    const stubLengths = new Map<string, number>(); 
    const sideGroups = new Map<string, Array<{name: string, x: number, y: number}>>();

    const registerPin = (compId: string, pinName: string) => {
        const comp = components.find(c => c.id === compId);
        if (!comp) return;
        const vec = getPinExitVector(comp, pinName, layoutData);
        const side = Math.abs(vec.x) > Math.abs(vec.y) ? (vec.x > 0 ? 'R' : 'L') : (vec.y > 0 ? 'B' : 'T');
        const key = `${compId}:${side}`;
        if (!sideGroups.has(key)) sideGroups.set(key, []);
        const pos = getPinAbsolutePosition(comp, pinName, layoutData);
        const group = sideGroups.get(key)!;
        if (!group.some(p => p.name === pinName)) group.push({ name: pinName, x: pos.x, y: pos.y });
    };

    connections.forEach(([src, tgt]) => {
        registerPin(src.split(':')[0], src.split(':')[1]);
        registerPin(tgt.split(':')[0], tgt.split(':')[1]);
    });

    sideGroups.forEach((pins, key) => {
        const [, side] = key.split(':');
        // Sort pins to minimize crossing:
        // Top/Bottom edges sorted by X.
        // Left/Right edges sorted by Y.
        if (side === 'T' || side === 'B') pins.sort((a, b) => a.x - b.x);
        else pins.sort((a, b) => a.y - b.y);
        
        pins.forEach((p, index) => {
            stubLengths.set(`${key.split(':')[0]}:${p.name}`, STUB_BASE + (index * STUB_STEP));
        });
    });
    return stubLengths;
}

/**
 * Main engine for initial wire routing. Calculates paths for all connections.
 */
export function calculateDefaultRoutes(
  components: CircuitComponent[],
  connections: WokwiConnection[],
  layoutData: LayoutDataMap
): Map<string, Point[]> {
  const routes = new Map<string, Point[]>();
  const stubLengths = computeDynamicStubs(components, connections, layoutData);

  connections.forEach((conn, idx) => {
      const [srcStr, tgtStr] = conn;
      const [srcId, srcPinName] = srcStr.split(':');
      const [tgtId, tgtPinName] = tgtStr.split(':');

      const srcPart = components.find(c => c.id === srcId);
      const tgtPart = components.find(c => c.id === tgtId);

      if (srcPart && tgtPart) {
          const start = getPinAbsolutePosition(srcPart, srcPinName, layoutData);
          const end = getPinAbsolutePosition(tgtPart, tgtPinName, layoutData);
          const startVec = getPinExitVector(srcPart, srcPinName, layoutData);
          const endVec = getPinExitVector(tgtPart, tgtPinName, layoutData);
          const sLen = stubLengths.get(`${srcId}:${srcPinName}`) || STUB_BASE;
          const eLen = stubLengths.get(`${tgtId}:${tgtPinName}`) || STUB_BASE;

          // Calculate Stub Tips
          const sStub = { x: start.x + startVec.x * sLen, y: start.y + startVec.y * sLen };
          const eStub = { x: end.x + endVec.x * eLen, y: end.y + endVec.y * eLen };

          // Determine the vertical channel (MidX)
          let midX = (sStub.x + eStub.x) / 2;

          // --- SMART ROUTING PREVENT U-TURNS ---
          // Prevent horizontal overlapping. If a pin exits Right, the vertical turn 
          // channel MUST be at least as far right as the stub tip. 
          // If a pin exits Left, the channel MUST be at least as far left as the stub tip.
          
          // 1. Source Constraints
          if (Math.abs(startVec.x) > 0.5) { 
             if (startVec.x > 0) midX = Math.max(midX, sStub.x);
             else midX = Math.min(midX, sStub.x);
          }

          // 2. Target Constraints
          if (Math.abs(endVec.x) > 0.5) {
             if (endVec.x > 0) midX = Math.max(midX, eStub.x);
             else midX = Math.min(midX, eStub.x);
          }

          // Build path points: Start -> SourceStub -> Vertical Turn -> TargetStub -> End
          const rawPoints = [
              start, 
              sStub, 
              { x: midX, y: sStub.y }, 
              { x: midX, y: eStub.y }, 
              eStub, 
              end
          ];

          // Filter out zero-length segments to keep the router clean
          const points = rawPoints.filter((p, i) => {
            if (i === 0) return true;
            const prev = rawPoints[i-1];
            // Filter if point is essentially identical to previous point
            return !(Math.abs(p.x - prev.x) < 0.5 && Math.abs(p.y - prev.y) < 0.5);
          });

          routes.set(`${idx}`, points);
      }
  });
  return routes;
}

/**
 * Adjusts a wire route in response to user dragging a segment.
 */
export function updateRouteWithDrag(
    originalPoints: Point[],
    segmentIndex: number,
    mousePos: Point,
    lockedOrientation: 'H' | 'V'
): Point[] {
    const newPoints = [...originalPoints];
    // Safety check indices
    if (segmentIndex < 0 || segmentIndex >= newPoints.length - 1) return newPoints;

    if (lockedOrientation === 'H') {
        newPoints[segmentIndex] = { ...newPoints[segmentIndex], y: mousePos.y };
        newPoints[segmentIndex + 1] = { ...newPoints[segmentIndex + 1], y: mousePos.y };
    } else {
        newPoints[segmentIndex] = { ...newPoints[segmentIndex], x: mousePos.x };
        newPoints[segmentIndex + 1] = { ...newPoints[segmentIndex + 1], x: mousePos.x };
    }
    return newPoints;
}
