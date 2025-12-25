import React from 'react';
import { CircuitComponent } from '../../../types';
import { DHT22Overlay } from './DHT22Overlay';
import { FlameSensorOverlay } from './FlameSensorOverlay';
import { GasSensorOverlay } from './GasSensorOverlay';
import { HCSR04Overlay } from './HCSR04Overlay';
import { HX711Overlay } from './HX711Overlay';
import { HeartBeatSensorOverlay } from './HeartBeatSensorOverlay';
import { IRReceiverOverlay } from './IRReceiverOverlay';
import { LDROverlay } from './LDROverlay';
import { MPU6050Overlay } from './MPU6050Overlay';
import { MembraneKeypadOverlay } from './MembraneKeypadOverlay';
import { NTCOverlay } from './NTCOverlay';
import { PIROverlay } from './PIROverlay';
import { SoundSensorOverlay } from './SoundSensorOverlay';

import { CircuitSimulator } from '../../../simulator/core/Simulator';
import { SSD1306Overlay } from './SSD1306Overlay';

interface SensorOverlaysProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
    simulator?: CircuitSimulator;
    isSimulating?: boolean;
}

export const SensorOverlays: React.FC<SensorOverlaysProps> = (props) => {
    // We render ALL applicable overlays. 
    // Each overlay is responsible for checking if its specific component exists/is selected 
    // or if it should always be visible (depending on design).
    // Based on DHT22Overlay, it checks for 'selectedId'.

    // Only show overlays if simulation is running
    if (!props.isSimulating) return null;

    return (
        <>
            {/* SVG Overlays Container */}
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    pointerEvents: 'none'
                }}
            >
                <DHT22Overlay {...props} />
                <FlameSensorOverlay {...props} />
                <GasSensorOverlay {...props} />
                <HCSR04Overlay {...props} />
                <HX711Overlay {...props} />
                <HeartBeatSensorOverlay {...props} />
                <IRReceiverOverlay {...props} />
                <LDROverlay {...props} />
                <MPU6050Overlay {...props} />
                <NTCOverlay {...props} />
                <PIROverlay {...props} />
                <SoundSensorOverlay {...props} />
            </svg>

            {/* HTML Overlays */}
            <SSD1306Overlay {...props} />
            <MembraneKeypadOverlay {...props} />
        </>
    );
};
