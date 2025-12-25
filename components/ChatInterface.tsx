
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Cpu, Trash2, ArrowRight, User as UserIcon, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClear: () => void;
  isProcessing: boolean;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  user: User | null;
  saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSavedAt?: Date | null;
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
            <code key={i} className="bg-black/40 px-1.5 py-0.5 rounded text-brand-300 font-mono text-xs border border-white/5">
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
  isProcessing,
  projectName,
  onProjectNameChange,
  user,
  saveStatus,
  lastSavedAt
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
    <div className="flex flex-col h-full bg-dark-900 border-l border-dark-700 w-full shadow-2xl relative">
      {/* Project Name Header */}
      <div className="h-16 sm:h-20 px-6 border-b border-dark-700 flex items-center justify-between gap-4 bg-dark-900">
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="flex-1 bg-transparent text-lg sm:text-xl font-bold text-gray-200 uppercase tracking-wider hover:text-brand-400 focus:text-brand-400 focus:outline-none transition-colors placeholder-gray-600"
          placeholder="UNTITLED PROJECT"
        />

        {/* Save Status Indicator */}
        <div className="flex flex-col items-end justify-center min-w-[60px]">
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />}
            {saveStatus === 'saved' && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            {saveStatus === 'error' && <span className="w-2 h-2 bg-red-500 rounded-full" />}
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              {saveStatus === 'saving' ? 'Saving...' :
                saveStatus === 'saved' ? 'Saved' :
                  saveStatus === 'error' ? 'Error' : 'Unsaved'}
            </span>
          </div>
          {lastSavedAt && saveStatus === 'saved' && (
            <span className="text-[10px] text-gray-600 hidden sm:block">
              {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* User Profile Icon */}
        <div className="flex-shrink-0">
          {user ? (
            user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-10 h-10 rounded-full border-2 border-dark-600 shadow-sm"
                title={user.displayName || user.email || "User"}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full bg-brand-500/20 border-2 border-brand-500/30 flex items-center justify-center text-sm font-bold text-brand-400 shadow-sm"
                title={user.displayName || user.email || "User"}
              >
                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <div
              className="w-10 h-10 rounded-full bg-dark-800 border-2 border-dark-700 flex items-center justify-center text-gray-600 shadow-sm"
              title="Not Signed In"
            >
              <UserIcon className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}
          >
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-tighter ${msg.role === 'user' ? 'text-gray-500' : 'text-brand-500/50'}`}>
              {msg.role === 'user' ? 'You' : 'Ziro'}
            </div>
            <div
              className={`max-w-[100%] rounded-2xl px-4 py-3 text-sm transition-all ${msg.role === 'user'
                ? 'bg-dark-800 text-gray-300 border border-dark-700'
                : msg.isError
                  ? 'bg-red-900/20 text-red-200 border border-red-800/30'
                  : 'bg-brand-500/10 text-brand-50 border border-brand-500/20'
                }`}
            >
              <FormattedMessage text={msg.text} />
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex flex-col items-end">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-brand-500/50">Ziro</div>
            <div className="bg-brand-500/10 px-4 py-3 rounded-2xl border border-brand-500/20 flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-pulse"></span>
              <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-pulse delay-75"></span>
              <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-pulse delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-dark-900 border-t border-dark-700">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Ask Ziro..."
            className="w-full bg-dark-800 text-gray-300 placeholder-gray-500 rounded-xl pl-4 pr-12 py-3 border border-dark-700 focus:outline-none focus:border-brand-500/50 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-400 disabled:opacity-30 disabled:bg-dark-700 disabled:text-gray-400 transition-all shadow-lg shadow-brand-500/20"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
