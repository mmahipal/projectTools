import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip component that only shows when content is truncated
 * Usage: <Tooltip text="Full text here"><div>Potentially truncated text</div></Tooltip>
 */
const Tooltip = ({ children, text, className = '', style = {} }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        // Check if text is truncated
        const isTextTruncated = element.scrollWidth > element.clientWidth || 
                                element.scrollHeight > element.clientHeight;
        setIsTruncated(isTextTruncated);
      }
    };

    checkTruncation();
    // Recheck on window resize
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text]);

  const handleMouseEnter = () => {
    if (isTruncated && text) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // If no text provided, use children's text content
  const tooltipText = text || (contentRef.current?.textContent || '');

  return (
    <div
      ref={contentRef}
      className={className}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && isTruncated && tooltipText && (
        <div
          style={{
            position: 'absolute',
            zIndex: 10000,
            backgroundColor: '#1f2937',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Poppins',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            lineHeight: '1.4'
          }}
        >
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export default Tooltip;


