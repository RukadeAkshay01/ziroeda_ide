
import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import Canvas, { CanvasHandle } from './components/Canvas';
import ComponentLibrary from './components/ComponentLibrary';
import UpperToolbar from './components/UpperToolbar';
import LowerToolbar from './components/LowerToolbar';
import CodeEditor from './components/CodeEditor';
import PropertiesPanel from './components/PropertiesPanel';
import BillOfMaterials from './components/BillOfMaterials';
import SerialMonitor from './components/SerialMonitor';
import DebugLogPanel from './components/DebugLogPanel';
import { generateCircuitDesign } from './services/geminiService';
import { ChatMessage, CircuitComponent, WokwiConnection, DebugLogEntry } from './types';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquare } from 'lucide-react';

import { useCircuitHistory } from './hooks/useCircuitHistory';
import { useSimulationRunner } from './hooks/useSimulationRunner';
import { useComponentActions } from './hooks/useComponentActions';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'intro',
    role: 'assistant',
    text: "Hello! I'm Ziro, your expert AI electronics engineer. I can help you design, understand, and build electronic circuits. What can I do for you today?"
  }]);
  
  // Circuit State
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [connections, setConnections] = useState<WokwiConnection[]>([]);
  const [arduinoCode, setArduinoCode] = useState<string>('');
  
  // Hooks
  const { historyIndex, historyLength, saveToHistory, undo, redo, resetHistory } = useCircuitHistory();
  const { 
    isSimulating, 
    isCompiling, 
    simulationPinStates, 
    serialOutput,
    toggleSimulation, 
    resetSimulation, 
    stopSimulation,
    sendSerialInput,
    clearSerialOutput 
  } = useSimulationRunner(arduinoCode);

  // Selection & UI State
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [isBOMOpen, setIsBOMOpen] = useState(false); 
  const [isSerialMonitorOpen, setIsSerialMonitorOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  
  // Debug Logs State
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);

  // Responsive UI State
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // FAB Drag State
  const [fabPos, setFabPos] = useState<{x: number, y: number} | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const isDraggingRef = useRef(false);

  // Canvas Ref
  const canvasRef = useRef<CanvasHandle>(null);

  // Responsive Initialization
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsLibraryOpen(false); // Default closed on mobile
      } else {
        setIsLibraryOpen(true); // Default open on desktop
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [canvasResetKey, setCanvasResetKey] = useState(0); 

  const { 
    addComponent, moveComponent, deleteComponent, rotateComponent, 
    flipHorizontal, flipVertical, updateComponent, createConnection 
  } = useComponentActions({
    components, setComponents, connections, setConnections, saveToHistory,
    selectedComponentId, setSelectedComponentId, setIsPropertiesOpen
  });

  // FAB Touch Handlers
  const handleFabTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = false;
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleFabTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    
    // Threshold to prevent accidental drags when clicking
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDraggingRef.current = true;
        setFabPos({ 
            x: touch.clientX - 28, // Center offset (56px / 2)
            y: touch.clientY - 28 
        });
    }
  };

  // Wrapper for adding components on mobile to close the drawer
  const handleAddComponent = (type: any) => {
    addComponent(type);
    if (isMobile) setIsLibraryOpen(false);
  };

  // Undo/Redo Handlers
  const handleUndo = () => {
    const state = undo();
    if (state) {
      setComponents(state.components);
      setConnections(state.connections);
    }
  };

  const handleRedo = () => {
    const state = redo();
    if (state) {
      setComponents(state.components);
      setConnections(state.connections);
    }
  };

  // --- AI Interaction ---
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsProcessing(true);

    try {
      // Call service, which now returns debug info too
      const { design, rawRequest, rawResponse } = await generateCircuitDesign(updatedHistory, components, connections);

      // Log Request
      const reqLog: DebugLogEntry = {
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'request',
          summary: `Sent "${text.slice(0, 30)}..." with ${components.length} components context.`,
          payload: rawRequest
      };
      
      // Log Response
      const resLog: DebugLogEntry = {
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'response',
          summary: `Received ${design.components.length} components. Code length: ${design.arduinoCode?.length || 0} chars.`,
          payload: JSON.parse(rawResponse) // It's a JSON string from the service
      };

      setDebugLogs(prev => [...prev, reqLog, resLog]);

      if (design.components && design.components.length > 0) {
        setComponents(design.components);
        setConnections(design.connections || []);
        setArduinoCode(design.arduinoCode || '');
        saveToHistory(design.components, design.connections || []);
      }

      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        text: design.explanation
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        text: "I'm sorry, I hit a snag while thinking. Could you try saying that again?",
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);

      // Log Error
      setDebugLogs(prev => [...prev, {
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'error',
          summary: 'Gemini API Error',
          payload: error.message || error
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    stopSimulation();
    setComponents([]);
    setConnections([]);
    setArduinoCode('');
    setSelectedComponentId(null);
    setMessages([{
      id: uuidv4(),
      role: 'assistant',
      text: "Canvas cleared! I'm ready for a fresh project. What's the new plan?"
    }]);
    resetHistory();
    setDebugLogs([]); // Clear logs too? Or keep history? Let's clear for fresh start.
  };

  const handleShare = () => {
    const data = JSON.stringify({ components, connections, code: arduinoCode });
    console.log("Sharing Data:", data);
    alert("Shareable link copied to clipboard! (Simulation)");
  };

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1115] text-white font-sans relative">
      
      {/* --- MOBILE: Library Drawer (90% from Left) --- */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${isLibraryOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
         {/* Backdrop */}
         <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsLibraryOpen(false)}
         />
         {/* Drawer Panel */}
         <div className={`absolute left-0 top-0 bottom-0 w-[90%] bg-[#13161c] shadow-2xl transition-transform duration-300 ease-in-out ${isLibraryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <ComponentLibrary onAddComponent={handleAddComponent} />
            {/* Close handle for accessibility */}
            <div className="absolute top-1/2 -right-6 w-6 h-12 bg-[#13161c] rounded-r-lg flex items-center justify-center text-gray-500" onClick={() => setIsLibraryOpen(false)}>
               ‹
            </div>
         </div>
      </div>

      {/* --- DESKTOP: Library Sidebar --- */}
      <div 
        className={`hidden md:block flex-shrink-0 h-full border-r border-[#1e2229] bg-[#13161c] transition-[width,opacity] duration-300 ease-in-out overflow-hidden ${
          isLibraryOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-none'
        }`}
      >
        <ComponentLibrary onAddComponent={addComponent} />
      </div>

      {/* --- CENTER: Main Application Area --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b0d11] relative z-10">
        <UpperToolbar 
          onViewCode={() => setIsCodeEditorOpen(prev => !prev)} 
          onSimulate={toggleSimulation}
          onResetSimulation={resetSimulation}
          onViewSerialMonitor={() => setIsSerialMonitorOpen(prev => !prev)}
          onViewSchematic={() => alert("Schematic View: Feature Coming Soon")}
          onViewBOM={() => setIsBOMOpen(prev => !prev)} 
          onShare={handleShare}
          onToggleDebug={() => setIsDebugOpen(prev => !prev)}
          isSimulating={isSimulating}
          isCompiling={isCompiling}
          toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
          isLibraryOpen={isLibraryOpen}
          isDebugOpen={isDebugOpen}
        />
        
        <div className="flex-1 relative bg-grid overflow-hidden">
          <Canvas 
            ref={canvasRef}
            key={canvasResetKey}
            components={components} 
            connections={connections} 
            isLoading={isProcessing} 
            selectedComponentId={selectedComponentId}
            onSelectComponent={(id) => { setSelectedComponentId(id); if(!id) setIsPropertiesOpen(false); }}
            onComponentMove={moveComponent}
            onDragEnd={() => saveToHistory(components, connections)}
            onConnectionCreated={createConnection}
            simulationPinStates={isSimulating ? simulationPinStates : undefined}
          />

          {isPropertiesOpen && selectedComponent && (
            <PropertiesPanel 
              component={selectedComponent}
              onUpdate={updateComponent}
              onClose={() => setIsPropertiesOpen(false)}
            />
          )}
        </div>
        
        <LowerToolbar 
          selectedComponentId={selectedComponentId}
          onDelete={deleteComponent}
          onRotate={rotateComponent}
          onFlipHorizontal={flipHorizontal}
          onFlipVertical={flipVertical}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onProperties={() => setIsPropertiesOpen(!isPropertiesOpen)}
          onFitToScreen={() => canvasRef.current?.zoomToFit()}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < historyLength - 1}
        />
      </div>

      {/* --- DESKTOP: Chat Sidebar --- */}
      <div className="hidden md:block w-96 flex-shrink-0 z-30 h-full border-l border-[#1e2229] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          onClear={handleClear}
          isProcessing={isProcessing}
        />
      </div>

      {/* --- MOBILE: Chat Drawer (90% from Right) --- */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${isMobileChatOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
         {/* Backdrop (10% Click Area) */}
         <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileChatOpen(false)}
         />
         {/* Drawer Panel */}
         <div className={`absolute right-0 top-0 bottom-0 w-[90%] bg-[#0f1115] border-l border-[#1e2229] shadow-2xl transition-transform duration-300 ease-in-out ${isMobileChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <ChatInterface 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              onClear={handleClear}
              isProcessing={isProcessing}
            />
         </div>
      </div>

      {/* --- MOBILE: Draggable Chat FAB --- */}
      <button
        className={`md:hidden fixed z-40 w-14 h-14 bg-cyan-600 rounded-full shadow-[0_4px_20px_rgba(8,145,178,0.5)] flex items-center justify-center text-white active:scale-95 transition-transform ${isMobileChatOpen ? 'hidden' : 'block'}`}
        style={{
          left: fabPos ? fabPos.x : undefined,
          top: fabPos ? fabPos.y : undefined,
          right: fabPos ? undefined : '20px',
          bottom: fabPos ? undefined : '100px', // Position above the lower toolbar
          touchAction: 'none' // Prevent scrolling while dragging
        }}
        onTouchStart={handleFabTouchStart}
        onTouchMove={handleFabTouchMove}
        onClick={() => { if (!isDraggingRef.current) setIsMobileChatOpen(true); }}
      >
        <MessageSquare className="w-7 h-7 fill-white/20" />
        {/* Notification dot if processing */}
        {isProcessing && (
           <span className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-bounce" />
        )}
      </button>

      {/* --- GLOBAL OVERLAYS --- */}
      
      {isCodeEditorOpen && (
        <CodeEditor 
          code={arduinoCode} 
          components={components}
          onCodeChange={(newCode) => setArduinoCode(newCode)}
          onClose={() => setIsCodeEditorOpen(false)} 
        />
      )}

      {isBOMOpen && (
         <BillOfMaterials 
           components={components} 
           onClose={() => setIsBOMOpen(false)} 
         />
      )}
      
      <SerialMonitor
        isOpen={isSerialMonitorOpen}
        onClose={() => setIsSerialMonitorOpen(false)}
        output={serialOutput}
        onSend={sendSerialInput}
        onClear={clearSerialOutput}
        isSimulating={isSimulating}
      />

      <DebugLogPanel 
        logs={debugLogs}
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        onClear={() => setDebugLogs([])}
      />

    </div>
  );
};

export default App;
