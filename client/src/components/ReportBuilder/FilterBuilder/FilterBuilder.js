import React, { useState, useEffect } from 'react';
import { Plus, X, Filter } from 'lucide-react';
import FilterCondition from './FilterCondition';
import FilterGroup from './FilterGroup';
import './FilterBuilder.css';

const FilterBuilder = ({ 
  availableFields, 
  filterOptions, 
  filters, 
  onFiltersChange 
}) => {
  const [filterGroups, setFilterGroups] = useState(() => {
    // Initialize from existing filters or create default group
    if (filters && filters.groups && filters.groups.length > 0) {
      return filters.groups;
    }
    return [{ id: 'group_1', logic: 'AND', conditions: [] }];
  });

  // Sync filterGroups with filters prop when it changes externally
  useEffect(() => {
    // Check if filters have the new advanced structure (with groups)
    if (filters && filters.groups && Array.isArray(filters.groups)) {
      // Only update if the structure is different to avoid infinite loops
      const currentGroupsStr = JSON.stringify(filterGroups);
      const newGroupsStr = JSON.stringify(filters.groups);
      if (currentGroupsStr !== newGroupsStr) {
        setFilterGroups(filters.groups);
      }
    } else if (filters && typeof filters === 'object' && !filters.groups) {
      // Old simple filter format - convert to new format
      const hasFilters = Object.keys(filters).length > 0 && Object.values(filters).some(v => v !== null && v !== '' && v !== '--None--');
      if (hasFilters) {
        // Convert old format to new format
        const conditions = Object.entries(filters)
          .filter(([key, value]) => value !== null && value !== '' && value !== '--None--')
          .map(([key, value], idx) => ({
            id: `condition_${Date.now()}_${idx}`,
            field: key,
            operator: Array.isArray(value) ? 'in' : 'equals',
            value: Array.isArray(value) ? value : value,
            valueType: Array.isArray(value) ? 'multiselect' : 'text'
          }));
        
        if (conditions.length > 0) {
          const newGroups = [{ id: 'group_1', logic: 'AND', conditions }];
          setFilterGroups(newGroups);
        }
      } else {
        // Empty filters - reset to default
        if (filterGroups.length === 0 || (filterGroups.length === 1 && filterGroups[0].conditions.length === 0)) {
          setFilterGroups([{ id: 'group_1', logic: 'AND', conditions: [] }]);
        }
      }
    } else if (!filters || (typeof filters === 'object' && Object.keys(filters).length === 0)) {
      // Completely empty filters - reset to default only if current groups are empty
      const hasAnyConditions = filterGroups.some(g => 
        g.conditions && g.conditions.length > 0
      );
      if (!hasAnyConditions && filterGroups.length === 0) {
        setFilterGroups([{ id: 'group_1', logic: 'AND', conditions: [] }]);
      }
    }
  }, [filters]);

  const addFilterGroup = () => {
    const newGroup = {
      id: `group_${Date.now()}`,
      logic: 'AND',
      conditions: []
    };
    setFilterGroups([...filterGroups, newGroup]);
    updateFilters();
  };

  const removeFilterGroup = (groupId) => {
    if (filterGroups.length > 1) {
      const updated = filterGroups.filter(g => g.id !== groupId);
      setFilterGroups(updated);
      updateFilters();
    }
  };

  const updateFilterGroup = (groupId, updates) => {
    const updated = filterGroups.map(g => 
      g.id === groupId ? { ...g, ...updates } : g
    );
    setFilterGroups(updated);
    updateFilters();
  };

  const addCondition = (groupId) => {
    const updated = filterGroups.map(g => {
      if (g.id === groupId) {
        const newCondition = {
          id: `condition_${Date.now()}`,
          field: '',
          operator: 'equals',
          value: '',
          valueType: 'text'
        };
        return {
          ...g,
          conditions: [
            ...g.conditions,
            newCondition
          ]
        };
      }
      return g;
    });
    setFilterGroups(updated);
    // Update filters immediately with the updated groups to preserve UI state
    updateFilters(updated);
  };

  const removeCondition = (groupId, conditionId) => {
    const updated = filterGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          conditions: g.conditions.filter(c => c.id !== conditionId)
        };
      }
      return g;
    });
    setFilterGroups(updated);
    updateFilters();
  };

  const updateCondition = (groupId, conditionId, updates) => {
    const updated = filterGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          conditions: g.conditions.map(c =>
            c.id === conditionId ? { ...c, ...updates } : c
          )
        };
      }
      return g;
    });
    setFilterGroups(updated);
    updateFilters();
  };

  const updateFilters = (groupsToUse = null) => {
    // Use provided groups or current state
    const groups = groupsToUse || filterGroups;
    
    // Always send all groups with their conditions, even if incomplete
    // This ensures filters are saved properly when report is saved
    // The backend will handle validation when building the SOQL query
    const filterStructure = {
      groupLogic: (filters && filters.groupLogic) || (groups.length > 1 ? 'AND' : 'AND'),
      groups: groups.map(g => ({
        ...g,
        conditions: g.conditions || []
      }))
    };
    
    onFiltersChange(filterStructure);
  };

  const setGroupLogic = (groupId, logic) => {
    updateFilterGroup(groupId, { logic });
  };

  return (
    <div className="filter-builder">
      <div className="filter-builder-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#08979C" />
          <label style={{ fontSize: '13px', fontWeight: '500' }}>
            Advanced Filters (Optional)
          </label>
        </div>
        <button
          type="button"
          onClick={addFilterGroup}
          className="filter-builder-add-group-btn"
          title="Add filter group"
        >
          <Plus size={14} />
          Add Group
        </button>
      </div>

      <div className="filter-groups-container">
        {filterGroups.map((group, groupIndex) => (
          <FilterGroup
            key={group.id}
            group={group}
            groupIndex={groupIndex}
            availableFields={availableFields}
            filterOptions={filterOptions}
            onAddCondition={() => addCondition(group.id)}
            onRemoveGroup={() => removeFilterGroup(group.id)}
            onUpdateGroup={(updates) => updateFilterGroup(group.id, updates)}
            onUpdateCondition={(conditionId, updates) => 
              updateCondition(group.id, conditionId, updates)
            }
            onRemoveCondition={(conditionId) => 
              removeCondition(group.id, conditionId)
            }
            canRemove={filterGroups.length > 1}
          />
        ))}
      </div>

      {filterGroups.length === 0 && (
        <div className="filter-builder-empty">
          <p>No filters applied. Click "Add Group" to create filter conditions.</p>
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;

