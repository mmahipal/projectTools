import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, LogOut, RefreshCw, BarChart3, TrendingUp, Users, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../components/BookmarkButton';
import '../styles/CaseAnalyticsDashboard.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const BASELINE_STORAGE_KEY = 'caseAnalyticsDashboardBaseline';

// Load baseline data from localStorage
const loadBaselineData = () => {
  try {
    const saved = localStorage.getItem(BASELINE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    // Silently fail baseline loading
  }
  return null;
};

// Save current dashboard state as baseline
const saveBaselineData = (dashboardState) => {
  try {
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify({
      ...dashboardState,
      savedAt: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    return false;
  }
};

const CaseAnalyticsDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState({}); // Track refreshing per tab
  const [activeTab, setActiveTab] = useState('daily-snapshot');
  
  // Filter state
  const [filters, setFilters] = useState({
    date: 'all',
    caseStatus: 'all',
    projectName: 'all',
    accountName: 'all',
    group: 'all',
    caseOwner: 'all',
    caseType: 'all',
    caseReason: 'all',
    caseTag: 'all',
    slaStatus: 'all'
  });

  // Initialize state with baseline data if available (using lazy initializer)
  // Load baseline inside each initializer to ensure fresh read
  const [kpis, setKpis] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.kpis || {
    totalUnresolvedTickets: 0,
    dcpt: 0,
    avgResolutionTime: 0,
    unresolvedWithinTargetSLA: 0,
    backlogOverTargetSLA: 0,
    backlogOverExternalSLA: 0,
    totalBacklog: 0,
    avgAgeUnresolved: 0,
    resolvedCases: 0,
    aht: 0
    };
  });

  const [dailyNewCases, setDailyNewCases] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.dailyNewCases || [];
  });
  const [dailyResolvedCases, setDailyResolvedCases] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.dailyResolvedCases || [];
  });
  const [caseStatusBreakdown, setCaseStatusBreakdown] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.caseStatusBreakdown || [];
  });
  const [unresolvedSLABreakdown, setUnresolvedSLABreakdown] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.unresolvedSLABreakdown || [];
  });
  const [createdResolvedByGroup, setCreatedResolvedByGroup] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.createdResolvedByGroup || [];
  });
  const [avgCreatedResolvedByGroup, setAvgCreatedResolvedByGroup] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.avgCreatedResolvedByGroup || [];
  });
  const [medianTimeByGroup, setMedianTimeByGroup] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.medianTimeByGroup || [];
  });
  const [createdResolvedByReason, setCreatedResolvedByReason] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.createdResolvedByReason || [];
  });
  const [avgCreatedResolvedByReason, setAvgCreatedResolvedByReason] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.avgCreatedResolvedByReason || [];
  });
  const [medianTimeByReason, setMedianTimeByReason] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.medianTimeByReason || [];
  });
  const [createdResolvedByType, setCreatedResolvedByType] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.createdResolvedByType || [];
  });
  const [avgCreatedResolvedByType, setAvgCreatedResolvedByType] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.avgCreatedResolvedByType || [];
  });
  const [medianTimeByType, setMedianTimeByType] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.medianTimeByType || [];
  });
  const [unresolvedByGroup, setUnresolvedByGroup] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.unresolvedByGroup || [];
  });
  const [unresolvedByType, setUnresolvedByType] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.unresolvedByType || [];
  });
  const [backlogByClient, setBacklogByClient] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.backlogByClient || [];
  });
  const [historicalBacklog, setHistoricalBacklog] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.historicalBacklog || [];
  });
  const [onHoldReasons, setOnHoldReasons] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.onHoldReasons || [];
  });
  const [agentPerformance, setAgentPerformance] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.agentPerformance || [];
  });
  const [automatedCaseActions, setAutomatedCaseActions] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.automatedCaseActions || [];
  });
  const [avgAutomatedActionsByReason, setAvgAutomatedActionsByReason] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.avgAutomatedActionsByReason || [];
  });
  const [onHoldCasesOutsideSLA, setOnHoldCasesOutsideSLA] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.onHoldCasesOutsideSLA || [];
  });
  const [casesTouchedByAgent, setCasesTouchedByAgent] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.casesTouchedByAgent || [];
  });
  const [caseAnalytics, setCaseAnalytics] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.caseAnalytics || [];
  });
  const [unresolvedSolvedByAgent, setUnresolvedSolvedByAgent] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.unresolvedSolvedByAgent || [];
  });
  const [dailySolvedByProject, setDailySolvedByProject] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.dailySolvedByProject || { data: [], dateColumns: [] };
  });
  const [dailySolvedByName, setDailySolvedByName] = useState(() => {
    const baseline = loadBaselineData();
    return baseline?.dailySolvedByName || { data: [], dateColumns: [] };
  });

  const [timeRange, setTimeRange] = useState('past-7-days');
  
  // Filter options state
  const [filterOptions, setFilterOptions] = useState({
    caseStatus: [],
    caseType: [],
    caseReason: [],
    group: [],
    projectName: [],
    accountName: [],
    caseOwner: [],
    caseTag: []
  });
  
  // Debounce timer ref for filter changes
  const filterDebounceTimer = useRef(null);
  
  // Widget loading states for individual refresh
  const [widgetStates, setWidgetStates] = useState({});

  // Log baseline data on mount for debugging
  useEffect(() => {
    const baseline = loadBaselineData();
  }, []);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await apiClient.get('/case-analytics/filter-options');
        setFilterOptions(response.data);
      } catch (error) {
        toast.error('Failed to load filter options');
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch all data - accepts optional filters and timeRange parameters to use latest values
  const fetchAllData = useCallback(async (filtersToUse = null, timeRangeToUse = null) => {
    const activeFilters = filtersToUse || filters;
    const activeTimeRange = timeRangeToUse || timeRange;
    setLoading(true);
    try {
      // Fetch KPIs with extended timeout
      const kpiResponse = await apiClient.get('/case-analytics/kpis', { 
        params: activeFilters,
        timeout: 120000 // 2 minutes for KPIs which may need pagination
      });
      setKpis(kpiResponse.data);

      // Prepare baseline data object - will be populated as we fetch
      const baselineData = {
        kpis: kpiResponse.data
      };

      // Fetch charts based on active tab
      if (activeTab === 'daily-snapshot') {
        const [newCases, resolvedCases, statusBreakdown, slaBreakdown] = await Promise.all([
          apiClient.get('/case-analytics/daily-new-cases', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/daily-resolved-cases', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/case-status-breakdown', { params: activeFilters }),
          apiClient.get('/case-analytics/unresolved-sla-breakdown', { params: activeFilters })
        ]);
        setDailyNewCases(newCases.data);
        setDailyResolvedCases(resolvedCases.data);
        setCaseStatusBreakdown(statusBreakdown.data);
        setUnresolvedSLABreakdown(slaBreakdown.data);
        
        baselineData.dailyNewCases = newCases.data;
        baselineData.dailyResolvedCases = resolvedCases.data;
        baselineData.caseStatusBreakdown = statusBreakdown.data;
        baselineData.unresolvedSLABreakdown = slaBreakdown.data;

        const [byGroup, avgByGroup, medianByGroup, byReason, avgByReason, medianByReason, byType, avgByType, medianByType] = await Promise.all([
          apiClient.get('/case-analytics/created-resolved-by-group', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/avg-created-resolved-by-group', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/median-time-by-group', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/created-resolved-by-reason', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/avg-created-resolved-by-reason', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/median-time-by-reason', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/created-resolved-by-type', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/avg-created-resolved-by-type', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/median-time-by-type', { params: { ...activeFilters, timeRange: activeTimeRange } })
        ]);
        setCreatedResolvedByGroup(byGroup.data);
        setAvgCreatedResolvedByGroup(avgByGroup.data);
        setMedianTimeByGroup(medianByGroup.data);
        setCreatedResolvedByReason(byReason.data);
        setAvgCreatedResolvedByReason(avgByReason.data);
        setMedianTimeByReason(medianByReason.data);
        setCreatedResolvedByType(byType.data);
        setAvgCreatedResolvedByType(avgByType.data);
        setMedianTimeByType(medianByType.data);
        
        baselineData.createdResolvedByGroup = byGroup.data;
        baselineData.avgCreatedResolvedByGroup = avgByGroup.data;
        baselineData.medianTimeByGroup = medianByGroup.data;
        baselineData.createdResolvedByReason = byReason.data;
        baselineData.avgCreatedResolvedByReason = avgByReason.data;
        baselineData.medianTimeByReason = medianByReason.data;
        baselineData.createdResolvedByType = byType.data;
        baselineData.avgCreatedResolvedByType = avgByType.data;
        baselineData.medianTimeByType = medianByType.data;
      } else if (activeTab === 'cases-backlog') {
        const [byGroup, byType, byClient, historical, onHold] = await Promise.all([
          apiClient.get('/case-analytics/unresolved-by-group', { params: activeFilters }),
          apiClient.get('/case-analytics/unresolved-by-type', { params: activeFilters }),
          apiClient.get('/case-analytics/backlog-by-client', { params: activeFilters }),
          apiClient.get('/case-analytics/historical-backlog', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/on-hold-reasons', { params: activeFilters })
        ]);
        setUnresolvedByGroup(byGroup.data);
        setUnresolvedByType(byType.data);
        setBacklogByClient(byClient.data);
        setHistoricalBacklog(historical.data);
        setOnHoldReasons(onHold.data);
        
        baselineData.unresolvedByGroup = byGroup.data;
        baselineData.unresolvedByType = byType.data;
        baselineData.backlogByClient = byClient.data;
        baselineData.historicalBacklog = historical.data;
        baselineData.onHoldReasons = onHold.data;
      } else if (activeTab === 'agent-performance') {
        const [performance, touched, analytics, unresolved] = await Promise.all([
          apiClient.get('/case-analytics/agent-performance', { params: activeFilters }),
          apiClient.get('/case-analytics/cases-touched-by-agent', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/case-analytics-list', { params: activeFilters, timeout: 70000 }),
          apiClient.get('/case-analytics/unresolved-solved-by-agent', { params: activeFilters })
        ]);
        setAgentPerformance(performance.data);
        setCasesTouchedByAgent(touched.data);
        setCaseAnalytics(analytics.data);
        setUnresolvedSolvedByAgent(unresolved.data);
        
        baselineData.agentPerformance = performance.data;
        baselineData.casesTouchedByAgent = touched.data;
        baselineData.caseAnalytics = analytics.data;
        baselineData.unresolvedSolvedByAgent = unresolved.data;
      } else if (activeTab === 'cases-breakdown') {
        const [automated, avgAutomated, onHoldSLA] = await Promise.all([
          apiClient.get('/case-analytics/automated-case-actions', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/avg-automated-actions-by-reason', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/on-hold-cases-outside-sla', { params: activeFilters })
        ]);
        setAutomatedCaseActions(automated.data);
        setAvgAutomatedActionsByReason(avgAutomated.data);
        setOnHoldCasesOutsideSLA(onHoldSLA.data);
        
        baselineData.automatedCaseActions = automated.data;
        baselineData.avgAutomatedActionsByReason = avgAutomated.data;
        baselineData.onHoldCasesOutsideSLA = onHoldSLA.data;
      } else if (activeTab === 'daily-solved') {
        const [byProject, byName] = await Promise.all([
          apiClient.get('/case-analytics/daily-solved-by-project', { params: { ...activeFilters, timeRange: activeTimeRange } }),
          apiClient.get('/case-analytics/daily-solved-by-name', { params: { ...activeFilters, timeRange: activeTimeRange } })
        ]);
        setDailySolvedByProject(byProject.data);
        setDailySolvedByName(byName.data);
        
        baselineData.dailySolvedByProject = byProject.data;
        baselineData.dailySolvedByName = byName.data;
      }
      
      // Load existing baseline and merge with new data (preserve data from other tabs)
      const existingBaseline = loadBaselineData() || {};
      const mergedBaseline = {
        ...existingBaseline,
        ...baselineData
      };
      
      // Save all data to baseline after successful fetch
      saveBaselineData(mergedBaseline);
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to load case analytics data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, timeRange]);

  // Don't auto-fetch - user must click refresh button
  // Removed auto-refresh useEffect

  const handleRefresh = () => {
    setRefreshing(prev => ({ ...prev, [activeTab]: true }));
    fetchAllData().finally(() => {
      setRefreshing(prev => ({ ...prev, [activeTab]: false }));
    });
  };

  // Handle time range change - apply immediately
  const handleTimeRangeChange = useCallback((newTimeRange) => {
    setTimeRange(newTimeRange);
    // Trigger data refresh immediately with new time range
    // Pass the new time range directly to fetchAllData to use it immediately
    fetchAllData(filters, newTimeRange);
  }, [fetchAllData, filters]);

  // Don't auto-fetch on tab change - user must click refresh
  // Removed auto-fetch useEffect for tab changes

  const handleFilterChange = (filterName, value) => {
    // Clear existing debounce timer
    if (filterDebounceTimer.current) {
      clearTimeout(filterDebounceTimer.current);
    }
    
    // Update filters immediately
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      
      // Apply filters immediately when value is selected
      // Small debounce (100ms) to avoid multiple rapid calls
      filterDebounceTimer.current = setTimeout(() => {
        // Pass newFilters to ensure we use the latest filter values
        fetchAllData(newFilters);
      }, 100);
      
      return newFilters;
    });
  };
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (filterDebounceTimer.current) {
        clearTimeout(filterDebounceTimer.current);
      }
    };
  }, []);

  const clearFilters = () => {
    // Clear debounce timer
    if (filterDebounceTimer.current) {
      clearTimeout(filterDebounceTimer.current);
    }
    
    const resetFilters = {
      date: 'all',
      caseStatus: 'all',
      projectName: 'all',
      accountName: 'all',
      group: 'all',
      caseOwner: 'all',
      caseType: 'all',
      caseReason: 'all',
      caseTag: 'all',
      slaStatus: 'all'
    };
    
    setFilters(resetFilters);
    
    // Refresh data with cleared filters immediately
    setTimeout(() => {
      fetchAllData(resetFilters);
    }, 100);
  };

  // Helper function to save baseline data after widget refresh
  const saveWidgetToBaseline = useCallback((widgetKey, data) => {
    const existingBaseline = loadBaselineData() || {};
    const updatedBaseline = { ...existingBaseline };
    
    // Map widget keys to baseline property names
    const widgetKeyMap = {
      'kpis': 'kpis',
      'dailyNewCases': 'dailyNewCases',
      'dailyResolvedCases': 'dailyResolvedCases',
      'caseStatusBreakdown': 'caseStatusBreakdown',
      'unresolvedSLABreakdown': 'unresolvedSLABreakdown',
      'createdResolvedByGroup': 'createdResolvedByGroup',
      'avgCreatedResolvedByGroup': 'avgCreatedResolvedByGroup',
      'medianTimeByGroup': 'medianTimeByGroup',
      'createdResolvedByReason': 'createdResolvedByReason',
      'avgCreatedResolvedByReason': 'avgCreatedResolvedByReason',
      'medianTimeByReason': 'medianTimeByReason',
      'createdResolvedByType': 'createdResolvedByType',
      'avgCreatedResolvedByType': 'avgCreatedResolvedByType',
      'medianTimeByType': 'medianTimeByType',
      'unresolvedByGroup': 'unresolvedByGroup',
      'unresolvedByType': 'unresolvedByType',
      'backlogByClient': 'backlogByClient',
      'historicalBacklog': 'historicalBacklog',
      'onHoldReasons': 'onHoldReasons',
      'agentPerformance': 'agentPerformance',
      'casesTouchedByAgent': 'casesTouchedByAgent',
      'caseAnalytics': 'caseAnalytics',
      'unresolvedSolvedByAgent': 'unresolvedSolvedByAgent',
      'automatedCaseActions': 'automatedCaseActions',
      'avgAutomatedActionsByReason': 'avgAutomatedActionsByReason',
      'onHoldCasesOutsideSLA': 'onHoldCasesOutsideSLA',
      'dailySolvedByProject': 'dailySolvedByProject',
      'dailySolvedByName': 'dailySolvedByName'
    };
    
    const baselineKey = widgetKeyMap[widgetKey];
    if (baselineKey) {
      updatedBaseline[baselineKey] = data;
      saveBaselineData(updatedBaseline);
    }
  }, []);

  // Individual widget refresh handlers
  const handleWidgetRefresh = useCallback(async (widgetKey) => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    
    try {
      switch (widgetKey) {
        case 'kpis':
          const kpiResponse = await apiClient.get('/case-analytics/kpis', { 
            params: filters,
            timeout: 120000
          });
          setKpis(kpiResponse.data);
          saveWidgetToBaseline('kpis', kpiResponse.data);
          break;
          
        case 'dailyNewCases':
          const newCasesResponse = await apiClient.get('/case-analytics/daily-new-cases', { 
            params: { ...filters, timeRange }
          });
          setDailyNewCases(newCasesResponse.data);
          saveWidgetToBaseline('dailyNewCases', newCasesResponse.data);
          break;
          
        case 'dailyResolvedCases':
          const resolvedCasesResponse = await apiClient.get('/case-analytics/daily-resolved-cases', { 
            params: { ...filters, timeRange }
          });
          setDailyResolvedCases(resolvedCasesResponse.data);
          saveWidgetToBaseline('dailyResolvedCases', resolvedCasesResponse.data);
          break;
          
        case 'caseStatusBreakdown':
          const statusBreakdownResponse = await apiClient.get('/case-analytics/case-status-breakdown', { 
            params: filters
          });
          setCaseStatusBreakdown(statusBreakdownResponse.data);
          saveWidgetToBaseline('caseStatusBreakdown', statusBreakdownResponse.data);
          break;
          
        case 'unresolvedSLABreakdown':
          const slaBreakdownResponse = await apiClient.get('/case-analytics/unresolved-sla-breakdown', { 
            params: filters
          });
          setUnresolvedSLABreakdown(slaBreakdownResponse.data);
          saveWidgetToBaseline('unresolvedSLABreakdown', slaBreakdownResponse.data);
          break;
          
        case 'createdResolvedByGroup':
          const byGroupResponse = await apiClient.get('/case-analytics/created-resolved-by-group', { 
            params: { ...filters, timeRange }
          });
          setCreatedResolvedByGroup(byGroupResponse.data);
          saveWidgetToBaseline('createdResolvedByGroup', byGroupResponse.data);
          break;
          
        case 'avgCreatedResolvedByGroup':
          const avgByGroupResponse = await apiClient.get('/case-analytics/avg-created-resolved-by-group', { 
            params: { ...filters, timeRange }
          });
          setAvgCreatedResolvedByGroup(avgByGroupResponse.data);
          saveWidgetToBaseline('avgCreatedResolvedByGroup', avgByGroupResponse.data);
          break;
          
        case 'medianTimeByGroup':
          const medianByGroupResponse = await apiClient.get('/case-analytics/median-time-by-group', { 
            params: { ...filters, timeRange }
          });
          setMedianTimeByGroup(medianByGroupResponse.data);
          saveWidgetToBaseline('medianTimeByGroup', medianByGroupResponse.data);
          break;
          
        case 'createdResolvedByReason':
          const byReasonResponse = await apiClient.get('/case-analytics/created-resolved-by-reason', { 
            params: { ...filters, timeRange }
          });
          setCreatedResolvedByReason(byReasonResponse.data);
          saveWidgetToBaseline('createdResolvedByReason', byReasonResponse.data);
          break;
          
        case 'avgCreatedResolvedByReason':
          const avgByReasonResponse = await apiClient.get('/case-analytics/avg-created-resolved-by-reason', { 
            params: { ...filters, timeRange }
          });
          setAvgCreatedResolvedByReason(avgByReasonResponse.data);
          saveWidgetToBaseline('avgCreatedResolvedByReason', avgByReasonResponse.data);
          break;
          
        case 'medianTimeByReason':
          const medianByReasonResponse = await apiClient.get('/case-analytics/median-time-by-reason', { 
            params: { ...filters, timeRange }
          });
          setMedianTimeByReason(medianByReasonResponse.data);
          saveWidgetToBaseline('medianTimeByReason', medianByReasonResponse.data);
          break;
          
        case 'createdResolvedByType':
          const byTypeResponse = await apiClient.get('/case-analytics/created-resolved-by-type', { 
            params: { ...filters, timeRange }
          });
          setCreatedResolvedByType(byTypeResponse.data);
          saveWidgetToBaseline('createdResolvedByType', byTypeResponse.data);
          break;
          
        case 'avgCreatedResolvedByType':
          const avgByTypeResponse = await apiClient.get('/case-analytics/avg-created-resolved-by-type', { 
            params: { ...filters, timeRange }
          });
          setAvgCreatedResolvedByType(avgByTypeResponse.data);
          saveWidgetToBaseline('avgCreatedResolvedByType', avgByTypeResponse.data);
          break;
          
        case 'medianTimeByType':
          const medianByTypeResponse = await apiClient.get('/case-analytics/median-time-by-type', { 
            params: { ...filters, timeRange }
          });
          setMedianTimeByType(medianByTypeResponse.data);
          saveWidgetToBaseline('medianTimeByType', medianByTypeResponse.data);
          break;
          
        case 'unresolvedByGroup':
          const unresolvedByGroupResponse = await apiClient.get('/case-analytics/unresolved-by-group', { 
            params: filters
          });
          setUnresolvedByGroup(unresolvedByGroupResponse.data);
          saveWidgetToBaseline('unresolvedByGroup', unresolvedByGroupResponse.data);
          break;
          
        case 'unresolvedByType':
          const unresolvedByTypeResponse = await apiClient.get('/case-analytics/unresolved-by-type', { 
            params: filters
          });
          setUnresolvedByType(unresolvedByTypeResponse.data);
          saveWidgetToBaseline('unresolvedByType', unresolvedByTypeResponse.data);
          break;
          
        case 'backlogByClient':
          const backlogByClientResponse = await apiClient.get('/case-analytics/backlog-by-client', { 
            params: filters
          });
          setBacklogByClient(backlogByClientResponse.data);
          saveWidgetToBaseline('backlogByClient', backlogByClientResponse.data);
          break;
          
        case 'historicalBacklog':
          const historicalBacklogResponse = await apiClient.get('/case-analytics/historical-backlog', { 
            params: { ...filters, timeRange }
          });
          setHistoricalBacklog(historicalBacklogResponse.data);
          saveWidgetToBaseline('historicalBacklog', historicalBacklogResponse.data);
          break;
          
        case 'onHoldReasons':
          const onHoldReasonsResponse = await apiClient.get('/case-analytics/on-hold-reasons', { 
            params: filters
          });
          setOnHoldReasons(onHoldReasonsResponse.data);
          saveWidgetToBaseline('onHoldReasons', onHoldReasonsResponse.data);
          break;
          
        case 'agentPerformance':
          const agentPerformanceResponse = await apiClient.get('/case-analytics/agent-performance', { 
            params: filters
          });
          setAgentPerformance(agentPerformanceResponse.data);
          saveWidgetToBaseline('agentPerformance', agentPerformanceResponse.data);
          break;
          
        case 'casesTouchedByAgent':
          const casesTouchedResponse = await apiClient.get('/case-analytics/cases-touched-by-agent', { 
            params: { ...filters, timeRange }
          });
          setCasesTouchedByAgent(casesTouchedResponse.data);
          saveWidgetToBaseline('casesTouchedByAgent', casesTouchedResponse.data);
          break;
          
        case 'caseAnalytics':
          const caseAnalyticsResponse = await apiClient.get('/case-analytics/case-analytics-list', { 
            params: filters,
            timeout: 70000 // 70 seconds - slightly more than backend timeout of 60s
          });
          setCaseAnalytics(caseAnalyticsResponse.data);
          saveWidgetToBaseline('caseAnalytics', caseAnalyticsResponse.data);
          break;
          
        case 'unresolvedSolvedByAgent':
          const unresolvedSolvedResponse = await apiClient.get('/case-analytics/unresolved-solved-by-agent', { 
            params: filters
          });
          setUnresolvedSolvedByAgent(unresolvedSolvedResponse.data);
          saveWidgetToBaseline('unresolvedSolvedByAgent', unresolvedSolvedResponse.data);
          break;
          
        case 'automatedCaseActions':
          const automatedResponse = await apiClient.get('/case-analytics/automated-case-actions', { 
            params: { ...filters, timeRange }
          });
          setAutomatedCaseActions(automatedResponse.data);
          saveWidgetToBaseline('automatedCaseActions', automatedResponse.data);
          break;
          
        case 'avgAutomatedActionsByReason':
          const avgAutomatedResponse = await apiClient.get('/case-analytics/avg-automated-actions-by-reason', { 
            params: { ...filters, timeRange }
          });
          setAvgAutomatedActionsByReason(avgAutomatedResponse.data);
          saveWidgetToBaseline('avgAutomatedActionsByReason', avgAutomatedResponse.data);
          break;
          
        case 'onHoldCasesOutsideSLA':
          const onHoldSLAResponse = await apiClient.get('/case-analytics/on-hold-cases-outside-sla', { 
            params: filters
          });
          setOnHoldCasesOutsideSLA(onHoldSLAResponse.data);
          saveWidgetToBaseline('onHoldCasesOutsideSLA', onHoldSLAResponse.data);
          break;
          
        case 'dailySolvedByProject':
          const dailySolvedByProjectResponse = await apiClient.get('/case-analytics/daily-solved-by-project', { 
            params: { ...filters, timeRange }
          });
          setDailySolvedByProject(dailySolvedByProjectResponse.data);
          saveWidgetToBaseline('dailySolvedByProject', dailySolvedByProjectResponse.data);
          break;
          
        case 'dailySolvedByName':
          const dailySolvedByNameResponse = await apiClient.get('/case-analytics/daily-solved-by-name', { 
            params: { ...filters, timeRange }
          });
          setDailySolvedByName(dailySolvedByNameResponse.data);
          saveWidgetToBaseline('dailySolvedByName', dailySolvedByNameResponse.data);
          break;
          
        default:
          // Unknown widget key
          break;
      }
      
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      toast.success(`${widgetKey} refreshed successfully`);
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      toast.error(`Failed to refresh ${widgetKey}`);
    }
  }, [filters, timeRange, saveWidgetToBaseline]);
  
  // Helper to render widget refresh button
  const renderWidgetRefresh = useCallback((widgetKey) => {
    const state = widgetStates[widgetKey];
    return (
      <button
        className="widget-refresh-btn"
        onClick={() => handleWidgetRefresh(widgetKey)}
        disabled={state?.loading}
        title={state?.loading ? 'Refreshing...' : state?.error ? 'Retry' : 'Refresh this widget'}
        style={{
          padding: '4px 8px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          borderRadius: '4px',
          cursor: state?.loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <RefreshCw size={14} className={state?.loading ? 'spinning' : ''} style={{ color: '#08979C' }} />
      </button>
    );
  }, [widgetStates, handleWidgetRefresh]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num?.toString() || '0';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div 
        className="case-analytics-dashboard" 
        style={{ 
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'margin-left 0.3s ease, width 0.3s ease',
          maxWidth: '100vw',
          overflowX: 'hidden'
        }}
      >
        <div className="case-analytics-container">
          <div className="case-analytics-header">
            <div className="header-content">
              <div className="header-left">
                <button
                  className="header-menu-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="page-title">Case Analytics Dashboard</h1>
                  <p className="page-subtitle">View case metrics and analytics</p>
                </div>
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Case Analytics Dashboard" pageType="page" />
                <div className="user-profile">
                  <div className="user-avatar">
                    {(user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{user?.email || 'User'}</span>
                  <button className="logout-btn" onClick={logout} title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="case-analytics-content">
            {/* Tabs */}
            <div className="case-analytics-tabs">
              <button
                className={`tab-button ${activeTab === 'daily-snapshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('daily-snapshot')}
              >
                Daily Snapshot
              </button>
              <button
                className={`tab-button ${activeTab === 'cases-backlog' ? 'active' : ''}`}
                onClick={() => setActiveTab('cases-backlog')}
              >
                Cases Backlog
              </button>
              <button
                className={`tab-button ${activeTab === 'agent-performance' ? 'active' : ''}`}
                onClick={() => setActiveTab('agent-performance')}
              >
                Agent Performance
              </button>
              <button
                className={`tab-button ${activeTab === 'cases-breakdown' ? 'active' : ''}`}
                onClick={() => setActiveTab('cases-breakdown')}
              >
                Cases Breakdown
              </button>
              <button
                className={`tab-button ${activeTab === 'daily-solved' ? 'active' : ''}`}
                onClick={() => setActiveTab('daily-solved')}
              >
                Daily Solved
              </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
              <select value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} title="Date Filter">
                <option value="all">Date: All</option>
                <option value="today">Today</option>
                <option value="past-7-days">Past 7 Days</option>
                <option value="past-30-days">Past 30 Days</option>
                <option value="past-90-days">Past 90 Days</option>
              </select>
              <select value={filters.caseStatus} onChange={(e) => handleFilterChange('caseStatus', e.target.value)} title="Case Status">
                <option value="all">Status: All</option>
                {filterOptions.caseStatus.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select value={filters.projectName} onChange={(e) => handleFilterChange('projectName', e.target.value)} title="Project Name">
                <option value="all">Project: All</option>
                {filterOptions.projectName.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              <select value={filters.accountName} onChange={(e) => handleFilterChange('accountName', e.target.value)} title="Account Name">
                <option value="all">Account: All</option>
                {filterOptions.accountName.map(account => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
              <select value={filters.group} onChange={(e) => handleFilterChange('group', e.target.value)} title="Group">
                <option value="all">Group: All</option>
                {filterOptions.group.length > 0 ? (
                  filterOptions.group.map(group => (
                    <option key={group} value={group.toLowerCase().replace(/\s+/g, '-')}>{group}</option>
                  ))
                ) : (
                  <>
                    <option value="crowd-support">Crowd Support</option>
                    <option value="trust-safety">Trust and Safety</option>
                    <option value="project-teams">Project Teams</option>
                    <option value="finance">Finance</option>
                    <option value="hr">HR</option>
                  </>
                )}
              </select>
              <select value={filters.caseOwner} onChange={(e) => handleFilterChange('caseOwner', e.target.value)} title="Case Owner">
                <option value="all">Owner: All</option>
                {filterOptions.caseOwner.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
              <select value={filters.caseType} onChange={(e) => handleFilterChange('caseType', e.target.value)} title="Case Type">
                <option value="all">Type: All</option>
                {filterOptions.caseType.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select value={filters.caseReason} onChange={(e) => handleFilterChange('caseReason', e.target.value)} title="Case Reason">
                <option value="all">Reason: All</option>
                {filterOptions.caseReason.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <select value={filters.caseTag} onChange={(e) => handleFilterChange('caseTag', e.target.value)} title="Case Tag">
                <option value="all">Tag: All</option>
                {filterOptions.caseTag.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              {activeTab === 'cases-backlog' && (
                <select value={filters.slaStatus} onChange={(e) => handleFilterChange('slaStatus', e.target.value)} title="SLA Status">
                  <option value="all">SLA: All</option>
                  <option value="within-target">Within Target</option>
                  <option value="over-target">Over Target</option>
                  <option value="over-external">Over External</option>
                </select>
              )}
              <button className="clear-filter-btn" onClick={clearFilters} title="Clear All Filters">
                <X size={12} />
                Clear
              </button>
              <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing[activeTab]} title="Refresh">
                <RefreshCw size={16} className={refreshing[activeTab] ? 'spinning' : ''} />
              </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'daily-snapshot' && (
              <DailySnapshotView
                kpis={kpis}
                dailyNewCases={dailyNewCases}
                dailyResolvedCases={dailyResolvedCases}
                caseStatusBreakdown={caseStatusBreakdown}
                unresolvedSLABreakdown={unresolvedSLABreakdown}
                createdResolvedByGroup={createdResolvedByGroup}
                avgCreatedResolvedByGroup={avgCreatedResolvedByGroup}
                medianTimeByGroup={medianTimeByGroup}
                createdResolvedByReason={createdResolvedByReason}
                avgCreatedResolvedByReason={avgCreatedResolvedByReason}
                medianTimeByReason={medianTimeByReason}
                createdResolvedByType={createdResolvedByType}
                avgCreatedResolvedByType={avgCreatedResolvedByType}
                medianTimeByType={medianTimeByType}
                timeRange={timeRange}
                setTimeRange={handleTimeRangeChange}
                formatNumber={formatNumber}
                renderWidgetRefresh={renderWidgetRefresh}
              />
            )}
            {activeTab === 'cases-backlog' && (
              <CasesBacklogView
                kpis={kpis}
                unresolvedByGroup={unresolvedByGroup}
                unresolvedByType={unresolvedByType}
                backlogByClient={backlogByClient}
                historicalBacklog={historicalBacklog}
                onHoldReasons={onHoldReasons}
                timeRange={timeRange}
                setTimeRange={handleTimeRangeChange}
                formatNumber={formatNumber}
                renderWidgetRefresh={renderWidgetRefresh}
              />
            )}
            {activeTab === 'agent-performance' && (
              <AgentPerformanceView
                kpis={kpis}
                agentPerformance={agentPerformance}
                casesTouchedByAgent={casesTouchedByAgent}
                caseAnalytics={caseAnalytics}
                unresolvedSolvedByAgent={unresolvedSolvedByAgent}
                timeRange={timeRange}
                setTimeRange={handleTimeRangeChange}
                formatNumber={formatNumber}
                renderWidgetRefresh={renderWidgetRefresh}
              />
            )}
            {activeTab === 'cases-breakdown' && (
              <CasesBreakdownView
                automatedCaseActions={automatedCaseActions}
                avgAutomatedActionsByReason={avgAutomatedActionsByReason}
                onHoldCasesOutsideSLA={onHoldCasesOutsideSLA}
                timeRange={timeRange}
                setTimeRange={handleTimeRangeChange}
                formatNumber={formatNumber}
                renderWidgetRefresh={renderWidgetRefresh}
              />
            )}
            {activeTab === 'daily-solved' && (
              <DailySolvedView
                formatNumber={formatNumber}
                dailySolvedByProject={dailySolvedByProject}
                dailySolvedByName={dailySolvedByName}
                timeRange={timeRange}
                setTimeRange={handleTimeRangeChange}
                renderWidgetRefresh={renderWidgetRefresh}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Daily Snapshot View Component
const DailySnapshotView = ({ kpis, dailyNewCases, dailyResolvedCases, caseStatusBreakdown, unresolvedSLABreakdown, createdResolvedByGroup, avgCreatedResolvedByGroup, medianTimeByGroup, createdResolvedByReason, avgCreatedResolvedByReason, medianTimeByReason, createdResolvedByType, avgCreatedResolvedByType, medianTimeByType, timeRange, setTimeRange, formatNumber, renderWidgetRefresh }) => {
  // Calculate averages for daily charts
  const avgNewCases = dailyNewCases.length > 0 
    ? Math.round(dailyNewCases.reduce((sum, d) => sum + d.count, 0) / dailyNewCases.length)
    : 0;
  const avgResolvedCases = dailyResolvedCases.length > 0
    ? Math.round(dailyResolvedCases.reduce((sum, d) => sum + d.count, 0) / dailyResolvedCases.length)
    : 0;

  return (
    <div className="tab-content">
      {/* KPIs */}
      <div className="kpi-section" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
          {renderWidgetRefresh('kpis')}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Unresolved Tickets</div>
          <div className="kpi-value">{formatNumber(kpis.totalUnresolvedTickets)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">DCPT</div>
          <div className="kpi-value">{kpis.dcpt?.toFixed(2) || '0.00'}</div>
          <div className="kpi-sublabel">Daily Cases per 1,000 Contributors</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg. Resolution Time</div>
          <div className="kpi-value">{kpis.avgResolutionTime?.toFixed(2) || '0.00'} days</div>
          <div className="kpi-sublabel">*resolved cases only*</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Unresolved Within Target SLA</div>
          <div className="kpi-value">{formatNumber(kpis.unresolvedWithinTargetSLA)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Backlog (&gt; Target SLA)</div>
          <div className="kpi-value">{formatNumber(kpis.backlogOverTargetSLA)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Backlog (&gt; External SLA)</div>
          <div className="kpi-value">{formatNumber(kpis.backlogOverExternalSLA)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Backlog</div>
          <div className="kpi-value">{formatNumber(kpis.totalBacklog)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg. Age Unresolved</div>
          <div className="kpi-value">{kpis.avgAgeUnresolved?.toFixed(2) || '0.00'} days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Resolved Cases</div>
          <div className="kpi-value">{formatNumber(kpis.resolvedCases)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">AHT</div>
          <div className="kpi-value">{kpis.aht?.toFixed(2) || '0.00'} days</div>
          <div className="kpi-sublabel">Average Handle Time</div>
        </div>
      </div>

      {/* Case Status Breakdown */}
      <div className="chart-row">
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Case Status Breakdown</h3>
            {renderWidgetRefresh('caseStatusBreakdown')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(200, caseStatusBreakdown.length * 30)}>
              <BarChart data={caseStatusBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="status" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Unresolved SLA Status</h3>
            {renderWidgetRefresh('unresolvedSLABreakdown')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(200, unresolvedSLABreakdown.length * 30)}>
              <BarChart data={unresolvedSLABreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="status" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="percentage" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Charts */}
      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3>DAILY NEW CASES</h3>
                {renderWidgetRefresh('dailyNewCases')}
              </div>
              <div className="chart-average">Avg. Created: <span>{formatNumber(avgNewCases)}</span></div>
            </div>
            <div className="time-range-buttons">
              <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
              <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30 Days</button>
              <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90 Days</button>
            </div>
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyNewCases}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
                <ReferenceLine y={avgNewCases} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Avg: ${avgNewCases}`, position: 'right' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3>DAILY RESOLVED CASES</h3>
                {renderWidgetRefresh('dailyResolvedCases')}
              </div>
              <div className="chart-average">Avg. Resolved: <span>{formatNumber(avgResolvedCases)}</span></div>
            </div>
            <div className="time-range-buttons">
              <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
              <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30 Days</button>
              <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90 Days</button>
            </div>
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyResolvedCases}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
                <ReferenceLine y={avgResolvedCases} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Avg: ${avgResolvedCases}`, position: 'right' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables - Created & Resolved by Group */}
      <div className="tables-section">
        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>CREATED & RESOLVED BY GROUP</h3>
              {renderWidgetRefresh('createdResolvedByGroup')}
            </div>
            <div className="time-range-buttons">
              <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
              <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30 Days</button>
              <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90 Days</button>
              <button className={timeRange === 'past-180-days' ? 'active' : ''} onClick={() => setTimeRange('past-180-days')}>Past 180 Days</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Created Cases ↓</th>
                  <th>Resolved Cases</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {createdResolvedByGroup.length > 0 ? createdResolvedByGroup.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.group}</td>
                    <td>{formatNumber(row.created)}</td>
                    <td>{formatNumber(row.resolved)}</td>
                    <td className={row.variance >= 0 ? 'positive' : 'negative'}>{row.variance >= 0 ? '+' : ''}{formatNumber(row.variance)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>AVG. CREATED & RESOLVED CASES BY GROUP</h3>
              {renderWidgetRefresh('avgCreatedResolvedByGroup')}
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Avg. Created Cases ↓</th>
                  <th>Avg. Resolved Cases</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {avgCreatedResolvedByGroup.length > 0 ? avgCreatedResolvedByGroup.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.group}</td>
                    <td>{row.avgCreated?.toFixed(1) || '0.0'}</td>
                    <td>{row.avgResolved?.toFixed(1) || '0.0'}</td>
                    <td className={row.variance >= 0 ? 'positive' : 'negative'}>{row.variance >= 0 ? '+' : ''}{row.variance?.toFixed(1) || '0.0'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>

      {/* Median Time by Group - paired with Median Time by Reason for balance */}
      <div className="tables-section">
        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
              <h3>MEDIAN TIME TO RESOLVE BY GROUP (Hours)</h3>
              {renderWidgetRefresh('medianTimeByGroup')}
            </div>
            <div className="sla-legend">
              <span className="legend-item"><span className="legend-color green"></span>0-4.99% - Green</span>
              <span className="legend-item"><span className="legend-color yellow"></span>5-14.99% - Yellow</span>
              <span className="legend-item"><span className="legend-color red"></span>15% or Greater - Red</span>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group ↑</th>
                  <th>Past 7 Days</th>
                  <th>Past 30</th>
                  <th>Past 90</th>
                  <th>Past 180</th>
                </tr>
              </thead>
              <tbody>
                {medianTimeByGroup.length > 0 ? medianTimeByGroup.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.group}</td>
                    <td className={row.past7Days >= 15 ? 'red' : row.past7Days >= 5 ? 'yellow' : 'green'}>{row.past7Days || '-'}</td>
                    <td className={row.past30 >= 15 ? 'red' : row.past30 >= 5 ? 'yellow' : 'green'}>{row.past30 || '-'}</td>
                    <td className={row.past90 >= 15 ? 'red' : row.past90 >= 5 ? 'yellow' : 'green'}>{row.past90 || '-'}</td>
                    <td className={row.past180 >= 15 ? 'red' : row.past180 >= 5 ? 'yellow' : 'green'}>{row.past180 || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
              <h3>MEDIAN TIME TO RESOLVE BY REASON (Hours)</h3>
              {renderWidgetRefresh('medianTimeByReason')}
            </div>
            <div className="sla-legend">
              <span className="legend-item"><span className="legend-color green"></span>Green = In SLA</span>
              <span className="legend-item"><span className="legend-color red"></span>Red = Out of SLA</span>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Reason ↑</th>
                  <th>Target SLA</th>
                  <th>Past 7 Days</th>
                  <th>Past 30</th>
                  <th>Past 90</th>
                  <th>Past 180</th>
                </tr>
              </thead>
              <tbody>
                {medianTimeByReason.length > 0 ? medianTimeByReason.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.reason}</td>
                    <td>{row.targetSLA || 48}</td>
                    <td className={row.past7Days && row.past7Days > (row.targetSLA || 48) ? 'red' : 'green'}>{row.past7Days || '-'}</td>
                    <td className={row.past30 && row.past30 > (row.targetSLA || 48) ? 'red' : 'green'}>{row.past30 || '-'}</td>
                    <td className={row.past90 && row.past90 > (row.targetSLA || 48) ? 'red' : 'green'}>{row.past90 || '-'}</td>
                    <td className={row.past180 && row.past180 > (row.targetSLA || 48) ? 'red' : 'green'}>{row.past180 || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tables - Created & Resolved by Reason */}
      <div className="tables-section">
        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>CREATED & RESOLVED BY REASON</h3>
              {renderWidgetRefresh('createdResolvedByReason')}
            </div>
            <div className="time-range-buttons">
              <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
              <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30 Days</button>
              <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90 Days</button>
              <button className={timeRange === 'past-180-days' ? 'active' : ''} onClick={() => setTimeRange('past-180-days')}>Past 180 Days</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Created Cases ↓</th>
                  <th>Resolved Cases</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {createdResolvedByReason.length > 0 ? createdResolvedByReason.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.reason}</td>
                    <td>{formatNumber(row.created)}</td>
                    <td>{formatNumber(row.resolved)}</td>
                    <td className={row.variance >= 0 ? 'positive' : 'negative'}>{row.variance >= 0 ? '+' : ''}{formatNumber(row.variance)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>AVG. CREATED & RESOLVED CASES BY REASON</h3>
              {renderWidgetRefresh('avgCreatedResolvedByReason')}
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Reason</th>
                  <th>Avg. Created Cases ↓</th>
                  <th>Avg. Resolved Cases</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {avgCreatedResolvedByReason.length > 0 ? avgCreatedResolvedByReason.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.reason}</td>
                    <td>{row.avgCreated?.toFixed(1) || '0.0'}</td>
                    <td>{row.avgResolved?.toFixed(1) || '0.0'}</td>
                    <td className={row.variance >= 0 ? 'positive' : 'negative'}>{row.variance >= 0 ? '+' : ''}{row.variance?.toFixed(1) || '0.0'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Tables - Created & Resolved by Type */}
      <div className="tables-section">
        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>CREATED & RESOLVED BY TYPE</h3>
              {renderWidgetRefresh('createdResolvedByType')}
            </div>
            <div className="time-range-buttons">
              <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
              <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30 Days</button>
              <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90 Days</button>
              <button className={timeRange === 'past-180-days' ? 'active' : ''} onClick={() => setTimeRange('past-180-days')}>Past 180 Days</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Type</th>
                  <th>Created Cases ↓</th>
                  <th>Resolved Cases</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {createdResolvedByType.length > 0 ? createdResolvedByType.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.type}</td>
                    <td>{formatNumber(row.created)}</td>
                    <td>{formatNumber(row.resolved)}</td>
                    <td className={row.variance >= 0 ? 'positive' : 'negative'}>{row.variance >= 0 ? '+' : ''}{formatNumber(row.variance)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>AVG. CREATED & RESOLVED CASES BY TYPE</h3>
              {renderWidgetRefresh('avgCreatedResolvedByType')}
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Type</th>
                  <th>Avg. Created Cases ↓</th>
                  <th>Avg. Resolved Cases</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {avgCreatedResolvedByType.length > 0 ? avgCreatedResolvedByType.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.type}</td>
                    <td>{row.avgCreated?.toFixed(1) || '0.0'}</td>
                    <td>{row.avgResolved?.toFixed(1) || '0.0'}</td>
                    <td className={row.variance >= 0 ? 'positive' : 'negative'}>{row.variance >= 0 ? '+' : ''}{row.variance?.toFixed(1) || '0.0'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>

      {/* Median Time by Type - separate section */}
      <div className="tables-section">
        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
              <h3>MEDIAN TIME TO RESOLVE BY TYPE (Hours)</h3>
              {renderWidgetRefresh('medianTimeByType')}
            </div>
            <div className="sla-legend">
              <span className="legend-item"><span className="legend-color green"></span>0-4.99% - Green</span>
              <span className="legend-item"><span className="legend-color yellow"></span>5-14.99% - Yellow</span>
              <span className="legend-item"><span className="legend-color red"></span>15% or Greater - Red</span>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Type ↑</th>
                  <th>Past 7 Days</th>
                  <th>Past 30</th>
                  <th>Past 90</th>
                  <th>Past 180</th>
                </tr>
              </thead>
              <tbody>
                {medianTimeByType.length > 0 ? medianTimeByType.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.type}</td>
                    <td className={row.past7Days >= 15 ? 'red' : row.past7Days >= 5 ? 'yellow' : 'green'}>{row.past7Days || '-'}</td>
                    <td className={row.past30 >= 15 ? 'red' : row.past30 >= 5 ? 'yellow' : 'green'}>{row.past30 || '-'}</td>
                    <td className={row.past90 >= 15 ? 'red' : row.past90 >= 5 ? 'yellow' : 'green'}>{row.past90 || '-'}</td>
                    <td className={row.past180 >= 15 ? 'red' : row.past180 >= 5 ? 'yellow' : 'green'}>{row.past180 || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cases Backlog View Component
const CasesBacklogView = ({ kpis, unresolvedByGroup, unresolvedByType, backlogByClient, historicalBacklog, onHoldReasons, timeRange, setTimeRange, formatNumber, renderWidgetRefresh }) => {
  return (
    <div className="tab-content">
      {/* KPIs */}
      <div className="kpi-section" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
          {renderWidgetRefresh('kpis')}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Unresolved Within Target SLA</div>
          <div className="kpi-value">{formatNumber(kpis.unresolvedWithinTargetSLA)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Backlog (&gt; Target SLA)</div>
          <div className="kpi-value">{formatNumber(kpis.backlogOverTargetSLA)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Backlog (&gt; External SLA)</div>
          <div className="kpi-value">{formatNumber(kpis.backlogOverExternalSLA)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Backlog</div>
          <div className="kpi-value">{formatNumber(kpis.totalBacklog)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg. Handling Time</div>
          <div className="kpi-value">{kpis.aht?.toFixed(2) || '0.00'} days</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-row">
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>UNRESOLVED CASES BY GROUP</h3>
            {renderWidgetRefresh('unresolvedByGroup')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(250, unresolvedByGroup.length * 35)}>
              <BarChart data={unresolvedByGroup} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="group" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="overExternal" stackId="a" fill="#ef4444" name="Over External SLA" />
                <Bar dataKey="overTarget" stackId="a" fill="#f59e0b" name="Over Target SLA" />
                <Bar dataKey="within" stackId="a" fill="#10b981" name="Within Target SLA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>UNRESOLVED CASES BY TYPE</h3>
            {renderWidgetRefresh('unresolvedByType')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(250, unresolvedByType.length * 35)}>
              <BarChart data={unresolvedByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="overExternal" stackId="a" fill="#ef4444" name="Over External SLA" />
                <Bar dataKey="overTarget" stackId="a" fill="#f59e0b" name="Over Target SLA" />
                <Bar dataKey="within" stackId="a" fill="#10b981" name="Within Target SLA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>BACKLOG BY CLIENT</h3>
            {renderWidgetRefresh('backlogByClient')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(250, backlogByClient.length * 35)}>
              <BarChart data={backlogByClient} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="client" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="overExternal" stackId="a" fill="#ef4444" name="Over External SLA" />
                <Bar dataKey="overTarget" stackId="a" fill="#f59e0b" name="Over Target SLA" />
                <Bar dataKey="within" stackId="a" fill="#10b981" name="Within Target SLA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>ONHOLD REASON</h3>
            {renderWidgetRefresh('onHoldReasons')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(250, onHoldReasons.length * 35)}>
              <BarChart data={onHoldReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="reason" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="overExternal" stackId="a" fill="#ef4444" name="Over External SLA" />
                <Bar dataKey="overTarget" stackId="a" fill="#f59e0b" name="Over Target SLA" />
                <Bar dataKey="within" stackId="a" fill="#10b981" name="Within Target SLA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Backlog Trend */}
      <div className="chart-card" style={{ marginTop: '16px' }}>
        <div className="chart-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3>HISTORICAL BACKLOG TREND</h3>
            {renderWidgetRefresh('historicalBacklog')}
          </div>
          <div className="time-range-buttons">
            <button className={timeRange === 'past-3-days' ? 'active' : ''} onClick={() => setTimeRange('past-3-days')}>incl. past 3 days</button>
            <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>past 7 days</button>
            <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>past 30 days</button>
            <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>past 90 days</button>
            <button className={timeRange === 'past-365-days' ? 'active' : ''} onClick={() => setTimeRange('past-365-days')}>past 365 days</button>
          </div>
        </div>
        <div className="chart-container scrollable-chart">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historicalBacklog}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" label={{ value: 'Unresolved from day', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Historical Unresolved, Backlog', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="unresolved" stroke="#8b4513" strokeWidth={2} name="Unresolved from day" />
              <Line yAxisId="right" type="monotone" dataKey="historical" stroke="#ec4899" strokeWidth={2} name="Historical Unresolved" />
              <Line yAxisId="right" type="monotone" dataKey="backlog" stroke="#f59e0b" strokeWidth={2} name="Backlog (>SLA)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Agent Performance View Component
const AgentPerformanceView = ({ kpis, agentPerformance, casesTouchedByAgent, caseAnalytics, unresolvedSolvedByAgent, timeRange, setTimeRange, formatNumber, renderWidgetRefresh }) => {
  return (
    <div className="tab-content">
      {/* KPIs */}
      <div className="kpi-section" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
          {renderWidgetRefresh('kpis')}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Unresolved Tickets</div>
          <div className="kpi-value">{formatNumber(kpis.totalUnresolvedTickets)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">DCPT</div>
          <div className="kpi-value">{kpis.dcpt?.toFixed(2) || '0.00'}</div>
          <div className="kpi-sublabel">Daily Cases per 1,000 Contributors</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg. Resolution Time</div>
          <div className="kpi-value">{kpis.avgResolutionTime?.toFixed(2) || '0.00'} days</div>
          <div className="kpi-sublabel">*resolved cases only*</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-row">
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Completion Rate vs. Unresolved Tickets</h3>
            {renderWidgetRefresh('agentPerformance')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(250, agentPerformance.length * 35)}>
              <BarChart data={[...agentPerformance].sort((a, b) => (a.unresolvedOverSLA || 0) - (b.unresolvedOverSLA || 0))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="unresolvedOverSLA" 
                  tick={{ fontSize: 10 }} 
                  label={{ value: 'Outside SLA', position: 'insideBottom', offset: -5 }}
                  type="number"
                />
                <YAxis label={{ value: 'Completion Rate %', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value.toFixed(2)}%`, 
                    'Completion Rate', 
                    `Agent: ${props.payload.agent || 'Unknown'}`
                  ]}
                  labelFormatter={(label) => `Outside SLA: ${label}`}
                />
                <Bar dataKey="slaPerformance" fill="#3b82f6" name="Completion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="tables-section">
        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>Cases Touched by Agent</h3>
              {renderWidgetRefresh('casesTouchedByAgent')}
            </div>
            <div className="time-range-buttons">
              <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
              <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30</button>
              <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90</button>
              <button className={timeRange === 'past-365-days' ? 'active' : ''} onClick={() => setTimeRange('past-365-days')}>Past 365</button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name ↑</th>
                  <th>New</th>
                  <th>Open</th>
                  <th>Merged</th>
                  <th>On Hold</th>
                  <th>Pending</th>
                  <th>Solved</th>
                  <th>Closed</th>
                  <th>Blocked</th>
                </tr>
              </thead>
              <tbody>
                {casesTouchedByAgent.length > 0 ? casesTouchedByAgent.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.agent}</td>
                    <td>{row.new || '-'}</td>
                    <td>{row.open || '-'}</td>
                    <td>{row.merged || '-'}</td>
                    <td>{row.onHold || '-'}</td>
                    <td>{row.pending || '-'}</td>
                    <td>{row.solved || '-'}</td>
                    <td>{row.closed || '-'}</td>
                    <td>{row.blocked || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>Case Analytics</h3>
              {renderWidgetRefresh('caseAnalytics')}
            </div>
          </div>
          <div className="table-container case-analytics-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Case Number ↑</th>
                  <th>Case Type</th>
                  <th>Project Name</th>
                  <th>Case Status</th>
                  <th>Case Reason</th>
                  <th>Case ID</th>
                </tr>
              </thead>
              <tbody>
                {caseAnalytics.length > 0 ? caseAnalytics.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.id}</td>
                    <td>{row.caseNumber}</td>
                    <td>{row.caseType}</td>
                    <td>{row.projectName}</td>
                    <td>{row.caseStatus}</td>
                    <td>{row.caseReason}</td>
                    <td>{row.caseId}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {caseAnalytics.length > 10 && (
            <div style={{ padding: '8px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Showing {caseAnalytics.length} entries. Scroll to view all.
            </div>
          )}
        </div>

        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>Agent Performance</h3>
              {renderWidgetRefresh('agentPerformance')}
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Owner</th>
                  <th>Avg. Resolution Time</th>
                  <th>SLA Performance</th>
                  <th>Historical Ticket Count</th>
                  <th>Resolved Past 7-Days</th>
                  <th>Historical Resolved</th>
                  <th>Unresolved &lt; SLA</th>
                  <th>Unresolved &gt; SLA</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.length > 0 ? agentPerformance.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.agent}</td>
                    <td>{row.avgResolutionTime?.toFixed(2) || '0.00'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '20px', 
                          background: row.slaPerformance >= 75 ? '#10b981' : row.slaPerformance >= 50 ? '#f59e0b' : '#ef4444',
                          borderRadius: '4px'
                        }}></div>
                        <span>{row.slaPerformance?.toFixed(2) || '0.00'}%</span>
                      </div>
                    </td>
                    <td>{formatNumber(row.historicalTicketCount)}</td>
                    <td>{row.resolvedPast7Days || '-'}</td>
                    <td>{formatNumber(row.historicalResolved)}</td>
                    <td>{formatNumber(row.unresolvedWithinSLA)}</td>
                    <td>{formatNumber(row.unresolvedOverSLA)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>Unresolved Cases and Solved Cases</h3>
              {renderWidgetRefresh('unresolvedSolvedByAgent')}
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name ↑</th>
                  <th>Unresolved Cases</th>
                  <th>Unresolved Cases (Within SLA)</th>
                  <th>Unresolved Cases (Over Target SLA)</th>
                  <th>Unresolved Cases (Over External SLA)</th>
                  <th>Solved Cases (This Week)</th>
                  <th>Solved Cases</th>
                </tr>
              </thead>
              <tbody>
                {unresolvedSolvedByAgent.length > 0 ? unresolvedSolvedByAgent.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.agent}</td>
                    <td>{row.unresolved || '-'}</td>
                    <td>{row.unresolvedWithin || '-'}</td>
                    <td>{row.unresolvedOverTarget || '-'}</td>
                    <td>{row.unresolvedOverExternal || '-'}</td>
                    <td>{row.solvedThisWeek || '-'}</td>
                    <td>{formatNumber(row.solved)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cases Breakdown View Component
const CasesBreakdownView = ({ automatedCaseActions, avgAutomatedActionsByReason, onHoldCasesOutsideSLA, timeRange, setTimeRange, formatNumber, renderWidgetRefresh }) => {
  return (
    <div className="tab-content">
      {/* Charts */}
      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3>AUTOMATED CASE ACTIONS</h3>
              {renderWidgetRefresh('automatedCaseActions')}
            </div>
            <div className="time-range-buttons">
              <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
              <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30</button>
              <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90</button>
              <button className={timeRange === 'past-365-days' ? 'active' : ''} onClick={() => setTimeRange('past-365-days')}>Past 365</button>
            </div>
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(250, automatedCaseActions.length * 30)}>
              <BarChart data={automatedCaseActions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="automated" stackId="a" fill="#3b82f6" name="Automated" />
                <Bar dataKey="manual" stackId="a" fill="#f59e0b" name="Manual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>On Hold Cases Outside 48hrs SLA</h3>
            {renderWidgetRefresh('onHoldCasesOutsideSLA')}
          </div>
          <div className="chart-container scrollable-chart">
            <ResponsiveContainer width="100%" height={Math.max(250, onHoldCasesOutsideSLA.length * 35)}>
              <BarChart data={onHoldCasesOutsideSLA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={Math.max(100, onHoldCasesOutsideSLA.length * 20)} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card" style={{ marginTop: '16px' }}>
        <div className="table-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h3>AVG. DAILY COUNT OF AUTOMATED CASE ACTIONS BY REASON</h3>
            {renderWidgetRefresh('avgAutomatedActionsByReason')}
          </div>
          <div className="time-range-buttons">
            <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
            <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30</button>
            <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90</button>
            <button className={timeRange === 'past-365-days' ? 'active' : ''} onClick={() => setTimeRange('past-365-days')}>Past 365</button>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case Reason</th>
                <th>Past 7 Days</th>
                <th>Past 30</th>
                <th>Past 90</th>
                <th>Past 365</th>
              </tr>
            </thead>
            <tbody>
              {avgAutomatedActionsByReason.length > 0 ? avgAutomatedActionsByReason.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.reason}</td>
                  <td>{row.automated?.toFixed(1) || '0.0'}</td>
                  <td>{row.automated?.toFixed(1) || '0.0'}</td>
                  <td>{row.automated?.toFixed(1) || '0.0'}</td>
                  <td>{row.automated?.toFixed(1) || '0.0'}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Daily Solved View Component
const DailySolvedView = ({ formatNumber, dailySolvedByProject, dailySolvedByName, timeRange, setTimeRange, renderWidgetRefresh }) => {
  return (
    <div className="tab-content">
      {/* Time Range Buttons */}
      <div style={{ marginBottom: '24px' }}>
        <div className="time-range-buttons">
          <button className={timeRange === 'past-7-days' ? 'active' : ''} onClick={() => setTimeRange('past-7-days')}>Past 7 Days</button>
          <button className={timeRange === 'past-30-days' ? 'active' : ''} onClick={() => setTimeRange('past-30-days')}>Past 30 Days</button>
          <button className={timeRange === 'past-90-days' ? 'active' : ''} onClick={() => setTimeRange('past-90-days')}>Past 90 Days</button>
        </div>
      </div>

      {/* Daily Solved by Project Table */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h3>Trunc_Solved_Date (Year-Month-Day) - By Project</h3>
            {renderWidgetRefresh('dailySolvedByProject')}
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#f3f2f2', zIndex: 2 }}>
                  PROJECT NAME ↑
                </th>
                {dailySolvedByProject.dateColumns && dailySolvedByProject.dateColumns.map((date, idx) => (
                  <th key={idx} style={{ textAlign: 'center' }}>
                    <div>{date}</div>
                    <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>Count</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailySolvedByProject.data && dailySolvedByProject.data.length > 0 ? (
                dailySolvedByProject.data.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 1, fontWeight: 500 }}>
                      {row.projectName || 'Unknown'}
                    </td>
                    {dailySolvedByProject.dateColumns && dailySolvedByProject.dateColumns.map((date, dateIdx) => (
                      <td key={dateIdx} style={{ textAlign: 'center' }}>
                        {row[date] || '-'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={(dailySolvedByProject.dateColumns?.length || 0) + 1} style={{ textAlign: 'center', padding: '20px' }}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Solved by Name Table */}
      <div className="table-card">
        <div className="table-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h3>Trunc_Solved_Date (Year-Month-Day) - By Name</h3>
            {renderWidgetRefresh('dailySolvedByName')}
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#f3f2f2', zIndex: 2 }}>
                  FULL NAME ↑
                </th>
                {dailySolvedByName.dateColumns && dailySolvedByName.dateColumns.map((date, idx) => (
                  <th key={idx} style={{ textAlign: 'center' }}>
                    <div>{date}</div>
                    <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>Count</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailySolvedByName.data && dailySolvedByName.data.length > 0 ? (
                dailySolvedByName.data.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 1, fontWeight: 500 }}>
                      {row.fullName || 'Unknown'}
                    </td>
                    {dailySolvedByName.dateColumns && dailySolvedByName.dateColumns.map((date, dateIdx) => (
                      <td key={dateIdx} style={{ textAlign: 'center' }}>
                        {row[date] || '-'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={(dailySolvedByName.dateColumns?.length || 0) + 1} style={{ textAlign: 'center', padding: '20px' }}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseAnalyticsDashboard;

