
import React from 'react';
import {
  Play,
  Pause,
  Square,
  Code,
  RotateCcw,
  LayoutTemplate,
  Monitor,
  Workflow,
  ClipboardList,
  Loader2,
  Save
} from 'lucide-react';

interface UpperToolbarProps {
  onViewCode: () => void;
  onSimulate: () => void;
  onResetSimulation: () => void;
  onViewSerialMonitor: () => void;
  onViewSchematic: () => void;
  onViewBOM: () => void;
  onViewBOM: () => void;
  onSave: () => void;
  isSimulating: boolean;
  isPaused?: boolean;
  isCompiling: boolean;
  toggleLibrary: () => void;
  isLibraryOpen: boolean;
  isReadOnly?: boolean;
}

const UpperToolbar: React.FC<UpperToolbarProps> = ({
  onViewCode,
  onSimulate,
  onResetSimulation,
  onViewSerialMonitor,
  onViewSchematic,
  onViewBOM,
  onSave,
  isSimulating,
  isPaused = false,
  isCompiling,
  toggleLibrary,
  isLibraryOpen,
  isReadOnly = false
}) => {

  const ToolbarButton = ({
    icon: Icon,
    label,
    onClick,
    active = false,
    disabled = false,
    colorClass = "text-gray-400 hover:text-brand-400"
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
        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${active
          ? 'bg-brand-500/10 border-brand-500/30 text-brand-400 shadow-brand-900/20'
          : disabled
            ? 'bg-dark-800/50 text-dark-700 border-transparent cursor-not-allowed'
            : `bg-dark-800 border-dark-700 hover:bg-dark-700 hover:-translate-y-0.5 hover:shadow-lg ${colorClass}`
          }`}
        title={label}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${active ? 'text-brand-400' : disabled ? 'text-dark-700' : 'text-gray-500 group-hover:text-brand-400'
        }`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full h-16 sm:h-20 bg-dark-900 border-b border-dark-700 z-40 flex items-center justify-center relative">
      <div className="flex items-center justify-around sm:justify-between w-full h-full px-2 sm:px-8">

        <ToolbarButton
          icon={LayoutTemplate}
          label="Library"
          active={isLibraryOpen}
          onClick={toggleLibrary}
        />

        <div className="hidden sm:block w-px h-8 bg-dark-700 flex-shrink-0 mx-1" />

        {/* Start/Pause/Resume Simulation */}
        <div className="flex flex-col items-center justify-center gap-1 group min-w-0 sm:min-w-[3.5rem]">
          <button
            onClick={onSimulate}
            disabled={isCompiling}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${isSimulating && !isPaused
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-yellow-900/20 hover:bg-yellow-500/20'
              : 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] shadow-green-900/20 hover:bg-[#22c55e]/20 hover:-translate-y-0.5'
              }`}
            title={isCompiling ? "Compiling..." : isSimulating && !isPaused ? "Pause Simulation" : isSimulating && isPaused ? "Resume Simulation" : "Start Simulation"}
          >
            {isCompiling ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : isSimulating && !isPaused ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            )}
          </button>
          <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${isSimulating && !isPaused ? 'text-yellow-500/60' : 'text-[#22c55e]/60'
            }`}>
            {isCompiling ? 'Loading' : isSimulating && !isPaused ? 'Pause' : isSimulating && isPaused ? 'Resume' : 'Start'}
          </span>
        </div>

        {/* Stop/Reset Simulation */}
        <div className="flex flex-col items-center justify-center gap-1 group min-w-0 sm:min-w-[3.5rem]">
          <button
            onClick={onResetSimulation}
            disabled={!isSimulating}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${isSimulating
              ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-900/20 hover:bg-red-500/20'
              : 'bg-dark-800/50 text-dark-700 border-transparent cursor-not-allowed'
              }`}
            title="Stop Simulation"
          >
            <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
          </button>
          <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${isSimulating ? 'text-red-500/60' : 'text-dark-700'
            }`}>
            Reset
          </span>
        </div>

        <div className="hidden sm:block w-px h-8 bg-dark-700 flex-shrink-0 mx-1" />

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
          icon={ClipboardList}
          label="BOM"
          onClick={onViewBOM}
        />

        <div className="hidden sm:block w-px h-8 bg-dark-700 flex-shrink-0 mx-1" />

        <ToolbarButton
          icon={Save}
          label="Save"
          onClick={onSave}
          disabled={isReadOnly}
        />

        {/* Save Status Indicator - Moved to ChatInterface */}
      </div>
    </div>
  );
};

export default UpperToolbar;
