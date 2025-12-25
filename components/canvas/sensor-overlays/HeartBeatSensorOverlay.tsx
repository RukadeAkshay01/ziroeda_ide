import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface HeartBeatSensorOverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const HeartBeatSensorOverlay: React.FC<HeartBeatSensorOverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {


    // Find the active Heartbeat sensor
    const sensor = components.find(c => c.id === selectedId && (c.type === 'heart_beat_sensor' || c.type === 'wokwi-heart-beat-sensor'));

    // Drag state
    const [offset, setOffset] = useState({ x: 0, y: -150 });
    const [isDragging, setIsDragging] = useState(false);

    // Simulation state
    const [active, setActive] = useState(false);
    const [bpm, setBpm] = useState(60);

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

    useEffect(() => {
        if (sensor) {
            // Sync current state to simulator on mount/remount/reconnect
            // This fixes the issue where Simulator reset (re-compile) clears the internal state
            // but the UI still shows "Active".
            // We use a small timeout to ensure the Simulator has fully loaded the design.
            const timer = setTimeout(() => {
                onComponentEvent?.(sensor.id, 'set-heart-beat-active', { active });
                onComponentEvent?.(sensor.id, 'set-heart-beat-rate', { bpm });
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [sensor?.id, active, bpm]); // Re-sync if ID changes. Also keeping active/bpm here ensures we send latest, but we might want to debounce if this causes too much traffic. 
    // Actually, sending on every active/bpm change is duplicative with the onChange handlers, 
    // but ensures consistency. For optimization, we could split it, but for reliability this is safer.


    if (!sensor) return null;

    const pos = layout[sensor.id];
    if (!pos) return null;

    const width = 220;
    const height = 140;

    return (
        <g transform={`translate(${pos.x + offset.x}, ${pos.y + offset.y})`}>
            <foreignObject width={width} height={height} style={{ overflow: 'visible' }}>
                <div
                    className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl flex flex-col gap-3 cursor-grab active:cursor-grabbing select-none"
                    style={{ width: '100%', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        // Only start drag if not on input
                        const target = e.target as HTMLElement;
                        if (target.tagName !== 'INPUT') {
                            setIsDragging(true);
                        }
                    }}
                >
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase mb-0 pointer-events-none">
                        <span>❤️ Heart Beat</span>
                        <span className={active ? "text-rose-500 animate-pulse" : "text-zinc-600"}>
                            {active ? `${bpm} BPM` : 'STOPPED'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-800 p-2 rounded">
                        <span className="text-xs text-zinc-300">Active</span>
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => {
                                const newActive = e.target.checked;
                                setActive(newActive);
                                onComponentEvent?.(sensor.id, 'set-heart-beat-active', { active: newActive });
                            }}
                            className="w-4 h-4 rounded cursor-pointer accent-rose-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>Rate</span>
                            <span>{bpm}</span>
                        </div>
                        <input
                            type="range"
                            min="30"
                            max="200"
                            value={bpm}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setBpm(val);
                                onComponentEvent?.(sensor.id, 'set-heart-beat-rate', { bpm: val });
                            }}
                            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
                        />
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
