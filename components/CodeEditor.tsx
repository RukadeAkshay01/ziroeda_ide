
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileCode, Terminal, ChevronDown, Cpu } from 'lucide-react';
import { CircuitComponent } from '../types';

interface CodeEditorProps {
  code: string;
  components: CircuitComponent[];
  onCodeChange: (newCode: string) => void;
  onClose: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, components, onCodeChange, onClose }) => {
  const [localCode, setLocalCode] = useState(code);
  const [copied, setCopied] = useState(false);
  
  // Filter for components that act as programmable boards
  const boards = components.filter(c => c.type === 'wokwi-arduino-uno');
  const [selectedBoardId, setSelectedBoardId] = useState(boards[0]?.id || '');

  // Keep local state in sync when AI updates the code
  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  // Sync back to parent when local state changes
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalCode(val);
    onCodeChange(val);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0f1115] w-full max-w-4xl h-[85vh] rounded-2xl border border-[#2d3748] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Editor Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2229] bg-[#13161c]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-500/10 p-2 rounded-lg">
                <FileCode className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider leading-none">Firmware Lab</h3>
                <p className="text-[10px] text-[#4a5568] font-mono uppercase mt-1">v2.1 / Interactive IDE</p>
              </div>
            </div>

            {/* Board Selector */}
            <div className="h-8 w-px bg-[#2d3748]" />
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#4a5568] uppercase tracking-widest">Target Hardware</label>
              <div className="relative group">
                <select 
                  value={selectedBoardId}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className="appearance-none bg-[#1a1d24] text-cyan-400 text-xs font-mono border border-[#2d3748] rounded px-3 py-1 pr-8 focus:outline-none focus:border-cyan-500/50 cursor-pointer min-w-[140px]"
                >
                  {boards.length > 0 ? (
                    boards.map(b => (
                      <option key={b.id} value={b.id}>{b.label || b.type.replace('wokwi-', '')} ({b.id.split('-')[1]})</option>
                    ))
                  ) : (
                    <option value="">No boards detected</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4a5568] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                copied 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-[#1a1d24] border-[#2d3748] text-[#cbd5e0] hover:bg-[#2d3748]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-[#4a5568] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Line Numbers - Visual Only */}
          <div className="w-12 bg-[#0b0d11] border-r border-[#1e2229] flex flex-col items-center py-6 select-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className="text-[10px] font-mono text-[#2d3748] leading-relaxed">{i + 1}</span>
            ))}
          </div>

          {/* Interactive Textarea */}
          <div className="flex-1 relative bg-[#0b0d11]">
            <textarea
              value={localCode}
              onChange={handleTextAreaChange}
              spellCheck={false}
              className="absolute inset-0 w-full h-full bg-transparent p-6 font-mono text-sm text-cyan-50/90 leading-relaxed resize-none focus:outline-none scrollbar-hide selection:bg-cyan-500/30"
              placeholder="// Type your Arduino code here..."
            />
          </div>
        </div>

        {/* Editor Footer */}
        <div className="px-6 py-3 border-t border-[#1e2229] bg-[#13161c] flex items-center justify-between">
            <div className="flex items-center gap-6 text-[10px] text-[#4a5568] font-mono uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse"></div>
                    Connected to {selectedBoardId || 'None'}
                </div>
                <span>C++ / sketch.ino</span>
                <span className="text-cyan-500/40">Col: {localCode.split('\n').pop()?.length || 0}</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-500/40 uppercase">
                  <Terminal className="w-3 h-3" />
                  115200 Baud
               </div>
               <div className="text-[10px] font-bold text-[#4a5568] uppercase">
                  Ready to compile
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
