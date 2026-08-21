// Reusable component for field value inputs (handles picklist, reference, text)

import React from 'react';
import { Search } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

const FieldValueInput = ({
  value,
  onChange,
  fieldInfo,
  picklistValues = [],
  placeholder = 'Enter value',
  disabled = false,
  // Reference search props
  referenceSearchTerm = '',
  setReferenceSearchTerm,
  referenceSearchResults = [],
  searchingReference = false,
  showReferenceDropdown = false,
  setShowReferenceDropdown,
  onReferenceSelect,
  // Current value reference search (for "specific" mode)
  currentValueReferenceSearchTerm = '',
  setCurrentValueReferenceSearchTerm,
  currentValueReferenceSearchResults = [],
  searchingCurrentValueReference = false,
  showCurrentValueReferenceDropdown = false,
  setShowCurrentValueReferenceDropdown,
  onCurrentValueReferenceSelect,
  isCurrentValue = false
}) => {
  if (!fieldInfo) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={disabled ? 'Select a field first' : placeholder}
        disabled={disabled}
        style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: disabled ? '#f5f5f5' : '#fff' }}
      />
    );
  }

  // Picklist field
  if (fieldInfo.type === 'picklist' || fieldInfo.type === 'multipicklist') {
    return (
      <select
        key={`picklist-${fieldInfo.name}-${value || 'empty'}`}
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: disabled ? '#f5f5f5' : '#fff' }}
      >
        <option value="">--Select Value--</option>
        {picklistValues.map((val, index) => (
          <option key={`${val}-${index}`} value={val}>{val}</option>
        ))}
        {/* Preserve selected value even if not in current picklistValues (temporary) */}
        {value && value !== '' && !picklistValues.includes(value) && (
          <option key={value} value={value} disabled>
            {value} (Not available)
          </option>
        )}
      </select>
    );
  }

  // Reference field
  if (fieldInfo.type === 'reference' && fieldInfo.referenceTo) {
    const searchTerm = isCurrentValue ? currentValueReferenceSearchTerm : referenceSearchTerm;
    const searchResults = isCurrentValue ? currentValueReferenceSearchResults : referenceSearchResults;
    const searching = isCurrentValue ? searchingCurrentValueReference : searchingReference;
    const showDropdown = isCurrentValue ? showCurrentValueReferenceDropdown : showReferenceDropdown;
    const setSearchTerm = isCurrentValue ? setCurrentValueReferenceSearchTerm : setReferenceSearchTerm;
    const setShowDropdown = isCurrentValue ? setShowCurrentValueReferenceDropdown : setShowReferenceDropdown;
    const onSelect = isCurrentValue ? onCurrentValueReferenceSelect : onReferenceSelect;

    return (
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            if (!val || val.trim() === '') {
              onChange('');
            }
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (searchTerm.trim() !== '') {
              setShowDropdown(true);
            }
          }}
          placeholder={`Search ${fieldInfo.referenceTo}...`}
          style={{ 
            fontSize: '12px', 
            padding: '6px 10px', 
            paddingRight: '36px',
            height: '32px', 
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff'
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
        {searching && (
          <div style={{ 
            position: 'absolute', 
            right: '36px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#666'
          }}>
            Searching...
          </div>
        )}
        {showDropdown && (searchResults.length > 0 || searchTerm.trim() === '' || searching) && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {searching ? (
              <div style={{
                padding: '6px 10px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((record) => (
                <div
                  key={record.id || record.Id}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(record);
                    } else {
                      onChange(record.id || record.Id);
                      setSearchTerm(record.name || record.Name);
                      setShowDropdown(false);
                    }
                  }}
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
                    {record.name || record.Name}
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
                {searchTerm.trim() ? 'No records found' : 'Start typing to search...'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular text input
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: disabled ? '#f5f5f5' : '#fff' }}
    />
  );
};

export default FieldValueInput;

