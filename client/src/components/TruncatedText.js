import React, { useState, useRef, useEffect } from 'react';

/**
 * Component that wraps text and shows tooltip only when truncated
 * Usage: <TruncatedText className="some-class" style={{...}}>Text content</TruncatedText>
 */
const TruncatedText = ({ children, className = '', style = {}, title, ...props }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const element = textRef.current;
        const isTextTruncated = element.scrollWidth > element.clientWidth || 
                                element.scrollHeight > element.clientHeight;
        setIsTruncated(isTextTruncated);
      }
    };

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      checkTruncation();
    });

    // Recheck on window resize
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [children]);

  const handleMouseEnter = () => {
    if (isTruncated) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const tooltipText = title || children || (textRef.current?.textContent || '');

  return (
    <span
      ref={textRef}
      className={className}
      style={{ position: 'relative', ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      {showTooltip && isTruncated && tooltipText && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '4px',
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
    </span>
  );
};

export default TruncatedText;


