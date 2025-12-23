
import React from 'react';
import { Undo2, Redo2, Settings2, RotateCw, FlipVertical, FlipHorizontal, Trash2, Scan } from 'lucide-react';

interface LowerToolbarProps {
  selectedComponentId: string | null;
  onDelete: () => void;
  onRotate: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onProperties: () => void;
  onFitToScreen: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const LowerToolbar: React.FC<LowerToolbarProps> = ({ 
  selectedComponentId,
  onDelete,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onUndo,
  onRedo,
  onProperties,
  onFitToScreen,
  canUndo,
  canRedo
}) => {
  
  const hasSelection = !!selectedComponentId;

  const ToolbarButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    disabled = false,
    variant = 'default' 
  }: { 
    icon: any, 
    label: string, 
    onClick?: () => void, 
    disabled?: boolean,
    variant?: 'default' | 'danger'
  }) => (
    <div className="flex flex-col items-center justify-center gap-1 group min-w-0 sm:min-w-[3.5rem]">
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${
          disabled 
            ? 'bg-[#1a1d24]/50 text-[#2d3748] border-transparent cursor-not-allowed'
            : variant === 'danger'
              ? 'bg-[#1a1d24] text-red-500/80 border-[#2d3748] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 hover:shadow-red-900/20 hover:-translate-y-0.5'
              : 'bg-[#1a1d24] text-[#a0aec0] border-[#2d3748] hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 hover:shadow-cyan-900/20 hover:-translate-y-0.5'
        }`}
        title={label}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
        disabled ? 'text-[#2d3748]' : variant === 'danger' ? 'text-red-500/40 group-hover:text-red-500' : 'text-[#4a5568] group-hover:text-cyan-400'
      }`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full h-16 sm:h-20 bg-[#0f1115] border-t border-[#1e2229] z-40 flex items-center justify-center">
      <div className="flex items-center justify-around sm:justify-between w-full h-full px-2 sm:px-8">
        
        <ToolbarButton 
          icon={Scan} 
          label="Fit" 
          onClick={onFitToScreen} 
        />

        <div className="hidden sm:block w-px h-8 bg-[#1e2229] flex-shrink-0 mx-1" />
        
        <ToolbarButton 
          icon={Undo2} 
          label="Undo" 
          onClick={onUndo} 
          disabled={!canUndo}
        />
        
        <ToolbarButton 
          icon={Redo2} 
          label="Redo" 
          onClick={onRedo} 
          disabled={!canRedo}
        />

        <div className="hidden sm:block w-px h-8 bg-[#1e2229] flex-shrink-0 mx-1" />

        <ToolbarButton 
          icon={Settings2} 
          label="Properties" 
          disabled={!hasSelection}
          onClick={onProperties}
        />
        
        <ToolbarButton 
          icon={RotateCw} 
          label="Rotate" 
          disabled={!hasSelection}
          onClick={onRotate}
        />
        
        <ToolbarButton 
          icon={FlipVertical} 
          label="V-Flip" 
          disabled={!hasSelection}
          onClick={onFlipVertical}
        />
        
        <ToolbarButton 
          icon={FlipHorizontal} 
          label="H-Flip" 
          disabled={!hasSelection}
          onClick={onFlipHorizontal}
        />

        <div className="hidden sm:block w-px h-8 bg-[#1e2229] flex-shrink-0 mx-1" />

        <ToolbarButton 
          icon={Trash2} 
          label="Delete" 
          variant="danger" 
          disabled={!hasSelection}
          onClick={onDelete}
        />

      </div>
    </div>
  );
};

export default LowerToolbar;
