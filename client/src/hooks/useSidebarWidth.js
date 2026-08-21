import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to track the actual width of the sidebar element
 * This allows pages to adjust their content width dynamically when the sidebar is resized
 * Updates in real-time during resize for smooth, interactive experience
 * 
 * @param {boolean} sidebarOpen - Whether the sidebar is currently open
 * @returns {number} The current width of the sidebar in pixels
 */
const useSidebarWidth = (sidebarOpen) => {
  const [sidebarWidth, setSidebarWidth] = useState(sidebarOpen ? 320 : 80);
  const rafIdRef = useRef(null);

  useEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      // Fallback: set based on sidebarOpen state
      setSidebarWidth(sidebarOpen ? 320 : 80);
      return;
    }

    const updateSidebarWidth = () => {
      // Cancel any pending animation frame
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Use requestAnimationFrame for smooth updates during resize
      rafIdRef.current = requestAnimationFrame(() => {
        const width = sidebar.offsetWidth;
        if (width > 0) {
          setSidebarWidth(width);
        } else {
          // Fallback if width is 0
          setSidebarWidth(sidebarOpen ? 320 : 80);
        }
      });
    };

    // Initial width - use a small delay to ensure sidebar is rendered
    const timeoutId = setTimeout(updateSidebarWidth, 0);

    // Watch for width changes using ResizeObserver with immediate updates
    const resizeObserver = new ResizeObserver((entries) => {
      // Update immediately for responsive behavior
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setSidebarWidth(width);
        }
      }
    });

    resizeObserver.observe(sidebar);

    // Also listen for transition end (when sidebar opens/closes)
    sidebar.addEventListener('transitionend', updateSidebarWidth);
    
    // Watch for style changes (when resizing via drag)
    const mutationObserver = new MutationObserver(() => {
      updateSidebarWidth();
    });

    mutationObserver.observe(sidebar, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Also update on window resize
    const handleWindowResize = () => {
      updateSidebarWidth();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timeoutId);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      sidebar.removeEventListener('transitionend', updateSidebarWidth);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [sidebarOpen]);

  return sidebarWidth;
};

export default useSidebarWidth;

