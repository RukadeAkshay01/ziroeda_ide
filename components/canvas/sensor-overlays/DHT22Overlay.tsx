import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface DHT22OverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const DHT22Overlay: React.FC<DHT22OverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    const [temp, setTemp] = useState(24.0);
    const [hum, setHum] = useState(50.0);

    // Find the active DHT22 sensor
    const sensor = components.find(c => c.id === selectedId && (c.type === 'dht22' || c.type === 'wokwi-dht22'));

    useEffect(() => {
        if (sensor) {
            // Reset or sync values if we had them stored in component properties?
            // For now, just default or keep state.
        }
    }, [sensor?.id]);

    // Drag state
    const [offset, setOffset] = useState({ x: -80, y: -150 });
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

    const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTemp = parseFloat(e.target.value);
        setTemp(newTemp);
        onComponentEvent?.(sensor.id, 'environment-change', { temperature: newTemp, humidity: hum });
    };

    const handleHumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHum = parseFloat(e.target.value);
        setHum(newHum);
        onComponentEvent?.(sensor.id, 'environment-change', { temperature: temp, humidity: newHum });
    };

    if (!sensor) return null;

    const pos = layout[sensor.id] || { x: 0, y: 0 };
    const sensorX = pos.x;
    const sensorY = pos.y;

    const width = 220; // Slightly wider for two controls
    const height = 140; // Taller for two rows

    return (
        <g transform={`translate(${sensorX + offset.x}, ${sensorY + offset.y})`}>
            <foreignObject width={width} height={height} style={{ overflow: 'visible' }}>
                <div
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl flex flex-col gap-3 cursor-grab active:cursor-grabbing select-none"
                    style={{ width: '100%', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            setIsDragging(true);
                        }
                    }}
                >
                    <div className="text-[10px] text-zinc-400 font-bold uppercase mb-0 pointer-events-none">
                        DHT22 Environment
                    </div>

                    {/* Temperature Control */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold uppercase">
                            <span>Temperature</span>
                            <span className="text-zinc-200">{temp.toFixed(1)}°C</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm pointer-events-none">❄️</span>
                            <input
                                type="range"
                                min="-40" max="80" step="0.1"
                                value={temp}
                                onMouseDown={(e) => e.stopPropagation()}
                                onChange={handleTempChange}
                                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <span className="text-sm pointer-events-none">🔥</span>
                        </div>
                    </div>

                    {/* Humidity Control */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold uppercase">
                            <span>Humidity</span>
                            <span className="text-zinc-200">{hum.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm pointer-events-none">🌵</span>
                            <input
                                type="range"
                                min="0" max="100" step="0.1"
                                value={hum}
                                onMouseDown={(e) => e.stopPropagation()}
                                onChange={handleHumChange}
                                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <span className="text-sm pointer-events-none">💧</span>
                        </div>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
