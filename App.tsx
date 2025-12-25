
import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import ZiroedaLogo from './components/ZiroedaLogo';
import Canvas, { CanvasHandle } from './components/Canvas';
import ComponentLibrary from './components/ComponentLibrary';
import UpperToolbar from './components/UpperToolbar';
import LowerToolbar from './components/LowerToolbar';
import CodeEditor from './components/CodeEditor';
import PropertiesPanel from './components/PropertiesPanel';
import BillOfMaterials from './components/BillOfMaterials';
import SerialMonitor from './components/SerialMonitor';
import { generateCircuitDesign } from './services/geminiService';
import { ChatMessage, CircuitComponent, WokwiConnection } from './types';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquare } from 'lucide-react';

import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import LoginOverlay from './components/LoginOverlay';

import { useCircuitHistory } from './hooks/useCircuitHistory';
import { useSimulationRunner } from './hooks/useSimulationRunner';
import { useComponentActions } from './hooks/useComponentActions';
import { saveProject, loadProject, fetchProjectVersions, createProjectVersion, ProjectVersion } from './services/supabase';
import VersionHistoryPanel from './components/VersionHistoryPanel';

import { useAutosave } from './hooks/useAutosave';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Project State
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("Untitled Project");
  const [isPublic, setIsPublic] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'intro',
    role: 'assistant',
    text: "Hello! I'm Ziro, your expert AI electronics engineer. I can help you design, understand, and build electronic circuits. What can I do for you today?"
  }]);

  // Circuit State
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [connections, setConnections] = useState<WokwiConnection[]>([]);
  const [arduinoCode, setArduinoCode] = useState<string>('');

  // Autosave Hook
  const { saveStatus, lastSavedAt } = useAutosave({
    components,
    connections,
    code: arduinoCode,
    user,
    projectId,
    setProjectId,
    projectName,
    messages,
    isPublic,
    isReadOnly
  });

  // Hooks
  const { historyIndex, historyLength, saveToHistory, undo, redo, resetHistory } = useCircuitHistory();
  const {
    isSimulating,
    isPaused,
    isCompiling,
    simulationPinStates,
    serialOutput,
    toggleSimulation,
    resetSimulation,
    stopSimulation,
    sendSerialInput,
    clearSerialOutput,
    handleComponentEvent,
    getSimulator
  } = useSimulationRunner(components, connections, arduinoCode, (simulator) => {
    canvasRef.current?.updateVisuals(simulator);
  });

  const handleStopSimulation = () => {
    stopSimulation();
    canvasRef.current?.resetVisuals();
  };

  // Auto-reset simulation on edit
  useEffect(() => {
    if (isSimulating) {
      handleStopSimulation();
    }
  }, [components, connections, arduinoCode]);

  // Selection & UI State
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);

  const [isBOMOpen, setIsBOMOpen] = useState(false);
  const [isSerialMonitorOpen, setIsSerialMonitorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Responsive UI State
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // FAB Drag State
  const [fabPos, setFabPos] = useState<{ x: number, y: number } | null>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
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

  // Handle URL Prompt & Project Loading
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get('prompt');
    const urlProjectId = params.get('projectId');

    if (prompt) {
      // Send the message
      handleSendMessage(prompt);

      // Clean up the URL (remove prompt but keep projectId if needed, though usually we load project first)
      const newUrl = window.location.pathname + (urlProjectId ? `?projectId=${urlProjectId}` : '');
      window.history.replaceState({}, '', newUrl);
    }

    if (urlProjectId) {
      const fetchProject = async () => {
        try {
          const project = await loadProject(urlProjectId);
          if (project && project.design) {
            setComponents(project.design.components || []);
            setConnections(project.design.connections || []);
            setArduinoCode(project.design.code || '');
            setProjectId(urlProjectId);
            setProjectName(project.name || "Untitled Project");
            setIsPublic(project.is_public || false);

            // Restore chat history if available
            if (project.chat_history && project.chat_history.length > 0) {
              setMessages(project.chat_history);
            }

            // Determine Read-Only Status
            if (user && user.uid === project.owner_id) {
              setIsReadOnly(false);
            } else if (project.public_access === 'edit') {
              setIsReadOnly(false);
            } else {
              setIsReadOnly(true);
            }

            // Add to history
            saveToHistory(project.design.components || [], project.design.connections || []);
          }
        } catch (error) {
          console.error("Failed to load project:", error);
          alert("Failed to load project. It might not exist or you don't have permission.");
        }
      };
      if (user) {
        fetchProject();
      } else {
        // Wait for auth to initialize
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            fetchProject();
          }
          unsubscribe();
        });
      }
    }
  }, [user]); // Re-run when user auth state changes

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsProcessing(true);

    try {
      // Call service
      const { design } = await generateCircuitDesign(updatedHistory, components, connections);

      if (design.components && design.components.length > 0) {
        setComponents(design.components);
        setConnections(design.connections || []);
        setArduinoCode(design.arduinoCode || '');

        // Update project name if AI suggests one and current name is "Untitled Project"
        if (design.projectName && (projectName === "Untitled Project" || projectName === "")) {
          setProjectName(design.projectName);
        }

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
    setProjectName("Untitled Project");
    setMessages([{
      id: uuidv4(),
      role: 'assistant',
      text: "Canvas cleared! I'm ready for a fresh project. What's the new plan?"
    }]);
    resetHistory();
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save your project.");
      return;
    }

    try {
      const projectData = {
        name: projectName,
        description: "Created with ZiroEDA",
        owner_id: user.uid,
        owner_name: user.displayName || "Anonymous",
        is_public: false,
        design: {
          components,
          connections,
          code: arduinoCode
        }
      };

      await saveProject(projectData);
      alert("Project saved successfully!");
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("Failed to save project. See console for details.");
    }
  };

  const handleShare = () => {
    // Repurposing Share for Save temporarily as requested/implied
    handleSave();
  };

  const handleToggleHistory = async () => {
    const newState = !isHistoryOpen;
    setIsHistoryOpen(newState);
    if (newState && projectId) {
      setIsHistoryLoading(true);
      try {
        const versions = await fetchProjectVersions(projectId);
        setProjectVersions(versions);
      } catch (error) {
        console.error("Failed to load versions", error);
      } finally {
        setIsHistoryLoading(false);
      }
    }
  };

  const handleCreateVersion = async (name: string) => {
    if (!projectId) {
      alert("Please save the project first.");
      return;
    }
    try {
      const design = {
        components,
        connections,
        code: arduinoCode
      };
      await createProjectVersion(projectId, design, name);
      // Refresh list
      const versions = await fetchProjectVersions(projectId);
      setProjectVersions(versions);
    } catch (error) {
      console.error("Failed to create version", error);
      alert("Failed to create version.");
    }
  };

  const handleLoadVersion = (version: ProjectVersion) => {
    if (confirm("Load this version? Unsaved changes to current state will be lost.")) {
      setComponents(version.design.components || []);
      setConnections(version.design.connections || []);
      setArduinoCode(version.design.code || '');
      setIsHistoryOpen(false);
      saveToHistory(version.design.components || [], version.design.connections || []);
    }
  };

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  if (authLoading) {
    return <div className="flex h-[100dvh] w-screen items-center justify-center bg-dark-900 text-white">Loading...</div>;
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-dark-900 text-white font-sans relative">
      {!user && <LoginOverlay />}

      {/* --- MOBILE: Library Drawer (90% from Left) --- */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${isLibraryOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsLibraryOpen(false)}
        />
        {/* Drawer Panel */}
        <div className={`absolute left-0 top-0 bottom-0 w-[90%] bg-dark-900 shadow-2xl transition-transform duration-300 ease-in-out ${isLibraryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <ComponentLibrary onAddComponent={handleAddComponent} />
          {/* Close handle for accessibility */}
          <div className="absolute top-1/2 -right-6 w-6 h-12 bg-dark-900 rounded-r-lg flex items-center justify-center text-gray-500" onClick={() => setIsLibraryOpen(false)}>
            ‹
          </div>
        </div>
      </div>

      {/* --- DESKTOP: Library Sidebar --- */}
      <div
        className={`hidden md:block flex-shrink-0 h-full border-r border-dark-700 bg-dark-900 transition-[width,opacity] duration-300 ease-in-out overflow-hidden ${isLibraryOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-none'
          }`}
      >
        <ComponentLibrary onAddComponent={addComponent} />
      </div>

      {/* --- CENTER: Main Application Area --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-dark-800 relative z-10">
        <UpperToolbar
          onViewCode={() => setIsCodeEditorOpen(prev => !prev)}
          onSimulate={toggleSimulation}
          onResetSimulation={handleStopSimulation}
          onViewSerialMonitor={() => setIsSerialMonitorOpen(prev => !prev)}
          onViewSchematic={() => alert("Schematic View: Feature Coming Soon")}
          onViewBOM={() => setIsBOMOpen(prev => !prev)}
          onHistoryClick={handleToggleHistory}
          isSimulating={isSimulating}
          isPaused={isPaused}
          isCompiling={isCompiling}
          toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
          isLibraryOpen={isLibraryOpen}
          isReadOnly={isReadOnly}
        />

        <div className="flex-1 relative bg-grid overflow-hidden">
          <Canvas
            ref={canvasRef}
            key={canvasResetKey}
            components={components}
            connections={connections}
            isLoading={isProcessing}
            selectedComponentId={selectedComponentId}
            onSelectComponent={(id) => { setSelectedComponentId(id); if (!id) setIsPropertiesOpen(false); }}
            onComponentMove={moveComponent}
            onDragEnd={() => saveToHistory(components, connections)}
            onConnectionCreated={createConnection}
            simulationPinStates={isSimulating ? simulationPinStates : undefined}
            onComponentEvent={handleComponentEvent}
            simulator={getSimulator()}
            isSimulating={isSimulating}
            isReadOnly={isReadOnly}
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

      {isHistoryOpen && (
        <VersionHistoryPanel
          versions={projectVersions}
          onCreateVersion={handleCreateVersion}
          onLoadVersion={handleLoadVersion}
          isLoading={isHistoryLoading}
          onClose={() => setIsHistoryOpen(false)}
          isReadOnly={isReadOnly}
        />
      )}

      {/* --- DESKTOP: Chat Sidebar --- */}
      <div className="hidden md:block w-96 flex-shrink-0 z-30 h-full border-l border-dark-700 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onClear={handleClear}
          isProcessing={isProcessing}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          user={user}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
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
        <div className={`absolute right-0 top-0 bottom-0 w-[90%] bg-dark-900 border-l border-dark-700 shadow-2xl transition-transform duration-300 ease-in-out ${isMobileChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClear={handleClear}
            isProcessing={isProcessing}
            projectName={projectName}
            onProjectNameChange={setProjectName}
            user={user}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
          />
        </div>
      </div>

      {/* --- MOBILE: Draggable Chat FAB --- */}
      <button
        className={`md:hidden fixed z-40 w-14 h-14 bg-dark-900/80 backdrop-blur-md rounded-full shadow-[0_0_20px_rgba(20,184,166,0.3)] border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform ${isMobileChatOpen ? 'hidden' : 'block'}`}
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
        <ZiroedaLogo className="w-8 h-8" />
        {/* Notification dot if processing */}
        {isProcessing && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-brand-500 rounded-full animate-bounce" />
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

    </div>
  );
};

export default App;
