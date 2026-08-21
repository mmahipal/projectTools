/**
 * useDebouncedFilters Hook
 * 
 * A custom React hook that debounces filter changes to prevent excessive API calls.
 * Useful for search inputs, filter dropdowns, and other interactive filters.
 * 
 * @param {object} initialFilters - Initial filter values
 * @param {number} delay - Debounce delay in milliseconds (default: 500ms)
 * @returns {Array} [filters, setFilters, debouncedFilters]
 * 
 * @example
 * const [filters, setFilters, debouncedFilters] = useDebouncedFilters({ search: '', status: 'all' }, 500);
 * 
 * // Use debouncedFilters in API calls
 * useEffect(() => {
 *   fetchData(debouncedFilters);
 * }, [debouncedFilters]);
 */
import { useState, useEffect, useRef } from 'react';
import { debounce } from '../utils/debounce';

export const useDebouncedFilters = (initialFilters, delay = 500) => {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);
  
  // Create debounced function using useRef to persist across renders
  const debouncedSetFilters = useRef(
    debounce((newFilters) => {
      setDebouncedFilters(newFilters);
    }, delay)
  ).current;
  
  // Update debounced filters when filters change
  useEffect(() => {
    debouncedSetFilters(filters);
  }, [filters, debouncedSetFilters]);
  
  return [filters, setFilters, debouncedFilters];
};

export default useDebouncedFilters;
