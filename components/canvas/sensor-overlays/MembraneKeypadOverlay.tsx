import React from 'react';
import { CircuitComponent } from '../../../types';

interface MembraneKeypadOverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const MembraneKeypadOverlay: React.FC<MembraneKeypadOverlayProps> = ({ components, layout, selectedId, zoom, onComponentEvent }) => {
    // User requested to use native Wokwi component interactivity.
    // We return null here to remove the custom overlay and allow direct interaction
    // with the underlying wokwi-membrane-keypad element.
    return null;
};
