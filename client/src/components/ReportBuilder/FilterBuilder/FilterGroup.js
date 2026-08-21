import React from 'react';
import { X, Plus } from 'lucide-react';
import FilterCondition from './FilterCondition';
import './FilterBuilder.css';

const FilterGroup = ({
  group,
  groupIndex,
  availableFields,
  filterOptions,
  onAddCondition,
  onRemoveGroup,
  onUpdateGroup,
  onUpdateCondition,
  onRemoveCondition,
  canRemove
}) => {
  const handleGroupLogicChange = (e) => {
    onUpdateGroup({ logic: e.target.value });
  };

  return (
    <div className="filter-group">
      <div className="filter-group-header">
        <div className="filter-group-title">
          <span className="filter-group-label">Group {groupIndex + 1}</span>
          {group.conditions.length > 1 && (
            <select
              value={group.logic}
              onChange={handleGroupLogicChange}
              className="filter-group-logic-select"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemoveGroup}
            className="filter-group-remove-btn"
            title="Remove filter group"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="filter-conditions-container">
        {group.conditions.map((condition, conditionIndex) => (
          <div key={condition.id} className="filter-condition-wrapper">
            {conditionIndex > 0 && (
              <div className="filter-condition-connector">
                <span className="filter-connector-text">{group.logic}</span>
              </div>
            )}
            <FilterCondition
              condition={condition}
              availableFields={availableFields}
              filterOptions={filterOptions}
              onUpdate={(updates) => onUpdateCondition(condition.id, updates)}
              onRemove={() => onRemoveCondition(condition.id)}
              canRemove={group.conditions.length > 1}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddCondition}
        className="filter-add-condition-btn"
      >
        <Plus size={14} />
        Add Condition
      </button>
    </div>
  );
};

export default FilterGroup;

