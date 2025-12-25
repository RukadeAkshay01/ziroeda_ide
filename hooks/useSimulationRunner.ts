
import { useState, useRef, useEffect, useCallback } from 'react';
import { SimulationService, SimulationUpdate, compileArduinoCode } from '../services/simulationService';
import { CircuitComponent, WokwiConnection } from '../types';

import { CircuitSimulator } from '../simulator/core/Simulator';

export const useSimulationRunner = (
  components: CircuitComponent[],
  connections: WokwiConnection[],
  arduinoCode: string,
  onTick?: (simulator: CircuitSimulator) => void
) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [simulationPinStates, setSimulationPinStates] = useState<Record<string, number>>({});
  const [serialOutput, setSerialOutput] = useState<string>("");

  const serviceRef = useRef<SimulationService | null>(null);

  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stop();
      }
    };
  }, []);

  const stopSimulation = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
      serviceRef.current = null;
    }
    setIsSimulating(false);
    setIsPaused(false);
    setSimulationPinStates({});
  }, []);

  const startSimulation = useCallback(async () => {
    if (!arduinoCode) {
      throw new Error("No code to simulate!");
    }
    setIsCompiling(true);
    setSerialOutput("");
    try {
      const service = new SimulationService((update: SimulationUpdate) => {
        if (Object.keys(update.pinStates).length > 0) {
          setSimulationPinStates(update.pinStates);
        }
        if (update.serialOutput) {
          setSerialOutput(prev => prev + update.serialOutput);
        }
      }, onTick);
      serviceRef.current = service;
      await service.start(components, connections, arduinoCode);
      setIsSimulating(true);
      setIsPaused(false);
    } catch (err) {
      throw err;
    } finally {
      setIsCompiling(false);
    }
  }, [components, connections, arduinoCode]);

  const toggleSimulation = useCallback(async () => {
    if (isSimulating) {
      if (isPaused) {
        // Resume
        serviceRef.current?.resume();
        setIsPaused(false);
      } else {
        // Pause
        serviceRef.current?.pause();
        setIsPaused(true);
      }
    } else {
      // Start
      try {
        await startSimulation();
      } catch (e: any) {
        alert("Simulation Error: " + e.message);
      }
    }
  }, [isSimulating, isPaused, startSimulation]);

  const resetSimulation = useCallback(async () => {
    if (isSimulating) {
      stopSimulation();
      try {
        await startSimulation();
      } catch (e: any) {
        alert("Reset Failed: " + e.message);
      }
    }
  }, [isSimulating, stopSimulation, startSimulation]);

  const sendSerialInput = useCallback((text: string) => {
    if (serviceRef.current && isSimulating) {
      serviceRef.current.serialWrite(text);
    }
  }, [isSimulating]);

  const clearSerialOutput = useCallback(() => {
    setSerialOutput("");
  }, []);

  return {
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
    getSimulator: () => serviceRef.current?.getSimulator(),
    handleComponentEvent: (id: string, name: string, detail: any) => serviceRef.current?.handleComponentEvent(id, name, detail)
  };
};
