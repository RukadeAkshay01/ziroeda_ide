
import React from 'react';
import { 
  Play, 
  Square, 
  Code, 
  RotateCcw, 
  LayoutTemplate, 
  Monitor, 
  Workflow, 
  ClipboardList, 
  Loader2,
  Share2,
  Bug
} from 'lucide-react';

interface UpperToolbarProps {
  onViewCode: () => void;
  onSimulate: () => void;
  onResetSimulation: () => void;
  onViewSerialMonitor: () => void;
  onViewSchematic: () => void;
  onViewBOM: () => void;
  onShare: () => void;
  onToggleDebug: () => void;
  isSimulating: boolean;
  isCompiling: boolean;
  toggleLibrary: () => void;
  isLibraryOpen: boolean;
  isDebugOpen: boolean;
}

const UpperToolbar: React.FC<UpperToolbarProps> = ({ 
  onViewCode, 
  onSimulate, 
  onResetSimulation,
  onViewSerialMonitor,
  onViewSchematic,
  onViewBOM,
  onShare,
  onToggleDebug,
  isSimulating, 
  isCompiling,
  toggleLibrary,
  isLibraryOpen,
  isDebugOpen
}) => {

  const ToolbarButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    active = false,
    disabled = false,
    colorClass = "text-[#a0aec0] hover:text-cyan-400"
  }: { 
    icon: any, 
    label: string, 
    onClick: () => void, 
    active?: boolean,
    disabled?: boolean,
    colorClass?: string
  }) => (
    <div className="flex flex-col items-center justify-center gap-1 group min-w-0 sm:min-w-[3.5rem]">
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${
          active 
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-900/20' 
            : disabled
              ? 'bg-[#1a1d24]/50 text-[#2d3748] border-transparent cursor-not-allowed'
              : `bg-[#1a1d24] border-[#2d3748] hover:bg-[#2d3748] hover:-translate-y-0.5 hover:shadow-lg ${colorClass}`
        }`}
        title={label}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
        active ? 'text-cyan-400' : disabled ? 'text-[#2d3748]' : 'text-[#4a5568] group-hover:text-cyan-400'
      }`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full h-16 sm:h-20 bg-[#0f1115] border-b border-[#1e2229] z-40 flex items-center justify-center relative">
      <div className="flex items-center justify-around sm:justify-between w-full h-full px-2 sm:px-8">
        
        <ToolbarButton 
          icon={LayoutTemplate} 
          label="Library" 
          active={isLibraryOpen} 
          onClick={toggleLibrary} 
        />
        
        <div className="hidden sm:block w-px h-8 bg-[#1e2229] flex-shrink-0 mx-1" />

        {/* Start/Stop Simulation */}
        <div className="flex flex-col items-center justify-center gap-1 group min-w-0 sm:min-w-[3.5rem]">
           <button 
             onClick={onSimulate}
             disabled={isCompiling}
             className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${
               isSimulating 
                 ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-900/20 hover:bg-red-500/20' 
                 : 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] shadow-green-900/20 hover:bg-[#22c55e]/20 hover:-translate-y-0.5'
             }`}
             title={isSimulating ? "Stop Simulation" : "Start Simulation"}
           >
             {isCompiling ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
             ) : isSimulating ? (
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
             ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
             )}
           </button>
           <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
              isSimulating ? 'text-red-500/60' : 'text-[#22c55e]/60'
           }`}>
              {isCompiling ? 'Loading' : isSimulating ? 'Stop' : 'Start'}
           </span>
        </div>

        <ToolbarButton 
          icon={RotateCcw} 
          label="Reset" 
          onClick={onResetSimulation}
          disabled={!isSimulating} 
        />

        <div className="hidden sm:block w-px h-8 bg-[#1e2229] flex-shrink-0 mx-1" />

        <ToolbarButton 
          icon={Code} 
          label="Code" 
          onClick={onViewCode} 
        />

        <ToolbarButton 
          icon={Monitor} 
          label="Serial" 
          onClick={onViewSerialMonitor} 
        />

        <ToolbarButton 
          icon={Bug} 
          label="Debug" 
          onClick={onToggleDebug} 
          active={isDebugOpen}
          colorClass="text-yellow-500/80 hover:text-yellow-400"
        />

        <ToolbarButton 
          icon={ClipboardList} 
          label="BOM" 
          onClick={onViewBOM} 
        />

        <div className="hidden sm:block w-px h-8 bg-[#1e2229] flex-shrink-0 mx-1" />

        <ToolbarButton 
          icon={Share2} 
          label="Share" 
          onClick={onShare} 
        />
      </div>
    </div>
  );
};

export default UpperToolbar;
