// Custom hook for field mappings state management

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_FIELD_MAPPING } from '../constants';
import { getMappingStatus, getMappingSummary, createNewMapping } from '../utils/mappingUtils';

export const useFieldMappings = (fields, sourceFields) => {
  const [fieldMappings, setFieldMappings] = useState([createNewMapping()]);
  const [selectedMappingId, setSelectedMappingId] = useState(null);
  const [useHybridView, setUseHybridView] = useState(false);

  // Initialize selected mapping when mappings change
  useEffect(() => {
    if (fieldMappings.length > 0 && useHybridView) {
      if (!selectedMappingId || !fieldMappings.find(m => m.id === selectedMappingId)) {
        setSelectedMappingId(fieldMappings[0].id);
      }
    }
  }, [fieldMappings, useHybridView, selectedMappingId]);

  // Add new mapping
  const addMapping = useCallback(() => {
    const newMapping = createNewMapping();
    setFieldMappings(prev => [...prev, newMapping]);
    if (useHybridView) {
      setSelectedMappingId(newMapping.id);
    }
  }, [useHybridView]);

  // Remove mapping
  const removeMapping = useCallback((mappingId) => {
    setFieldMappings(prev => {
      const filtered = prev.filter(m => m.id !== mappingId);
      if (filtered.length === 0) {
        return [createNewMapping()];
      }
      return filtered;
    });
    if (selectedMappingId === mappingId) {
      const remaining = fieldMappings.filter(m => m.id !== mappingId);
      setSelectedMappingId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [selectedMappingId, fieldMappings]);

  // Update mapping
  const updateMapping = useCallback((mappingId, updates) => {
    setFieldMappings(prev => prev.map(m => 
      m.id === mappingId ? { ...m, ...updates } : m
    ));
  }, []);

  // Get mapping status
  const getStatus = useCallback((mapping) => {
    return getMappingStatus(mapping);
  }, []);

  // Get mapping summary
  const getSummary = useCallback((mapping) => {
    return getMappingSummary(mapping, fields, sourceFields);
  }, [fields, sourceFields]);

  return {
    fieldMappings,
    setFieldMappings,
    selectedMappingId,
    setSelectedMappingId,
    useHybridView,
    setUseHybridView,
    addMapping,
    removeMapping,
    updateMapping,
    getStatus,
    getSummary
  };
};

