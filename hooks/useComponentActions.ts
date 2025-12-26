import React, { useState, useCallback } from 'react';
import { CircuitComponent, WokwiConnection, ComponentType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UseComponentActionsProps {
  components: CircuitComponent[];
  setComponents: React.Dispatch<React.SetStateAction<CircuitComponent[]>>;
  connections: WokwiConnection[];
  setConnections: React.Dispatch<React.SetStateAction<WokwiConnection[]>>;
  saveToHistory: (comps: CircuitComponent[], conns: WokwiConnection[]) => void;
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  setIsPropertiesOpen: (open: boolean) => void;
}

export const useComponentActions = ({
  components,
  setComponents,
  connections,
  setConnections,
  saveToHistory,
  selectedComponentId,
  setSelectedComponentId,
  setIsPropertiesOpen
}: UseComponentActionsProps) => {

  const addComponent = useCallback((type: ComponentType) => {
    const offset = components.length * 20;

    // Default attributes for specific components to prevent rendering errors (like NaNmm)
    const defaultAttributes: Record<string, any> = {};
    if (type === 'wokwi-neopixel') {
      defaultAttributes.pixels = "1";
    }

    const newComp: CircuitComponent = {
      id: `comp-${uuidv4().slice(0, 8)}`,
      type,
      x: 100 + offset,
      y: 200 + offset,
      rotation: 0,
      attributes: defaultAttributes,
      label: type.replace('wokwi-', '')
    };
    const newComps = [...components, newComp];
    setComponents(newComps);
    saveToHistory(newComps, connections);
    setSelectedComponentId(newComp.id);
  }, [components, connections, setComponents, saveToHistory, setSelectedComponentId]);

  const moveComponent = useCallback((id: string, x: number, y: number) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id ? { ...comp, x, y } : comp
    ));
    setSelectedComponentId(id);
  }, [setComponents, setSelectedComponentId]);

  const deleteComponent = useCallback(() => {
    if (!selectedComponentId) return;
    const newComps = components.filter(c => c.id !== selectedComponentId);
    const newConns = connections.filter(c =>
      !c[0].startsWith(selectedComponentId) && !c[1].startsWith(selectedComponentId)
    );
    setComponents(newComps);
    setConnections(newConns);
    saveToHistory(newComps, newConns);
    setSelectedComponentId(null);
    setIsPropertiesOpen(false);
  }, [components, connections, selectedComponentId, setComponents, setConnections, saveToHistory, setSelectedComponentId, setIsPropertiesOpen]);

  const rotateComponent = useCallback(() => {
    if (!selectedComponentId) return;
    const newComps = components.map(c =>
      c.id === selectedComponentId ? { ...c, rotation: (c.rotation + 90) % 360 } : c
    );
    setComponents(newComps);
    saveToHistory(newComps, connections);
  }, [components, connections, selectedComponentId, setComponents, saveToHistory]);

  const flipHorizontal = useCallback(() => {
    if (!selectedComponentId) return;
    const newComps = components.map(c => {
      if (c.id !== selectedComponentId) return c;
      const currentFlip = !!c.attributes.flipX;
      return { ...c, attributes: { ...c.attributes, flipX: !currentFlip } };
    });
    setComponents(newComps);
    saveToHistory(newComps, connections);
  }, [components, connections, selectedComponentId, setComponents, saveToHistory]);

  const flipVertical = useCallback(() => {
    if (!selectedComponentId) return;
    const newComps = components.map(c => {
      if (c.id !== selectedComponentId) return c;
      const currentFlip = !!c.attributes.flipY;
      return { ...c, attributes: { ...c.attributes, flipY: !currentFlip } };
    });
    setComponents(newComps);
    saveToHistory(newComps, connections);
  }, [components, connections, selectedComponentId, setComponents, saveToHistory]);

  const updateComponent = useCallback((id: string, updates: Partial<CircuitComponent>) => {
    const newComps = components.map(c => c.id === id ? { ...c, ...updates } : c);
    setComponents(newComps);
    saveToHistory(newComps, connections);
  }, [components, connections, setComponents, saveToHistory]);

  const createConnection = useCallback((sourceId: string, sourcePin: string, targetId: string, targetPin: string) => {
    const newConnection: WokwiConnection = [`${sourceId}:${sourcePin}`, `${targetId}:${targetPin}`, "green"];
    const newConns = connections.some(c =>
      (c[0] === newConnection[0] && c[1] === newConnection[1]) ||
      (c[0] === newConnection[1] && c[1] === newConnection[0])
    ) ? connections : [...connections, newConnection];

    if (newConns.length > connections.length) {
      setConnections(newConns);
      saveToHistory(components, newConns);
    }
  }, [components, connections, setConnections, saveToHistory]);

  return {
    addComponent,
    moveComponent,
    deleteComponent,
    rotateComponent,
    flipHorizontal,
    flipVertical,
    updateComponent,
    createConnection
  };
};