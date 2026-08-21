/**
 * Custom hook to automatically refresh data when GPC filter override changes
 * 
 * Usage:
 *   const { override, initialized } = useGPCFilter();
 *   useGPCFilterRefresh(() => {
 *     fetchAllData(true);
 *   }, [override, initialized]);
 * 
 * This hook ensures data is refreshed when the GPC filter override changes,
 * but avoids double-fetching on initial mount.
 */

import { useEffect, useRef } from 'react';

export const useGPCFilterRefresh = (refreshCallback, dependencies = []) => {
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Call refresh callback when dependencies change
    refreshCallback();
  }, dependencies);
};

export default useGPCFilterRefresh;

