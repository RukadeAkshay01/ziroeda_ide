import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface GasSensorOverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const GasSensorOverlay: React.FC<GasSensorOverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    const sensor = components.find(c => c.id === selectedId && (c.type === 'gas_sensor' || c.type === 'wokwi-gas-sensor'));

    // Drag state
    const [offset, setOffset] = useState({ x: 0, y: -100 });
    const [isDragging, setIsDragging] = useState(false);

    // Simulation state
    // We store the internal slider value (0-100) for smooth logarithmic feeling
    const [sliderVal, setSliderVal] = useState(() => {
        // Initial PPM 100 -> Log 2. 
        // Range -1 to 5 (span 6).
        // -1 + (val/100)*6 = 2 => (val/100)*6 = 3 => val/100 = 0.5 => val = 50.
        return 50;
    });

    // Calculate actual PPM from slider value
    // Log range: -1 (0.1) to 5 (100,000)
    // Formula: logVal = -1 + (sliderVal / 100) * 6
    // PPM = 10^logVal
    const logVal = -1 + (sliderVal / 100) * 6;
    const ppm = Math.pow(10, logVal);

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
        if (sensor && onComponentEvent) {
            onComponentEvent(sensor.id, 'input', { value: ppm });
        }
    }, [ppm, sensor, onComponentEvent]);

    if (!sensor) return null;

    const pos = layout[sensor.id] || { x: 0, y: 0 };
    const sensorX = pos.x;
    const sensorY = pos.y;

    const overlayWidth = 300;
    const overlayHeight = 90;

    // Formatting for display
    let displayPpm = ppm < 10 ? ppm.toFixed(2) : Math.round(ppm).toString();
    if (ppm >= 1000) {
        displayPpm = (ppm / 1000).toFixed(1) + 'k';
    }

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
                        <span>🧪 Gas Sensor</span>
                        <span className="text-emerald-400">{displayPpm} PPM</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-lg">🍃</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={sliderVal}
                            onChange={(e) => setSliderVal(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                        />
                        <span className="text-lg">☠️</span>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
