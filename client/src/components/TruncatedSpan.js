import React from 'react';
import { useTruncatedTooltip } from '../utils/useTruncatedTooltip';

/**
 * Span component with automatic tooltip for truncated text
 * Use for page titles, nav labels, field names, etc.
 */
const TruncatedSpan = ({ children, className = '', style = {}, title, ...props }) => {
  const text = title || (typeof children === 'string' ? children : (children?.props?.children || ''));
  const { ref, isTruncated, showTooltip, handleMouseEnter, handleMouseLeave, setShowTooltip } = useTruncatedTooltip(text);

  // For block-level elements, use div instead of span
  const isBlock = style?.display === 'block' || className.includes('page-title');
  const Component = isBlock ? 'div' : 'span';
  
  const handleHoverEnter = (e) => {
    // Recheck truncation on hover to ensure accuracy
    if (ref.current) {
      const element = ref.current;
      const isTextTruncated = element.scrollWidth > element.clientWidth || 
                              element.scrollHeight > element.clientHeight;
      if (isTextTruncated && text) {
        setShowTooltip(true);
      }
    }
    handleMouseEnter(e);
  };
  
  return (
    <Component
      ref={ref}
      className={className}
      style={{ position: 'relative', display: isBlock ? 'block' : 'inline-block', width: isBlock ? '100%' : 'auto', ...style }}
      onMouseEnter={handleHoverEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      {showTooltip && isTruncated && text && (
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
          {text}
        </div>
      )}
    </Component>
  );
};

export default TruncatedSpan;

