
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, FileCode, Terminal, ChevronDown, ExternalLink, GripHorizontal } from 'lucide-react';
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

  // Floating Window State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Pop-out State
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const externalWindowRef = useRef<Window | null>(null);

  // Filter for components that act as programmable boards
  const boards = components.filter(c => c.type === 'wokwi-arduino-uno');
  const [selectedBoardId, setSelectedBoardId] = useState(boards[0]?.id || '');

  // Initialize position (center screen) with responsive logic
  useEffect(() => {
    if (!isPoppedOut && position.x === 0 && position.y === 0) {
      const width = Math.min(800, window.innerWidth * 0.95);
      const height = Math.min(600, window.innerHeight * 0.8);
      setPosition({
        x: Math.max(0, (window.innerWidth - width) / 2),
        y: Math.max(20, (window.innerHeight - height) / 2) // Ensure at least 20px from top
      });
    }
  }, []);

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

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPoppedOut) return;
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

  const handlePopOut = () => {
    if (isPoppedOut) {
      externalWindowRef.current?.close();
      return;
    }

    const newWindow = window.open('', '', 'width=800,height=600,left=150,top=150');
    if (newWindow) {
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach(node => {
        newWindow.document.head.appendChild(node.cloneNode(true));
      });

      newWindow.document.title = "Firmware Lab - ZiroEDA";
      newWindow.document.body.style.backgroundColor = '#000'; // Dark background
      newWindow.document.body.style.margin = '0';

      externalWindowRef.current = newWindow;
      setIsPoppedOut(true);

      newWindow.onbeforeunload = () => {
        setIsPoppedOut(false);
        externalWindowRef.current = null;
      };
    }
  };

  // The main editor content
  const editorContent = (
    <div className={`flex flex-col bg-dark-900 overflow-hidden ${isPoppedOut ? 'h-screen w-screen' : 'w-[95vw] h-[70vh] md:w-[800px] md:h-[600px] rounded-xl border border-dark-700 shadow-[0_0_50px_rgba(0,0,0,0.5)]'}`}>

      {/* Editor Header */}
      <div
        className={`flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-dark-700 bg-dark-800 ${!isPoppedOut ? 'cursor-move select-none' : ''}`}
        onMouseDown={!isPoppedOut ? handleMouseDown : undefined}
      >
        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {!isPoppedOut && <GripHorizontal className="w-5 h-5 text-gray-500" />}
            <div className="bg-brand-500/10 p-1.5 md:p-2 rounded-lg hidden sm:block">
              <FileCode className="w-4 h-4 md:w-5 md:h-5 text-brand-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider leading-none truncate">Firmware</h3>
              <p className="hidden sm:block text-[10px] text-gray-500 font-mono uppercase mt-1">Interactive IDE</p>
            </div>
          </div>

          {/* Board Selector */}
          <div className="h-6 md:h-8 w-px bg-dark-700 flex-shrink-0" />

          <div className="flex flex-col gap-0.5 md:gap-1 min-w-0 flex-1" onMouseDown={e => e.stopPropagation()}>
            <label className="hidden md:block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Target</label>
            <div className="relative group w-full max-w-[140px]">
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full appearance-none bg-dark-700 text-brand-400 text-[10px] md:text-xs font-mono border border-dark-700 rounded px-2 py-1 pr-6 focus:outline-none focus:border-brand-500/50 cursor-pointer truncate"
              >
                {boards.length > 0 ? (
                  boards.map(b => (
                    <option key={b.id} value={b.id}>{b.label || b.type.replace('wokwi-', '')} ({b.id.split('-')[1]})</option>
                  ))
                ) : (
                  <option value="">No boards detected</option>
                )}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2" onMouseDown={e => e.stopPropagation()}>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-2 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${copied
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-dark-700 border-dark-700 text-gray-300 hover:bg-dark-700'
              }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handlePopOut}
            className="hidden sm:block p-1.5 hover:bg-dark-700 text-gray-500 hover:text-white rounded-lg transition-all"
            title={isPoppedOut ? "Restore" : "Pop out"}
          >
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-gray-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers - Visual Only */}
        <div className="w-8 md:w-12 bg-dark-900 border-r border-dark-700 flex flex-col items-center py-6 select-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className="text-[10px] font-mono text-dark-700 leading-relaxed">{i + 1}</span>
          ))}
        </div>

        {/* Interactive Textarea */}
        <div className="flex-1 relative bg-dark-900">
          <textarea
            value={localCode}
            onChange={handleTextAreaChange}
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-transparent p-4 md:p-6 font-mono text-xs md:text-sm text-brand-50/90 leading-relaxed resize-none focus:outline-none scrollbar-hide selection:bg-brand-500/30"
            placeholder="// Type your Arduino code here..."
          />
        </div>
      </div>

      {/* Editor Footer */}
      <div className="px-4 md:px-6 py-2 md:py-3 border-t border-dark-700 bg-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse"></div>
            <span className="hidden sm:inline">Connected</span>
          </div>
          <span className="hidden sm:inline">C++ / sketch.ino</span>
          <span className="text-brand-500/40">Col: {localCode.split('\n').pop()?.length || 0}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-brand-500/40 uppercase">
            <Terminal className="w-3 h-3" />
            <span className="hidden sm:inline">115200 Baud</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isPoppedOut && externalWindowRef.current) {
    return createPortal(editorContent, externalWindowRef.current.document.body);
  }

  // Floating Window Rendering
  return (
    <div
      className="fixed z-[95] shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-xl"
      style={{ left: position.x, top: position.y }}
    >
      {editorContent}
    </div>
  );
};

export default CodeEditor;
