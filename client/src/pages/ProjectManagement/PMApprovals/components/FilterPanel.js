import React, { useState, useEffect } from 'react';
import { RotateCcw, Filter } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import './FilterPanel.css';

const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onApplyFilters,
  onClearFilters, 
  filterOptions,
  loading 
}) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    account: 'all',
    project: 'all',
    projectObjective: 'all',
    email: 'all',
    transactionDateFrom: '',
    transactionDateTo: '',
    weekendingDateFrom: '',
    weekendingDateTo: '',
    transactionId: ''
  });

  useEffect(() => {
    setLocalFilters(filters || {
      account: 'all',
      project: 'all',
      projectObjective: 'all',
      email: 'all',
      transactionDateFrom: '',
      transactionDateTo: '',
      weekendingDateFrom: '',
      weekendingDateTo: '',
      transactionId: ''
    });
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    
    // Note: Removed cascading filter logic - all filters are independent
    // Users can select any combination of filters
    // Filters are stored locally but not applied until "Apply Filter" is clicked
    
    setLocalFilters(newFilters);
    // Don't call onFilterChange - filters are only applied when "Apply Filter" is clicked
  };

  const handleApplyFilters = () => {
    // Apply the current local filters
    if (onApplyFilters) {
      onApplyFilters(localFilters);
    } else if (onFilterChange) {
      // Fallback to onFilterChange if onApplyFilters is not provided
      onFilterChange(localFilters);
    }
  };

  const handleClearAll = () => {
    const clearedFilters = {
      account: 'all',
      project: 'all',
      projectObjective: 'all',
      email: 'all',
      transactionDateFrom: '',
      transactionDateTo: '',
      weekendingDateFrom: '',
      weekendingDateTo: '',
      transactionId: ''
    };
    setLocalFilters(clearedFilters);
    onClearFilters(clearedFilters);
  };

  // Ensure all filter options are arrays
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    return [];
  };

  const accounts = ensureArray(filterOptions?.accounts || []);
  const projects = ensureArray(filterOptions?.projects || []);
  const projectObjectives = ensureArray(filterOptions?.projectObjectives || []);
  const emails = ensureArray(filterOptions?.emails || []);

  return (
    <div className="filter-panel">
      <div className="filter-list">
        {/* Account Filter */}
        <div className="filter-row">
          <label className="filter-label">Account</label>
          <div className="filter-dropdown-wrapper">
            <SearchableSelect
              value={localFilters.account || 'all'}
              onChange={(value) => handleFilterChange('account', value)}
              options={accounts}
              placeholder="Search accounts..."
              disabled={loading}
              showAllOption={true}
              allOptionLabel="All"
              allOptionValue="all"
            />
          </div>
        </div>

        {/* Project Filter */}
        <div className="filter-row">
          <label className="filter-label">Project</label>
          <div className="filter-dropdown-wrapper">
            <SearchableSelect
              value={localFilters.project || 'all'}
              onChange={(value) => handleFilterChange('project', value)}
              options={projects}
              placeholder="Search projects..."
              disabled={loading}
              showAllOption={true}
              allOptionLabel="All"
              allOptionValue="all"
            />
          </div>
        </div>

        {/* Project Objective Filter */}
        <div className="filter-row">
          <label className="filter-label">Project Objective</label>
          <div className="filter-dropdown-wrapper">
            <SearchableSelect
              value={localFilters.projectObjective || 'all'}
              onChange={(value) => handleFilterChange('projectObjective', value)}
              options={projectObjectives}
              placeholder="Search project objectives..."
              disabled={loading}
              showAllOption={true}
              allOptionLabel="All"
              allOptionValue="all"
              getOptionLabel={(opt) => typeof opt === 'object' && opt !== null ? opt.name : String(opt || '')}
              getOptionValue={(opt) => typeof opt === 'object' && opt !== null ? opt.name : String(opt || '')}
              getOptionKey={(opt, index) => typeof opt === 'object' && opt !== null ? opt.id : (String(opt) || index)}
            />
          </div>
        </div>

        {/* Email Filter */}
        <div className="filter-row">
          <label className="filter-label">Email</label>
          <div className="filter-dropdown-wrapper">
            <SearchableSelect
              value={localFilters.email || 'all'}
              onChange={(value) => handleFilterChange('email', value)}
              options={emails}
              placeholder="Search emails..."
              disabled={loading}
              showAllOption={true}
              allOptionLabel="All"
              allOptionValue="all"
            />
          </div>
        </div>

        {/* Transaction Date Filter */}
        <div className="filter-row">
          <label className="filter-label">Transaction date</label>
          <div className="filter-date-range">
            <input
              type="date"
              className="filter-date-input"
              value={localFilters.transactionDateFrom || ''}
              onChange={(e) => handleFilterChange('transactionDateFrom', e.target.value)}
              disabled={loading}
            />
            <span className="filter-date-separator">to</span>
            <input
              type="date"
              className="filter-date-input"
              value={localFilters.transactionDateTo || ''}
              onChange={(e) => handleFilterChange('transactionDateTo', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Weekending Date Filter */}
        <div className="filter-row">
          <label className="filter-label">Weekending Date</label>
          <div className="filter-date-range">
            <input
              type="date"
              className="filter-date-input"
              value={localFilters.weekendingDateFrom || ''}
              onChange={(e) => handleFilterChange('weekendingDateFrom', e.target.value)}
              disabled={loading}
            />
            <span className="filter-date-separator">to</span>
            <input
              type="date"
              className="filter-date-input"
              value={localFilters.weekendingDateTo || ''}
              onChange={(e) => handleFilterChange('weekendingDateTo', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Transaction ID Filter */}
        <div className="filter-row">
          <label className="filter-label">Transaction ID</label>
          <input
            type="text"
            className="filter-text-input"
            value={localFilters.transactionId || ''}
            onChange={(e) => handleFilterChange('transactionId', e.target.value)}
            disabled={loading}
            placeholder="Enter Transaction ID"
          />
        </div>
      </div>
      
      <div className="filter-actions">
        <button 
          className="apply-filter-btn" 
          onClick={handleApplyFilters}
          disabled={loading}
        >
          <Filter size={16} />
          Apply Filter
        </button>
        <button 
          className="clear-filter-btn" 
          onClick={handleClearAll}
          disabled={loading}
        >
          <RotateCcw size={16} />
          Clear Filter
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;

