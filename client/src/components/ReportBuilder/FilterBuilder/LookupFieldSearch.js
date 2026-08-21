import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import apiClient from '../../../config/api';
import './FilterBuilder.css';

const LookupFieldSearch = ({
  field,
  value,
  onChange,
  placeholder = 'Search...'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load selected record name if value is an ID
  useEffect(() => {
    if (value && typeof value === 'string' && (value.length === 15 || value.length === 18) && field?.referenceTo) {
      const referenceObject = Array.isArray(field.referenceTo) ? field.referenceTo[0] : field.referenceTo;
      if (referenceObject) {
        loadRecordName(value, referenceObject);
      }
    } else if (value && selectedRecord && selectedRecord.Id === value) {
      // Value already matches selected record
    } else {
      setSelectedRecord(null);
    }
  }, [value, field]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadRecordName = async (recordId, objectType) => {
    if (!recordId || !objectType) return;
    
    try {
      const response = await apiClient.post('/reports/lookup-search', {
        objectType,
        searchTerm: recordId,
        exactMatch: true
      });
      
      if (response.data.success && response.data.records && response.data.records.length > 0) {
        setSelectedRecord(response.data.records[0]);
        setSearchTerm(response.data.records[0].Name || recordId);
      }
    } catch (error) {
      console.error('Error loading record name:', error);
    }
  };

  const searchRecords = async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const referenceObject = Array.isArray(field?.referenceTo) ? field.referenceTo[0] : field?.referenceTo;
    if (!referenceObject) {
      setError('No reference object specified');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await apiClient.post('/reports/lookup-search', {
        objectType: referenceObject,
        searchTerm: term.trim()
      });

      if (response.data.success) {
        setSearchResults(response.data.records || []);
        setShowDropdown(true);
      } else {
        setError(response.data.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching records:', error);
      setError(error.response?.data?.error || 'Failed to search records');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setSelectedRecord(null);
    setShowDropdown(false);
    setError(null);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    if (term.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchRecords(term);
      }, 300);
    } else {
      setSearchResults([]);
      // If search term is cleared, clear the value
      if (!term) {
        onChange('');
      }
    }
  };

  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
    setSearchTerm(record.Name || record.Id);
    setShowDropdown(false);
    onChange(record.Id); // Store the ID, not the name
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedRecord(null);
    setSearchResults([]);
    setShowDropdown(false);
    onChange('');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowDropdown(true);
            } else if (searchTerm.trim().length >= 2) {
              searchRecords(searchTerm);
            }
          }}
          placeholder={placeholder}
          className="filter-value-input"
          style={{ paddingRight: selectedRecord ? '60px' : '30px' }}
        />
        <div style={{ 
          position: 'absolute', 
          right: selectedRecord ? '30px' : '8px',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          {isSearching ? (
            <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
          ) : (
            <Search size={14} color="#666" />
          )}
        </div>
        {selectedRecord && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear selection"
          >
            <X size={14} color="#666" />
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          fontSize: '11px', 
          color: '#d32f2f', 
          marginTop: '4px',
          padding: '4px 8px',
          background: '#ffebee',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '4px'
          }}
        >
          {searchResults.map((record) => (
            <div
              key={record.Id}
              onClick={() => handleSelectRecord(record)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
              }}
            >
              <div style={{ fontWeight: '500', color: '#002329' }}>
                {record.Name || record.Id}
              </div>
              {record.Id && record.Id !== record.Name && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {record.Id}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDropdown && searchResults.length === 0 && searchTerm.trim().length >= 2 && !isSearching && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            padding: '12px',
            fontSize: '12px',
            color: '#666',
            marginTop: '4px'
          }}
        >
          No records found
        </div>
      )}
    </div>
  );
};

export default LookupFieldSearch;

