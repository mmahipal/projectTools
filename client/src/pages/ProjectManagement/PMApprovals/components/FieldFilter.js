import React, { useState, useEffect, useMemo } from 'react';
import { Filter, X, Plus, ArrowUpDown } from 'lucide-react';
import './FieldFilter.css';

const FieldFilter = ({ 
  records = [],
  onApplyFilter,
  onClearFilter,
  loading = false,
  currentSortBy = '',
  currentSortOrder = 'DESC',
  onSortChange
}) => {
  const [filters, setFilters] = useState([{ field: '', value: '' }]);
  const [sortField, setSortField] = useState(currentSortBy || '');
  const [sortOrder, setSortOrder] = useState(currentSortOrder || 'DESC');

  // Sync sort state with props when they change
  useEffect(() => {
    setSortField(currentSortBy || '');
    setSortOrder(currentSortOrder || 'DESC');
  }, [currentSortBy, currentSortOrder]);

  // Define filterable fields from the table
  const filterableFields = [
    { key: 'transactionId', label: 'Transaction ID', type: 'text' },
    { key: 'contributorName', label: 'Contributor', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'projectName', label: 'Project', type: 'text' },
    { key: 'projectObjectiveName', label: 'Project Objective', type: 'text' },
    { key: 'accountName', label: 'Account', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' }
  ];

  // Define sortable fields
  const sortableFields = [
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'contributorName', label: 'Contributor' },
    { key: 'email', label: 'Email' },
    { key: 'projectName', label: 'Project' },
    { key: 'projectObjectiveName', label: 'Project Objective' },
    { key: 'accountName', label: 'Account' },
    { key: 'transactionDate', label: 'Transaction Date' },
    { key: 'status', label: 'Status' }
  ];

  // Extract unique values for a field from records
  const getFieldValues = (fieldKey) => {
    if (!fieldKey || !Array.isArray(records) || records.length === 0) {
      return [];
    }

    const values = new Set();
    records.forEach(record => {
      if (record && record[fieldKey]) {
        const value = String(record[fieldKey]).trim();
        if (value) {
          values.add(value);
        }
      }
    });

    return Array.from(values).sort();
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', value: '' }]);
  };

  const handleRemoveFilter = (index) => {
    if (filters.length > 1) {
      setFilters(filters.filter((_, i) => i !== index));
    } else {
      setFilters([{ field: '', value: '' }]);
    }
  };

  const handleFilterFieldChange = (index, value) => {
    const newFilters = [...filters];
    newFilters[index] = { field: value, value: '' };
    setFilters(newFilters);
  };

  const handleFilterValueChange = (index, value) => {
    const newFilters = [...filters];
    newFilters[index].value = value;
    setFilters(newFilters);
  };

  const handleApply = () => {
    const activeFilters = filters.filter(f => f.field && f.value);
    if (activeFilters.length > 0 || sortField) {
      onApplyFilter({
        filters: activeFilters,
        sortBy: sortField,
        sortOrder: sortOrder
      });
    }
  };

  const handleClear = () => {
    setFilters([{ field: '', value: '' }]);
    setSortField('');
    setSortOrder('DESC');
    onClearFilter();
  };

  const handleSortFieldChange = (value) => {
    setSortField(value);
    if (value && onSortChange) {
      onSortChange(value, sortOrder);
    }
  };

  const handleSortOrderChange = (value) => {
    setSortOrder(value);
    if (sortField && onSortChange) {
      onSortChange(sortField, value);
    }
  };

  return (
    <div className="field-filter-panel">
      <div className="field-filter-header">
        <Filter size={18} />
        <span>Filter & Sort Records</span>
      </div>
      
      <div className="field-filter-controls">
        {/* Multiple Filters */}
        <div className="filters-section">
          <div className="filters-header">
            <label>Filters:</label>
            <button
              type="button"
              className="add-filter-btn"
              onClick={handleAddFilter}
              disabled={loading}
              title="Add another filter"
            >
              <Plus size={14} />
              Add Filter
            </button>
          </div>
          
          {filters.map((filter, index) => (
            <div key={index} className="filter-item">
              <div className="filter-row">
                <div className="filter-control-group">
                  <select
                    value={filter.field}
                    onChange={(e) => handleFilterFieldChange(index, e.target.value)}
                    disabled={loading}
                    className="filter-field-select"
                  >
                    <option value="">-- Select Field --</option>
                    {filterableFields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                {filters.length > 1 && (
                  <button
                    type="button"
                    className="remove-filter-btn"
                    onClick={() => handleRemoveFilter(index)}
                    disabled={loading}
                    title="Remove this filter"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {filter.field && (
                <div className="filter-value-row">
                  <div className="filter-control-group">
                    <select
                      value={filter.value}
                      onChange={(e) => handleFilterValueChange(index, e.target.value)}
                      disabled={loading || getFieldValues(filter.field).length === 0}
                      className="filter-value-select"
                    >
                      <option value="">-- Select Value --</option>
                      {getFieldValues(filter.field).map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sort Options */}
        <div className="sort-section">
          <div className="sort-header">
            <ArrowUpDown size={16} />
            <label>Sort By:</label>
          </div>
          <div className="sort-controls">
            <select
              value={sortField}
              onChange={(e) => handleSortFieldChange(e.target.value)}
              disabled={loading}
              className="sort-field-select"
            >
              <option value="">-- Select Field --</option>
              {sortableFields.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
            
            {sortField && (
              <select
                value={sortOrder}
                onChange={(e) => handleSortOrderChange(e.target.value)}
                disabled={loading}
                className="sort-order-select"
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            )}
          </div>
        </div>

        <div className="filter-actions">
          <button
            className="apply-filter-btn"
            onClick={handleApply}
            disabled={loading || (filters.every(f => !f.field || !f.value) && !sortField)}
          >
            <Filter size={16} />
            Apply Filter
          </button>
          <button
            className="clear-filter-btn"
            onClick={handleClear}
            disabled={loading}
          >
            <X size={16} />
            Clear Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldFilter;
