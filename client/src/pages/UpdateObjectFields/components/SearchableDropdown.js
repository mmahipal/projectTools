// Reusable searchable dropdown component

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader } from 'lucide-react';

const SearchableDropdown = ({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  options = [],
  loading = false,
  searching = false,
  showDropdown = false,
  onSelect,
  onClose,
  label,
  style = {},
  zIndex = 100000
}) => {
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // Use viewport coordinates for fixed positioning
        left: rect.left,
        width: rect.width
      });
    }
  }, [showDropdown, value]); // Recalculate when value changes (for dynamic content)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          inputRef.current &&
          !inputRef.current.contains(event.target)) {
        if (onClose) {
          onClose();
        }
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown, onClose]);

  const handleSelect = (option) => {
    if (onSelect) {
      onSelect(option);
    }
  };

  const renderDropdown = () => {
    if (!showDropdown) return null;

    const dropdownContent = (
      <div 
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}
      >
            {loading ? (
              <div style={{
                padding: '6px 10px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                Loading...
              </div>
            ) : searching ? (
              <div style={{
                padding: '6px 10px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                Searching...
              </div>
            ) : options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option.id || option.value}
                  onClick={() => handleSelect(option)}
                  style={{
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderBottom: '1px solid #f3f4f6',
                    color: '#000000',
                    backgroundColor: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={{ fontWeight: '500', color: '#000000' }}>
                    {option.name || option.label || option.value}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '6px 10px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                {value.trim() ? 'No results found' : 'Start typing to search...'}
              </div>
            )}
          </div>
    );

    // Use portal to render dropdown at body level to escape stacking contexts
    return createPortal(dropdownContent, document.body);
  };

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative', ...style }}>
      {label && (
        <label style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', display: 'block', color: '#374151' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{ 
            fontSize: '12px', 
            padding: '6px 10px', 
            paddingRight: '36px',
            height: '32px', 
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#fff',
            ...style
          }}
        />
        <Search 
          size={14} 
          style={{ 
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#666',
            pointerEvents: 'none'
          }} 
        />
        {(loading || searching) && (
          <div style={{ 
            position: 'absolute', 
            right: '36px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#666'
          }}>
            {searching ? 'Searching...' : 'Loading...'}
          </div>
        )}
      </div>
      {renderDropdown()}
    </div>
  );
};

export default SearchableDropdown;

