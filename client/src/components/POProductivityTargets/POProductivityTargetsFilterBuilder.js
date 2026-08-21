import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const POProductivityTargetsFilterBuilder = ({ availableFields, records = [], filters, onSubmit, onClear, onClose }) => {
  const [localFilters, setLocalFilters] = useState(Array.isArray(filters) ? filters : []);

  useEffect(() => {
    setLocalFilters(Array.isArray(filters) ? filters : []);
  }, [filters]);

  const addFilter = () => {
    setLocalFilters([...localFilters, { field: '', operator: 'equals', value: '' }]);
  };

  const removeFilter = (index) => {
    setLocalFilters(localFilters.filter((_, i) => i !== index));
  };

  const updateFilter = (index, updates) => {
    const updated = [...localFilters];
    updated[index] = { ...updated[index], ...updates };
    setLocalFilters(updated);
  };

  const handleSubmit = () => {
    const validFilters = localFilters.filter(f => {
      if (!f.field || !f.operator) return false;
      // isEmpty and isNotEmpty don't need a value
      if (f.operator === 'isEmpty' || f.operator === 'isNotEmpty') return true;
      // All other operators need a value
      return f.value !== '';
    });
    onSubmit(validFilters);
  };

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'greaterThanOrEqual', label: 'Greater Than Or Equal' },
    { value: 'lessThanOrEqual', label: 'Less Than Or Equal' },
    { value: 'isEmpty', label: 'Is Empty' },
    { value: 'isNotEmpty', label: 'Is Not Empty' }
  ];

  // Extract unique values for a given field from records
  const getUniqueValuesForField = (fieldName) => {
    if (!fieldName || !records || records.length === 0) return [];
    
    const values = new Set();
    records.forEach(record => {
      const value = record[fieldName];
      if (value !== null && value !== undefined && value !== '') {
        values.add(value);
      }
    });
    
    // Sort values appropriately
    const sortedValues = Array.from(values).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      return String(a).localeCompare(String(b));
    });
    
    return sortedValues;
  };

  // Filter out deprecated fields
  const filteredFields = availableFields.filter(f => {
    const fieldLabel = (f.label || '').toLowerCase();
    return !f.deprecated && !fieldLabel.includes('deprecated');
  });

  return (
    <div className="case-filter-builder">
      <div className="filter-builder-header">
        <h3>Filter PO Productivity Targets</h3>
        <button className="btn-close-filter" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="filter-builder-content">
        {localFilters.length === 0 ? (
          <div className="filter-empty-state">
            <p>No filters applied. Click "Add Filter" to filter the data.</p>
          </div>
        ) : (
          localFilters.map((filter, index) => {
            const field = filteredFields.find(f => f.name === filter.field);
            const isPicklist = field?.type === 'picklist';
            const isBoolean = field?.type === 'boolean';
            const isDate = field?.type === 'date' || field?.type === 'datetime';
            const isNumber = field?.type === 'int' || field?.type === 'double' || field?.type === 'currency' || field?.type === 'percent';
            const uniqueValues = filter.field ? getUniqueValuesForField(filter.field) : [];

            return (
              <div key={index} className="filter-row">
                <select
                  className="filter-field-select"
                  value={filter.field}
                  onChange={(e) => updateFilter(index, { field: e.target.value, value: '' })}
                >
                  <option value="">Select Field</option>
                  {filteredFields.map(f => (
                    <option key={f.name} value={f.name}>{f.label || f.name}</option>
                  ))}
                </select>

                <select
                  className="filter-operator-select"
                  value={filter.operator}
                  onChange={(e) => updateFilter(index, { operator: e.target.value })}
                  disabled={!filter.field}
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                  <>
                    {isPicklist && field?.picklistValues ? (
                      <select
                        className="filter-value-input"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        disabled={!filter.field}
                      >
                        <option value="">Select Value</option>
                        {field.picklistValues.map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    ) : uniqueValues.length > 0 && !isNumber && !isDate ? (
                      <select
                        className="filter-value-input"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        disabled={!filter.field}
                      >
                        <option value="">Select Value ({uniqueValues.length} available)</option>
                        {uniqueValues.slice(0, 100).map((val, idx) => (
                          <option key={idx} value={val}>
                            {String(val)}
                          </option>
                        ))}
                        {uniqueValues.length > 100 && (
                          <option disabled>... and {uniqueValues.length - 100} more</option>
                        )}
                      </select>
                    ) : isBoolean ? (
                      <select
                        className="filter-value-input"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        disabled={!filter.field}
                      >
                        <option value="">Select Value</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : isDate ? (
                      <input
                        type={field?.type === 'datetime' ? 'datetime-local' : 'date'}
                        className="filter-value-input"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        disabled={!filter.field}
                      />
                    ) : (
                      <input
                        type={isNumber ? 'number' : 'text'}
                        className="filter-value-input"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: isNumber ? (e.target.value ? parseFloat(e.target.value) : '') : e.target.value })}
                        placeholder="Enter value"
                        disabled={!filter.field}
                      />
                    )}
                  </>
                )}

                <button
                  className="btn-remove-filter"
                  onClick={() => removeFilter(index)}
                  title="Remove filter"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}

        <button className="btn-add-filter" onClick={addFilter}>
          <Plus size={16} />
          <span>Add Filter</span>
        </button>
      </div>

      <div className="filter-builder-actions">
        <button className="btn-clear-filters" onClick={onClear}>
          Clear All
        </button>
        <button className="btn-submit-filters" onClick={handleSubmit}>
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default POProductivityTargetsFilterBuilder;
