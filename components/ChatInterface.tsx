
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Cpu, Trash2, ArrowRight } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClear: () => void;
  isProcessing: boolean;
}

const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        if (para.includes('\n- ') || para.startsWith('- ')) {
          const items = para.split(/\n- /).filter(i => i.trim());
          return (
            <ul key={pIdx} className="list-disc ml-4 space-y-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="pl-1">
                  <InlineFormatter text={item.startsWith('- ') ? item.slice(2) : item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={pIdx} className="leading-relaxed">
            <InlineFormatter text={para} />
          </p>
        );
      })}
    </div>
  );
};

const InlineFormatter: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="bg-black/40 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs border border-white/5">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part === '\n') {
          return <br key={i} />;
        }
        return part;
      })}
    </>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onClear,
  isProcessing 
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1115] border-l border-[#1e2229] w-full shadow-2xl relative">
      {/* Mini Title */}
      <div className="px-4 pt-4 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">
        AI Chat Assistant
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-tighter ${msg.role === 'user' ? 'text-[#4a5568]' : 'text-cyan-500/50'}`}>
              {msg.role === 'user' ? 'You' : 'Ziro'}
            </div>
            <div
              className={`max-w-[100%] rounded-2xl px-4 py-3 text-sm transition-all ${
                msg.role === 'user'
                  ? 'bg-cyan-500/10 text-cyan-50 border border-cyan-500/20'
                  : msg.isError 
                    ? 'bg-red-900/20 text-red-200 border border-red-800/30'
                    : 'bg-[#1a1d24] text-[#cbd5e0] border border-[#2d3748]'
              }`}
            >
              <FormattedMessage text={msg.text} />
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex flex-col items-start">
             <div className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-cyan-500/50">Ziro</div>
             <div className="bg-[#1a1d24] px-4 py-3 rounded-2xl border border-[#2d3748] flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-pulse delay-75"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-pulse delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0f1115] border-t border-[#1e2229]">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Ask Ziro..."
            className="w-full bg-[#1a1d24] text-[#cbd5e0] placeholder-[#4a5568] rounded-xl pl-4 pr-12 py-3 border border-[#2d3748] focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-[#2d3748] text-[#a0aec0] rounded-lg hover:bg-cyan-500 hover:text-white disabled:opacity-30 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
