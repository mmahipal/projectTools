import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import './FilterBuilder.css';

const MultiSelectDropdown = ({ options, value = [], onChange, placeholder = 'Select values' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updateDropdownPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateDropdownPosition = () => {
    if (containerRef.current && dropdownRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dropdownRef.current.style.top = `${rect.bottom + window.scrollY}px`;
      dropdownRef.current.style.left = `${rect.left + window.scrollX}px`;
      dropdownRef.current.style.width = `${rect.width}px`;
    }
  };

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (optionValue, e) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedLabels = value
    .map(v => options.find(o => o.value === v)?.label || v)
    .join(', ');

  return (
    <div className="multi-select-dropdown-container" ref={containerRef}>
      <div
        className="multi-select-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="multi-select-dropdown-selected">
          {value.length === 0 ? (
            <span className="multi-select-placeholder">{placeholder}</span>
          ) : (
            <div className="multi-select-tags">
              {value.slice(0, 2).map(v => {
                const option = options.find(o => o.value === v);
                return (
                  <span key={v} className="multi-select-tag">
                    {option?.label || v}
                    <button
                      type="button"
                      onClick={(e) => removeOption(v, e)}
                      className="multi-select-tag-remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
              {value.length > 2 && (
                <span className="multi-select-more">+{value.length - 2} more</span>
              )}
            </div>
          )}
        </div>
        <ChevronDown size={16} className={isOpen ? 'rotate' : ''} />
      </div>

      {isOpen && createPortal(
        <div className="multi-select-dropdown-menu" ref={dropdownRef}>
          <div className="multi-select-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="multi-select-search-input"
              autoFocus
            />
          </div>
          <div className="multi-select-options">
            {filteredOptions.length === 0 ? (
              <div className="multi-select-no-results">No options found</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`multi-select-option ${value.includes(option.value) ? 'selected' : ''}`}
                  onClick={() => toggleOption(option.value)}
                >
                  <Check
                    size={14}
                    className={value.includes(option.value) ? 'visible' : 'hidden'}
                  />
                  <span>{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MultiSelectDropdown;

