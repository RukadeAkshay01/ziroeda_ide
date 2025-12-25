import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface NTCOverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const NTCOverlay: React.FC<NTCOverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    // Find the active NTC sensor
    const sensor = components.find(c => c.id === selectedId && (c.type === 'ntc_temp' || c.type === 'wokwi-ntc-temperature-sensor'));

    // Local state for value
    const [temp, setTemp] = useState(24.0);

    // Initial sync
    useEffect(() => {
        if (sensor && onComponentEvent) {
            onComponentEvent(sensor.id, 'input', { temperature: temp });
        }
    }, [temp, sensor, onComponentEvent]);

    // Drag state
    const [offset, setOffset] = useState({ x: 0, y: -100 });
    const [isDragging, setIsDragging] = useState(false);

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
    const sensorX = pos.x;
    const sensorY = pos.y;

    const width = 200;
    const height = 80;

    return (
        <g transform={`translate(${sensorX + offset.x}, ${sensorY + offset.y})`}>
            <foreignObject width={width} height={height} style={{ overflow: 'visible' }}>
                <div
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none"
                    style={{ width: '100%', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            setIsDragging(true);
                        }
                    }}
                >
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase mb-1 pointer-events-none">
                        <span>Temperature</span>
                        <span className="text-zinc-200">{temp.toFixed(1)}°C</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm pointer-events-none">❄️</span>
                        <input
                            type="range"
                            min="-55"
                            max="200"
                            step="1"
                            value={temp}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => setTemp(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <span className="text-sm pointer-events-none">🔥</span>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
