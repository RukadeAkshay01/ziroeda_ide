
import React from 'react';
import { Undo2, Redo2, Settings, RotateCcw, BoxSelect, Maximize, Trash2, Target, MousePointer2 } from 'lucide-react';

interface LowerToolbarProps {
  onClear: () => void;
  onResetZoom: () => void;
}

const LowerToolbar: React.FC<LowerToolbarProps> = ({ onClear, onResetZoom }) => {
  return (
    <div className="w-full grid grid-cols-3 items-center px-6 py-2 bg-[#0f1115] border-t border-[#1e2229] z-40">
      {/* Left Group: Tool Selection */}
      <div className="flex items-center gap-1 justify-start">
        <button className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg transition-colors hover:bg-cyan-500/20" title="Select Tool">
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-[#1a1d24] text-[#4a5568] hover:text-[#cbd5e0] rounded-lg transition-all" title="Box Select">
          <BoxSelect className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-[#1e2229] mx-2" />
        <button className="p-2 hover:bg-[#1a1d24] text-[#4a5568] hover:text-[#cbd5e0] rounded-lg transition-all" title="Undo">
          <Undo2 className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-[#1a1d24] text-[#4a5568] hover:text-[#cbd5e0] rounded-lg transition-all" title="Redo">
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Middle Group: View Controls (Centered) */}
      <div className="flex items-center gap-1 justify-center">
        <button onClick={onResetZoom} className="p-2 hover:bg-[#1a1d24] text-[#4a5568] hover:text-cyan-400 rounded-lg transition-all" title="Reset View">
          <Target className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-[#1a1d24] text-[#4a5568] hover:text-[#cbd5e0] rounded-lg transition-all" title="Zoom to Fit">
          <Maximize className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-[#1e2229] mx-2" />
        <button className="p-2 hover:bg-[#1a1d24] text-[#4a5568] hover:text-[#cbd5e0] rounded-lg transition-all" title="Rotate Selection">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-[#1a1d24] text-[#4a5568] hover:text-[#cbd5e0] rounded-lg transition-all" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Right Group: Actions (Right Aligned) */}
      <div className="flex items-center justify-end">
        <button 
          onClick={onClear} 
          className="px-4 py-1.5 flex items-center gap-2 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
          title="Clear Workspace"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Project
        </button>
      </div>
    </div>
  );
};

export default LowerToolbar;
