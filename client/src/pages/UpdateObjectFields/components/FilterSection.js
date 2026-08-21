// FilterSection component - Handles all filter UI for different object types

import React, { useEffect } from 'react';
import { Loader } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';
import { useFilters } from '../hooks/useFilters';
import { fetchFilterOptions, fetchAllProjects, fetchAllProjectObjectives } from '../services/apiService';
import toast from 'react-hot-toast';

const FilterSection = ({ 
  selectedObject, 
  setSelectedObject,
  objectOptions,
  onFiltersChange,
  setFields,
  setSelectedField,
  setNewValue,
  setCurrentValue
}) => {
  const filterHook = useFilters(selectedObject);
  const {
    filters,
    setFilters,
    filterOptions,
    setFilterOptions,
    loadingFilters,
    setLoadingFilters,
    projectSearchTerm,
    setProjectSearchTerm,
    projectObjectiveSearchTerm,
    setProjectObjectiveSearchTerm,
    allProjects,
    filteredProjects,
    allProjectObjectives,
    filteredProjectObjectives,
    showProjectDropdown,
    setShowProjectDropdown,
    showProjectObjectiveDropdown,
    setShowProjectObjectiveDropdown,
    loadingAllProjects,
    searchingProjects,
    searchingProjectObjectives,
    matchingRecordsCount,
    loadingCount,
    projectSearchRef,
    projectObjectiveSearchRef,
    loadProjects,
    loadProjectObjectives,
    handleProjectSelect,
    handleProjectObjectiveSelect
  } = filterHook;

  // Fetch filter options when object is selected
  useEffect(() => {
    if (selectedObject) {
      const fetchOptions = async () => {
        setLoadingFilters(true);
        try {
          const options = await fetchFilterOptions(selectedObject);
          setFilterOptions(options);
          
          // Always load projects from the dedicated endpoint for better search functionality
          const needsProjectFilter = selectedObject.toLowerCase() === 'project' ||
                                   selectedObject.toLowerCase() === 'project objective' || 
                                   selectedObject.toLowerCase() === 'contributor project';
          if (needsProjectFilter) {
            // Always load projects from the dedicated endpoint for search
            loadProjects();
          }

          // Load project objectives if available
          if (options.projectObjectives && options.projectObjectives.length > 0) {
            // Project objectives already loaded
          } else {
            const needsProjectObjectiveFilter = selectedObject.toLowerCase() === 'project objective' ||
                                             selectedObject.toLowerCase() === 'contributor project';
            if (needsProjectObjectiveFilter) {
              loadProjectObjectives(filters.projectId || null);
            }
          }
        } catch (error) {
          console.error('Error fetching filter options:', error);
          toast.error('Failed to load filter options');
        } finally {
          setLoadingFilters(false);
        }
      };
      fetchOptions();
    }
  }, [selectedObject, loadProjects, loadProjectObjectives, filters.projectId]);

  // Refresh project objectives when project filter changes
  useEffect(() => {
    if (!selectedObject) return;
    
    const needsProjectObjectiveFilter = selectedObject.toLowerCase() === 'project objective' ||
                                       selectedObject.toLowerCase() === 'contributor project';
    
    if (needsProjectObjectiveFilter) {
      const projectId = filters.projectId || null;
      loadProjectObjectives(projectId);
      
      if (!filters.projectId && filters.projectObjectiveId) {
        setFilters(prev => ({
          ...prev,
          projectObjectiveId: '',
          projectObjectiveName: ''
        }));
        setProjectObjectiveSearchTerm('');
      }
    }
  }, [filters.projectId, selectedObject, loadProjectObjectives, filters.projectObjectiveId, setFilters, setProjectObjectiveSearchTerm]);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters, matchingRecordsCount);
    }
  }, [filters, matchingRecordsCount, onFiltersChange]);

  // Handle project search change
  const handleProjectSearchChange = (e) => {
    const value = e.target.value;
    setProjectSearchTerm(value);
    if (!value || value.trim() === '') {
      setFilters(prev => {
        const updated = { ...prev, projectId: '', projectName: '' };
        if (prev.projectId) {
          loadProjectObjectives(null);
          if (prev.projectObjectiveId) {
            updated.projectObjectiveId = '';
            updated.projectObjectiveName = '';
            setProjectObjectiveSearchTerm('');
          }
        }
        return updated;
      });
    }
    setShowProjectDropdown(true);
  };

  // Handle project objective search change
  const handleProjectObjectiveSearchChange = (e) => {
    const value = e.target.value;
    setProjectObjectiveSearchTerm(value);
    if (!value || value.trim() === '') {
      setFilters(prev => ({ ...prev, projectObjectiveId: '', projectObjectiveName: '' }));
    }
    setShowProjectObjectiveDropdown(true);
  };

  const objectLower = selectedObject?.toLowerCase() || '';

  return (
    <div className="form-section fade-in">
      <div className="section-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'start' }}>
          {/* Select Object - Compact */}
          <div style={{ minWidth: '200px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', display: 'block', color: '#374151' }}>
              Object *
            </label>
            <select
              value={selectedObject}
              onChange={(e) => {
                setSelectedObject(e.target.value);
                setSelectedField('');
                setNewValue('');
                setCurrentValue('');
              }}
              style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
            >
              <option value="">--Select Object--</option>
              {objectOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Filters - Compact, only shown when object is selected */}
          {selectedObject && (
            <div style={{ flex: 1 }}>
              <div className="form-grid compact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {/* Project Objective: Filter by Project, Project Objective */}
                {objectLower === 'project objective' && (
                  <>
                    <SearchableDropdown
                      label="Filter by Project"
                      value={projectSearchTerm}
                      onChange={handleProjectSearchChange}
                      onFocus={() => {
                        setShowProjectDropdown(true);
                        // Ensure projects are loaded when focusing
                        if (allProjects.length === 0 && !loadingAllProjects) {
                          loadProjects();
                        }
                      }}
                      onClose={() => setShowProjectDropdown(false)}
                      placeholder="Search or select a project..."
                      options={filteredProjects}
                      loading={loadingAllProjects}
                      searching={searchingProjects}
                      showDropdown={showProjectDropdown}
                      onSelect={handleProjectSelect}
                      style={{ position: 'relative' }}
                      zIndex={100000}
                    />
                    <SearchableDropdown
                      label="Filter by Project Objective"
                      value={projectObjectiveSearchTerm}
                      onChange={handleProjectObjectiveSearchChange}
                      onFocus={() => {
                        setShowProjectObjectiveDropdown(true);
                        // Ensure project objectives are loaded when focusing
                        // Load all project objectives if none are loaded (even if no project filter is selected)
                        if (allProjectObjectives.length === 0) {
                          loadProjectObjectives(filters.projectId || null);
                        }
                      }}
                      onClose={() => setShowProjectObjectiveDropdown(false)}
                      placeholder="Search or select a project objective..."
                      options={filteredProjectObjectives}
                      loading={false}
                      searching={searchingProjectObjectives}
                      showDropdown={showProjectObjectiveDropdown}
                      onSelect={handleProjectObjectiveSelect}
                      style={{ position: 'relative' }}
                      zIndex={100000}
                    />
                  </>
                )}

                {/* Contributor Project: Filter by Project, Project Objective, Status */}
                {objectLower === 'contributor project' && (
                  <>
                    <SearchableDropdown
                      label="Filter by Project"
                      value={projectSearchTerm}
                      onChange={handleProjectSearchChange}
                      onFocus={() => {
                        setShowProjectDropdown(true);
                        // Ensure projects are loaded when focusing
                        if (allProjects.length === 0 && !loadingAllProjects) {
                          loadProjects();
                        }
                      }}
                      onClose={() => setShowProjectDropdown(false)}
                      placeholder="Search or select a project..."
                      options={filteredProjects}
                      loading={loadingAllProjects}
                      searching={searchingProjects}
                      showDropdown={showProjectDropdown}
                      onSelect={handleProjectSelect}
                      style={{ position: 'relative' }}
                      zIndex={100000}
                    />
                    <SearchableDropdown
                      label="Filter by Project Objective"
                      value={projectObjectiveSearchTerm}
                      onChange={handleProjectObjectiveSearchChange}
                      onFocus={() => {
                        setShowProjectObjectiveDropdown(true);
                        // Ensure project objectives are loaded when focusing
                        // Load all project objectives if none are loaded or if project filter is not selected
                        if (allProjectObjectives.length === 0) {
                          loadProjectObjectives(filters.projectId || null);
                        }
                      }}
                      onClose={() => setShowProjectObjectiveDropdown(false)}
                      placeholder="Search or select a project objective..."
                      options={filteredProjectObjectives}
                      loading={false}
                      searching={searchingProjectObjectives}
                      showDropdown={showProjectObjectiveDropdown}
                      onSelect={handleProjectObjectiveSelect}
                      style={{ position: 'relative' }}
                      zIndex={100000}
                    />
                    <div className="form-group">
                      <label style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', display: 'block', color: '#374151' }}>
                        Filter by Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
                      >
                        <option value="">--All Statuses--</option>
                        {(filterOptions.statuses || []).map((status, index) => (
                          <option key={index} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Project: Filter by Project, Status, Type */}
                {objectLower === 'project' && (
                  <>
                    <SearchableDropdown
                      label="Filter by Project"
                      value={projectSearchTerm}
                      onChange={handleProjectSearchChange}
                      onFocus={() => setShowProjectDropdown(true)}
                      placeholder="Search or select a project..."
                      options={filteredProjects}
                      loading={loadingAllProjects}
                      searching={searchingProjects}
                      showDropdown={showProjectDropdown}
                      onSelect={handleProjectSelect}
                      style={{ position: 'relative' }}
                      zIndex={100000}
                    />
                    <div className="form-group">
                      <label style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', display: 'block', color: '#374151' }}>
                        Filter by Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
                      >
                        <option value="">--All Statuses--</option>
                        {(filterOptions.statuses || []).map((status, index) => (
                          <option key={index} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', display: 'block', color: '#374151' }}>
                        Filter by Type
                      </label>
                      <select
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
                      >
                        <option value="">--All Types--</option>
                        {(filterOptions.types || []).map((type, index) => (
                          <option key={index} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Matching Records Count */}
      {selectedObject && matchingRecordsCount !== null && (
        <div style={{ 
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '13px', 
          color: '#08979C',
          fontWeight: '500',
          paddingBottom: '12px',
          paddingLeft: '12px',
          paddingRight: '12px',
          backgroundColor: '#e6fffb',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {loadingCount ? (
            <>
              <Loader size={14} className="spinner" />
              <span>Counting...</span>
            </>
          ) : (
            <span>
              {matchingRecordsCount === 0 
                ? 'No records match the filters' 
                : `${matchingRecordsCount} record${matchingRecordsCount === 1 ? '' : 's'} match${matchingRecordsCount === 1 ? 'es' : ''} the filters`
              }
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;

