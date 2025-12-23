
import { Point } from '../types';

interface Vector { x: number; y: number }

/**
 * Rotates a 2D vector by a given angle in degrees.
 */
export function rotateVector(v: Vector, angleDegrees: number): Vector {
  const rad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: Math.round(v.x * cos - v.y * sin),
    y: Math.round(v.x * sin + v.y * cos)
  };
}

/**
 * Calculates the Manhattan (orthogonal) path between two points.
 */
export function getManhattanPoints(start: Point, end: Point): Point[] {
    const midX = (start.x + end.x) / 2;
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
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
