import React, { useState } from 'react';
import { X, Plus, Filter } from 'lucide-react';
import FilterBuilder from '../../../ReportBuilder/FilterBuilder/FilterBuilder';
import '../../../../styles/FilterCard.css';

const FilterCard = ({ filters, onFilterAdd, onFilterRemove, availableFields }) => {
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);

  // Convert filters array to filter structure for FilterBuilder
  const filterStructure = {
    groups: [{
      id: 'group_1',
      logic: 'AND',
      conditions: filters.map((filter, index) => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
        valueType: filter.valueType || 'text'
      }))
    }],
    groupLogic: 'AND'
  };

  const handleFiltersChange = (newFilters) => {
    if (newFilters.groups && newFilters.groups.length > 0) {
      const conditions = newFilters.groups[0].conditions || [];
      // Update filters array
      conditions.forEach((condition, index) => {
        if (index < filters.length) {
          // Update existing
        } else {
          // Add new
          onFilterAdd(condition);
        }
      });
      // Remove extra filters
      for (let i = conditions.length; i < filters.length; i++) {
        onFilterRemove(i);
      }
    }
  };

  return (
    <div className="query-card filter-card">
      <div className="card-header">
        <div className="card-title">
          <Filter size={18} />
          <span>Filters</span>
        </div>
        {filters.length > 0 && (
          <button
            className="card-remove-btn"
            onClick={() => {
              // Remove all filters
              filters.forEach((_, index) => onFilterRemove(index));
            }}
            title="Clear all filters"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="card-content">
        {filters.length === 0 ? (
          <div className="card-empty">
            <p>No filters applied</p>
            <button
              className="add-filter-btn"
              onClick={() => setShowFilterBuilder(true)}
            >
              <Plus size={14} /> Add Filter
            </button>
          </div>
        ) : (
          <div className="filter-list">
            {filters.map((filter, index) => (
              <div key={index} className="filter-item">
                <span className="filter-field">{filter.field}</span>
                <span className="filter-operator">{filter.operator}</span>
                <span className="filter-value">{String(filter.value)}</span>
                <button
                  className="filter-remove-btn"
                  onClick={() => onFilterRemove(index)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              className="add-filter-btn-small"
              onClick={() => setShowFilterBuilder(true)}
            >
              <Plus size={12} /> Add Filter
            </button>
          </div>
        )}

        {showFilterBuilder && (
          <div className="filter-builder-modal">
            <div className="filter-builder-content">
              <div className="filter-builder-header">
                <h3>Add Filter</h3>
                <button onClick={() => setShowFilterBuilder(false)}>
                  <X size={16} />
                </button>
              </div>
              <FilterBuilder
                availableFields={availableFields}
                filterOptions={{}}
                filters={filterStructure}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterCard;

