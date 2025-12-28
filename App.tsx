
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

import { auth, authenticateWithToken } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

import { useCircuitHistory } from './hooks/useCircuitHistory';
import { useSimulationRunner } from './hooks/useSimulationRunner';
import { useComponentActions } from './hooks/useComponentActions';
import { saveProject, updateProject, loadProject, fetchProjectVersions, createProjectVersion, ProjectVersion, uploadProjectPreview } from './services/supabase';
import { domToPng } from 'modern-screenshot';

import VersionHistoryPanel from './components/VersionHistoryPanel';
import { ConfirmationModal } from './components/modals/ConfirmationModal';

import { useAutosave } from './hooks/useAutosave';
import ProjectGuard, { InitializationStatus } from './components/ProjectGuard';
import { MAINTENANCE_MODE } from './maintenanceConfig';



const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Project State
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("Untitled Project");
  const [isPublic, setIsPublic] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<InitializationStatus>('initializing');

  // Canvas Ref (Moved up for useAutosave)
  const canvasRef = useRef<CanvasHandle>(null);

  // Exit Confirmation State
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isIntentionalExitRef = useRef(false);

  // Browser Exit Protection (Tab Close & Back Button)
  useEffect(() => {
    // 1. Handle Tab Close / Refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isIntentionalExitRef.current) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    // 2. Handle Back Button (Push State Trap)
    const handlePopState = (e: PopStateEvent) => {
      if (isIntentionalExitRef.current) return;

      // User pressed Back
      e.preventDefault();
      // Show confirmation
      setShowExitConfirm((prev) => {
        if (!prev) {
          // Push state again to "undo" the back navigation effectively checks the trap
          window.history.pushState(null, '', window.location.href);
          return true;
        }
        return prev;
      });
    };

    // Initialize Trap
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogoClick = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    isIntentionalExitRef.current = true;
    window.location.href = 'https://ziroeda.com';
  };

  const capturePreview = async (): Promise<string | null> => {
    if (!projectId) return null;
    const node = canvasRef.current?.getContainer();
    if (!node) return null;

    try {
      const dataUrl = await domToPng(node, {
        scale: 1, // Keep scale at 1 to prevent double-scaling of text
        features: {
          // This feature is unique to modern-screenshot
          // It removes hidden elements which sometimes mess up layout calculations
          removeControlCharacter: true,
        },
        filter: (node: any) => {
          return node.tagName !== 'IFRAME' && !node.classList?.contains('no-screenshot');
        }
      });

      // Convert Data URL to Blob for upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const url = await uploadProjectPreview(projectId, blob);

      if (url) {
        // Explicitly update the project with the new preview URL
        await updateProject(projectId, { preview_url: url });
      }

      return url;

    } catch (error) {
      console.error('Failed to capture preview:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const lastLoadedProjectId = useRef<string | null>(null);

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
    isReadOnly,
    initializationStatus,
    capturePreview
  });

  // Hooks
  const { historyIndex, historyLength, saveToHistory, undo, redo, resetHistory } = useCircuitHistory();

  // Sync Project ID to URL to enable reloads/persistence
  useEffect(() => {
    if (projectId) {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('projectId') !== projectId) {
        currentUrl.searchParams.set('projectId', projectId);
        // Clear prompt if it was there
        currentUrl.searchParams.delete('prompt');
        window.history.replaceState({}, '', currentUrl.toString());
      }
    }
  }, [projectId]);
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
  const [selectedWireIndex, setSelectedWireIndex] = useState<string | null>(null);

  const handleSelectComponent = (id: string | null) => {
    setSelectedComponentId(id);
    if (id) setSelectedWireIndex(null);
  };

  const handleSelectWire = (index: string | null) => {
    setSelectedWireIndex(index);
    if (index) setSelectedComponentId(null);
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

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
  // Canvas Ref
  // const canvasRef = useRef<CanvasHandle>(null); // Moved up

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
    addComponent, moveComponent, deleteComponent, deleteWire, rotateComponent,
    flipHorizontal, flipVertical, updateComponent, createConnection
  } = useComponentActions({
    components, setComponents, connections, setConnections, saveToHistory,
    selectedComponentId, setSelectedComponentId: handleSelectComponent,
    selectedWireIndex, setSelectedWireIndex: handleSelectWire,
    setIsPropertiesOpen
  });

  // Global Keyboard Shortcuts (Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isSimulating && !isReadOnly && (selectedComponentId || selectedWireIndex)) {
          // Check if we actually have something to delete
          if (selectedWireIndex) {
            deleteWire(selectedWireIndex);
          } else if (selectedComponentId) {
            deleteComponent();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSimulating, isReadOnly, selectedComponentId, selectedWireIndex, deleteWire, deleteComponent]);

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
    if (isReadOnly) return;
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
    const token = params.get('token');

    const handleAuth = async () => {
      if (token && initializationStatus === 'initializing') {
        setInitializationStatus('validating');
        try {
          await authenticateWithToken(token);
          // Post-auth redirect to clean URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('token');
          window.history.replaceState({}, '', newUrl.toString());
        } catch (error) {
          console.error("Token authentication failed", error);
          setInitializationStatus('unauthorized');
        }
      }
    };

    handleAuth();

    if (prompt && (initializationStatus === 'initializing' || initializationStatus === 'validating')) {
      // Send the message
      handleSendMessage(prompt);

      // Set status to ready so user can see Ziro thinking
      setInitializationStatus('ready');

      // Clean up the URL (remove prompt but keep projectId if needed)
      const newUrl = window.location.pathname + (urlProjectId ? `?projectId=${urlProjectId}` : '');
      window.history.replaceState({}, '', newUrl);
    }

    if (!urlProjectId && !prompt && !token && initializationStatus === 'initializing' && !MAINTENANCE_MODE) {
      window.location.href = 'https://ziroeda.com';
      return;
    }


    const forkId = params.get('fork');

    if (urlProjectId || forkId) {
      const fetchProject = async () => {
        const targetId = urlProjectId || forkId;

        if (!targetId) return;

        try {
          const project = await loadProject(targetId);
          if (project && project.design) {
            setComponents(project.design.components || []);
            setConnections(project.design.connections || []);
            setArduinoCode(project.design.code || '');

            if (forkId) {
              // FORK MODE: Load as new project
              setProjectId(null); // Explicitly null to trigger new save
              setProjectName(`Copy of ${project.name || "Untitled Project"}`);
              setIsPublic(false); // Forks start private
              setIsReadOnly(false); // User owns the new copy

              // Clean URL immediately
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('fork');
              window.history.replaceState({}, '', newUrl.toString());
            } else {
              // NORMAL LOAD MODE
              setProjectId(targetId);
              setProjectName(project.name || "Untitled Project");
              setIsPublic(project.is_public || false);
              lastLoadedProjectId.current = targetId;

              // Determine Read-Only Status
              if (params.get('readonly') === 'true') {
                setIsReadOnly(true);
              } else if (user && user.uid === project.owner_id) {
                setIsReadOnly(false);
              } else if (project.public_access === 'edit') {
                setIsReadOnly(false);
              } else {
                setIsReadOnly(true);
              }
            }

            // Restore chat history if available
            if (project.chat_history && project.chat_history.length > 0) {
              setMessages(project.chat_history);
            }

            // Add to history
            saveToHistory(project.design.components || [], project.design.connections || []);

            // Success!
            setInitializationStatus('ready');

            // Auto-center the loaded circuit
            setTimeout(() => {
              if (canvasRef.current) {
                canvasRef.current.zoomToFit();
              }
            }, 500);
          } else {
            setInitializationStatus('not-found');
          }
        } catch (error: any) {
          console.error("Failed to load project:", error);
          if (error?.status === 401 || error?.status === 403) {
            setInitializationStatus('unauthorized');
          } else {
            setInitializationStatus('not-found');
          }
        }
      };

      fetchProject();
    }
  }, [user]); // Re-run when user auth state changes

  // Read-only Popup Logic
  const [showReadOnlyMessage, setShowReadOnlyMessage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('readonly') === 'true') {
      setShowReadOnlyMessage(true);
    }
  }, []);

  const handleForkRedirect = () => {
    // Navigate back to history (Project Detail Page presumably)
    window.history.back();
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setLoadingMessage("Ziro is designing your circuit...");
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

        // Zoom to fit the new design
        setTimeout(() => {
          if (canvasRef.current) {
            canvasRef.current.zoomToFit();
          }
        }, 500);
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

  const handleDelete = () => {
    if (selectedWireIndex) {
      deleteWire(selectedWireIndex);
    } else {
      deleteComponent();
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
      // Trigger Manual Preview Capture
      const previewUrl = await capturePreview();

      const design = {
        components,
        connections,
        code: arduinoCode
      };

      const version = await createProjectVersion(projectId, design, name);
      // If we have a preview, we might want to attach it to the version too, 
      // but current createProjectVersion schema doesn't seemingly take previewUrl args in the func signature
      // (It takes design only).
      // But updateProject (called inside capturePreview) updates the main project pointer.

      setProjectVersions(prev => [version, ...prev]);
      setIsHistoryOpen(false);
      alert("Version created successfully and preview updated!");
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

  /* --- Drag and Drop Handling --- */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const componentType = e.dataTransfer.getData('componentType') as any;
    if (!componentType) return;

    // Calculate Drop Position
    if (canvasRef.current) {
      const container = canvasRef.current.getContainer();
      const transform = canvasRef.current.getTransform();

      if (container && transform) {
        const rect = container.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Convert to canvas coordinates: (screen - pan) / scale
        const canvasX = (clientX - rect.left - transform.x) / transform.scale;
        const canvasY = (clientY - rect.top - transform.y) / transform.scale;

        // Snap to grid (10px) - Optional but good for UX
        const snappedX = Math.round(canvasX / 10) * 10;
        const snappedY = Math.round(canvasY / 10) * 10;

        addComponent(componentType, snappedX, snappedY);

        // Mobile drawer handling not needed here as drop implies interaction
      }
    }
  };

  return (
    <ProjectGuard status={initializationStatus}>
      <div
        className="flex h-[100dvh] w-screen overflow-hidden bg-dark-900 text-white font-sans relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >

        {/* --- MOBILE: Library Drawer (90% from Left) --- */}
        <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${isLibraryOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
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
            onLogoClick={handleLogoClick}
          />

          <div className="flex-1 relative bg-grid overflow-hidden">
            <Canvas
              ref={canvasRef}
              key={canvasResetKey}
              components={components}
              connections={connections}
              isLoading={isProcessing}
              loadingMessage={loadingMessage}
              selectedComponentId={selectedComponentId}
              onSelectComponent={(id) => {
                if (id && id === selectedComponentId) {
                  // Toggle off if clicking same component
                  setSelectedComponentId(null);
                  setIsPropertiesOpen(false);
                } else {
                  // Select new component (or deselect if id is null)
                  setSelectedComponentId(id);
                  if (!id) setIsPropertiesOpen(false);
                }
              }}
              selectedWireIndex={selectedWireIndex}
              onSelectWire={handleSelectWire}
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
            isSimulating={isSimulating}
            onSelectComponent={handleSelectComponent}
            selectedWireIndex={selectedWireIndex}
            onSelectWire={handleSelectWire}
            onDelete={handleDelete}
            onComponentMove={moveComponent}
            onFlipHorizontal={flipHorizontal}
            onFlipVertical={flipVertical}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onProperties={() => setIsPropertiesOpen(!isPropertiesOpen)}
            onFitToScreen={() => canvasRef.current?.zoomToFit()}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < historyLength - 1}
            isReadOnly={isReadOnly}
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

        {/* Read Only Modal */}
        <ConfirmationModal
          isOpen={showReadOnlyMessage}
          onClose={() => setShowReadOnlyMessage(false)}
          onConfirm={handleForkRedirect}
          title="Read Only Mode"
          message="You are in Read-Only mode. Only simulation features are active. To edit this project, please go back to the project details page and fork it from there."
          confirmText="Go Back"
          cancelText="Stay in Read Only"
          type="info"
        />

        {/* Exit Confirmation Modal */}
        <ConfirmationModal
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={async () => {
            // Trigger final preview capture on exit
            // We can also trigger a manual save here if needed, but autosave usually handles it.
            // Let's assume safely that we are capturing state.
            await capturePreview();
            handleConfirmExit();
          }}
          title="Save & Exit?"
          message="We'll save your latest changes and capture a preview before taking you back to the dashboard."
          confirmText="Save & Exit"
          cancelText="Stay"
          type="info" // Changed from warning to info to be less "scary"
        />

        {/* --- DESKTOP: Chat Sidebar --- */}
        <div className="hidden md:block w-96 flex-shrink-0 z-30 h-full border-l border-dark-700 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            projectName={projectName}
            onProjectNameChange={setProjectName}
            user={user}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            isReadOnly={isReadOnly}
          />
        </div>

        {/* --- MOBILE: Chat Drawer (90% from Right) --- */}
        <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${isMobileChatOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
          {/* Backdrop (10% Click Area) */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setIsMobileChatOpen(false)}
          />
          {/* Drawer Panel */}
          <div className={`absolute right-0 top-0 bottom-0 w-[90%] bg-dark-900 border-l border-dark-700 shadow-2xl transition-transform duration-300 ease-in-out ${isMobileChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              projectName={projectName}
              onProjectNameChange={setProjectName}
              user={user}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              isReadOnly={isReadOnly}
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
            isReadOnly={isReadOnly}
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
    </ProjectGuard>
  );
};

export default App;
