import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import './SearchableSelect.css';

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Search...',
  disabled = false,
  showAllOption = true,
  allOptionLabel = 'All',
  allOptionValue = 'all',
  getOptionLabel = (opt) => typeof opt === 'object' && opt !== null ? (opt.name || opt.label || opt.value) : String(opt || ''),
  getOptionValue = (opt) => typeof opt === 'object' && opt !== null ? (opt.value || opt.id || opt.name) : String(opt || ''),
  getOptionKey = (opt, index) => typeof opt === 'object' && opt !== null ? (opt.id || opt.value || index) : (String(opt) || index)
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Ensure options is always an array
  const optionsArray = Array.isArray(options) ? options : [];

  // Update filtered options when options or search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(optionsArray);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = optionsArray.filter(opt => {
        const label = getOptionLabel(opt);
        return label && String(label).toLowerCase().includes(term);
      });
      setFilteredOptions(filtered);
    }
  }, [searchTerm, optionsArray, getOptionLabel]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Get display value
  const getDisplayValue = () => {
    if (value === allOptionValue || value === 'all' || !value) {
      return allOptionLabel;
    }
    const selectedOption = optionsArray.find(opt => getOptionValue(opt) === value);
    if (selectedOption) {
      return getOptionLabel(selectedOption);
    }
    return value;
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(allOptionValue);
    setSearchTerm('');
  };

  const displayValue = getDisplayValue();

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div
        className={`searchable-select-trigger ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
      >
        <span className="searchable-select-value">
          {displayValue || placeholder}
        </span>
        <div className="searchable-select-actions">
          {value !== allOptionValue && value !== 'all' && value && !disabled && (
            <X
              size={14}
              className="searchable-select-clear"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            size={14}
            className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown" ref={dropdownRef}>
          <div className="searchable-select-search">
            <Search size={14} className="searchable-select-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="searchable-select-input"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="searchable-select-options">
            {showAllOption && (
              <div
                className={`searchable-select-option ${value === allOptionValue || value === 'all' || !value ? 'selected' : ''}`}
                onClick={() => handleSelect(allOptionValue)}
              >
                {allOptionLabel}
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                const optionKey = getOptionKey(option, index);
                return (
                  <div
                    key={optionKey}
                    className={`searchable-select-option ${value === optionValue ? 'selected' : ''}`}
                    onClick={() => handleSelect(optionValue)}
                  >
                    {optionLabel}
                  </div>
                );
              })
            ) : (
              <div className="searchable-select-no-results">
                {searchTerm.trim() ? 'No results found' : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

