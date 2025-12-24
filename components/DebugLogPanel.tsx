
import React, { useRef, useEffect, useState } from 'react';
import { X, Bug, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { DebugLogEntry } from '../types';

interface DebugLogPanelProps {
  logs: DebugLogEntry[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

const DebugLogPanel: React.FC<DebugLogPanelProps> = ({ logs, isOpen, onClose, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
      
      <div className="bg-[#13161c] w-[90vw] h-[80vh] md:w-[800px] border border-[#2d3748] rounded-xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d3748] bg-[#1a1d24]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-yellow-500/10 rounded-md border border-yellow-500/20">
              <Bug className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Debug Protocol</h3>
              <p className="text-[10px] text-[#718096] font-mono">Raw Request / Response Cycle</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={onClear} 
                className="p-2 hover:bg-[#2d3748] text-[#718096] hover:text-red-400 rounded-lg transition-colors"
                title="Clear Logs"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-[#2d3748] text-[#718096] hover:text-white rounded-lg transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b0d11]">
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-[#2d3748] space-y-2">
               <Bug className="w-12 h-12 opacity-20" />
               <span className="text-xs font-mono uppercase tracking-widest">No Interaction Data</span>
            </div>
          )}
          
          {logs.map((log) => (
            <div key={log.id} className="group">
               {/* Log Header / Summary */}
               <div 
                 onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                 className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    log.type === 'error' 
                      ? 'bg-red-950/10 border-red-900/30 hover:bg-red-950/20' 
                      : log.type === 'request'
                        ? 'bg-[#1a1d24] border-[#2d3748] hover:border-cyan-500/30 hover:shadow-lg'
                        : 'bg-[#161b22] border-[#2d3748] hover:border-green-500/30 hover:shadow-lg'
                 }`}
               >
                  <div className={`mt-0.5 p-1 rounded ${
                      log.type === 'error' ? 'text-red-500 bg-red-500/10' :
                      log.type === 'request' ? 'text-cyan-400 bg-cyan-400/10' : 'text-green-400 bg-green-400/10'
                  }`}>
                      {log.type === 'request' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                              log.type === 'error' ? 'text-red-400' :
                              log.type === 'request' ? 'text-cyan-400' : 'text-green-400'
                          }`}>
                              {log.type === 'request' ? 'OUTGOING (To AI)' : 'INCOMING (From AI)'}
                          </span>
                          <span className="text-[10px] text-[#4a5568] font-mono">
                              {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                      </div>
                      <p className="text-xs text-[#cbd5e0] font-mono truncate">{log.summary}</p>
                  </div>
               </div>

               {/* Expanded Details */}
               {expandedId === log.id && (
                  <div className="mt-2 ml-9 relative">
                      <div className="absolute top-0 bottom-0 -left-4 w-px bg-[#2d3748] border-l border-dashed border-[#4a5568]/50" />
                      <div className="bg-[#0f1115] rounded-md border border-[#1e2229] p-3 overflow-x-auto">
                          <pre className="text-[10px] font-mono text-[#a0aec0] leading-relaxed">
                              {typeof log.payload === 'string' 
                                  ? log.payload 
                                  : JSON.stringify(log.payload, null, 2)
                              }
                          </pre>
                      </div>
                  </div>
               )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

      </div>
    </div>
  );
};

export default DebugLogPanel;
