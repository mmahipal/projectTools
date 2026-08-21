import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const ContributorMatchMatrixFilterBuilder = ({ availableFields, filters, onSubmit, onClear, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const addFilter = () => {
    setLocalFilters({ ...localFilters, [Date.now().toString()]: { field: '', value: true } });
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
    // Convert to object format expected by backend: { fieldName: true/false }
    const filterObject = {};
    Object.keys(localFilters).forEach(key => {
      const filter = localFilters[key];
      if (filter.field && (filter.value === true || filter.value === false)) {
        filterObject[filter.field] = filter.value;
      }
    });
    onSubmit(filterObject);
  };

  return (
    <div className="case-filter-builder">
      <div className="filter-builder-header">
        <h3>Filter Contributor Match Matrix</h3>
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
            const field = availableFields.find(f => f.name === filter.field);
            
            return (
              <div key={key} className="filter-row">
                <select
                  className="filter-field-select"
                  value={filter.field || ''}
                  onChange={(e) => updateFilter(key, { field: e.target.value, value: true })}
                >
                  <option value="">Select Field</option>
                  {availableFields
                    .filter(f => {
                      // Filter out deprecated fields
                      const fieldLabel = (f.label || '').toLowerCase();
                      return !f.deprecated && !fieldLabel.includes('deprecated');
                    })
                    .map(f => (
                      <option key={f.name} value={f.name}>
                        {f.label || f.name}
                      </option>
                    ))}
                </select>
                <select
                  className="filter-value-select"
                  value={filter.value === true ? 'true' : filter.value === false ? 'false' : ''}
                  onChange={(e) => updateFilter(key, { value: e.target.value === 'true' })}
                  disabled={!filter.field}
                  style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'Poppins', background: '#fff', color: '#002329', width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="">Select Value</option>
                  <option value="true">True (Checked)</option>
                  <option value="false">False (Unchecked)</option>
                </select>
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

export default ContributorMatchMatrixFilterBuilder;

