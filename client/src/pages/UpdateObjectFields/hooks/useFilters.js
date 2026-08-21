// Custom hook for filter state management

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_FILTERS } from '../constants';
import { fetchAllProjects, fetchAllProjectObjectives, getMatchingRecordsCount } from '../services/apiService';

export const useFilters = (selectedObject) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState({});
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectObjectiveSearchTerm, setProjectObjectiveSearchTerm] = useState('');
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [allProjectObjectives, setAllProjectObjectives] = useState([]);
  const [filteredProjectObjectives, setFilteredProjectObjectives] = useState([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showProjectObjectiveDropdown, setShowProjectObjectiveDropdown] = useState(false);
  const [loadingAllProjects, setLoadingAllProjects] = useState(false);
  const [searchingProjects, setSearchingProjects] = useState(false);
  const [searchingProjectObjectives, setSearchingProjectObjectives] = useState(false);
  const [matchingRecordsCount, setMatchingRecordsCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const projectSearchRef = useRef(null);
  const projectObjectiveSearchRef = useRef(null);
  const projectSearchTimeoutRef = useRef(null);
  const projectObjectiveSearchTimeoutRef = useRef(null);

  // Reset filters when object changes
  useEffect(() => {
    if (selectedObject) {
      setFilters(DEFAULT_FILTERS);
      setProjectSearchTerm('');
      setProjectObjectiveSearchTerm('');
      setAllProjects([]);
      setFilteredProjects([]);
      setAllProjectObjectives([]);
      setFilteredProjectObjectives([]);
      setShowProjectDropdown(false);
      setShowProjectObjectiveDropdown(false);
      setMatchingRecordsCount(null);
    }
  }, [selectedObject]);

  // Filter projects based on search term
  useEffect(() => {
    if (projectSearchTerm.trim() === '') {
      setFilteredProjects(allProjects);
      setSearchingProjects(false);
      return;
    }

    setSearchingProjects(true);
    if (projectSearchTimeoutRef.current) {
      clearTimeout(projectSearchTimeoutRef.current);
    }

    projectSearchTimeoutRef.current = setTimeout(() => {
      const searchLower = projectSearchTerm.toLowerCase().trim();
      const filtered = allProjects.filter(project => {
        // Handle cases where project might be null or name might be undefined
        if (!project) return false;
        const projectName = project.name || project.Name || '';
        return projectName.toLowerCase().includes(searchLower);
      });
      setFilteredProjects(filtered);
      setSearchingProjects(false);
    }, 300);
  }, [projectSearchTerm, allProjects]);

  // Filter project objectives based on search term
  useEffect(() => {
    if (projectObjectiveSearchTerm.trim() === '') {
      setFilteredProjectObjectives(allProjectObjectives);
      setSearchingProjectObjectives(false);
      return;
    }

    setSearchingProjectObjectives(true);
    if (projectObjectiveSearchTimeoutRef.current) {
      clearTimeout(projectObjectiveSearchTimeoutRef.current);
    }

    projectObjectiveSearchTimeoutRef.current = setTimeout(() => {
      const searchLower = projectObjectiveSearchTerm.toLowerCase().trim();
      const filtered = allProjectObjectives.filter(po => {
        // Handle cases where po might be null or name might be undefined
        if (!po) return false;
        const poName = po.name || po.Name || '';
        return poName.toLowerCase().includes(searchLower);
      });
      setFilteredProjectObjectives(filtered);
      setSearchingProjectObjectives(false);
    }, 300);
  }, [projectObjectiveSearchTerm, allProjectObjectives]);

  // Load projects
  const loadProjects = useCallback(async () => {
    setLoadingAllProjects(true);
    try {
      const projects = await fetchAllProjects();
      setAllProjects(projects);
      setFilteredProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingAllProjects(false);
    }
  }, []);

  // Load project objectives
  const loadProjectObjectives = useCallback(async (projectId = null) => {
    try {
      const objectives = await fetchAllProjectObjectives(projectId);
      setAllProjectObjectives(objectives);
      setFilteredProjectObjectives(objectives);
    } catch (error) {
      console.error('Error loading project objectives:', error);
    }
  }, []);

  // Update matching records count
  const updateMatchingCount = useCallback(async () => {
    if (!selectedObject) return;
    
    setLoadingCount(true);
    try {
      const count = await getMatchingRecordsCount(selectedObject, filters);
      setMatchingRecordsCount(count);
    } catch (error) {
      console.error('Error getting matching count:', error);
    } finally {
      setLoadingCount(false);
    }
  }, [selectedObject, filters]);

  // Update count when filters change
  useEffect(() => {
    if (selectedObject) {
      updateMatchingCount();
    }
  }, [selectedObject, filters, updateMatchingCount]);

  // Handle project selection
  const handleProjectSelect = useCallback((project) => {
    const hadProjectObjective = filters.projectObjectiveId;
    setFilters(prev => ({
      ...prev,
      projectId: project.id,
      projectName: project.name,
      projectObjectiveId: '',
      projectObjectiveName: ''
    }));
    setProjectSearchTerm(project.name);
    setShowProjectDropdown(false);
    if (hadProjectObjective) {
      setProjectObjectiveSearchTerm('');
    }
    loadProjectObjectives(project.id);
  }, [filters.projectObjectiveId, loadProjectObjectives]);

  // Handle project objective selection
  const handleProjectObjectiveSelect = useCallback((projectObjective) => {
    setFilters(prev => ({
      ...prev,
      projectObjectiveId: projectObjective.id,
      projectObjectiveName: projectObjective.name
    }));
    setProjectObjectiveSearchTerm(projectObjective.name);
    setShowProjectObjectiveDropdown(false);
  }, []);

  return {
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
    updateMatchingCount,
    handleProjectSelect,
    handleProjectObjectiveSelect
  };
};

