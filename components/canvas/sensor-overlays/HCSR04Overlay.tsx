import React, { useState, useEffect, useRef } from 'react';
import { CircuitComponent } from '../../../types';

interface HCSR04OverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const HCSR04Overlay: React.FC<HCSR04OverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    const [targetPos, setTargetPos] = useState({ x: 0, y: -100 }); // Start at 100cm
    const [isDragging, setIsDragging] = useState(false);
    const lastDistanceRef = useRef<number>(100);

    // Find the active HC-SR04 sensor
    const sensor = components.find(c => c.id === selectedId && (c.type === 'hc_sr04' || c.type === 'wokwi-hc-sr04'));

    useEffect(() => {
        // Reset target position when selection changes
        if (sensor) {
            setTargetPos({ x: 0, y: -100 });
            lastDistanceRef.current = 100;
        }
    }, [sensor?.id]);

    // Window event listeners for smooth dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const scale = 1 / zoom;
            setTargetPos(prev => ({
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

    // Update distance whenever position changes
    useEffect(() => {
        if (!sensor || !onComponentEvent) return;
        updateDistance();
    }, [targetPos]);

    if (!sensor) return null;

    // HC-SR04 Parameters
    const maxRange = 400;
    const minRange = 2; // Physical min
    const innerRange = 20; // Visual blind spot for style (slightly exaggerated)
    const angle = 60; // Degrees (Visual cone angle)

    const pos = layout[sensor.id] || { x: 0, y: 0 };
    const sensorX = pos.x;
    const sensorY = pos.y;
    const rotation = sensor.rotation || 0;

    // Convert polar to cartesian for cone drawing
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const startAngle = -90 - angle / 2;
    const endAngle = -90 + angle / 2;

    // Outer Arc Points
    const p1Outer = {
        x: maxRange * Math.cos(toRad(startAngle)),
        y: maxRange * Math.sin(toRad(startAngle))
    };
    const p2Outer = {
        x: maxRange * Math.cos(toRad(endAngle)),
        y: maxRange * Math.sin(toRad(endAngle))
    };

    // Inner Arc Points
    const p1Inner = {
        x: innerRange * Math.cos(toRad(startAngle)),
        y: innerRange * Math.sin(toRad(startAngle))
    };
    const p2Inner = {
        x: innerRange * Math.cos(toRad(endAngle)),
        y: innerRange * Math.sin(toRad(endAngle))
    };

    // SVG Path: Inner Start -> Outer Start -> Outer Arc -> Outer End -> Inner End -> Inner Arc -> Close
    const pathData = `
        M ${p1Inner.x} ${p1Inner.y}
        L ${p1Outer.x} ${p1Outer.y}
        A ${maxRange} ${maxRange} 0 0 1 ${p2Outer.x} ${p2Outer.y}
        L ${p2Inner.x} ${p2Inner.y}
        A ${innerRange} ${innerRange} 0 0 0 ${p1Inner.x} ${p1Inner.y}
        Z
    `;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
    };

    const updateDistance = () => {
        if (!sensor || !onComponentEvent) return;

        // Calculate distance from sensor (0,0) to target
        let dist = Math.sqrt(targetPos.x * targetPos.x + targetPos.y * targetPos.y);

        // Clamp distance
        dist = Math.max(minRange, Math.min(maxRange, dist));

        // Check if target is within the cone angle?
        let angleDeg = Math.atan2(targetPos.y, targetPos.x) * (180 / Math.PI);
        let diff = angleDeg - (-90);
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;

        const isInsideCone = Math.abs(diff) <= angle / 2 && dist <= maxRange && dist >= innerRange;

        // If outside cone, simulate no echo (max range usually)
        let finalDist = dist;
        if (!isInsideCone) {
            finalDist = maxRange;
        }

        if (Math.abs(finalDist - lastDistanceRef.current) > 0.1) {
            lastDistanceRef.current = finalDist;
            onComponentEvent(sensor.id, 'input', { value: Math.round(finalDist) });
        }
    };

    const currentDist = Math.sqrt(targetPos.x * targetPos.x + targetPos.y * targetPos.y);
    const displayDist = Math.max(minRange, Math.min(maxRange, currentDist));
    const displayInches = (displayDist / 2.54).toFixed(1);

    // Calculate text position (midpoint of line from sensor to target)
    const textPos = {
        x: targetPos.x / 2,
        y: targetPos.y / 2
    };

    // Offset to center the cone (assuming (0,0) is the left transducer/edge)
    // HC-SR04 width is 46px. Half width is 23px.
    const centerOffset = 85;

    return (
        <g
            transform={`translate(${sensorX}, ${sensorY}) rotate(${rotation}) translate(${centerOffset}, 10)`}
            style={{ pointerEvents: 'none' }}
        >
            {/* Field of View Cone */}
            <path
                d={pathData}
                fill="rgba(0, 255, 255, 0.1)"
                stroke="rgba(0, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="5,5"
                style={{ pointerEvents: 'none' }}
            />

            {/* Distance Line */}
            <line
                x1="0" y1="0"
                x2={targetPos.x} y2={targetPos.y}
                stroke="rgba(0, 255, 255, 0.5)"
                strokeDasharray="4 4"
            />

            {/* Distance Text */}
            <g transform={`translate(${textPos.x}, ${textPos.y})`}>
                {/* Rotate text to be readable or aligned with line? Let's keep it horizontal for readability, but we need to counter-rotate if parent is rotated. 
                    Actually, the parent <g> is rotated. So text will be rotated. 
                    To keep text horizontal, we would need to rotate it by -rotation.
                 */}
                <text
                    y="-5"
                    fill="#00ffff"
                    fontSize="12"
                    textAnchor="middle"
                    style={{ textShadow: '0px 1px 2px black' }}
                    transform={`rotate(${-rotation})`}
                >
                    {displayInches}in / {displayDist.toFixed(1)}cm
                </text>
            </g>

            {/* Draggable Target */}
            <g
                transform={`translate(${targetPos.x}, ${targetPos.y})`}
                style={{ pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
            >
                <circle r="10" fill="#00bcd4" stroke="white" strokeWidth="2" />
            </g>
        </g>
    );
};
