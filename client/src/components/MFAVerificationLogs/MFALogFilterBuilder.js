import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const MFALogFilterBuilder = ({ availableFields, filters, onSubmit, onClear, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Only show fields that are displayed in the table
  const tableFields = [
    'Contact__c',
    'Name',
    'Flow__c',
    'Status__c',
    'IP_Address__c'
  ];
  
  // Filter availableFields to only include table fields
  let filteredFields = availableFields.filter(field => tableFields.includes(field.name));
  
  // Ensure Contributor (Contact__c) is included and properly labeled
  filteredFields = filteredFields.map(field => {
    if (field.name === 'Contact__c') {
      return { ...field, label: 'Contributor' };
    }
    return field;
  });
  
  // If Contact__c is not in availableFields but should be in table, add it manually
  if (!filteredFields.find(f => f.name === 'Contact__c') && tableFields.includes('Contact__c')) {
    filteredFields.push({
      name: 'Contact__c',
      label: 'Contributor',
      type: 'reference'
    });
  }

  useEffect(() => {
    setLocalFilters(filters);
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

  return (
    <div className="case-filter-builder">
      <div className="filter-builder-header">
        <h3>Filter MFA Verification Logs</h3>
        <button className="btn-close-filter" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="filter-builder-content">
        {localFilters.length === 0 ? (
          <div className="filter-empty-state">
            <p>No filters applied</p>
          </div>
        ) : (
          localFilters.map((filter, index) => {
            const field = filteredFields.find(f => f.name === filter.field);
            const isPicklist = field?.type === 'picklist';
            const isBoolean = field?.type === 'boolean';
            const isDate = field?.type === 'date' || field?.type === 'datetime';

            return (
              <div key={index} className="filter-row">
                <select
                  className="filter-field-select"
                  value={filter.field}
                  onChange={(e) => updateFilter(index, { field: e.target.value, value: '' })}
                >
                  <option value="">Select Field</option>
                  {filteredFields.map(f => {
                    // Use label map to ensure consistent naming
                    const labelMap = {
                      'Contact__c': 'Contributor',
                      'Name': 'MFA Verification Log Name',
                      'Flow__c': 'Flow',
                      'Status__c': 'Status',
                      'IP_Address__c': 'IP Address'
                    };
                    const displayLabel = labelMap[f.name] || f.label || f.name;
                    return (
                      <option key={f.name} value={f.name}>{displayLabel}</option>
                    );
                  })}
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
                        type="text"
                        className="filter-value-input"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
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

export default MFALogFilterBuilder;

