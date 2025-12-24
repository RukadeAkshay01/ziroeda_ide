
import React, { useId } from 'react';

export const ZiroedaLogo = ({ className, noGlow = false }: { className?: string, noGlow?: boolean }) => {
    const id = useId();
    return (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`overflow-visible ${className || 'w-8 h-8'}`}>
            <defs>
                {!noGlow && (
                    <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                )}
            </defs>

            {/* Connecting Line (Right Side) */}
            <line x1="95" y1="50" x2="140" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round" />

            {/* Main Circle Container */}
            <circle cx="50" cy="50" r="45" fill="#18181b" stroke="white" strokeWidth="4" />

            {/* Teal Accent (Bottom Left Curve) */}
            <path
                d="M 15 70 A 40 40 0 0 0 50 89"
                stroke="#14b8a6"
                strokeWidth="5"
                strokeLinecap="round"
                style={!noGlow ? { filter: `url(#glow-${id})` } : {}}
            />

            {/* Z Letter (Bold, Sans-Serif) */}
            <path
                d="M 35 35 H 65 L 35 65 H 65"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="square"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ZiroedaLogo;
