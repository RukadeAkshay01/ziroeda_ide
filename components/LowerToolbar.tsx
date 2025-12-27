
import React from 'react';
import { Undo2, Redo2, Settings2, RotateCw, FlipVertical, FlipHorizontal, Trash2, Scan } from 'lucide-react';

interface LowerToolbarProps {
  selectedComponentId: string | null;
  selectedWireIndex?: string | null;
  isSimulating?: boolean; // Add this
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
  selectedWireIndex,
  isSimulating,
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

  const hasSelection = !!selectedComponentId || !!selectedWireIndex;

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
        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${disabled
          ? 'bg-dark-800/50 text-dark-700 border-transparent cursor-not-allowed'
          : variant === 'danger'
            ? 'bg-dark-800 text-red-500/80 border-dark-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 hover:shadow-red-900/20 hover:-translate-y-0.5'
            : 'bg-dark-800 text-gray-400 border-dark-700 hover:bg-brand-500/10 hover:text-brand-400 hover:border-brand-500/30 hover:shadow-brand-900/20 hover:-translate-y-0.5'
          }`}
        title={label}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${disabled ? 'text-dark-700' : variant === 'danger' ? 'text-red-500/40 group-hover:text-red-500' : 'text-gray-500 group-hover:text-brand-400'
        }`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full h-16 sm:h-20 bg-dark-900 border-t border-dark-700 z-40 flex items-center justify-center">
      <div className="flex items-center justify-around sm:justify-between w-full h-full px-2 sm:px-8">

        <ToolbarButton
          icon={Scan}
          label="Fit"
          onClick={onFitToScreen}
        />

        <div className="hidden sm:block w-px h-8 bg-dark-700 flex-shrink-0 mx-1" />

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

        <div className="hidden sm:block w-px h-8 bg-dark-700 flex-shrink-0 mx-1" />

        <ToolbarButton
          icon={Settings2}
          label="Properties"
          disabled={!selectedComponentId || isSimulating}
          onClick={onProperties}
        />

        <ToolbarButton
          icon={RotateCw}
          label="Rotate"
          disabled={!selectedComponentId || isSimulating}
          onClick={onRotate}
        />

        <ToolbarButton
          icon={FlipVertical}
          label="V-Flip"
          disabled={!selectedComponentId || isSimulating}
          onClick={onFlipVertical}
        />

        <ToolbarButton
          icon={FlipHorizontal}
          label="H-Flip"
          disabled={!selectedComponentId || isSimulating}
          onClick={onFlipHorizontal}
        />

        <div className="hidden sm:block w-px h-8 bg-[#1e2229] flex-shrink-0 mx-1" />

        <ToolbarButton
          icon={Trash2}
          label="Delete"
          variant="danger"
          disabled={!hasSelection || isSimulating}
          onClick={onDelete}
        />

      </div>
    </div>
  );
};

export default LowerToolbar;
