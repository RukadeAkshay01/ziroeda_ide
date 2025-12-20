
import React from 'react';
import { Play, Square, Code, Terminal, FileEdit, Package, Share2, Download, Zap, Loader2 } from 'lucide-react';

interface UpperToolbarProps {
  onViewCode: () => void;
  onSimulate: () => void;
  isSimulating: boolean;
  isCompiling: boolean;
}

const UpperToolbar: React.FC<UpperToolbarProps> = ({ 
  onViewCode, 
  onSimulate, 
  isSimulating, 
  isCompiling 
}) => {
  return (
    <div className="w-full grid grid-cols-3 items-center px-6 py-2 bg-[#0f1115] border-b border-[#1e2229] z-40">
      {/* Left Group: Simulation Controls */}
      <div className="flex items-center gap-3 justify-start">
        <button 
          onClick={onSimulate}
          disabled={isCompiling}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs transition-all group border ${
            isSimulating 
              ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' 
              : 'bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/20'
          }`}
        >
          {isCompiling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isSimulating ? (
            <Square className="w-3.5 h-3.5 fill-red-500 group-hover:scale-110 transition-transform" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-[#22c55e] group-hover:scale-110 transition-transform" />
          )}
          {isCompiling ? 'Compiling...' : isSimulating ? 'Stop' : 'Simulate'}
        </button>
        
        <div className="h-4 w-px bg-[#1e2229] mx-1" />
        
        <div className="flex items-center gap-0.5 text-[#4a5568]">
          <button 
            onClick={onViewCode}
            className="p-2 hover:bg-[#1a1d24] hover:text-cyan-400 rounded-lg transition-all" 
            title="View Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-[#1a1d24] hover:text-cyan-400 rounded-lg transition-all" title="Serial Monitor"><Terminal className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-[#1a1d24] hover:text-cyan-400 rounded-lg transition-all" title="Notes"><FileEdit className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-[#1a1d24] hover:text-cyan-400 rounded-lg transition-all" title="Bill of Materials"><Package className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Middle Group: AI Status (Centered) */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 bg-cyan-400/5 text-cyan-400/80 px-3 py-1 rounded-md border border-cyan-400/10">
            <Zap className={`w-3 h-3 fill-cyan-400 ${isSimulating ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isSimulating ? 'Simulation Running' : 'Ziro AI System Active'}
            </span>
        </div>
      </div>

      {/* Right Group: Workspace Utilities (Right Aligned) */}
      <div className="flex items-center gap-3 justify-end">
        <div className="flex items-center gap-0.5 text-[#4a5568]">
          <button className="p-2 hover:bg-[#1a1d24] hover:text-[#cbd5e0] rounded-lg transition-all"><Download className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-[#1a1d24] hover:text-[#cbd5e0] rounded-lg transition-all"><Share2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default UpperToolbar;
