import React, { useEffect, useState } from 'react';
import { CircuitComponent } from '../../../types';

interface FlameSensorOverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const FlameSensorOverlay: React.FC<FlameSensorOverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    const sensor = components.find(c => c.id === selectedId && (c.type === 'flame_sensor' || c.type === 'wokwi-flame-sensor'));

    // Default start position
    const [offset, setOffset] = useState({ x: 0, y: -120 });
    const [isDragging, setIsDragging] = useState(false);

    // Constants from User Request
    const SENSOR_RADIUS = 30; // approx px radius of sensor "head"
    const MAX_DISTANCE_PX = 200; // mapped to 100cm roughly
    const DETECTION_THRESHOLD = 60; // Slightly larger than radius

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

    // Calculation Logic
    // Sensor "Center" is roughly (20, 7) relative to component
    const centerX = -20;
    const centerY = -2;
    const dx = offset.x - centerX;
    const dy = offset.y - centerY;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    // Logic from user's script
    // cmDistance = Math.max(0, (pixelDistance - sensorRadius) / 160 * 100);
    const cmDistance = Math.max(0, Math.round((pixelDistance - 30) / (MAX_DISTANCE_PX * 0.8) * 100));

    const isDetected = pixelDistance < DETECTION_THRESHOLD;
    const isWarning = !isDetected && pixelDistance < (DETECTION_THRESHOLD + 50);

    // IR Intensity (0-100%)
    const irIntensityPercent = Math.max(0, Math.min(100, 100 - (pixelDistance / MAX_DISTANCE_PX * 100)));

    // Analog Value (0-1023) - Inverted logic usually? 
    // User script: analogValue = Math.round((irIntensityPercent / 100) * 1023);
    // Usually Flame Sensor: High IR -> Low Resistance -> Low Voltage (if pull-up) or High Voltage?
    // Reviewing ComponentMappings: 
    //   Flame Detected (Close) -> Analog 0.5V (Low), DOUT=False (Low)
    //   No Flame (Far) -> Analog 4.5V (High), DOUT=True (High)
    // So Higher Intensity = Lower Value.
    // User's script shows Analog Output increasing with intensity? 
    // "analogValue = Math.round((irIntensityPercent / 100) * 1023);" -> High Int = High Value.
    // This contradicts standard KY-026 behavior (Active Low).
    // I will stick to the standard KY-026 behavior (Inverse) for the SIMULATOR EVENT, 
    // but I can display the "IR Intensity" as High in the UI.

    // Mapping for Simulator (KY-026 Standard)
    // Intensity 100% -> Voltage 0V
    // Intensity 0% -> Voltage 5V
    const simVoltage = 5 * (1 - (irIntensityPercent / 100));

    useEffect(() => {
        if (!sensor || !onComponentEvent) return;

        // Send continuous updates for Analog Precision
        // We use a custom event or piggyback on mousedown/up if the mapping supports it.
        // For now, let's send a generic 'sensor-update' that ComponentMappings can listen to, 
        // OR just keep firing 'mousedown' (Detect) / 'mouseup' (Safe) but with voltage data.

        // Actually, easiest is to just send the data on every change.
        // We need to match what ComponentMappings expects. I will update ComponentMappings to handle 'value-change' or similar.
        // Let's stick to the existing events but add a payload.

        const payload = { voltage: simVoltage, analogValue: Math.round((irIntensityPercent / 100) * 1023) };

        if (isDetected) {
            onComponentEvent(sensor.id, 'mousedown', payload);
        } else {
            // Even if not detected (digital high), analog value changes with distance
            onComponentEvent(sensor.id, 'mouseup', payload);
        }

    }, [isDetected, sensor, onComponentEvent, simVoltage, irIntensityPercent]);


    if (!sensor) return null;

    const pos = layout[sensor.id] || { x: 0, y: 0 };

    // Status Colors
    let statusColor = '#32b8c6'; // Safe (Blue/Cyan)
    let statusText = 'SAFE';
    if (isDetected) {
        statusColor = '#ff4444'; // Detected (Red)
        statusText = 'DETECTED';
    } else if (isWarning) {
        statusColor = '#ffc864'; // Warning (Yellow)
        statusText = 'APPROACHING';
    }

    return (
        <g transform={`translate(${pos.x}, ${pos.y})`}>
            {/* Definitions for Gradients */}
            <defs>
                <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#ff4500', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#ffa500', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ffff00', stopOpacity: 1 }} />
                </linearGradient>
            </defs>

            {/* Detection Zone (Visual) */}
            <circle
                cx={centerX} cy={centerY} r={DETECTION_THRESHOLD}
                fill={isDetected ? "rgba(255, 68, 68, 0.1)" : "transparent"}
                stroke={statusColor}
                strokeWidth={isDetected ? 2 : 1}
                strokeDasharray="4 2"
                style={{ pointerEvents: 'none', transition: 'all 0.3s ease' }}
            />

            {/* Warning Zone (Visual) */}
            <circle
                cx={centerX} cy={centerY} r={DETECTION_THRESHOLD + 50}
                fill="none"
                stroke={statusColor}
                strokeWidth={0.5}
                strokeOpacity={0.3}
                style={{ pointerEvents: 'none', transition: 'all 0.3s ease' }}
            />

            {/* HUD / Info Panel (Fixed above sensor) */}
            <foreignObject x={-290} y={-100} width={160} height={90} style={{ pointerEvents: 'none' }}>
                <div className="flex flex-col gap-1 p-2 rounded-lg border backdrop-blur-md shadow-lg transition-colors duration-300"
                    style={{
                        backgroundColor: 'rgba(15, 15, 35, 0.85)',
                        borderColor: statusColor,
                        fontFamily: 'monospace'
                    }}>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
                        <span style={{ color: statusColor, fontWeight: 'bold', fontSize: '10px' }}>{statusText}</span>
                        <span className="text-[10px] text-gray-400">{Math.round(cmDistance)}cm</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
                        <div className="text-gray-500">DIGITAL</div>
                        <div style={{ color: isDetected ? '#ff4444' : '#32b8c6', fontWeight: 'bold' }}>
                            {isDetected ? 'LOW' : 'HIGH'}
                        </div>

                        <div className="text-gray-500">ANALOG</div>
                        <div className="text-white font-bold">
                            {/* Display raw 0-1023 value (inverted logic for UI to match intensity usually, 
                                but mimicking user's code: High Intensity = High Value) */}
                            {Math.round((irIntensityPercent / 100) * 1023)}
                        </div>

                        <div className="text-gray-500">INTENSITY</div>
                        <div className="text-white">
                            {Math.round(irIntensityPercent)}%
                        </div>
                    </div>
                </div>
            </foreignObject>

            {/* The Draggable Flame (SVG) */}
            <g
                transform={`translate(${offset.x}, ${offset.y})`}
                style={{ cursor: isDragging ? 'none' : 'grab', pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsDragging(true);
                }}
            >
                {/* Center the flame SVG on the coordinate */}
                <g transform="translate(-17, -25) scale(0.5)">
                    <svg width="70" height="100" viewBox="0 0 70 100" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 8px rgba(255,100,0,0.6))' }}>
                        {/* Main flame body */}
                        <path d="M 35 5 Q 20 25 18 45 Q 15 65 35 95 Q 55 65 52 45 Q 50 25 35 5 Z" fill="url(#flameGradient)" />
                        {/* Inner bright part */}
                        <path d="M 35 15 Q 25 30 24 45 Q 23 55 35 85 Q 47 55 46 45 Q 45 30 35 15 Z" fill="#ffff00" opacity="0.6" />
                    </svg>
                </g>

                {/* Distance Label (visible when dragging) */}
                <foreignObject x={-20} y={30} width={40} height={20} style={{ pointerEvents: 'none', opacity: isDragging ? 1 : 0 }}>
                    <div className="bg-black/50 text-white text-[9px] px-1 rounded text-center backdrop-blur">
                        {Math.round(pixelDistance)}px
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};
