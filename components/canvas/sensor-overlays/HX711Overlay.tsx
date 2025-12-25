import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface HX711OverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const HX711Overlay: React.FC<HX711OverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    const sensor = components.find(c => c.id === selectedId && (c.type === 'hx711' || c.type === 'wokwi-hx711'));
    const [weight, setWeight] = useState(0);

    // Drag state
    const [offset, setOffset] = useState({ x: 0, y: -180 });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (sensor && onComponentEvent) {
            onComponentEvent(sensor.id, 'input', { weight });
        }
    }, [weight, sensor, onComponentEvent]);

    // Drag Handlers
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

    if (!sensor) return null;

    const pos = layout[sensor.id] || { x: 0, y: 0 };

    const overlayWidth = 280;
    const overlayHeight = 160;

    // Derived values for display
    const calibrationFactor = 420; // Standard for 5kg
    // Calculate raw value but clamp display to match simulator logic (24-bit max)
    let rawValue = Math.floor(weight * calibrationFactor);
    if (rawValue > 8388607) rawValue = 8388607;

    const weightKg = (weight / 1000).toFixed(3);

    return (
        <g transform={`translate(${pos.x + offset.x}, ${pos.y + 60 + offset.y})`}>
            <foreignObject width={overlayWidth} height={overlayHeight} style={{ overflow: 'visible' }}>
                <div style={{
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(4px)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    color: '#eee',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                    userSelect: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    pointerEvents: 'auto'
                }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        // Only start drag if not on input
                        const target = e.target as HTMLElement;
                        if (target.tagName !== 'INPUT') {
                            setIsDragging(true);
                        }
                    }}
                >
                    <div className="flex justify-between items-center border-b border-zinc-700 pb-2 mb-1">
                        <span className="font-bold text-zinc-400">⚖️ HX711 (5kg)</span>
                        <span className="text-green-400 text-xs">✓ Ready</span>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>0g</span>
                            <span>5000g</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="5000"
                            step="1"
                            value={weight}
                            onChange={e => setWeight(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Data Display */}
                    <div className="bg-zinc-800 rounded p-2 flex flex-col gap-1 text-[10px] text-zinc-300">
                        <div className="flex justify-between">
                            <span>Raw ADC:</span>
                            <span className="text-yellow-400 font-bold">{rawValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Calib Factor:</span>
                            <span className="text-blue-300">{calibrationFactor}</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-700 pt-1 mt-1">
                            <span>Weight:</span>
                            <span className="text-white font-bold text-xs">{weight.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between">
                            <span>(kg):</span>
                            <span className="text-zinc-400">{weightKg}kg</span>
                        </div>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
