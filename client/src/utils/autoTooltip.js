/**
 * Utility to automatically add tooltips to truncated elements
 * Call this function on elements that might be truncated
 */
export const addAutoTooltip = (element) => {
  if (!element) return;

  const checkAndAddTooltip = () => {
    const isTruncated = element.scrollWidth > element.clientWidth || 
                       element.scrollHeight > element.clientHeight;
    
    if (isTruncated) {
      const text = element.textContent || element.innerText || '';
      if (text && !element.getAttribute('data-tooltip-added')) {
        element.setAttribute('title', text);
        element.setAttribute('data-tooltip-added', 'true');
      }
    } else {
      // Remove tooltip if not truncated
      if (element.getAttribute('data-tooltip-added')) {
        element.removeAttribute('title');
        element.removeAttribute('data-tooltip-added');
      }
    }
  };

  // Check initially
  checkAndAddTooltip();

  // Recheck on resize
  let resizeObserver = null;
  try {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkAndAddTooltip();
      });
      resizeObserver.observe(element);
    }
  } catch (error) {
    console.warn('ResizeObserver not available:', error);
  }

  return () => {
    if (resizeObserver) {
      try {
        resizeObserver.disconnect();
      } catch (error) {
        console.warn('Error disconnecting ResizeObserver:', error);
      }
    }
  };
};

/**
 * Apply auto tooltips to all elements with specific selectors
 */
export const applyAutoTooltips = () => {
  try {
    // Apply to table headers and cells
    const tableHeaders = document.querySelectorAll('.case-table th, table th');
    const tableCells = document.querySelectorAll('.case-table td, table td');
    const pageTitles = document.querySelectorAll('.page-title');
    const navLabels = document.querySelectorAll('.nav-label');
    const contentHeaders = document.querySelectorAll('.content-header h2, .content-header h3');

    [...tableHeaders, ...tableCells, ...pageTitles, ...navLabels, ...contentHeaders].forEach(element => {
      try {
        if (element && typeof addAutoTooltip === 'function') {
          addAutoTooltip(element);
        }
      } catch (error) {
        console.warn('Error applying tooltip to element:', error);
      }
    });
  } catch (error) {
    console.warn('Error in applyAutoTooltips:', error);
  }
};

