import React from 'react';
import { useTruncatedTooltip } from '../../utils/useTruncatedTooltip';

/**
 * Table header component with automatic tooltip for truncated text
 */
const TableHeader = ({ children, className = '', style = {}, title, ...props }) => {
  // Get text from title prop, children string, or extract from React element
  const getText = () => {
    if (title) return title;
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    // Try to extract text from React element
    if (children?.props?.children) {
      const childText = children.props.children;
      return typeof childText === 'string' ? childText : (typeof childText === 'number' ? String(childText) : '');
    }
    return '';
  };
  
  const text = getText();
  const { ref, isTruncated, showTooltip, handleMouseEnter, handleMouseLeave, setShowTooltip } = useTruncatedTooltip(text);

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
    <th
      ref={ref}
      className={className}
      style={{ position: 'relative', ...style }}
      onMouseEnter={handleHoverEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      {showTooltip && text && (
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
    </th>
  );
};

export default TableHeader;

