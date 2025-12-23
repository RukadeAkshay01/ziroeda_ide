
import { useState, useCallback } from 'react';
import { CircuitComponent, WokwiConnection } from '../types';

interface HistoryState {
  components: CircuitComponent[];
  connections: WokwiConnection[];
}

export const useCircuitHistory = () => {
  const [history, setHistory] = useState<HistoryState[]>([{ components: [], connections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((newComps: CircuitComponent[], newConns: WokwiConnection[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ components: newComps, connections: newConns });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback((): HistoryState | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback((): HistoryState | null => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const resetHistory = useCallback(() => {
    setHistory([{ components: [], connections: [] }]);
    setHistoryIndex(0);
  }, []);

  return {
    historyIndex,
    historyLength: history.length,
    saveToHistory,
    undo,
    redo,
    resetHistory
  };
};
