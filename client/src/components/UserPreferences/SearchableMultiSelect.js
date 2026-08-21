import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import './SearchableMultiSelect.css';

const SearchableMultiSelect = ({ 
  label, 
  placeholder, 
  selectedItems, 
  onSelectionChange, 
  onSearch, 
  loading = false,
  itemLabelKey = 'name',
  itemValueKey = 'id'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(() => {
        handleSearch(searchTerm);
      }, 300); // Debounce
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearch = async (term) => {
    try {
      const results = await onSearch(term);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSelect = (item) => {
    const value = item[itemValueKey];
    // Check if already selected (handle both object and string formats)
    const isAlreadySelected = selectedItems.some(selected => {
      const selectedValue = typeof selected === 'string' ? selected : selected[itemValueKey];
      return selectedValue === value;
    });
    
    if (!isAlreadySelected) {
      // Store the full item object (with name and id) instead of just the ID
      onSelectionChange([...selectedItems, item]);
    }
    setSearchTerm('');
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const handleRemove = (value) => {
    // Remove by comparing values (handle both object and string formats)
    onSelectionChange(selectedItems.filter(selected => {
      const selectedValue = typeof selected === 'string' ? selected : selected[itemValueKey];
      return selectedValue !== value;
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(searchResults[highlightedIndex]);
      setHighlightedIndex(-1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const getItemLabel = (item) => {
    if (typeof item === 'string') return item;
    return item[itemLabelKey] || item[itemValueKey] || '';
  };

  const getItemValue = (item) => {
    if (typeof item === 'string') return item;
    return item[itemValueKey] || item;
  };

  // Get selected items details (for display)
  const selectedItemsDetails = selectedItems.map(selected => {
    // If it's already an object with name and id, use it directly
    if (typeof selected === 'object' && selected !== null) {
      return selected;
    }
    // If it's just an ID string, try to find in search results
    const found = searchResults.find(item => getItemValue(item) === selected);
    return found || { [itemValueKey]: selected, [itemLabelKey]: selected };
  });

  return (
    <div className="searchable-multi-select" ref={dropdownRef}>
      <label className="searchable-multi-select-label">{label}</label>
      <div className="searchable-multi-select-container">
        {/* Selected items chips */}
        <div className="selected-items-container">
          {selectedItemsDetails.map((item, index) => {
            const value = getItemValue(item);
            const label = getItemLabel(item);
            return (
              <span key={value} className="selected-item-chip">
                <span className="chip-label" title={label}>{label}</span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(value);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={`Remove ${label}`}
                  title={`Remove ${label}`}
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>

        {/* Search input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="searchable-multi-select-input"
            placeholder={selectedItems.length === 0 ? placeholder : ''}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="dropdown-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle dropdown"
          >
            <ChevronDown size={16} className={isOpen ? 'rotate' : ''} />
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="searchable-multi-select-dropdown">
            {loading ? (
              <div className="dropdown-loading">Searching...</div>
            ) : searchTerm.trim().length < 2 ? (
              <div className="dropdown-message">
                Type at least 2 characters to search
              </div>
            ) : searchResults.length === 0 ? (
              <div className="dropdown-message">No results found</div>
            ) : (
              <ul className="dropdown-list">
                {searchResults
                  .filter(item => {
                    const itemValue = getItemValue(item);
                    // Check if already selected (handle both object and string formats)
                    return !selectedItems.some(selected => {
                      const selectedValue = typeof selected === 'string' ? selected : selected[itemValueKey];
                      return selectedValue === itemValue;
                    });
                  })
                  .map((item, index) => {
                    const value = getItemValue(item);
                    const label = getItemLabel(item);
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <li
                        key={value}
                        className={`dropdown-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {label}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableMultiSelect;

