// Custom hook for transformation history (undo/redo)

import { useState, useEffect, useCallback } from 'react';
import { MAX_HISTORY_STATES } from '../constants';

export const useTransformationHistory = (fieldMappings) => {
  const [transformationHistory, setTransformationHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Track history when mappings change
  useEffect(() => {
    if (fieldMappings.length > 0) {
      const currentState = JSON.parse(JSON.stringify(fieldMappings));
      setTransformationHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(currentState);
        if (newHistory.length > MAX_HISTORY_STATES) {
          newHistory.shift();
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_STATES - 1));
    }
  }, [fieldMappings.length]); // Only track when mappings are added/removed

  const undo = useCallback((setFieldMappings) => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFieldMappings(JSON.parse(JSON.stringify(transformationHistory[newIndex])));
      return true;
    }
    return false;
  }, [historyIndex, transformationHistory]);

  const redo = useCallback((setFieldMappings) => {
    if (historyIndex < transformationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFieldMappings(JSON.parse(JSON.stringify(transformationHistory[newIndex])));
      return true;
    }
    return false;
  }, [historyIndex, transformationHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < transformationHistory.length - 1;

  return {
    undo,
    redo,
    canUndo,
    canRedo
  };
};

