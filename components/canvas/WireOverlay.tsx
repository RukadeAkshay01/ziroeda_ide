
import React from 'react';
import { WokwiConnection, Point } from '../../types';
import { DrawingState } from '../../types/canvasTypes';
import { getWireColor, pointsToSvgPath } from '../../utils/circuitUtils';

interface WireOverlayProps {
  connections: WokwiConnection[];
  wireRoutes: Map<string, Point[]>;
  selectedWireIndex: string | null;
  drawingState: DrawingState | null;
  mousePos: Point;
  onWireClick: (e: React.MouseEvent, index: string) => void;
  onWireHandleMouseDown: (e: React.MouseEvent, wireIndex: string, segmentIndex: number) => void;
  layer: 'bottom' | 'top';
}

const WireOverlay: React.FC<WireOverlayProps> = ({
  connections,
  wireRoutes,
  selectedWireIndex,
  drawingState,
  mousePos,
  onWireClick,
  onWireHandleMouseDown,
  layer
}) => {

  const getPreviewPath = () => {
    if (!drawingState) return '';
    const { startX, startY, startDirection } = drawingState;
    const { x: endX, y: endY } = mousePos;
    if (startDirection === 'V') return `M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`;
    return `M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY}`;
  };

  return (
    <svg className="absolute top-0 left-0 overflow-visible z-30 pointer-events-none" style={{ width: 1, height: 1 }}>
      {connections.map((conn, idx) => {
        const indexStr = `${idx}`;
        const points = wireRoutes.get(indexStr);
        if (!points) return null;
        
        const pathData = pointsToSvgPath(points);
        const color = getWireColor(conn);
        const isSelected = selectedWireIndex === indexStr;
        
        // BOTTOM LAYER: Render all wire paths (passive)
        if (layer === 'bottom') {
            return (
                <g key={`wire-bottom-${idx}`} onClick={(e) => onWireClick(e, indexStr)}>
                    {/* Transparent Hit Area */}
                    <path d={pathData} stroke="transparent" strokeWidth="12" fill="none" className="cursor-pointer pointer-events-auto" />
                    {/* Core Wire */}
                    <path d={pathData} stroke="#000000" strokeWidth="6" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={pathData} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none" />
                </g>
            );
        }

        // TOP LAYER: Render Selection Highlights & Handles (interactive overlay)
        if (layer === 'top' && isSelected) {
            return (
                <g key={`wire-top-${idx}`}>
                    {/* Highlight Glow (Visual only, clicks pass through to bottom or component) */}
                    <path d={pathData} stroke="#22d3ee" strokeWidth="6" fill="none" strokeOpacity="0.5" strokeLinecap="round" className="pointer-events-none" />
                    
                    {/* Drag Handles */}
                    {points.map((p, i) => {
                        if (i === points.length - 1) return null;
                        const nextP = points[i+1];
                        const midX = (p.x + nextP.x) / 2;
                        const midY = (p.y + nextP.y) / 2;
                        // Don't show handle for tiny segments or start/end segments of simple 2-point wires if desired
                        // Logic kept from original:
                        if (points.length !== 2 && (i === 0 || i === points.length - 2)) return null;
                        if (Math.abs(p.x - nextP.x) < 10 && Math.abs(p.y - nextP.y) < 10) return null;

                        return (
                            <circle
                                key={`handle-${i}`}
                                cx={midX}
                                cy={midY}
                                r={6}
                                fill="white"
                                stroke="#0ea5e9"
                                strokeWidth="2"
                                className="cursor-grab hover:scale-125 transition-transform pointer-events-auto"
                                onMouseDown={(e) => onWireHandleMouseDown(e, indexStr, i)}
                            />
                        );
                    })}
                </g>
            );
        }

        return null;
      })}
      
      {/* Drawing Preview (Always Top) */}
      {layer === 'top' && drawingState && (
        <g className="pointer-events-none">
           <circle cx={drawingState.startX} cy={drawingState.startY} r="4" fill="#06b6d4" />
           <path d={getPreviewPath()} stroke="#06b6d4" strokeWidth="3" fill="none" strokeDasharray="5,5" className="drop-shadow-md" />
           <circle cx={mousePos.x} cy={mousePos.y} r="4" fill="#06b6d4" />
        </g>
      )}
    </svg>
  );
};

export default WireOverlay;
