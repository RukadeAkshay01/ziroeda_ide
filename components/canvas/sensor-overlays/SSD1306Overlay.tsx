import React, { useEffect, useRef } from 'react';
import { CircuitComponent } from '../../../types';
import { CircuitSimulator } from '../../../simulator/core/Simulator';

interface SSD1306OverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    simulator?: CircuitSimulator;
}

export const SSD1306Overlay: React.FC<SSD1306OverlayProps> = ({ components, layout, simulator }) => {
    const oled = components.find(c => c.type === 'oled-ssd1306' || c.type === 'wokwi-ssd1306');
    const pos = oled ? layout[oled.id] : null;

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Render Loop
    useEffect(() => {
        if (!oled || !simulator || !simulator.ssd1306) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // OLED Dimensions (128x64)
        // Wokwi Scaling: The wokwi-oled-ssd1306 element is usually scaled.
        // We need to verify internal dimensions vs display size.
        // Assuming 1:1 pixel mapping for now.

        let animationFrameId: number;

        const render = () => {
            // Check if buffer exists
            if (simulator.ssd1306 && simulator.ssd1306.buffer) {
                const buffer = simulator.ssd1306.buffer;
                const imgData = ctx.createImageData(128, 64);
                const data = imgData.data;

                // Buffer: 1024 bytes. 
                // Each byte i represents a column (i % 128) and a page (i / 128). 
                // Page 0 = Rows 0-7, Page 1 = Rows 8-15...

                // Iterate through pages (0-7)
                for (let page = 0; page < 8; page++) {
                    for (let col = 0; col < 128; col++) {
                        const byteIndex = page * 128 + col;
                        const byte = buffer[byteIndex];

                        // Iterate through bits in the byte (8 rows)
                        for (let bit = 0; bit < 8; bit++) {
                            const pixelOn = (byte & (1 << bit)) !== 0;
                            const x = col;
                            const y = page * 8 + bit;

                            // Set Pixel (RGBA)
                            const index = (y * 128 + x) * 4;
                            if (pixelOn) {
                                // Light Blue / White (OLED Color)
                                data[index] = 0xAF;     // R
                                data[index + 1] = 0xDE; // G
                                data[index + 2] = 0xFF; // B
                                data[index + 3] = 255;  // Alpha
                            } else {
                                // Transparent or Black?
                                // Transparent allows seeing the PCB behind? 
                                // Usually OLED Glass is black.
                                data[index] = 0x10;
                                data[index + 1] = 0x10;
                                data[index + 2] = 0x10;
                                data[index + 3] = 255;
                            }
                        }
                    }
                }
                ctx.putImageData(imgData, 0, 0);
            }
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [oled, simulator]);

    if (!oled || !pos) return null;

    // Adjust position to align with the screen area of stored image/element
    // The OLED module usually has a PCB border.
    // Screen offset (approx): x: ??, y: ??
    // Need to fine-tune this. centering for now.

    // Width: 128px, Height: 64px (scaled if needed)

    return (
        <div
            style={{
                position: 'absolute',
                left: pos.x - 40, // Centering (80/2 = 40)
                top: pos.y - 40,
                width: 80,
                height: 80,
                pointerEvents: 'none',
                zIndex: 10
            }}
        >
            {/* 
                 The OLED screen itself is smaller than the module. 
                 Let's assume standard 0.96" I2C module.
                 Screen is roughly 25x15mm relative to the board.
                 We render the canvas "on top".
             */}
            <canvas
                ref={canvasRef}
                width={128}
                height={64}
                style={{
                    width: '100%', // Stretch to fit container? No, 128x64 is aspect ratio 2:1
                    height: 'auto',
                    imageRendering: 'pixelated',
                    position: 'absolute',
                    top: '25%', // Guessing visual alignment
                    left: '5%'
                }}
            />
        </div>
    );
};
