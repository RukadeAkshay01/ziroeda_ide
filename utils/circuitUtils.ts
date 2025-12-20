/**
 * @file circuitUtils.ts
 * @description Mathematical utilities for coordinate transformations, pin detection, and Manhattan routing.
 */

import { CircuitComponent, WokwiConnection, Point } from '../types';
import { getComponentSpec, getComponentDimensions } from './static-component-data';

const STUB_BASE = 20;           // Base length for wire "stubs" emerging from pins
const STUB_STEP = 12;           // Extra spacing added to parallel wires to create a bus effect

interface Vector { x: number; y: number }

export interface ResolvedPin { name: string; x: number; y: number; }

export interface ComponentLayoutData {
    width: number;
    height: number;
    pins: ResolvedPin[];
}

export type LayoutDataMap = Map<string, ComponentLayoutData>;

/**
 * Rotates a 2D vector by a given angle in degrees.
 */
function rotateVector(v: Vector, angleDegrees: number): Vector {
  const rad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: Math.round(v.x * cos - v.y * sin),
    y: Math.round(v.x * sin + v.y * cos)
  };
}

/**
 * Determines the ideal exit direction for a wire leaving a specific pin.
 * For example, Arduino top pins exit UP, while bottom pins exit DOWN.
 */
export function getPinExitVector(
  component: CircuitComponent,
  pinName: string,
  layoutData: LayoutDataMap
): Vector {
  const type = component.type;
  const rotation = component.rotation || 0;
  
  let localVector: Vector = { x: 0, y: 1 };

  if (type.includes('arduino')) {
    const dims = getComponentDimensions(type);
    const spec = getComponentSpec(type);
    if (spec) {
       const pinDef = spec.pins.find(p => p.name === pinName);
       if (pinDef) {
         if (pinDef.y < dims.height / 2) localVector = { x: 0, y: -1 };
         else localVector = { x: 0, y: 1 };
       }
    }
  } 
  else if (type.includes('resistor')) {
    if (pinName === '1') localVector = { x: -1, y: 0 };
    else if (pinName === '2') localVector = { x: 1, y: 0 };
  }
  else if (type.includes('pushbutton')) {
    if (pinName.includes('1.')) localVector = { x: 0, y: -1 };
    else localVector = { x: 0, y: 1 };
  }

  return rotateVector(localVector, rotation);
}

/**
 * Calculates absolute world coordinates for all pins on a component.
 * Accounts for component position, internal pin offsets, and rotation.
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
  const normalize = (n: string) => n.replace(/^D(\d+)$/, '$1').toUpperCase();
  const target = normalize(pinName);

  let pin = allPins.find(p => normalize(p.name) === target);
  if (!pin) pin = allPins.find(p => normalize(p.name).includes(target) || target.includes(normalize(p.name)));

  if (!pin) {
      const dims = getComponentDimensions(part.type);
      return { x: part.x + dims.width / 2, y: part.y + dims.height / 2 };
  }
  return { x: pin.x, y: pin.y };
}

/**
 * Maps pin context (e.g., 'GND', '5V') to a standardized wire color hex.
 */
export function getWireColor(connection: string[]): string {
  const explicitColor = connection[2] ? connection[2].toLowerCase() : '';
  const context = (connection[0] || '') + (connection[1] || '').toUpperCase();
  const colorMap: Record<string, string> = {
    'red': '#ef4444', 'black': '#475569', 'blue': '#3b82f6', 'green': '#22c55e',
    'yellow': '#eab308', 'orange': '#f97316', 'purple': '#a855f7', 'white': '#e2e8f0'
  };
  if (explicitColor && colorMap[explicitColor]) return colorMap[explicitColor];
  if (context.includes('GND')) return colorMap['black'];
  if (context.includes('5V') || context.includes('VCC')) return colorMap['red'];
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
        if (side === 'T' || side === 'B') pins.sort((a, b) => a.x - b.x);
        else pins.sort((a, b) => a.y - b.y);
        pins.forEach((p, index) => {
            stubLengths.set(`${key.split(':')[0]}:${p.name}`, STUB_BASE + (index * STUB_STEP));
        });
    });
    return stubLengths;
}

/**
 * Calculates the Manhattan (orthogonal) path between two points.
 */
function getManhattanPoints(start: Point, end: Point): Point[] {
    const midX = (start.x + end.x) / 2;
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
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

          const sStub = { x: start.x + startVec.x * sLen, y: start.y + startVec.y * sLen };
          const eStub = { x: end.x + endVec.x * eLen, y: end.y + endVec.y * eLen };

          routes.set(`${idx}`, [start, ...getManhattanPoints(sStub, eStub), end]);
      }
  });
  return routes;
}

/**
 * Converts a series of points into an SVG path string with rounded corners.
 */
export function pointsToSvgPath(points: Point[]): string {
    if (points.length < 2) return "";
    const R = 12; 
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    for (let i = 1; i < points.length - 1; i++) {
        const p = points[i-1], c = points[i], n = points[i+1];
        const dx1 = c.x - p.x, dy1 = c.y - p.y, len1 = Math.sqrt(dx1**2 + dy1**2);
        const dx2 = n.x - c.x, dy2 = n.y - c.y, len2 = Math.sqrt(dx2**2 + dy2**2);
        const r = Math.min(R, len1 / 2, len2 / 2);
        if (r < 2) { d += ` L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`; continue; }
        d += ` L ${(c.x - (dx1 / len1) * r).toFixed(1)} ${(c.y - (dy1 / len1) * r).toFixed(1)}`;
        d += ` Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${(c.x + (dx2 / len2) * r).toFixed(1)} ${(c.y + (dy2 / len2) * r).toFixed(1)}`;
    }
    d += ` L ${points[points.length-1].x.toFixed(1)} ${points[points.length-1].y.toFixed(1)}`;
    return d;
}

/**
 * Adjusts a wire route in response to user dragging a segment, maintaining orthogonality.
 */
export function updateRouteWithDrag(
    originalPoints: Point[],
    segmentIndex: number,
    mousePos: Point,
    lockedOrientation: 'H' | 'V'
): Point[] {
    const newPoints = [...originalPoints];
    if (lockedOrientation === 'H') {
        newPoints[segmentIndex] = { ...newPoints[segmentIndex], y: mousePos.y };
        newPoints[segmentIndex + 1] = { ...newPoints[segmentIndex + 1], y: mousePos.y };
    } else {
        newPoints[segmentIndex] = { ...newPoints[segmentIndex], x: mousePos.x };
        newPoints[segmentIndex + 1] = { ...newPoints[segmentIndex + 1], x: mousePos.x };
    }
    return newPoints;
}
