
import React, { useState, useRef, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Canvas from './components/Canvas';
import ComponentLibrary from './components/ComponentLibrary';
import UpperToolbar from './components/UpperToolbar';
import LowerToolbar from './components/LowerToolbar';
import CodeEditor from './components/CodeEditor';
import { generateCircuitDesign } from './services/geminiService';
import { compileArduinoCode, AVRRunner, SimulationUpdate } from './services/simulationService';
import { ChatMessage, CircuitComponent, WokwiConnection, ComponentType } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'intro',
    role: 'assistant',
    text: "Hello! I'm Ziro, your expert AI electronics engineer. I can help you design, understand, and build electronic circuits. What can I do for you today?"
  }]);
  
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [connections, setConnections] = useState<WokwiConnection[]>([]);
  const [arduinoCode, setArduinoCode] = useState<string>('');
  
  // Simulation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [simulationPinStates, setSimulationPinStates] = useState<Record<string, number>>({});
  const runnerRef = useRef<AVRRunner | null>(null);

  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [canvasResetKey, setCanvasResetKey] = useState(0); 

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsProcessing(true);

    try {
      const response = await generateCircuitDesign(updatedHistory, components, connections);

      if (response.components && response.components.length > 0) {
        setComponents(response.components);
        setConnections(response.connections || []);
        setArduinoCode(response.arduinoCode || '');
      }

      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        text: response.explanation
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        text: "I'm sorry, I hit a snag while thinking. Could you try saying that again?",
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSimulation = async () => {
    if (isSimulating) {
      runnerRef.current?.stop();
      runnerRef.current = null;
      setIsSimulating(false);
      setSimulationPinStates({});
      return;
    }

    if (!arduinoCode) {
      alert("No code to simulate! Ask Ziro to generate a circuit first.");
      return;
    }

    setIsCompiling(true);
    try {
      const hex = await compileArduinoCode(arduinoCode);
      const runner = new AVRRunner(hex, (update: SimulationUpdate) => {
        setSimulationPinStates(update.pinStates);
      });
      runnerRef.current = runner;
      runner.execute();
      setIsSimulating(true);
    } catch (err: any) {
      console.error("Simulation Start Error:", err);
      alert("Simulation Error: " + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleClear = () => {
    if (isSimulating) {
      runnerRef.current?.stop();
      runnerRef.current = null;
      setIsSimulating(false);
    }
    setComponents([]);
    setConnections([]);
    setArduinoCode('');
    setSimulationPinStates({});
    setMessages([{
      id: uuidv4(),
      role: 'assistant',
      text: "Canvas cleared! I'm ready for a fresh project. What's the new plan?"
    }]);
  };

  const handleAddComponent = (type: ComponentType) => {
    // Offset new components so they don't stack exactly on top of each other
    const offset = components.length * 20;
    const newComp: CircuitComponent = {
        id: `comp-${uuidv4().slice(0, 8)}`,
        type,
        x: 300 + offset,
        y: 200 + offset,
        rotation: 0,
        attributes: {},
        label: type.replace('wokwi-', '')
    };
    setComponents(prev => [...prev, newComp]);
  };

  const handleComponentMove = (id: string, x: number, y: number) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, x, y } : comp
    ));
  };

  const handleConnectionCreated = (sourceId: string, sourcePin: string, targetId: string, targetPin: string) => {
     const newConnection: WokwiConnection = [`${sourceId}:${sourcePin}`, `${targetId}:${targetPin}`, "green"];
     setConnections(prev => {
        const exists = prev.some(c => 
          (c[0] === newConnection[0] && c[1] === newConnection[1]) ||
          (c[0] === newConnection[1] && c[1] === newConnection[0])
        );
        if (exists) return prev;
        return [...prev, newConnection];
     });
  };

  const handleResetZoom = () => {
      setCanvasResetKey(prev => prev + 1);
  };

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (runnerRef.current) {
        runnerRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1115] text-white font-sans">
      <ComponentLibrary onAddComponent={handleAddComponent} />

      <div className="flex-1 flex flex-col bg-[#0b0d11] overflow-hidden relative">
        <UpperToolbar 
          onViewCode={() => setIsCodeEditorOpen(true)} 
          onSimulate={toggleSimulation}
          isSimulating={isSimulating}
          isCompiling={isCompiling}
        />
        
        <div className="flex-1 relative bg-grid overflow-hidden">
          <Canvas 
            key={canvasResetKey}
            components={components} 
            connections={connections} 
            isLoading={isProcessing} 
            onComponentMove={handleComponentMove}
            onConnectionCreated={handleConnectionCreated}
            simulationPinStates={isSimulating ? simulationPinStates : undefined}
          />

          {isCodeEditorOpen && (
            <CodeEditor 
              code={arduinoCode} 
              components={components}
              onCodeChange={(newCode) => setArduinoCode(newCode)}
              onClose={() => setIsCodeEditorOpen(false)} 
            />
          )}
        </div>
        
        <LowerToolbar onClear={handleClear} onResetZoom={handleResetZoom} />
      </div>

      <div className="w-96 flex-shrink-0 z-30 h-full">
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          onClear={handleClear}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

export default App;
