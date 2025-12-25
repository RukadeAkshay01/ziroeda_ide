import React, { useState, useEffect } from 'react';
import { CircuitComponent } from '../../../types';

interface MPU6050OverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const MPU6050Overlay: React.FC<MPU6050OverlayProps> = ({ components, layout, selectedId, onComponentEvent }) => {
    // Find the active MPU6050 sensor
    const mpu = components.find(c => c.id === selectedId && (c.type === 'mpu6050' || c.type === 'wokwi-mpu6050'));

    const [accel, setAccel] = useState({ x: 0, y: 0, z: 1 });
    const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });
    const [temp, setTemp] = useState(24.0);

    useEffect(() => {
        if (mpu && onComponentEvent) {
            onComponentEvent(mpu.id, 'input', {
                accelX: accel.x, accelY: accel.y, accelZ: accel.z,
                gyroX: gyro.x, gyroY: gyro.y, gyroZ: gyro.z,
                temperature: temp
            });
        }
    }, [accel, gyro, temp, mpu, onComponentEvent]);

    if (!mpu) return null;

    const pos = layout[mpu.id] || { x: 0, y: 0 };
    // Position the overlay near the component, but fixed in screen space or relative to component?
    // The PIR overlay is relative to component. Let's do the same but offset it so it doesn't cover the chip.
    // Actually, for complex controls like sliders, a fixed panel might be better, or a floating panel near the component.
    // Let's render it relative to the component for now, offset to the bottom.

    const panelWidth = 320;
    const panelHeight = 200;
    const offsetX = -panelWidth / 2 + 20; // Center horizontally roughly
    const offsetY = 80; // Below the component

    return (
        <g transform={`translate(${pos.x + offsetX}, ${pos.y + offsetY})`}>
            <foreignObject width={panelWidth} height={panelHeight} style={{ overflow: 'visible', pointerEvents: 'auto' }}>
                <div style={{
                    background: 'rgba(30, 30, 30, 0.9)',
                    backdropFilter: 'blur(4px)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    color: '#eee',
                    fontFamily: 'sans-serif',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    userSelect: 'none'
                }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent dragging the canvas
                >
                    <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #555', paddingBottom: '4px' }}>
                        MPU6050 Control
                    </div>

                    {/* Acceleration */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#aaa' }}>Acceleration (g)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 40px', gap: '5px', alignItems: 'center' }}>
                            <label>X:</label>
                            <input type="range" min="-2" max="2" step="0.01" value={accel.x} onChange={e => setAccel({ ...accel, x: parseFloat(e.target.value) })} />
                            <span>{accel.x.toFixed(2)}</span>

                            <label>Y:</label>
                            <input type="range" min="-2" max="2" step="0.01" value={accel.y} onChange={e => setAccel({ ...accel, y: parseFloat(e.target.value) })} />
                            <span>{accel.y.toFixed(2)}</span>

                            <label>Z:</label>
                            <input type="range" min="-2" max="2" step="0.01" value={accel.z} onChange={e => setAccel({ ...accel, z: parseFloat(e.target.value) })} />
                            <span>{accel.z.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Rotation */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#aaa' }}>Rotation (°/s)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 40px', gap: '5px', alignItems: 'center' }}>
                            <label>X:</label>
                            <input type="range" min="-250" max="250" step="1" value={gyro.x} onChange={e => setGyro({ ...gyro, x: parseFloat(e.target.value) })} />
                            <span>{gyro.x}</span>

                            <label>Y:</label>
                            <input type="range" min="-250" max="250" step="1" value={gyro.y} onChange={e => setGyro({ ...gyro, y: parseFloat(e.target.value) })} />
                            <span>{gyro.y}</span>

                            <label>Z:</label>
                            <input type="range" min="-250" max="250" step="1" value={gyro.z} onChange={e => setGyro({ ...gyro, z: parseFloat(e.target.value) })} />
                            <span>{gyro.z}</span>
                        </div>
                    </div>

                    {/* Temperature */}
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#aaa' }}>Temperature (°C)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 40px', gap: '5px', alignItems: 'center' }}>
                            <label>T:</label>
                            <input type="range" min="-40" max="85" step="0.1" value={temp} onChange={e => setTemp(parseFloat(e.target.value))} />
                            <span>{temp.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
