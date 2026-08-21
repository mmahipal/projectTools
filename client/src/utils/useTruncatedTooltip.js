import { useState, useRef, useEffect } from 'react';

/**
 * Hook that detects if text is truncated and provides tooltip functionality
 * Returns: { ref, isTruncated, showTooltip, handleMouseEnter, handleMouseLeave }
 */
export const useTruncatedTooltip = (text) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (ref.current) {
        const element = ref.current;
        // Check if text is truncated (scrollWidth > clientWidth for horizontal, scrollHeight > clientHeight for vertical)
        const isTextTruncated = element.scrollWidth > element.clientWidth || 
                                element.scrollHeight > element.clientHeight;
        setIsTruncated(isTextTruncated);
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully rendered
    let rafId = null;
    try {
      rafId = requestAnimationFrame(() => {
        checkTruncation();
        // Also check after a small delay to catch any async updates
        setTimeout(checkTruncation, 100);
      });
    } catch (error) {
      console.warn('Error in requestAnimationFrame:', error);
      // Fallback to setTimeout
      setTimeout(checkTruncation, 100);
    }
    
    // Recheck on window resize
    const handleResize = () => {
      try {
        requestAnimationFrame(() => {
          checkTruncation();
        });
      } catch (error) {
        checkTruncation();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also use MutationObserver to detect content changes
    let observer = null;
    let observerTimeout = null;
    // Use a timeout to ensure ref.current is available
    try {
      observerTimeout = setTimeout(() => {
        if (ref.current && typeof MutationObserver !== 'undefined') {
          try {
            observer = new MutationObserver(() => {
              checkTruncation();
            });
            observer.observe(ref.current, {
              childList: true,
              subtree: true,
              characterData: true,
              attributes: true,
              attributeFilter: ['style', 'class']
            });
          } catch (error) {
            console.warn('Error creating MutationObserver:', error);
          }
        }
      }, 0);
    } catch (error) {
      console.warn('Error setting up MutationObserver:', error);
    }
    
    return () => {
      try {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        if (observerTimeout) {
          clearTimeout(observerTimeout);
        }
        window.removeEventListener('resize', handleResize);
        if (observer) {
          observer.disconnect();
        }
      } catch (error) {
        console.warn('Error cleaning up tooltip hook:', error);
      }
    };
  }, [text]);

  const handleMouseEnter = () => {
    if (isTruncated) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return {
    ref,
    isTruncated,
    showTooltip,
    setShowTooltip,
    handleMouseEnter,
    handleMouseLeave
  };
};

