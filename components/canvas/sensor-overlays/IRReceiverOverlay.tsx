import React from 'react';
import { CircuitComponent } from '../../../types';

interface IRReceiverOverlayProps {
    components: CircuitComponent[];
    layout: Record<string, { x: number; y: number }>;
    selectedId: string | null;
    zoom: number;
    onComponentEvent?: (id: string, name: string, detail: any) => void;
}

export const IRReceiverOverlay: React.FC<IRReceiverOverlayProps> = ({ components, layout, selectedId, onComponentEvent }) => {
    const receiver = components.find(c => c.id === selectedId && c.type === 'wokwi-ir-receiver');

    if (!receiver) return null;

    const pos = layout[receiver.id] || { x: 0, y: 0 };

    // Standard "Car MP3" Remote Codes (NEC)
    const codes: Record<string, number> = {
        'POWER': 0xFFA25D, 'MENU': 0xFFE21D, 'TEST': 0xFF22DD,
        '+': 0xFF02FD, 'BACK': 0xFFC23D, 'PREV': 0xFFE01F,
        'PLAY': 0xFFA857, 'NEXT': 0xFF906F, '0': 0xFF6897,
        '-': 0xFF9867, 'C': 0xFFB04F, '1': 0xFF30CF,
        '2': 0xFF18E7, '3': 0xFF7A85, '4': 0xFF10EF,
        '5': 0xFF38C7, '6': 0xFF5AA5, '7': 0xFF42BD,
        '8': 0xFF4AB5, '9': 0xFF52AD
    };

    const handleBtnClick = (label: string) => {
        if (onComponentEvent) {
            onComponentEvent(receiver.id, 'remote-button', { code: codes[label] });
        }
    };

    const btnStyle: React.CSSProperties = {
        width: '30px', height: '30px', borderRadius: '50%', border: 'none',
        background: '#444', color: 'white', fontSize: '10px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
    };

    const redBtnStyle: React.CSSProperties = { ...btnStyle, background: '#d32f2f' };

    return (
        <g transform={`translate(${pos.x + 40}, ${pos.y - 230})`}>
            <foreignObject width={140} height={220} style={{ overflow: 'visible' }}>
                <div style={{
                    background: '#222',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #555',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center',
                    userSelect: 'none'
                }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }}>NEC Remote</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <button style={redBtnStyle} onClick={() => handleBtnClick('POWER')}>PWR</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('MENU')}>M</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('TEST')}>T</button>

                        <button style={btnStyle} onClick={() => handleBtnClick('+')}>+</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('BACK')}>{'<'}</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('PREV')}>{'<<'}</button>

                        <button style={btnStyle} onClick={() => handleBtnClick('PLAY')}>{'|>'}</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('NEXT')}>{'>>'}</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('-')}>-</button>

                        <button style={btnStyle} onClick={() => handleBtnClick('0')}>0</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('C')}>C</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('1')}>1</button>

                        <button style={btnStyle} onClick={() => handleBtnClick('2')}>2</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('3')}>3</button>
                        <button style={btnStyle} onClick={() => handleBtnClick('4')}>4</button>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};
