import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import MultiSelectDropdown from './MultiSelectDropdown';
import LookupFieldSearch from './LookupFieldSearch';
import { getOperatorsForFieldType, getValueInputType } from './filterUtils';
import './FilterBuilder.css';

const FilterCondition = ({
  condition,
  availableFields,
  filterOptions,
  onUpdate,
  onRemove,
  canRemove
}) => {
  const [selectedField, setSelectedField] = useState(null);

  useEffect(() => {
    if (condition.field) {
      const field = availableFields.find(f => f.name === condition.field);
      setSelectedField(field);
    }
  }, [condition.field, availableFields]);

  const handleFieldChange = (e) => {
    const fieldName = e.target.value;
    const field = availableFields.find(f => f.name === fieldName);
    
    if (field) {
      setSelectedField(field);
      const operators = getOperatorsForFieldType(field.type);
      const valueType = getValueInputType(field.type);
      
      onUpdate({
        field: fieldName,
        operator: operators[0]?.value || 'equals',
        value: '',
        valueType: valueType
      });
    } else {
      setSelectedField(null);
      onUpdate({ field: '', operator: 'equals', value: '', valueType: 'text' });
    }
  };

  const handleOperatorChange = (e) => {
    onUpdate({ operator: e.target.value });
  };

  const handleValueChange = (value) => {
    onUpdate({ value });
  };

  const getValueInput = () => {
    if (!selectedField) {
      return (
        <input
          type="text"
          value={condition.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Select a field first"
          disabled
          className="filter-value-input"
        />
      );
    }

    const fieldType = selectedField.type?.toLowerCase() || 'string';
    const operator = condition.operator;

    // Date/Datetime fields
    if (fieldType === 'date' || fieldType === 'datetime') {
      if (operator === 'between') {
        return (
          <DateRangePicker
            value={condition.value || { from: '', to: '' }}
            onChange={handleValueChange}
          />
        );
      } else {
        return (
          <input
            type="date"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="filter-value-input"
          />
        );
      }
    }

    // Reference/Lookup fields - use searchable lookup component
    if ((fieldType === 'reference' || fieldType === 'lookup') && selectedField.referenceTo) {
      // For 'in' or 'not in' operators, allow multiple selections
      if (operator === 'in' || operator === 'not in') {
        // For now, use a simple text input with comma-separated IDs
        // TODO: Could enhance this to support multiple lookup searches
        return (
          <input
            type="text"
            value={Array.isArray(condition.value) ? condition.value.join(', ') : (condition.value || '')}
            onChange={(e) => {
              const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
              handleValueChange(values.length > 0 ? values : '');
            }}
            placeholder="Enter IDs separated by commas"
            className="filter-value-input"
          />
        );
      } else {
        // For single value operators, use lookup search
        return (
          <LookupFieldSearch
            field={selectedField}
            value={condition.value || ''}
            onChange={handleValueChange}
            placeholder={`Search ${selectedField.referenceTo}...`}
          />
        );
      }
    }

    // Picklist fields
    if (fieldType === 'picklist' || fieldType === 'multipicklist') {
      // If picklistValues is an array of strings, use them directly
      // If it's an array of objects with value/label, map them
      const picklistOptions = selectedField.picklistValues 
        ? selectedField.picklistValues.map(v => {
            if (typeof v === 'string') {
              return { value: v, label: v };
            }
            return { value: v.value || v, label: v.label || v.value || v };
          })
        : [];

      if (picklistOptions.length === 0) {
        // If no picklist values loaded, show a message
        return (
          <div style={{ fontSize: '11px', color: '#666', padding: '4px' }}>
            Loading picklist values...
          </div>
        );
      }

      if (operator === 'in' || operator === 'not in') {
        return (
          <MultiSelectDropdown
            options={picklistOptions}
            value={Array.isArray(condition.value) ? condition.value : []}
            onChange={handleValueChange}
            placeholder="Select values"
          />
        );
      } else {
        return (
          <select
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="filter-value-input"
          >
            <option value="">Select value</option>
            {picklistOptions.map((v, idx) => (
              <option key={v.value || idx} value={v.value}>
                {v.label || v.value}
              </option>
            ))}
          </select>
        );
      }
    }

    // Boolean fields
    if (fieldType === 'boolean') {
      return (
        <select
          value={condition.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          className="filter-value-input"
        >
          <option value="">Select value</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    // Number fields
    if (fieldType === 'int' || fieldType === 'double' || fieldType === 'currency' || fieldType === 'percent') {
      return (
        <input
          type="number"
          value={condition.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter number"
          className="filter-value-input"
        />
      );
    }

    // Text/String fields - allow free text input
    return (
      <input
        type="text"
        value={condition.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="Enter value"
        className="filter-value-input"
      />
    );
  };

  const operators = selectedField 
    ? getOperatorsForFieldType(selectedField.type)
    : [];

  return (
    <div className="filter-condition">
      <div className="filter-condition-fields">
        <select
          value={condition.field || ''}
          onChange={handleFieldChange}
          className="filter-field-select"
        >
          <option value="">Select Field</option>
          {availableFields.map(field => (
            <option key={field.name} value={field.name}>
              {field.label || field.name}
            </option>
          ))}
        </select>

        {selectedField && operators.length > 0 && (
          <select
            value={condition.operator || 'equals'}
            onChange={handleOperatorChange}
            className="filter-operator-select"
          >
            {operators.map(op => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        )}

        <div className="filter-value-container">
          {getValueInput()}
        </div>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="filter-condition-remove-btn"
          title="Remove condition"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default FilterCondition;

