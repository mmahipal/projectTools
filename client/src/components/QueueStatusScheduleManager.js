/**
 * Queue Status Schedule Manager Component
 * Full CRUD interface for managing scheduled/automated status updates
 */

import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Settings, Loader, RefreshCw, Plus, Edit, Trash2, X, Save, Search, XCircle, ChevronLeft, ArrowRight, Filter } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { fetchAllProjects, fetchAllProjectObjectives, fetchFields, fetchPicklistValues } from '../pages/UpdateObjectFields/services/apiService';
import ConfirmModal from './ConfirmModal';
import TimePicker from './ReportBuilder/ScheduleComponents/TimePicker';
import './ReportBuilder/ScheduleComponents/ScheduleComponents.css';

const QueueStatusScheduleManager = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedRulesForExecution, setSelectedRulesForExecution] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [rulesToEnable, setRulesToEnable] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Filter data
  const [allProjects, setAllProjects] = useState([]);
  const [allProjectObjectives, setAllProjectObjectives] = useState([]);
  const [allContributorProjects, setAllContributorProjects] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectObjectiveSearchTerm, setProjectObjectiveSearchTerm] = useState('');
  const [contributorProjectSearchTerm, setContributorProjectSearchTerm] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showProjectObjectiveDropdown, setShowProjectObjectiveDropdown] = useState(false);
  const [showContributorProjectDropdown, setShowContributorProjectDropdown] = useState(false);
  const [contributorProjectFields, setContributorProjectFields] = useState([]);
  const [fieldPicklistValues, setFieldPicklistValues] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'time_based',
    enabled: false,
    fromStatus: '--None--',
    toStatus: '--None--',
    timeType: 'days', // 'days' or 'date'
    days: 7,
    specificDate: '',
    specificTime: '09:00',
    filters: {
      projects: {
        mode: 'none', // 'none', 'include', 'exclude'
        selected: []
      },
      projectObjectives: {
        mode: 'none',
        selected: []
      },
      contributorProjects: {
        mode: 'none',
        selected: []
      }
    }
  });

  const queueStatusOptions = ['--None--', 'Calibration Queue', 'Production Queue', 'Test Queue'];

  const fetchExecutionHistory = async (ruleId) => {
    setLoadingHistory(true);
    try {
      const response = await apiClient.get('/queue-status-management/execution-history', {
        params: {
          ruleId: ruleId,
          limit: 50
        }
      });
      if (response.data.success) {
        setExecutionHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching execution history:', error);
      toast.error('Failed to load execution history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRules();
    loadFilterData();
    loadContributorProjectFields();
  }, []);

  // Fetch execution history when a rule is selected
  useEffect(() => {
    if (selectedRule) {
      fetchExecutionHistory(selectedRule.id);
    } else {
      setExecutionHistory([]);
    }
  }, [selectedRule]);

  // Load contributor project fields for condition builder
  const loadContributorProjectFields = async () => {
    try {
      const fields = await fetchFields('Contributor Project');
      // Filter to only show relevant fields for conditions
      const relevantFields = fields.filter(f => 
        f.type === 'picklist' || 
        f.type === 'multipicklist' || 
        f.type === 'string' || 
        f.type === 'text' ||
        f.type === 'number' ||
        f.type === 'int' ||
        f.type === 'double' ||
        f.type === 'currency' ||
        f.type === 'percent' ||
        f.type === 'date' ||
        f.type === 'datetime' ||
        f.type === 'boolean' ||
        (f.type === 'reference' && f.name !== 'Id')
      );
      setContributorProjectFields(relevantFields);
    } catch (error) {
      console.error('Error loading contributor project fields:', error);
    }
  };

  // Load picklist values when a picklist field is selected in a condition
  useEffect(() => {
    const loadPicklistValuesForConditions = async () => {
      if (formData.type !== 'condition_based') return;
      
      const condition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : null;
      if (!condition || !condition.field) return;
      
      const field = contributorProjectFields.find(f => f.name === condition.field);
      if (field && (field.type === 'picklist' || field.type === 'multipicklist')) {
        if (!fieldPicklistValues[condition.field]) {
          try {
            const values = await fetchPicklistValues('Contributor Project', condition.field);
            setFieldPicklistValues(prev => ({ ...prev, [condition.field]: values }));
          } catch (error) {
            console.error(`Error loading picklist values for ${condition.field}:`, error);
          }
        }
      }
    };

    if (formData.type === 'condition_based' && contributorProjectFields.length > 0) {
      loadPicklistValuesForConditions();
    }
  }, [formData.conditions, formData.type, contributorProjectFields]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProjectDropdown && !event.target.closest('.project-filter-container')) {
        setShowProjectDropdown(false);
        setProjectSearchTerm('');
      }
      if (showProjectObjectiveDropdown && !event.target.closest('.project-objective-filter-container')) {
        setShowProjectObjectiveDropdown(false);
        setProjectObjectiveSearchTerm('');
      }
      if (showContributorProjectDropdown && !event.target.closest('.contributor-project-filter-container')) {
        setShowContributorProjectDropdown(false);
        setContributorProjectSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectDropdown, showProjectObjectiveDropdown, showContributorProjectDropdown]);

  // Filter project objectives based on selected projects
  useEffect(() => {
    if (formData.filters.projectObjectives.mode !== 'none') {
      const loadFilteredProjectObjectives = async () => {
        try {
          if (formData.filters.projects.selected.length > 0) {
            // Fetch project objectives for each selected project and combine
            const projectIds = formData.filters.projects.selected;
            const allFiltered = [];
            for (const projectId of projectIds) {
              const objectives = await fetchAllProjectObjectives(projectId);
              allFiltered.push(...objectives);
            }
            // Deduplicate by ID
            const unique = Array.from(new Map(allFiltered.map(po => [po.id || po.Id, po])).values());
            setAllProjectObjectives(unique);
          } else {
            // Load all project objectives if no projects selected
            const all = await fetchAllProjectObjectives();
            setAllProjectObjectives(all);
          }
        } catch (error) {
          console.error('Error loading filtered project objectives:', error);
        }
      };
      loadFilteredProjectObjectives();
    }
  }, [formData.filters.projects.selected, formData.filters.projectObjectives.mode]);

  // Filter contributor projects based on selected projects or project objectives
  useEffect(() => {
    if (formData.filters.contributorProjects.mode !== 'none') {
      const loadFilteredContributorProjects = async () => {
        try {
          const projectIds = formData.filters.projects.selected;
          const projectObjectiveIds = formData.filters.projectObjectives.selected;
          
          // Always fetch all first, then filter client-side
          const response = await apiClient.get('/queue-status-management/contributor-projects?limit=1000&offset=0');
          if (response.data.success) {
            let filtered = response.data.projects || [];
            
            // Filter by project IDs if provided
            if (projectIds.length > 0) {
              filtered = filtered.filter(cp => 
                projectIds.includes(cp.projectId || cp.Project__c)
              );
            }
            
            // Filter by project objective IDs if provided
            if (projectObjectiveIds.length > 0) {
              filtered = filtered.filter(cp => {
                const cpProjectObjectiveId = cp.projectObjectiveId;
                return cpProjectObjectiveId && projectObjectiveIds.includes(cpProjectObjectiveId);
              });
            }
            
            setAllContributorProjects(filtered);
          }
        } catch (error) {
          console.error('Error loading filtered contributor projects:', error);
        }
      };
      loadFilteredContributorProjects();
    }
  }, [formData.filters.projects.selected, formData.filters.projectObjectives.selected, formData.filters.contributorProjects.mode]);

  const loadFilterData = async () => {
    setLoadingFilters(true);
    try {
      const [projects, projectObjectives] = await Promise.all([
        fetchAllProjects(),
        fetchAllProjectObjectives()
      ]);
      setAllProjects(projects);
      setAllProjectObjectives(projectObjectives);
      
      // Fetch contributor projects
      try {
        const response = await apiClient.get('/queue-status-management/contributor-projects?limit=1000&offset=0');
        if (response.data.success) {
          setAllContributorProjects(response.data.projects || []);
        }
      } catch (error) {
        console.error('Error fetching contributor projects:', error);
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/queue-status-management/schedule-rules');
      if (response.data.success) {
        const fetchedRules = response.data.rules || [];
        setRules(fetchedRules);
        // Auto-select first rule if none selected and rules exist
        if (!selectedRule && fetchedRules.length > 0) {
          setSelectedRule(fetchedRules[0]);
        }
        // If selected rule was deleted, select first rule
        if (selectedRule && !fetchedRules.find(r => r.id === selectedRule.id) && fetchedRules.length > 0) {
          setSelectedRule(fetchedRules[0]);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch schedule rules');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (ruleIds = null) => {
    // If no ruleIds provided, use selected rules for execution
    const rulesToExecute = ruleIds || selectedRulesForExecution;
    
    if (rulesToExecute.length === 0) {
      toast.error('Please select at least one rule to execute');
      return;
    }

    // Check for disabled rules
    const disabledRules = rules.filter(r => rulesToExecute.includes(r.id) && !r.enabled);
    if (disabledRules.length > 0) {
      setRulesToEnable(disabledRules);
      setShowEnableConfirm(true);
      return; // Wait for user confirmation
    }

    await executeSelectedRules(rulesToExecute);
  };

  const executeSelectedRules = async (rulesToExecute) => {
    // Enable disabled rules if user confirmed
    if (rulesToEnable.length > 0) {
      for (const rule of rulesToEnable) {
        try {
          await apiClient.put(`/queue-status-management/schedule-rules/${rule.id}`, {
            enabled: true
          });
        } catch (error) {
          console.error(`Failed to enable rule ${rule.id}:`, error);
        }
      }
      await fetchRules(); // Refresh rules
      setRulesToEnable([]);
    }

    setExecuting(true);
    try {
      // Use extended timeout for scheduled updates (10 minutes)
      const response = await apiClient.post('/queue-status-management/execute-scheduled-updates', {
        ruleIds: rulesToExecute
      }, {
        timeout: 600000 // 10 minutes
      });
      if (response.data.success) {
        toast.success(response.data.message);
        if (response.data.results) {
          const { processed, updated, errors } = response.data.results;
          if (updated > 0) {
            toast.success(`Updated ${updated} project(s)`);
          }
          if (errors.length > 0) {
            toast.error(`${errors.length} error(s) occurred`);
          }
        }
        setSelectedRulesForExecution([]); // Clear selection after execution
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The scheduled updates are still processing. This may take several minutes for large datasets.');
      } else {
        toast.error(error.response?.data?.error || error.message || 'Failed to execute scheduled updates');
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleToggleRuleSelection = (ruleId) => {
    setSelectedRulesForExecution(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      type: 'time_based',
      enabled: false,
      fromStatus: '--None--',
      toStatus: '--None--',
      timeType: 'days',
      days: 7,
      specificDate: '',
      specificTime: '09:00',
      conditions: [],
      filters: {
        projects: { mode: 'none', selected: [] },
        projectObjectives: { mode: 'none', selected: [] },
        contributorProjects: { mode: 'none', selected: [] }
      }
    });
    setEditingRule(null);
    setShowCreateForm(true);
    setSelectedRule(null);
    setProjectSearchTerm('');
    setProjectObjectiveSearchTerm('');
    setContributorProjectSearchTerm('');
  };

  const handleEdit = (rule) => {
    const ruleConditions = rule.conditions || [];
    // Ensure at least one condition if type is condition_based
    const conditions = (rule.type === 'condition_based' && ruleConditions.length === 0) 
      ? [{ field: '', operator: '', value: '' }]
      : ruleConditions;
    
    setFormData({
      name: rule.name || '',
      type: rule.type || 'time_based',
      enabled: rule.enabled || false,
      fromStatus: rule.fromStatus || '--None--',
      toStatus: rule.toStatus || '--None--',
      timeType: rule.timeType || (rule.specificDate ? 'date' : 'days'),
      days: rule.days || 7,
      specificDate: rule.specificDate || '',
      specificTime: rule.specificTime || '09:00',
      conditions: conditions,
      filters: rule.filters || {
        projects: { mode: 'none', selected: [] },
        projectObjectives: { mode: 'none', selected: [] },
        contributorProjects: { mode: 'none', selected: [] }
      }
    });
    setEditingRule(rule.id);
    setShowCreateForm(true);
    setSelectedRule(rule);
    setProjectSearchTerm('');
    setProjectObjectiveSearchTerm('');
    setContributorProjectSearchTerm('');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.fromStatus || !formData.toStatus) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.type === 'time_based') {
      if (formData.timeType === 'days' && (!formData.days || formData.days < 1)) {
        toast.error('Days must be at least 1');
        return;
      }
      if (formData.timeType === 'date' && !formData.specificDate) {
        toast.error('Please select a specific date');
        return;
      }
    }

    if (formData.type === 'condition_based') {
      const condition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
      if (!condition.field || !condition.operator || !condition.value) {
        toast.error('Please fill in all condition fields');
        return;
      }
    }

    try {
      const dataToSave = {
        ...formData,
        // Remove specificDate if timeType is days, remove days if timeType is date
        ...(formData.timeType === 'days' ? { specificDate: '' } : { days: null }),
        ...(formData.timeType === 'date' ? { days: null } : {})
      };

      if (editingRule) {
        const response = await apiClient.put(`/queue-status-management/schedule-rules/${editingRule}`, dataToSave);
        if (response.data.success) {
          toast.success('Schedule rule updated successfully');
          setShowCreateForm(false);
          setEditingRule(null);
          await fetchRules();
          // Select the updated rule
          if (response.data.rule) {
            setSelectedRule(response.data.rule);
          } else {
            // Find the rule in the updated list
            const updatedRules = await apiClient.get('/queue-status-management/schedule-rules');
            if (updatedRules.data.success) {
              const updatedRule = updatedRules.data.rules.find(r => r.id === editingRule);
              if (updatedRule) setSelectedRule(updatedRule);
            }
          }
        }
      } else {
        const response = await apiClient.post('/queue-status-management/schedule-rules', dataToSave);
        if (response.data.success) {
          toast.success('Schedule rule created successfully');
          setShowCreateForm(false);
          await fetchRules();
          // Select the newly created rule
          if (response.data.rule) {
            setSelectedRule(response.data.rule);
          } else {
            // Find the rule in the updated list (it should be the last one)
            const updatedRules = await apiClient.get('/queue-status-management/schedule-rules');
            if (updatedRules.data.success && updatedRules.data.rules.length > 0) {
              setSelectedRule(updatedRules.data.rules[updatedRules.data.rules.length - 1]);
            }
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save schedule rule');
    }
  };

  const handleDelete = (ruleId) => {
    setRuleToDelete(ruleId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    
    try {
      const response = await apiClient.delete(`/queue-status-management/schedule-rules/${ruleToDelete}`);
      if (response.data.success) {
        toast.success('Schedule rule deleted successfully');
        setShowDeleteConfirm(false);
        setRuleToDelete(null);
        if (selectedRule?.id === ruleToDelete) {
          setSelectedRule(null);
        }
        fetchRules();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete schedule rule');
    }
  };

  const handleToggleEnabled = async (rule) => {
    try {
      const response = await apiClient.put(`/queue-status-management/schedule-rules/${rule.id}`, {
        enabled: !rule.enabled
      });
      if (response.data.success) {
        toast.success(`Schedule rule ${!rule.enabled ? 'enabled' : 'disabled'}`);
        fetchRules();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update schedule rule');
    }
  };

  const handleFilterModeChange = (filterType, mode) => {
    setFormData({
      ...formData,
      filters: {
        ...formData.filters,
        [filterType]: {
          mode,
          selected: mode === 'none' ? [] : formData.filters[filterType].selected
        }
      }
    });
  };

  const handleFilterSelect = (filterType, itemId) => {
    const currentSelected = formData.filters[filterType].selected || [];
    if (currentSelected.includes(itemId)) {
      setFormData({
        ...formData,
        filters: {
          ...formData.filters,
          [filterType]: {
            ...formData.filters[filterType],
            selected: currentSelected.filter(id => id !== itemId)
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        filters: {
          ...formData.filters,
          [filterType]: {
            ...formData.filters[filterType],
            selected: [...currentSelected, itemId]
          }
        }
      });
    }
  };

  const getFilteredItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      (item.name || item.Name || '').toLowerCase().includes(term) ||
      (item.id || item.Id || '').toLowerCase().includes(term)
    );
  };

  const getSelectedItems = (items, selectedIds) => {
    return items.filter(item => selectedIds.includes(item.id || item.Id));
  };

  const getFilteredRules = () => {
    if (!sidebarSearchTerm) return rules;
    const term = sidebarSearchTerm.toLowerCase();
    return rules.filter(rule => 
      (rule.name || '').toLowerCase().includes(term) ||
      (rule.type || '').toLowerCase().includes(term)
    );
  };

  const getRuleTypeLabel = (type) => {
    if (type === 'time_based') return 'Time-based';
    if (type === 'condition_based') return 'Condition-based';
    return type;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loader className="spinner" size={24} style={{ color: '#0176d3' }} />
        <p style={{ marginTop: '16px', color: '#666' }}>Loading schedule rules...</p>
      </div>
    );
  }

  // Standard button style for consistency - match Management tab style
  const standardButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600'
  };

  const filteredRules = getFilteredRules();

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 200px)', 
      background: '#fff', 
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      position: 'relative'
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0' : '320px',
        minWidth: sidebarCollapsed ? '0' : '320px',
        maxWidth: sidebarCollapsed ? '0' : '320px',
        borderRight: sidebarCollapsed ? 'none' : '1px solid var(--border-color)',
        background: '#fff',
        display: sidebarCollapsed ? 'none' : 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease',
        overflow: 'hidden'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={20} style={{ color: '#0176d3' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Schedule & Automation</h3>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search rules..."
              value={sidebarSearchTerm}
              onChange={(e) => setSidebarSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 34px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#fff'
              }}
            />
          </div>

          {/* Add New Rule Button */}
          <button
            onClick={handleCreate}
            className="btn-primary"
            style={{
              ...standardButtonStyle,
              width: '100%',
              justifyContent: 'center',
              marginBottom: '8px'
            }}
          >
            <Plus size={16} />
            Add New Rule
          </button>

          {/* Execute Selected Rules Button */}
          {selectedRulesForExecution.length > 0 && (
          <button
              onClick={() => handleExecute()}
            disabled={executing}
            className="btn-primary"
              style={{
                ...standardButtonStyle,
                width: '100%',
                justifyContent: 'center',
                background: executing ? '#9ca3af' : undefined
              }}
            >
              {executing ? (
                <>
                  <Loader size={16} className="spinning" />
                  Executing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Execute Selected ({selectedRulesForExecution.length})
                </>
              )}
          </button>
          )}
      </div>

        {/* Rules List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredRules.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
              {sidebarSearchTerm ? 'No rules match your search' : 'No rules configured'}
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => {
                  setSelectedRule(rule);
                  setShowCreateForm(false);
                  setEditingRule(null);
                }}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: selectedRule?.id === rule.id ? '#e3f2fd' : 'transparent',
                  border: selectedRule?.id === rule.id ? '1px solid #0176d3' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {/* Multi-select checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedRulesForExecution.includes(rule.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleRuleSelection(rule.id);
                    }}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
        <div style={{ 
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: rule.enabled ? '#22c55e' : '#9ca3af'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      {rule.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      Type: {getRuleTypeLabel(rule.type)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ 
                      position: 'relative',
                      display: 'inline-block',
                      width: '40px',
                      height: '20px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleEnabled(rule);
                        }}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: rule.enabled ? '#22c55e' : '#cbd5e1',
                        borderRadius: '20px',
                        transition: 'background 0.3s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          left: rule.enabled ? '22px' : '2px',
                          width: '16px',
                          height: '16px',
                          background: '#fff',
                          borderRadius: '50%',
                          transition: 'left 0.3s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Collapse/Expand Button */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#666'
            }}
          >
            <ChevronLeft size={16} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            {sidebarCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Expand Button (shown when sidebar is collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            padding: '12px 8px',
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderLeft: 'none',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
          }}
          title="Expand sidebar"
        >
          <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
      )}

      {/* Right Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {showCreateForm ? (
          <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            {/* Form Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              {editingRule ? 'Edit Schedule Rule' : 'Create New Schedule Rule'}
              </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingRule(null);
                  // Keep selectedRule when canceling edit
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Row 1: Rule Name and Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Auto-move to Production after 7 days"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                  Rule Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    if (newType === 'condition_based') {
                      // Automatically add exactly one condition when switching to condition-based
                      const condition = formData.conditions && formData.conditions.length > 0 
                        ? formData.conditions[0] 
                        : { field: '', operator: '', value: '' };
                      setFormData({ ...formData, type: newType, conditions: [condition] });
                    } else {
                      setFormData({ ...formData, type: newType });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                >
                  <option value="time_based">Time-based</option>
                  <option value="condition_based">Condition-based</option>
                </select>
              </div>
            </div>

            {/* Condition Fields - BEFORE From/To Status (only for condition-based rules) */}
            {formData.type === 'condition_based' && (
              <div style={{ marginTop: '4px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500' }}>
                  Conditions *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' }].map((condition, index) => {
                    const selectedField = contributorProjectFields.find(f => f.name === condition.field);
                    const isPicklist = selectedField && (selectedField.type === 'picklist' || selectedField.type === 'multipicklist');
                    const isNumber = selectedField && (selectedField.type === 'number' || selectedField.type === 'int' || selectedField.type === 'double' || selectedField.type === 'currency' || selectedField.type === 'percent');
                    const isDate = selectedField && (selectedField.type === 'date' || selectedField.type === 'datetime');
                    const isBoolean = selectedField && selectedField.type === 'boolean';
                    const picklistValues = condition.field ? (fieldPicklistValues[condition.field] || []) : [];

                    return (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={condition.field || ''}
                          onChange={(e) => {
                            const currentCondition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
                            const updatedCondition = { ...currentCondition, field: e.target.value, value: '' };
                            setFormData({ ...formData, conditions: [updatedCondition] });
                          }}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            background: '#fff'
                          }}
                        >
                          <option value="">Select Field</option>
                          {contributorProjectFields.map(field => (
                            <option key={field.name} value={field.name}>{field.label || field.name}</option>
                          ))}
                        </select>
                        <select
                          value={condition.operator || ''}
                          onChange={(e) => {
                            const currentCondition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
                            const updatedCondition = { ...currentCondition, operator: e.target.value };
                            setFormData({ ...formData, conditions: [updatedCondition] });
                          }}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            background: '#fff'
                          }}
                        >
                          <option value="">Select Operator</option>
                          {!isBoolean && <option value="equals">Equals</option>}
                          {!isBoolean && <option value="not_equals">Not Equals</option>}
                          {!isBoolean && !isNumber && !isDate && <option value="contains">Contains</option>}
                          {isNumber && <option value="greater_than">Greater Than</option>}
                          {isNumber && <option value="less_than">Less Than</option>}
                          {isBoolean && <option value="equals">Is True</option>}
                          {isBoolean && <option value="not_equals">Is False</option>}
                        </select>
                        {isPicklist && picklistValues.length > 0 ? (
                          <select
                            value={condition.value || ''}
                            onChange={(e) => {
                              const currentCondition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
                              const updatedCondition = { ...currentCondition, value: e.target.value };
                              setFormData({ ...formData, conditions: [updatedCondition] });
                            }}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              background: '#fff'
                            }}
                          >
                            <option value="">Select Value</option>
                            {picklistValues.map(value => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        ) : isNumber ? (
                          <input
                            type="number"
                            value={condition.value || ''}
                            onChange={(e) => {
                              const currentCondition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
                              const updatedCondition = { ...currentCondition, value: e.target.value };
                              setFormData({ ...formData, conditions: [updatedCondition] });
                            }}
                            placeholder="Number value"
                            style={{
                              padding: '6px 10px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              background: '#fff'
                            }}
                          />
                        ) : isDate ? (
                          <input
                            type="date"
                            value={condition.value || ''}
                            onChange={(e) => {
                              const currentCondition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
                              const updatedCondition = { ...currentCondition, value: e.target.value };
                              setFormData({ ...formData, conditions: [updatedCondition] });
                            }}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              background: '#fff'
                            }}
                          />
                        ) : isBoolean ? (
                          <select
                            value={condition.value || ''}
                            onChange={(e) => {
                              const currentCondition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
                              const updatedCondition = { ...currentCondition, value: e.target.value };
                              setFormData({ ...formData, conditions: [updatedCondition] });
                            }}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              background: '#fff'
                            }}
                          >
                            <option value="">Select</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={condition.value || ''}
                            onChange={(e) => {
                              const currentCondition = formData.conditions && formData.conditions.length > 0 ? formData.conditions[0] : { field: '', operator: '', value: '' };
                              const updatedCondition = { ...currentCondition, value: e.target.value };
                              setFormData({ ...formData, conditions: [updatedCondition] });
                            }}
                            placeholder="Value"
                            style={{
                              padding: '6px 10px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              background: '#fff'
                            }}
                          />
                        )}
                        {/* Delete button removed - user cannot delete the single required condition */}
                        <div style={{ width: '34px' }} /> {/* Spacer to maintain grid alignment */}
                      </div>
                    );
                  })}
                  {/* Add Condition button removed - only one condition is allowed */}
                </div>
              </div>
            )}

            {/* Row 2: From Status, To Status, Time (Days/Date), Enable */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                  From Status *
                </label>
                <select
                  value={formData.fromStatus}
                  onChange={(e) => setFormData({ ...formData, fromStatus: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                >
                  {queueStatusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                  To Status *
                </label>
                <select
                  value={formData.toStatus}
                  onChange={(e) => setFormData({ ...formData, toStatus: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                >
                  {queueStatusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              {formData.type === 'time_based' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formData.timeType === 'days'}
                        onChange={() => setFormData({ ...formData, timeType: 'days' })}
                        style={{ cursor: 'pointer' }}
                      />
                      Days
                    </label>
                    <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formData.timeType === 'date'}
                        onChange={() => setFormData({ ...formData, timeType: 'date' })}
                        style={{ cursor: 'pointer' }}
                      />
                      Date
                    </label>
                  </div>
                  {formData.timeType === 'days' ? (
                    <input
                      type="number"
                      min="1"
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        background: '#fff'
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
                          Date
                        </label>
                    <input
                      type="date"
                      value={formData.specificDate}
                      onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        background: '#fff'
                      }}
                    />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
                          Time
                        </label>
                        <TimePicker
                          value={formData.specificTime || '09:00'}
                          onChange={(time) => setFormData({ ...formData, specificTime: time })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '4px' }}>
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="enabled" style={{ fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Enable
                </label>
              </div>
            </div>

            {/* Filter Section */}
            <div style={{ marginTop: '8px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Apply Rule To:</div>
              
              {/* Filters in a single row: Projects (beginning), Project Objectives (centre), Contributor Projects (end) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {/* Projects Filter */}
                <div className="project-filter-container" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500' }}>Projects:</label>
                    <select
                      value={formData.filters.projects.mode}
                      onChange={(e) => handleFilterModeChange('projects', e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        flex: 1,
                        background: '#fff'
                      }}
                    >
                      <option value="none">None</option>
                      <option value="include">Include</option>
                      <option value="exclude">Exclude</option>
                    </select>
                  </div>
                  {formData.filters.projects.mode !== 'none' && (
                    <div style={{ marginTop: '4px' }}>
                      {!showProjectDropdown ? (
                        <div 
                          onClick={() => setShowProjectDropdown(true)}
                          style={{ 
                            minHeight: '32px',
                            padding: '6px 8px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            alignItems: 'center'
                          }}
                        >
                          {formData.filters.projects.selected.length > 0 ? (
                            getSelectedItems(allProjects, formData.filters.projects.selected).map(project => (
                              <span key={project.id || project.Id} style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                padding: '2px 6px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                {project.name || project.Name}
                                <XCircle 
                                  size={12} 
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterSelect('projects', project.id || project.Id);
                                  }}
                                />
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999' }}>Click to select projects...</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div style={{ position: 'relative', marginBottom: '4px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                              type="text"
                              placeholder="Search projects..."
                              value={projectSearchTerm}
                              onChange={(e) => setProjectSearchTerm(e.target.value)}
                              onFocus={() => setShowProjectDropdown(true)}
                              style={{
                                width: '100%',
                                padding: '4px 8px 4px 28px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                background: '#fff'
                              }}
                            />
                          </div>
                          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', background: '#fff' }}>
                            {getFilteredItems(allProjects, projectSearchTerm).slice(0, 50).map(project => (
                              <label key={project.id || project.Id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.filters.projects.selected.includes(project.id || project.Id)}
                                  onChange={() => handleFilterSelect('projects', project.id || project.Id)}
                                  style={{ cursor: 'pointer' }}
                                />
                                {project.name || project.Name}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Project Objectives Filter (Centre) */}
                <div className="project-objective-filter-container" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500' }}>Project Objectives:</label>
                    <select
                      value={formData.filters.projectObjectives.mode}
                      onChange={(e) => handleFilterModeChange('projectObjectives', e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        flex: 1,
                        background: '#fff'
                      }}
                    >
                      <option value="none">None</option>
                      <option value="include">Include</option>
                      <option value="exclude">Exclude</option>
                    </select>
                  </div>
                  {formData.filters.projectObjectives.mode !== 'none' && (
                    <div style={{ marginTop: '4px' }}>
                      {!showProjectObjectiveDropdown ? (
                        <div 
                          onClick={() => setShowProjectObjectiveDropdown(true)}
                          style={{ 
                            minHeight: '32px',
                            padding: '6px 8px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            alignItems: 'center'
                          }}
                        >
                          {formData.filters.projectObjectives.selected.length > 0 ? (
                            getSelectedItems(allProjectObjectives, formData.filters.projectObjectives.selected).map(po => (
                              <span key={po.id || po.Id} style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                padding: '2px 6px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                {po.name || po.Name}
                                <XCircle 
                                  size={12} 
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterSelect('projectObjectives', po.id || po.Id);
                                  }}
                                />
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999' }}>Click to select project objectives...</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div style={{ position: 'relative', marginBottom: '4px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                              type="text"
                              placeholder="Search project objectives..."
                              value={projectObjectiveSearchTerm}
                              onChange={(e) => setProjectObjectiveSearchTerm(e.target.value)}
                              onFocus={() => setShowProjectObjectiveDropdown(true)}
                              style={{
                                width: '100%',
                                padding: '4px 8px 4px 28px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                background: '#fff'
                              }}
                            />
                          </div>
                          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', background: '#fff' }}>
                            {getFilteredItems(allProjectObjectives, projectObjectiveSearchTerm).slice(0, 50).map(po => (
                              <label key={po.id || po.Id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.filters.projectObjectives.selected.includes(po.id || po.Id)}
                                  onChange={() => handleFilterSelect('projectObjectives', po.id || po.Id)}
                                  style={{ cursor: 'pointer' }}
                                />
                                {po.name || po.Name}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Contributor Projects Filter (End) */}
                <div className="contributor-project-filter-container" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500' }}>Contributor Projects:</label>
                    <select
                      value={formData.filters.contributorProjects.mode}
                      onChange={(e) => handleFilterModeChange('contributorProjects', e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        flex: 1,
                        background: '#fff'
                      }}
                    >
                      <option value="none">None</option>
                      <option value="include">Include</option>
                      <option value="exclude">Exclude</option>
                    </select>
                  </div>
                  {formData.filters.contributorProjects.mode !== 'none' && (
                    <div style={{ marginTop: '4px' }}>
                      {!showContributorProjectDropdown ? (
                        <div 
                          onClick={() => setShowContributorProjectDropdown(true)}
                          style={{ 
                            minHeight: '32px',
                            padding: '6px 8px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            alignItems: 'center'
                          }}
                        >
                          {formData.filters.contributorProjects.selected.length > 0 ? (
                            getSelectedItems(allContributorProjects, formData.filters.contributorProjects.selected).map(cp => (
                              <span key={cp.id || cp.Id} style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                padding: '2px 6px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                {cp.name || cp.Name}
                                <XCircle 
                                  size={12} 
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterSelect('contributorProjects', cp.id || cp.Id);
                                  }}
                                />
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999' }}>Click to select contributor projects...</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div style={{ position: 'relative', marginBottom: '4px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                              type="text"
                              placeholder="Search contributor projects..."
                              value={contributorProjectSearchTerm}
                              onChange={(e) => setContributorProjectSearchTerm(e.target.value)}
                              onFocus={() => setShowContributorProjectDropdown(true)}
                              style={{
                                width: '100%',
                                padding: '4px 8px 4px 28px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                background: '#fff'
                              }}
                            />
                          </div>
                          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', background: '#fff' }}>
                            {getFilteredItems(allContributorProjects, contributorProjectSearchTerm).slice(0, 50).map(cp => (
                              <label key={cp.id || cp.Id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.filters.contributorProjects.selected.includes(cp.id || cp.Id)}
                                  onChange={() => handleFilterSelect('contributorProjects', cp.id || cp.Id)}
                                  style={{ cursor: 'pointer' }}
                                />
                                {cp.name || cp.Name}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingRule(null);
                    // Keep selectedRule when canceling edit
                }}
                className="btn-secondary"
                  style={{ ...standardButtonStyle, width: '120px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                  style={{ ...standardButtonStyle, width: '120px' }}
              >
                <Save size={16} />
                {editingRule ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
        ) : selectedRule ? (
          <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', marginBottom: '4px' }}>
                  {selectedRule.name}
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Manage the details, triggers, and actions for this automation rule.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
          <button
                  onClick={() => handleDelete(selectedRule.id)}
                  className="btn-secondary"
                  style={{ ...standardButtonStyle, color: '#dc2626', borderColor: '#dc2626', width: '130px' }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => handleEdit(selectedRule)}
            className="btn-primary"
                  style={{ ...standardButtonStyle, width: '130px' }}
          >
                  <Edit size={16} />
                  Edit Rule
          </button>
                <button
                  onClick={() => handleExecute([selectedRule.id])}
                  disabled={executing}
                  className="btn-primary"
                  style={{ ...standardButtonStyle, minWidth: '140px' }}
                >
                  {executing ? <Loader size={16} className="spinning" /> : <Play size={16} />}
                  Execute Rule
                </button>
              </div>
            </div>

            {/* Rule Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: selectedRule.enabled ? '#22c55e' : '#9ca3af'
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {selectedRule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Type</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  {getRuleTypeLabel(selectedRule.type)}
                </div>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Created By</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  {selectedRule.createdByName || selectedRule.createdBy || 'System'}
                </div>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {selectedRule.updatedAt && selectedRule.updatedAt !== selectedRule.createdAt ? 'Last Modified' : 'Created'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  {(() => {
                    // Check if rule was never modified (updatedAt is same as createdAt or doesn't exist)
                    const wasModified = selectedRule.updatedAt && 
                                      selectedRule.createdAt && 
                                      selectedRule.updatedAt !== selectedRule.createdAt;
                    
                    if (wasModified) {
                      return new Date(selectedRule.updatedAt).toLocaleDateString();
                    } else if (selectedRule.createdAt) {
                      return new Date(selectedRule.createdAt).toLocaleDateString();
                    }
                    return 'N/A';
                  })()}
                      </div>
                      </div>
            </div>

            {/* Triggers Section */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Play size={18} style={{ color: '#0176d3' }} />
                <ArrowRight size={16} style={{ color: '#0176d3' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Triggers</h3>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {/* Trigger Condition - Time-based or Condition-based */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '6px', 
                    background: '#e3f2fd', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ArrowRight size={16} style={{ color: '#0176d3' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {selectedRule.type === 'time_based' ? 'Time-based Trigger' : 'Condition-based Trigger'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                      {selectedRule.type === 'time_based' ? (
                        <>After {
                          selectedRule.timeType === 'date' && selectedRule.specificDate
                            ? new Date(selectedRule.specificDate).toLocaleDateString()
                            : `${selectedRule.days || 0} day(s)`
                        } in current status</>
                      ) : selectedRule.conditions && selectedRule.conditions.length > 0 ? (
                        <>When {selectedRule.conditions.map((c, idx) => {
                          const field = contributorProjectFields.find(f => f.name === c.field);
                          return `${field?.label || c.field} ${c.operator} ${c.value}`;
                        }).join(' AND ')}</>
                      ) : (
                        'No condition specified'
                      )}
                    </div>
                  </div>
                </div>

                {/* AND meets the following criteria */}
                {selectedRule.filters && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Filter size={14} style={{ color: '#666' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>AND meets the following criteria:</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedRule.filters.projects?.mode !== 'none' && selectedRule.filters.projects.selected?.length > 0 && (
                        <span style={{ 
                          padding: '4px 12px', 
                          background: '#e5e7eb', 
                          borderRadius: '16px', 
                          fontSize: '12px',
                          color: '#333'
                        }}>
                          Projects ({selectedRule.filters.projects.mode}): {getSelectedItems(allProjects, selectedRule.filters.projects.selected).slice(0, 2).map(p => p.name || p.Name).join(', ')}
                          {getSelectedItems(allProjects, selectedRule.filters.projects.selected).length > 2 && ` +${getSelectedItems(allProjects, selectedRule.filters.projects.selected).length - 2} more`}
                          </span>
                        )}
                      {selectedRule.filters.projectObjectives?.mode !== 'none' && selectedRule.filters.projectObjectives.selected?.length > 0 && (
                        <span style={{ 
                          padding: '4px 12px', 
                          background: '#e5e7eb', 
                          borderRadius: '16px', 
                          fontSize: '12px',
                          color: '#333'
                        }}>
                          Project Objectives ({selectedRule.filters.projectObjectives.mode}): {getSelectedItems(allProjectObjectives, selectedRule.filters.projectObjectives.selected).slice(0, 2).map(po => po.name || po.Name || po.contributorFacingProjectName).join(', ')}
                          {getSelectedItems(allProjectObjectives, selectedRule.filters.projectObjectives.selected).length > 2 && ` +${getSelectedItems(allProjectObjectives, selectedRule.filters.projectObjectives.selected).length - 2} more`}
                          </span>
                        )}
                      {selectedRule.filters.contributorProjects?.mode !== 'none' && selectedRule.filters.contributorProjects.selected?.length > 0 && (
                        <span style={{ 
                          padding: '4px 12px', 
                          background: '#e5e7eb', 
                          borderRadius: '16px', 
                          fontSize: '12px',
                          color: '#333'
                        }}>
                          Contributor Projects ({selectedRule.filters.contributorProjects.mode}): {getSelectedItems(allContributorProjects, selectedRule.filters.contributorProjects.selected).slice(0, 2).map(cp => cp.contributorProjectName || cp.name || cp.Name).join(', ')}
                          {getSelectedItems(allContributorProjects, selectedRule.filters.contributorProjects.selected).length > 2 && ` +${getSelectedItems(allContributorProjects, selectedRule.filters.contributorProjects.selected).length - 2} more`}
                          </span>
                        )}
                      {(!selectedRule.filters.projects || selectedRule.filters.projects.mode === 'none') &&
                       (!selectedRule.filters.projectObjectives || selectedRule.filters.projectObjectives.mode === 'none') &&
                       (!selectedRule.filters.contributorProjects || selectedRule.filters.contributorProjects.mode === 'none') && (
                        <span style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No additional filters applied</span>
                    )}
                    </div>
                      </div>
                    )}
                  </div>
                </div>

            {/* Actions Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Play size={18} style={{ color: '#0176d3' }} />
                <ArrowRight size={16} style={{ color: '#0176d3' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Actions</h3>
                </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '6px', 
                    background: '#e3f2fd', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ArrowRight size={16} style={{ color: '#0176d3' }} />
              </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      Update Queue Status from "{selectedRule.fromStatus}" to "{selectedRule.toStatus}"
            </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      The Contributor Project's Queue Status is automatically updated from the source status to the target status when all trigger conditions are met.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution History Section */}
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Clock size={18} style={{ color: '#0176d3' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Execution History</h3>
              </div>
              {loadingHistory ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                  <Loader size={20} className="spinning" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: '8px', fontSize: '14px' }}>Loading execution history...</p>
                </div>
              ) : executionHistory.length === 0 ? (
                <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', color: '#666' }}>
                  <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>No execution history available for this rule</p>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>Execution Time</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666' }}>Triggered By</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#666' }}>Processed</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#666' }}>Updated</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#666' }}>Duration</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executionHistory.map((entry, idx) => (
                        <tr key={entry.id || idx} style={{ borderBottom: idx < executionHistory.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#333' }}>
                            {new Date(entry.executionTime).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                            {entry.triggeredBy === 'automatic_scheduler' ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> Automatic
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Play size={12} /> Manual
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#333', textAlign: 'right' }}>
                            {entry.rulesProcessed || 0}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#333', textAlign: 'right' }}>
                            {entry.rulesUpdated || 0}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666', textAlign: 'right' }}>
                            {entry.duration ? `${(entry.duration / 1000).toFixed(1)}s` : 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {entry.errors && entry.errors.length > 0 ? (
                              <span style={{ 
                                padding: '4px 8px', 
                                background: '#fee2e2', 
                                color: '#dc2626', 
                                borderRadius: '4px', 
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                Error
                              </span>
                            ) : (
                              <span style={{ 
                                padding: '4px 8px', 
                                background: '#d1fae5', 
                                color: '#059669', 
                                borderRadius: '4px', 
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                Success
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
        </div>
      )}
            </div>
          </div>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px',
            color: '#666'
          }}>
            <Settings size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No rule selected</p>
            <p style={{ fontSize: '14px', color: '#999' }}>Select a rule from the sidebar to view its details</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteConfirm}
        message="Are you sure you want to delete this schedule rule? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setRuleToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Enable Rules Confirmation Modal */}
      <ConfirmModal
        show={showEnableConfirm}
        message={
          `${rulesToEnable.length} selected rule(s) are disabled. Do you want to enable them before execution?\n\n` +
          `Rules: ${rulesToEnable.map(r => r.name).join(', ')}`
        }
        onConfirm={async () => {
          setShowEnableConfirm(false);
          const ruleIds = selectedRulesForExecution.length > 0 
            ? selectedRulesForExecution 
            : rulesToEnable.map(r => r.id);
          await executeSelectedRules(ruleIds);
        }}
        onCancel={() => {
          setShowEnableConfirm(false);
          setRulesToEnable([]);
        }}
        confirmText="Enable & Execute"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default QueueStatusScheduleManager;
