import React, { useState, useMemo } from 'react';
import { Search, Check, X, Info, Type, Calendar, Hash, ToggleLeft } from 'lucide-react';
import FieldGroup from './FieldGroup';
import './FieldSelector.css';

const FieldSelector = ({ 
  availableFields, 
  selectedFields, 
  onFieldToggle,
  onSelectAll,
  onSelectNone
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getFieldIcon = (fieldType) => {
    const type = (fieldType || '').toLowerCase();
    if (type === 'date' || type === 'datetime') return <Calendar size={14} />;
    if (type === 'int' || type === 'double' || type === 'currency' || type === 'percent') return <Hash size={14} />;
    if (type === 'boolean') return <ToggleLeft size={14} />;
    return <Type size={14} />;
  };

  const groupedFields = useMemo(() => {
    const filtered = availableFields.filter(field => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (field.label || field.name).toLowerCase().includes(term) ||
        field.name.toLowerCase().includes(term) ||
        (field.type || '').toLowerCase().includes(term)
      );
    });

    const groups = {
      'Standard Fields': [],
      'Custom Fields': [],
      'Related Objects': []
    };

    filtered.forEach(field => {
      if (field.name.includes('__r')) {
        groups['Related Objects'].push(field);
      } else if (field.name.includes('__c')) {
        groups['Custom Fields'].push(field);
      } else {
        groups['Standard Fields'].push(field);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [availableFields, searchTerm]);

  const allFilteredFieldsSelected = useMemo(() => {
    const allFields = Object.values(groupedFields).flat();
    return allFields.length > 0 && allFields.every(f => selectedFields.includes(f.name));
  }, [groupedFields, selectedFields]);

  const handleSelectAll = () => {
    const allFields = Object.values(groupedFields).flat();
    const fieldsToSelect = allFields.map(f => f.name);
    fieldsToSelect.forEach(fieldName => {
      if (!selectedFields.includes(fieldName)) {
        onFieldToggle(fieldName);
      }
    });
  };

  const handleSelectNone = () => {
    const allFields = Object.values(groupedFields).flat();
    allFields.forEach(field => {
      if (selectedFields.includes(field.name)) {
        onFieldToggle(field.name);
      }
    });
  };

  // Get selected field labels
  const selectedFieldLabels = useMemo(() => {
    return selectedFields.map(fieldName => {
      const field = availableFields.find(f => f.name === fieldName);
      return field ? (field.label || field.name) : fieldName;
    });
  }, [selectedFields, availableFields]);

  return (
    <div className="field-selector">
      <div className="field-selector-header">
        <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
          Fields * (Select at least one)
        </label>
        <div className="field-selector-actions">
          <button
            type="button"
            onClick={handleSelectAll}
            className="field-selector-action-btn"
            disabled={allFilteredFieldsSelected}
            title="Select all visible fields"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleSelectNone}
            className="field-selector-action-btn"
            disabled={selectedFields.length === 0}
            title="Deselect all fields"
          >
            Select None
          </button>
        </div>
      </div>

      {/* Selected Fields Display */}
      {selectedFields.length > 0 && (
        <div style={{
          marginBottom: '12px',
          padding: '10px',
          background: '#f0f9ff',
          border: '1px solid #08979C',
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#08979C', fontSize: '13px' }}>
            Selected Fields ({selectedFields.length}):
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px',
            maxHeight: '100px',
            overflowY: 'auto'
          }}>
            {selectedFieldLabels.map((label, idx) => (
              <span
                key={selectedFields[idx]}
                style={{
                  padding: '4px 8px',
                  background: '#fff',
                  border: '1px solid #08979C',
                  borderRadius: '4px',
                  color: '#002329',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {label}
                <button
                  type="button"
                  onClick={() => onFieldToggle(selectedFields[idx])}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#666'
                  }}
                  title="Remove field"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="field-selector-search">
        <Search size={16} className="field-selector-search-icon" />
        <input
          type="text"
          placeholder="Search fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="field-selector-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="field-selector-clear-search"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="field-selector-list">
        {Object.keys(groupedFields).length === 0 ? (
          <div className="field-selector-empty">
            {searchTerm ? 'No fields match your search' : 'No fields available'}
          </div>
        ) : (
          Object.entries(groupedFields).map(([groupName, fields]) => (
            <FieldGroup
              key={groupName}
              groupName={groupName}
              fields={fields}
              selectedFields={selectedFields}
              onFieldToggle={onFieldToggle}
              expanded={expandedGroups[groupName] !== false}
              onToggleExpand={() => toggleGroup(groupName)}
              getFieldIcon={getFieldIcon}
            />
          ))
        )}
      </div>

      {selectedFields.length > 0 && (
        <div className="field-selector-summary">
          <span>{selectedFields.length} field(s) selected</span>
        </div>
      )}
    </div>
  );
};

export default FieldSelector;

