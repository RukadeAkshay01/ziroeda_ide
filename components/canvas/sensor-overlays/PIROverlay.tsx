import React, { useState, useEffect, useRef } from 'react';
import { CircuitComponent } from '../../../types';

interface PIROverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const PIROverlay: React.FC<PIROverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    const [targetPos, setTargetPos] = useState({ x: 0, y: -150 }); // Start further out
    const [isDragging, setIsDragging] = useState(false);
    const lastTriggerRef = useRef<boolean>(false);

    // Find the active PIR sensor
    const pir = components.find(c => c.id === selectedId && (c.type === 'pir' || c.type === 'wokwi-pir-motion-sensor'));

    useEffect(() => {
        // Reset target position when selection changes
        if (pir) {
            setTargetPos({ x: 0, y: -150 });
            lastTriggerRef.current = false;
        }
    }, [pir?.id]);

    const lastTouchPosRef = useRef({ x: 0, y: 0 });

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

        const handleWindowTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches[0];
            const dx = touch.clientX - lastTouchPosRef.current.x;
            const dy = touch.clientY - lastTouchPosRef.current.y;
            lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

            const scale = 1 / zoom;
            setTargetPos(prev => ({
                x: prev.x + dx * scale,
                y: prev.y + dy * scale
            }));
        };

        const handleEnd = () => {
            setIsDragging(false);
            if (onComponentEvent && pir) {
                onComponentEvent(pir.id, 'input', { value: false });
                lastTriggerRef.current = false;
            }
        };

        const handleWindowMouseUp = handleEnd;
        const handleWindowTouchEnd = handleEnd;

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
        window.addEventListener('touchend', handleWindowTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
            window.removeEventListener('touchmove', handleWindowTouchMove);
            window.removeEventListener('touchend', handleWindowTouchEnd);
        };
    }, [isDragging, zoom, pir, onComponentEvent]);

    // Check detection whenever position changes
    useEffect(() => {
        if (!pir || !onComponentEvent) return;
        checkDetection();
    }, [targetPos]);

    if (!pir) return null;

    // PIR Parameters
    const range = 250;
    const innerRange = 40; // Blind spot near sensor
    const angle = 100; // Degrees
    const pos = layout[pir.id] || { x: 0, y: 0 };
    const sensorX = pos.x;
    const sensorY = pos.y;
    const rotation = pir.rotation || 0;

    // Convert polar to cartesian for cone drawing
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const startAngle = -90 - angle / 2;
    const endAngle = -90 + angle / 2;

    // Outer Arc Points
    const p1Outer = {
        x: range * Math.cos(toRad(startAngle)),
        y: range * Math.sin(toRad(startAngle))
    };
    const p2Outer = {
        x: range * Math.cos(toRad(endAngle)),
        y: range * Math.sin(toRad(endAngle))
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
        A ${range} ${range} 0 0 1 ${p2Outer.x} ${p2Outer.y}
        L ${p2Inner.x} ${p2Inner.y}
        A ${innerRange} ${innerRange} 0 0 0 ${p1Inner.x} ${p1Inner.y}
        Z
    `;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
        lastTouchPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const checkDetection = () => {
        if (!pir || !onComponentEvent) return;

        // 1. Check distance (Min and Max)
        const dist = Math.sqrt(targetPos.x * targetPos.x + targetPos.y * targetPos.y);
        if (dist > range || dist < innerRange) {
            updateTrigger(false);
            return;
        }

        // 2. Check angle
        let angleDeg = Math.atan2(targetPos.y, targetPos.x) * (180 / Math.PI);
        let diff = angleDeg - (-90);
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;

        if (Math.abs(diff) <= angle / 2) {
            updateTrigger(true);
        } else {
            updateTrigger(false);
        }
    };

    const updateTrigger = (isDetected: boolean) => {
        if (lastTriggerRef.current !== isDetected) {
            lastTriggerRef.current = isDetected;
            onComponentEvent?.(pir.id, 'input', { value: isDetected });
        }
    };

    // Center offset to align cone with the sensor dome (approx middle of 30x30 component)
    const centerX = 45;
    const centerY = 15;

    return (
        <g
            transform={`translate(${sensorX}, ${sensorY}) rotate(${rotation}) translate(${centerX}, ${centerY})`}
            style={{ pointerEvents: 'none' }}
        >
            {/* Field of View Cone */}
            <path
                d={pathData}
                fill="rgba(0, 255, 0, 0.1)"
                stroke="rgba(0, 255, 0, 0.3)"
                strokeWidth="1"
                strokeDasharray="5,5"
            />

            {/* Draggable Target */}
            <g
                transform={`translate(${targetPos.x}, ${targetPos.y})`}
                style={{ pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Target Visual - Increased Size for Mobile */}
                <circle r="25" fill="#007bff" stroke="white" strokeWidth="2" />

                {/* Pulse effect if active */}
                {lastTriggerRef.current && (
                    <circle r="30" fill="none" stroke="#007bff" strokeWidth="1" opacity="0.5">
                        <animate attributeName="r" from="25" to="45" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0" dur="1s" repeatCount="indefinite" />
                    </circle>
                )}
            </g>
        </g>
    );
};
