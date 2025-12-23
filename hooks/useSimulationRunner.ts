
import { useState, useRef, useEffect, useCallback } from 'react';
import { AVRRunner, SimulationUpdate, compileArduinoCode } from '../services/simulationService';

export const useSimulationRunner = (arduinoCode: string) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [simulationPinStates, setSimulationPinStates] = useState<Record<string, number>>({});
  const [serialOutput, setSerialOutput] = useState<string>("");
  
  const runnerRef = useRef<AVRRunner | null>(null);

  useEffect(() => {
    return () => {
      if (runnerRef.current) {
        runnerRef.current.stop();
      }
    };
  }, []);

  const stopSimulation = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.stop();
      runnerRef.current = null;
    }
    setIsSimulating(false);
    setSimulationPinStates({});
    // We optionally clear serial output on stop, or keep it for review. Keeping it for now.
  }, []);

  const startSimulation = useCallback(async () => {
    if (!arduinoCode) {
        throw new Error("No code to simulate!");
    }
    setIsCompiling(true);
    setSerialOutput(""); // Clear previous run output
    try {
        const hex = await compileArduinoCode(arduinoCode);
        const runner = new AVRRunner(hex, (update: SimulationUpdate) => {
          setSimulationPinStates(update.pinStates);
          if (update.serialOutput) {
            setSerialOutput(prev => prev + update.serialOutput);
          }
        });
        runnerRef.current = runner;
        runner.execute();
        setIsSimulating(true);
    } catch (err) {
        throw err;
    } finally {
        setIsCompiling(false);
    }
  }, [arduinoCode]);

  const toggleSimulation = useCallback(async () => {
    if (isSimulating) {
      stopSimulation();
    } else {
      try {
        await startSimulation();
      } catch (e: any) {
        alert("Simulation Error: " + e.message);
      }
    }
  }, [isSimulating, startSimulation, stopSimulation]);

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
     if (runnerRef.current && isSimulating) {
        runnerRef.current.serialWrite(text);
     }
  }, [isSimulating]);

  const clearSerialOutput = useCallback(() => {
    setSerialOutput("");
  }, []);

  return {
    isSimulating,
    isCompiling,
    simulationPinStates,
    serialOutput,
    toggleSimulation,
    resetSimulation,
    stopSimulation,
    sendSerialInput,
    clearSerialOutput
  };
};
