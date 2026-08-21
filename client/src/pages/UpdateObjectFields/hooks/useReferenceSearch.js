// Custom hook for reference field search functionality

import { useState, useRef, useCallback } from 'react';
import { searchReference } from '../services/apiService';

export const useReferenceSearch = () => {
  const [referenceSearchTerm, setReferenceSearchTerm] = useState('');
  const [referenceSearchResults, setReferenceSearchResults] = useState([]);
  const [searchingReference, setSearchingReference] = useState(false);
  const [showReferenceDropdown, setShowReferenceDropdown] = useState(false);
  const referenceSearchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const performSearch = useCallback(async (referenceObject, searchTerm) => {
    if (!referenceObject || !searchTerm || searchTerm.trim() === '') {
      setReferenceSearchResults([]);
      setShowReferenceDropdown(false);
      return;
    }

    setSearchingReference(true);
    setShowReferenceDropdown(true);

    try {
      const results = await searchReference(referenceObject, searchTerm);
      setReferenceSearchResults(results);
    } catch (error) {
      console.error('Error searching reference:', error);
      setReferenceSearchResults([]);
    } finally {
      setSearchingReference(false);
    }
  }, []);

  const handleSearch = useCallback((referenceObject, value) => {
    setReferenceSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value || value.trim() === '') {
      setReferenceSearchResults([]);
      setShowReferenceDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(referenceObject, value);
    }, 300);
  }, [performSearch]);

  return {
    referenceSearchTerm,
    setReferenceSearchTerm,
    referenceSearchResults,
    setReferenceSearchResults,
    searchingReference,
    showReferenceDropdown,
    setShowReferenceDropdown,
    referenceSearchRef,
    handleSearch,
    performSearch
  };
};

