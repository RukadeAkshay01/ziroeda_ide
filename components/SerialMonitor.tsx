
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Trash2, ArrowDownToLine, Monitor, Terminal, GripHorizontal, ExternalLink } from 'lucide-react';

interface SerialMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  output: string;
  onSend: (text: string) => void;
  onClear: () => void;
  isSimulating: boolean;
}

const SerialMonitor: React.FC<SerialMonitorProps> = ({ 
  isOpen, 
  onClose, 
  output, 
  onSend, 
  onClear,
  isSimulating
}) => {
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [baudRate, setBaudRate] = useState('9600');
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Floating Window State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Pop-out State
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const externalWindowRef = useRef<Window | null>(null);

  // Initialize position at bottom center when first opened
  useEffect(() => {
    if (isOpen && !isPoppedOut && position.x === 0 && position.y === 0) {
      const width = Math.min(600, window.innerWidth * 0.95);
      const height = 350;
      setPosition({
        x: Math.max(0, (window.innerWidth - width) / 2),
        y: Math.max(0, window.innerHeight - height - 100) // Buffer from bottom
      });
    }
  }, [isOpen]);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output, autoScroll]);

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

  // Pop-out Logic
  const handlePopOut = () => {
    if (isPoppedOut) {
      externalWindowRef.current?.close();
      return;
    }

    const newWindow = window.open('', '', 'width=600,height=400,left=200,top=200');
    if (newWindow) {
      // Copy styles from main window to child window
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach(node => {
        newWindow.document.head.appendChild(node.cloneNode(true));
      });
      
      newWindow.document.title = "Serial Monitor - ZiroEDA";
      newWindow.document.body.style.backgroundColor = '#0f1115';
      newWindow.document.body.style.margin = '0';
      
      externalWindowRef.current = newWindow;
      setIsPoppedOut(true);

      newWindow.onbeforeunload = () => {
        setIsPoppedOut(false);
        externalWindowRef.current = null;
      };
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       if (input) {
          onSend(input + '\n');
          setInput('');
       }
    }
  };

  if (!isOpen) return null;

  // The content of the monitor (shared between floating div and portal)
  const monitorContent = (
    <div className={`flex flex-col bg-[#0f1115] overflow-hidden ${isPoppedOut ? 'h-screen w-screen' : 'w-[95vw] h-[300px] md:w-[600px] md:h-[350px] rounded-xl border border-[#2d3748] shadow-2xl'}`}>
      
      {/* Header */}
      <div 
        className={`flex items-center justify-between px-3 py-2 border-b border-[#1e2229] bg-[#1a1d24] ${!isPoppedOut ? 'cursor-move select-none' : ''}`}
        onMouseDown={!isPoppedOut ? handleMouseDown : undefined}
      >
        <div className="flex items-center gap-2">
           {!isPoppedOut && <GripHorizontal className="w-4 h-4 text-[#4a5568]" />}
           <div className="flex items-center gap-2">
             <Terminal className="w-3.5 h-3.5 text-[#22c55e]" />
             <span className="text-xs font-bold text-white uppercase tracking-wide">Serial Monitor</span>
           </div>
           <div className="h-4 w-px bg-[#2d3748] mx-1" />
           <div className="flex items-center gap-1.5">
               <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-[#22c55e] animate-pulse' : 'bg-red-500'}`} />
               <span className="text-[9px] text-[#718096] font-mono uppercase">
                   {isSimulating ? 'Connected' : 'Offline'}
               </span>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 px-2 py-0.5 bg-[#0b0d11] rounded border border-[#2d3748]">
              <select 
                  value={baudRate}
                  onChange={(e) => setBaudRate(e.target.value)}
                  className="bg-transparent text-[9px] font-mono text-[#a0aec0] outline-none border-none cursor-pointer hover:text-white"
                  onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking select
              >
                  <option value="9600">9600 baud</option>
                  <option value="115200">115200 baud</option>
              </select>
           </div>
           
           <button 
             onClick={handlePopOut} 
             className="p-1 hover:bg-[#2d3748] text-[#718096] hover:text-white rounded transition-colors"
             title={isPoppedOut ? "Restore to Main Window" : "Pop out to New Tab"}
             onMouseDown={(e) => e.stopPropagation()}
           >
              <ExternalLink className="w-3.5 h-3.5" />
           </button>

           <button 
             onClick={onClose} 
             className="p-1 hover:bg-[#2d3748] text-[#718096] hover:text-white rounded transition-colors"
             onMouseDown={(e) => e.stopPropagation()}
           >
              <X className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 bg-[#0b0d11] p-3 overflow-y-auto font-mono text-xs relative">
         {output.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                 <div className="text-center">
                     <p className="text-[10px] text-[#4a5568]">No data.</p>
                 </div>
             </div>
         ) : (
             <pre className="whitespace-pre-wrap break-all text-cyan-50/90 leading-relaxed">{output}</pre>
         )}
         <div ref={outputEndRef} />
      </div>

      {/* Controls & Input */}
      <div className="bg-[#13161c] border-t border-[#1e2229]">
        <div className="px-3 py-1 flex items-center justify-between text-[9px] text-[#718096] border-b border-[#1e2229]/50">
             <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#cbd5e0]">
                 <div className={`w-2.5 h-2.5 border rounded flex items-center justify-center ${autoScroll ? 'bg-cyan-500 border-cyan-500' : 'border-[#4a5568]'}`}>
                     {autoScroll && <ArrowDownToLine className="w-2 h-2 text-black" />}
                 </div>
                 <input type="checkbox" className="hidden" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
                 AUTOSCROLL
             </label>
             <button onClick={onClear} className="flex items-center gap-1 hover:text-red-400">
                 <Trash2 className="w-2.5 h-2.5" />
                 CLEAR
             </button>
        </div>

        <div className="p-2">
            <form onSubmit={handleSend} className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send message..."
                    disabled={!isSimulating}
                    className="flex-1 bg-[#0b0d11] border border-[#2d3748] rounded px-2 py-1.5 text-xs text-white font-mono placeholder-[#4a5568] focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                />
                <button 
                    type="submit"
                    disabled={!isSimulating || !input}
                    className="bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#1a1d24] disabled:text-[#4a5568] text-white px-3 rounded text-[10px] font-bold transition-all flex items-center gap-1"
                >
                    <Send className="w-3 h-3" />
                    SEND
                </button>
            </form>
        </div>
      </div>
    </div>
  );

  if (isPoppedOut && externalWindowRef.current) {
    return createPortal(monitorContent, externalWindowRef.current.document.body);
  }

  return (
    <div 
      className="fixed z-[90] shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-xl"
      style={{ left: position.x, top: position.y }}
    >
      {monitorContent}
    </div>
  );
};

export default SerialMonitor;
