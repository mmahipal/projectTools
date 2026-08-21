/**
 * useVisibilityAwarePolling Hook
 * 
 * A custom React hook that implements intelligent polling with visibility awareness.
 * Automatically pauses polling when the browser tab is hidden and resumes when visible.
 * 
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds
 * @param {object} options - Configuration options
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {boolean} options.pauseWhenHidden - Whether to pause when tab is hidden (default: true)
 * 
 * @example
 * // Basic usage - poll every 60 seconds, pause when hidden
 * useVisibilityAwarePolling(() => {
 *   fetchData();
 * }, 60000);
 * 
 * @example
 * // Poll every 30 seconds, continue even when hidden
 * useVisibilityAwarePolling(() => {
 *   fetchData();
 * }, 30000, { pauseWhenHidden: false });
 * 
 * @example
 * // Conditionally enable polling
 * useVisibilityAwarePolling(() => {
 *   fetchData();
 * }, 60000, { enabled: isActive });
 */

import { useEffect, useRef } from 'react';

export const useVisibilityAwarePolling = (callback, interval, options = {}) => {
  const { enabled = true, pauseWhenHidden = true } = options;
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);
  
  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    const poll = () => {
      // Only poll if tab is visible (or if pauseWhenHidden is false)
      if (!pauseWhenHidden || !document.hidden) {
        callbackRef.current();
      }
    };
    
    // Poll immediately on mount/enable
    poll();
    
    // Set up interval polling
    intervalRef.current = setInterval(poll, interval);
    
    // Handle visibility changes - poll immediately when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && pauseWhenHidden) {
        // Tab became visible, poll immediately
        poll();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, pauseWhenHidden]);
};

export default useVisibilityAwarePolling;
