import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PaymentAdjustmentsFilterBuilder = ({ availableFields, filters, onSubmit, onClear, onClose, records }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [fieldValues, setFieldValues] = useState({});
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Extract unique values for each field from records
  useEffect(() => {
    if (!records || records.length === 0) return;
    
    const values = {};
    availableFields.forEach(field => {
      const uniqueValues = new Set();
      records.forEach(record => {
        let value = record[field.name];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && value.Name) {
            value = value.Name;
          }
          uniqueValues.add(String(value));
        }
      });
      values[field.name] = Array.from(uniqueValues).sort();
    });
    setFieldValues(values);
  }, [records, availableFields]);

  const addFilter = () => {
    setLocalFilters({ ...localFilters, [Date.now().toString()]: { field: '', operator: 'equals', value: '' } });
  };

  const removeFilter = (key) => {
    const updated = { ...localFilters };
    delete updated[key];
    setLocalFilters(updated);
  };

  const updateFilter = (key, updates) => {
    setLocalFilters({ ...localFilters, [key]: { ...localFilters[key], ...updates } });
  };

  const handleSubmit = () => {
    // Convert to object format expected by backend
    const filterObject = {};
    Object.keys(localFilters).forEach(key => {
      const filter = localFilters[key];
      if (filter.field && filter.value !== '') {
        // Map CreatedById to CreatedBy for backend compatibility
        let fieldName = filter.field;
        if (fieldName === 'CreatedById' || fieldName === 'CreatedBy.Id') {
          fieldName = 'CreatedBy';
        }
        filterObject[fieldName] = {
          operator: filter.operator || 'equals',
          value: filter.value
        };
      }
    });
    onSubmit(filterObject);
  };

  // Filter out deprecated fields and map field labels
  const filteredFields = availableFields
    .filter(f => {
      const fieldLabel = (f.label || '').toLowerCase();
      return !f.deprecated && !fieldLabel.includes('deprecated');
    })
    .map(f => {
      // Map CreatedById to show as "Created By"
      if (f.name === 'CreatedById' || f.name === 'CreatedBy.Id') {
        return { ...f, label: 'Created By' };
      }
      return f;
    });

  const getFieldType = (fieldName) => {
    const field = availableFields.find(f => f.name === fieldName);
    if (!field) return 'text';
    return field.type || 'text';
  };

  const getOperators = (fieldType) => {
    switch (fieldType) {
      case 'picklist':
      case 'multipicklist':
        return [{ value: 'equals', label: 'Equals' }, { value: 'not_equals', label: 'Not Equals' }];
      case 'date':
      case 'datetime':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than', label: 'Less Than' },
          { value: 'between', label: 'Between' }
        ];
      case 'number':
      case 'currency':
      case 'percent':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than', label: 'Less Than' },
          { value: 'between', label: 'Between' }
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'starts_with', label: 'Starts With' }
        ];
    }
  };

  return (
    <div className="case-filter-builder">
      <div className="filter-builder-header">
        <h3>Filter Payment Adjustments</h3>
        <button className="btn-close-filter" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="filter-builder-content">
        {Object.keys(localFilters).length === 0 ? (
          <div className="filter-empty-state">
            <p>No filters applied. Click "Add Filter" to filter the data.</p>
          </div>
        ) : (
          Object.keys(localFilters).map((key) => {
            const filter = localFilters[key];
            const field = filteredFields.find(f => f.name === filter.field);
            const fieldType = getFieldType(filter.field);
            const operators = getOperators(fieldType);
            const availableValues = fieldValues[filter.field] || [];
            
            return (
              <div key={key} className="filter-row">
                <select
                  className="filter-field-select"
                  value={filter.field || ''}
                  onChange={(e) => updateFilter(key, { field: e.target.value, operator: 'equals', value: '' })}
                >
                  <option value="">Select Field</option>
                  {filteredFields.map(f => (
                    <option key={f.name} value={f.name}>
                      {f.label || f.name}
                    </option>
                  ))}
                </select>
                <select
                  className="filter-operator-select"
                  value={filter.operator || 'equals'}
                  onChange={(e) => updateFilter(key, { operator: e.target.value })}
                  disabled={!filter.field}
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                {fieldType === 'picklist' || fieldType === 'multipicklist' ? (
                  <select
                    className="filter-value-select"
                    value={filter.value || ''}
                    onChange={(e) => updateFilter(key, { value: e.target.value })}
                    disabled={!filter.field || availableValues.length === 0}
                  >
                    <option value="">Select Value</option>
                    {availableValues.map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldType === 'date' || fieldType === 'datetime' ? 'date' : fieldType === 'number' || fieldType === 'currency' ? 'number' : 'text'}
                    className="filter-value-input"
                    value={filter.value || ''}
                    onChange={(e) => updateFilter(key, { value: e.target.value })}
                    placeholder="Enter value"
                    disabled={!filter.field}
                  />
                )}
                <button
                  className="filter-remove-btn"
                  onClick={() => removeFilter(key)}
                  title="Remove filter"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="filter-builder-actions">
        <button className="btn-add-filter" onClick={addFilter}>
          <Plus size={14} /> Add Filter
        </button>
        {Object.keys(localFilters).length > 0 && (
          <button className="btn-clear-filters" onClick={onClear}>
            <Trash2 size={14} /> Clear All
          </button>
        )}
        <button className="btn-submit-filters" onClick={handleSubmit}>
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default PaymentAdjustmentsFilterBuilder;

