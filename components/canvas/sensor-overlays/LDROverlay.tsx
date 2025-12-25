import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface LDROverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const LDROverlay: React.FC<LDROverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    // Find the active LDR sensor
    // We show the overlay if an LDR is selected OR if we want to show it for all LDRs?
    // Tinkercad shows it when you click the component.
    // Let's stick to "selectedId" for now to avoid clutter, or maybe show for all if simulation is running?
    // The user said "such should come up in simulation", implying it appears when needed.
    // Let's show it only when selected for now, as per standard behavior.

    const ldr = components.find(c => c.id === selectedId && (c.type === 'photoresistor' || c.type === 'wokwi-photoresistor-sensor'));

    // Local state for the slider value
    const [lux, setLux] = useState(500);

    useEffect(() => {
        if (ldr && onComponentEvent) {
            onComponentEvent(ldr.id, 'input', { value: lux });
        }
    }, [lux, ldr, onComponentEvent]);

    // Drag state
    const [offset, setOffset] = useState({ x: 0, y: -100 });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        // Reset offset when selection changes (optional, keeps it predictable)
        if (ldr) {
            // Keep last position or reset? Let's reset for now or keep generic default
            // If we want per-component persistence we need a map, but for now simple reset is fine or even Just Don't Reset if same component
        }
    }, [ldr?.id]);

    useEffect(() => {
        if (!isDragging) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const scale = 1 / zoom;
            setOffset(prev => ({
                x: prev.x + e.movementX * scale,
                y: prev.y + e.movementY * scale
            }));
        };

        const handleWindowMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isDragging, zoom]);

    if (!ldr) return null;

    const pos = layout[ldr.id] || { x: 0, y: 0 };
    const sensorX = pos.x;
    const sensorY = pos.y;

    const overlayWidth = 200;
    const overlayHeight = 80;

    return (
        <g transform={`translate(${sensorX + offset.x}, ${sensorY + offset.y})`}>
            <foreignObject width={overlayWidth} height={overlayHeight} style={{ overflow: 'visible' }}>
                <div
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none"
                    style={{ width: '100%', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        // Only start drag if not clicking input
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            setIsDragging(true);
                        }
                    }}
                >
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase mb-1 pointer-events-none">
                        <span>Light Intensity</span>
                        <span className="text-zinc-200">{lux} Lux</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm pointer-events-none">🌑</span>
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            step="10"
                            value={lux}
                            onMouseDown={(e) => e.stopPropagation()} // Allow interaction with slider without dragging box
                            onChange={(e) => setLux(Number(e.target.value))}
                            className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                        />
                        <span className="text-sm pointer-events-none">☀️</span>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
