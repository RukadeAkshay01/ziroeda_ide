
import React, { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal, Save } from 'lucide-react';
import { CircuitComponent } from '../types';

interface PropertiesPanelProps {
  component: CircuitComponent;
  onUpdate: (id: string, updates: Partial<CircuitComponent>) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ component, onUpdate, onClose }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  // Local state for form fields
  const [label, setLabel] = useState(component.label || '');
  const [attributes, setAttributes] = useState<Record<string, any>>({ ...component.attributes });

  // Update local state when selected component changes
  useEffect(() => {
    setLabel(component.label || '');
    setAttributes({ ...component.attributes });
  }, [component.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSave = () => {
    onUpdate(component.id, {
      label,
      attributes: { ...attributes }
    });
    // Optional: Auto close or keep open? Keeping open allows tweaking.
  };

  // Helper to detect commonly used attributes based on component type
  const getRelevantAttributes = () => {
    const attrs = [];
    
    if (component.type.includes('resistor')) {
      attrs.push({ key: 'value', label: 'Resistance (Ω)', type: 'text', placeholder: '1000' });
    }
    if (component.type.includes('led')) {
      attrs.push({ key: 'color', label: 'Color', type: 'select', options: ['red', 'green', 'blue', 'yellow', 'white', 'orange'] });
      attrs.push({ key: 'flip', label: 'Flip', type: 'boolean' }); // Legacy support
    }
    if (component.type.includes('pushbutton')) {
      attrs.push({ key: 'bounce', label: 'Bounce (ms)', type: 'boolean' });
      attrs.push({ key: 'color', label: 'Cap Color', type: 'select', options: ['red', 'green', 'blue', 'yellow', 'black', 'white'] });
    }
    
    // Generic Color for others
    if (!component.type.includes('led') && !component.type.includes('pushbutton')) {
       // Check if it already has a color attribute
       if (attributes.color !== undefined) {
         attrs.push({ key: 'color', label: 'Color', type: 'text' });
       }
    }

    return attrs;
  };

  const relevantAttrs = getRelevantAttributes();

  return (
    <div 
      className="fixed z-50 w-72 bg-[#13161c] border border-[#2d3748] rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div 
        className="h-9 bg-[#1a1d24] border-b border-[#2d3748] flex items-center justify-between px-3 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-[#cbd5e0]">
          <GripHorizontal className="w-4 h-4 text-[#4a5568]" />
          <span className="text-xs font-bold uppercase tracking-wide">Properties</span>
        </div>
        <button onClick={onClose} className="text-[#4a5568] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#4a5568] uppercase">Label</label>
          <input 
            type="text" 
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-[#0b0d11] border border-[#2d3748] rounded px-2 py-1.5 text-xs text-cyan-300 focus:border-cyan-500/50 outline-none"
            placeholder="Component Label"
          />
        </div>

        {relevantAttrs.map((attr) => (
          <div key={attr.key} className="space-y-1">
            <label className="text-[10px] font-bold text-[#4a5568] uppercase">{attr.label}</label>
            
            {attr.type === 'select' ? (
              <select
                value={attributes[attr.key] || ''}
                onChange={(e) => setAttributes({...attributes, [attr.key]: e.target.value})}
                className="w-full bg-[#0b0d11] border border-[#2d3748] rounded px-2 py-1.5 text-xs text-[#cbd5e0] focus:border-cyan-500/50 outline-none"
              >
                {attr.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : attr.type === 'boolean' ? (
               <div className="flex items-center gap-2">
                 <input 
                    type="checkbox"
                    checked={!!attributes[attr.key]}
                    onChange={(e) => setAttributes({...attributes, [attr.key]: e.target.checked})}
                    className="rounded bg-[#0b0d11] border-[#2d3748]"
                 />
                 <span className="text-xs text-[#cbd5e0]">Enabled</span>
               </div>
            ) : (
              <input 
                type="text" 
                value={attributes[attr.key] || ''}
                onChange={(e) => setAttributes({...attributes, [attr.key]: e.target.value})}
                className="w-full bg-[#0b0d11] border border-[#2d3748] rounded px-2 py-1.5 text-xs text-[#cbd5e0] focus:border-cyan-500/50 outline-none"
                placeholder={attr.placeholder}
              />
            )}
          </div>
        ))}
        
        {/* Helper text if no specific attributes found */}
        {relevantAttrs.length === 0 && (
          <p className="text-[10px] text-[#4a5568] italic">No specific editable properties for this component type.</p>
        )}

      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#2d3748] bg-[#1a1d24]">
        <button 
          onClick={handleSave}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Apply Changes
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
