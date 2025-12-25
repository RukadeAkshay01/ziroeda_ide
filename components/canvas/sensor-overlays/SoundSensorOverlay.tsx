import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface SoundSensorOverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const SoundSensorOverlay: React.FC<SoundSensorOverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    // 1. Selector Logic
    const sensor = components.find(c =>
        c.id === selectedId &&
        (c.type === 'big_sound_sensor' || c.type === 'small_sound_sensor' || c.type === 'wokwi-big-sound-sensor' || c.type === 'wokwi-small-sound-sensor')
    );

    // 2. Drag state
    const [offset, setOffset] = useState({ x: 0, y: -100 });
    const [isDragging, setIsDragging] = useState(false);

    // 3. Determine sensor type and specs
    const isSmall = sensor?.type === 'small_sound_sensor' || sensor?.type === 'wokwi-small-sound-sensor';
    const minDb = isSmall ? 58 : 50; // KY-038 (58dB) vs KY-037 (50dB)
    const maxDb = 100;

    // 4. Simulation state (in Decibels)
    // Initialize with minDb, but we also rely on useEffect to reset if type switches while mounted
    const [dbLevel, setDbLevel] = useState(minDb);

    // Reset dB level if sensor type changes
    useEffect(() => {
        setDbLevel(minDb);
    }, [minDb]);

    // 5. Drag Handlers
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

    // 6. Send Update to Simulator
    useEffect(() => {
        if (sensor && onComponentEvent) {
            // Map dB to 0-1023 range for the Simulator logic
            // 0 = Silence (minDb), 1023 = Loud (maxDb)
            // val = ((db - min) / (max - min)) * 1023
            // Clamp dbLevel to be safe
            const clampedDb = Math.max(minDb, Math.min(maxDb, dbLevel));
            const ratio = (clampedDb - minDb) / (maxDb - minDb);
            const mappedValue = Math.round(ratio * 1023);

            // Send 'input' event which keys into ComponentMappings
            onComponentEvent(sensor.id, 'input', { value: mappedValue });

            // Also send direct 'set-sound-level' if we want to be explicit, but 'input' is standard
        }
    }, [dbLevel, sensor, onComponentEvent, minDb, maxDb]);

    if (!sensor) return null;

    const pos = layout[sensor.id] || { x: 0, y: 0 };
    const sensorX = pos.x;
    const sensorY = pos.y;

    const overlayWidth = 260; // Increased to lengthen slider
    const overlayHeight = 90;

    return (
        <g transform={`translate(${sensorX + offset.x}, ${sensorY + offset.y})`}>
            <foreignObject width={overlayWidth} height={overlayHeight} style={{ overflow: 'visible' }}>
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
                        <span>{isSmall ? "🎙️ KY-038 (Small)" : "🎤 KY-037 (Big)"}</span>
                        <span className="text-blue-400">{dbLevel} dB</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{minDb}dB</span>
                        <input
                            type="range"
                            min={minDb}
                            max={maxDb}
                            step="1"
                            value={dbLevel}
                            onChange={(e) => setDbLevel(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                        />
                        <span className="text-xs text-zinc-500">{maxDb}dB</span>
                    </div>

                    <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                        <span>Freq: {isSmall ? "100Hz-10kHz" : "50Hz-10kHz"}</span>
                        <span>Sensitivity: {isSmall ? "Low" : "High"}</span>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
