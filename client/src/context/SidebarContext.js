import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext({
  sidebarWidth: 320,
  isOpen: true,
  updateWidth: () => {}
});

export const SidebarProvider = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const updateWidth = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        if (width > 0) {
          setSidebarWidth(width);
        }
        // Check if sidebar is open or closed
        setIsOpen(sidebar.classList.contains('sidebar-open'));
      }
    };

    // Initial update
    const timeoutId = setTimeout(updateWidth, 0);

    // Watch for width changes using ResizeObserver
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            setSidebarWidth(width);
          }
          setIsOpen(entry.target.classList.contains('sidebar-open'));
        }
      });

      resizeObserver.observe(sidebar);

      // Also listen for transition end and class changes
      sidebar.addEventListener('transitionend', updateWidth);
      
      // Use MutationObserver to watch for class changes
      const mutationObserver = new MutationObserver(updateWidth);
      mutationObserver.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        sidebar.removeEventListener('transitionend', updateWidth);
        mutationObserver.disconnect();
      };
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Also update on window resize
  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        if (width > 0) {
          setSidebarWidth(width);
        }
        setIsOpen(sidebar.classList.contains('sidebar-open'));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ sidebarWidth, isOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    // Fallback if context is not available
    const sidebar = document.querySelector('.sidebar');
    const width = sidebar ? sidebar.offsetWidth : 320;
    const isOpen = sidebar ? sidebar.classList.contains('sidebar-open') : true;
    return { sidebarWidth: width, isOpen };
  }
  return context;
};

export default SidebarContext;


