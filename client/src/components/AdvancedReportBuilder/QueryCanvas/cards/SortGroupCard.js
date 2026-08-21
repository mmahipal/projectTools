import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import '../../../../styles/SortGroupCard.css';

const SortGroupCard = ({
  sortBy,
  sortOrder,
  groupBy,
  availableFields,
  onSortUpdate,
  onGroupByUpdate
}) => {
  const getFieldLabel = (fieldName) => {
    if (typeof fieldName === 'string') {
      const field = availableFields.find(f => {
        const fName = typeof f === 'string' ? f : f.name;
        return fName === fieldName;
      });
      return field ? (typeof field === 'string' ? field : field.label || field.name) : fieldName;
    }
    return fieldName;
  };

  return (
    <div className="query-card sort-group-card">
      <div className="card-header">
        <div className="card-title">
          <ArrowUpDown size={18} />
          <span>Sort & Group</span>
        </div>
      </div>
      
      <div className="card-content">
        <div className="sort-group-controls">
          <div className="control-group">
            <label>Sort By</label>
            <select
              value={sortBy || ''}
              onChange={(e) => {
                if (e.target.value) {
                  onSortUpdate(e.target.value, sortOrder);
                } else {
                  onSortUpdate(null, 'ASC');
                }
              }}
              className="control-select"
            >
              <option value="">No sorting</option>
              {availableFields.map(field => {
                const fieldName = typeof field === 'string' ? field : field.name;
                const fieldLabel = getFieldLabel(fieldName);
                return (
                  <option key={fieldName} value={fieldName}>
                    {fieldLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {sortBy && (
            <div className="control-group">
              <label>Order</label>
              <select
                value={sortOrder || 'ASC'}
                onChange={(e) => onSortUpdate(sortBy, e.target.value)}
                className="control-select"
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>
          )}

          <div className="control-group">
            <label>Group By</label>
            <select
              value={groupBy || ''}
              onChange={(e) => onGroupByUpdate(e.target.value || null)}
              className="control-select"
            >
              <option value="">No grouping</option>
              {availableFields.map(field => {
                const fieldName = typeof field === 'string' ? field : field.name;
                const fieldLabel = getFieldLabel(fieldName);
                return (
                  <option key={fieldName} value={fieldName}>
                    {fieldLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortGroupCard;

