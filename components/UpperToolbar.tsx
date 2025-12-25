
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
  Share2
} from 'lucide-react';

interface UpperToolbarProps {
  onViewCode: () => void;
  onSimulate: () => void;
  onResetSimulation: () => void;
  onViewSerialMonitor: () => void;
  onViewSchematic: () => void;
  onViewBOM: () => void;
  onShare: () => void;
  isSimulating: boolean;
  isCompiling: boolean;
  toggleLibrary: () => void;
  isLibraryOpen: boolean;
  saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSavedAt?: Date | null;
}

const UpperToolbar: React.FC<UpperToolbarProps> = ({
  onViewCode,
  onSimulate,
  onResetSimulation,
  onViewSerialMonitor,
  onViewSchematic,
  onViewBOM,
  onShare,
  isSimulating,
  isCompiling,
  toggleLibrary,
  isLibraryOpen,
  saveStatus,
  lastSavedAt
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

        {/* Start/Stop Simulation */}
        <div className="flex flex-col items-center justify-center gap-1 group min-w-0 sm:min-w-[3.5rem]">
          <button
            onClick={onSimulate}
            disabled={isCompiling}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 border shadow-sm ${isSimulating
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
          <span className={`hidden sm:block text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${isSimulating ? 'text-red-500/60' : 'text-[#22c55e]/60'
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
          icon={Share2}
          label="Share"
          onClick={onShare}
        />

        {/* Save Status Indicator */}
        <div className="hidden md:flex flex-col items-end justify-center ml-4 min-w-[100px]">
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />}
            {saveStatus === 'saved' && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            {saveStatus === 'error' && <span className="w-2 h-2 bg-red-500 rounded-full" />}
            <span className="text-xs text-gray-400 font-medium">
              {saveStatus === 'saving' ? 'Saving...' :
                saveStatus === 'saved' ? 'Saved' :
                  saveStatus === 'error' ? 'Error' : 'Unsaved'}
            </span>
          </div>
          {lastSavedAt && saveStatus === 'saved' && (
            <span className="text-[10px] text-gray-600">
              {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpperToolbar;
