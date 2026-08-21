import React, { useState, useEffect, useRef } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import apiClient from '../../config/api';
import '../../styles/CaseManagement.css';

const WorkStreamFilter = ({ showFilters, onToggleFilters, onApplyFilters, onClearFilters, filters }) => {
  const [projectStatusValues, setProjectStatusValues] = useState([]);
  const [projectObjectiveStatusValues, setProjectObjectiveStatusValues] = useState([]);
  const [showPOStatusDropdown, setShowPOStatusDropdown] = useState(false);
  const poStatusDropdownRef = useRef(null);
  const [allPOStatusValues, setAllPOStatusValues] = useState([]);
  const [loadingPOStatusValues, setLoadingPOStatusValues] = useState(false);

  // Default status values for Project Objective Status
  const defaultProjectObjectiveStatuses = ['Open', 'Paused', 'Hidden'];
  
  // Common project status values (these should ideally come from API)
  const commonProjectStatuses = ['Open', 'Closed', 'Paused', 'Cancelled', 'On Hold'];
  
  // Fetch all PO status values from Salesforce
  useEffect(() => {
    const fetchPOStatusValues = async () => {
      setLoadingPOStatusValues(true);
      try {
        const response = await apiClient.get('/workstream-reporting/project-objective-status-values');
        if (response.data.success && response.data.statusValues) {
          setAllPOStatusValues(response.data.statusValues);
        } else {
          // Fallback to defaults if API fails
          setAllPOStatusValues(defaultProjectObjectiveStatuses);
        }
      } catch (error) {
        console.error('Error fetching PO status values:', error);
        // Fallback to defaults on error
        setAllPOStatusValues(defaultProjectObjectiveStatuses);
      } finally {
        setLoadingPOStatusValues(false);
      }
    };
    
    fetchPOStatusValues();
  }, []);

  useEffect(() => {
    // Initialize with default filters
    if (filters.projectObjectiveStatus && filters.projectObjectiveStatus.length > 0) {
      setProjectObjectiveStatusValues(filters.projectObjectiveStatus);
    } else {
      // Default: Open, Paused, Hidden
      setProjectObjectiveStatusValues(defaultProjectObjectiveStatuses);
    }
    
    if (filters.projectStatus && filters.projectStatus.length > 0) {
      setProjectStatusValues(filters.projectStatus);
    }
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (poStatusDropdownRef.current && !poStatusDropdownRef.current.contains(event.target)) {
        setShowPOStatusDropdown(false);
      }
    };

    if (showPOStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPOStatusDropdown]);


  const handleClearAll = () => {
    setProjectStatusValues([]);
    setProjectObjectiveStatusValues([]);
    onClearFilters();
  };

  const handleRemoveFilter = (field) => {
    const newFilters = { ...filters };
    if (field === 'projectStatus') {
      newFilters.projectStatus = [];
      setProjectStatusValues([]);
    } else if (field === 'projectObjectiveStatus') {
      // Don't allow removing all project objective status filters - must have at least default
      if (newFilters.projectObjectiveStatus && newFilters.projectObjectiveStatus.length > 0) {
        newFilters.projectObjectiveStatus = ['Open', 'Paused', 'Hidden']; // Reset to default
        setProjectObjectiveStatusValues(['Open', 'Paused', 'Hidden']);
      }
    }
    onApplyFilters(newFilters);
  };

  return (
    <>
      <button
        onClick={onToggleFilters}
        className={`btn-action ${showFilters ? 'active' : ''}`}
        title="Filter workstreams"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: showFilters ? '#0176d3' : 'transparent',
          color: showFilters ? '#fff' : '#0176d3',
          border: '1px solid #0176d3',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        <Filter size={16} />
        <span>Filter</span>
        {(projectStatusValues.length > 0 || projectObjectiveStatusValues.length > 0) && (
          <span style={{
            background: showFilters ? '#fff' : '#0176d3',
            color: showFilters ? '#0176d3' : '#fff',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: '600',
            marginLeft: '4px'
          }}>
            {projectStatusValues.length + projectObjectiveStatusValues.length}
          </span>
        )}
      </button>

      {showFilters && (
        <div style={{ 
          marginTop: '12px', 
          marginBottom: '12px',
          padding: '12px',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <button
            onClick={onToggleFilters}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: '#6b7280',
              zIndex: 10
            }}
            title="Close filters"
          >
            <X size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingRight: '32px' }}>
            {/* Project Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>
                Project Status:
              </label>
              <select
                value={projectStatusValues.length > 0 ? projectStatusValues[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const newFilters = { ...filters, projectStatus: [e.target.value] };
                    onApplyFilters(newFilters);
                  } else {
                    handleRemoveFilter('projectStatus');
                  }
                }}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  minWidth: '140px',
                  background: '#fff'
                }}
              >
                <option value="">All</option>
                {commonProjectStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {projectStatusValues.length > 0 && (
                <button
                  onClick={() => handleRemoveFilter('projectStatus')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Remove filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Project Objective Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }} ref={poStatusDropdownRef}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>
                PO Status:
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '13px',
                    minWidth: '180px',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                  onClick={() => setShowPOStatusDropdown(!showPOStatusDropdown)}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {projectObjectiveStatusValues.length === 0
                      ? 'None'
                      : projectObjectiveStatusValues.length === allPOStatusValues.length || 
                        (allPOStatusValues.length === 0 && projectObjectiveStatusValues.length === defaultProjectObjectiveStatuses.length)
                      ? 'All'
                      : projectObjectiveStatusValues.length <= 3
                      ? projectObjectiveStatusValues.join(', ')
                      : `${projectObjectiveStatusValues.length} selected`}
                  </span>
                  <ChevronDown size={14} />
                </div>
                        {showPOStatusDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            background: '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            minWidth: '180px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            padding: '8px'
                          }}>
                            {loadingPOStatusValues ? (
                              <div style={{ padding: '8px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                Loading...
                              </div>
                            ) : (
                              (allPOStatusValues.length > 0 ? allPOStatusValues : defaultProjectObjectiveStatuses).map(status => (
                      <label
                        key={status}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 0',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={projectObjectiveStatusValues.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newValues = [...projectObjectiveStatusValues, status];
                              const newFilters = { ...filters, projectObjectiveStatus: newValues };
                              onApplyFilters(newFilters);
                            } else {
                              const newValues = projectObjectiveStatusValues.filter(v => v !== status);
                              const newFilters = { ...filters, projectObjectiveStatus: newValues.length > 0 ? newValues : ['Open', 'Paused', 'Hidden'] };
                              onApplyFilters(newFilters);
                            }
                          }}
                        />
                                <span>{status}</span>
                              </label>
                            ))
                            )}
                          </div>
                        )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Clear
              </button>
              <button
                onClick={() => onApplyFilters(filters)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  background: '#08979C',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkStreamFilter;

