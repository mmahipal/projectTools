import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import useSidebarWidth from '../../hooks/useSidebarWidth';
import BookmarkButton from '../../components/BookmarkButton';
import { Menu, RefreshCw, Loader } from 'lucide-react';
import UserProfileDropdown from '../../components/UserProfileDropdown/UserProfileDropdown';
import toast from 'react-hot-toast';
import apiClient from '../../config/api';
import { useGPCFilter } from '../../context/GPCFilterContext';
import { applyGPCFilterToConfig } from '../../utils/gpcFilter';
import GPCFilterToggle from '../../components/GPCFilter/GPCFilterToggle';
import OverviewCards from './components/OverviewCards';
import FunnelChart from './components/FunnelChart';
import FinancialChart from './components/FinancialChart';
import ObjectiveChart from './components/ObjectiveChart';
import TeamChart from './components/TeamChart';
import QueueChart from './components/QueueChart';
import '../../styles/ProjectPerformance.css';
import '../../styles/Sidebar.css';
import '../../styles/GlobalHeader.css';

const ProjectPerformance = () => {
  const { user, logout } = useAuth();
  const { getFilterParams, override, initialized } = useGPCFilter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [accounts, setAccounts] = useState([]);
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [objectivesData, setObjectivesData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [queueData, setQueueData] = useState(null);
  
  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState(new Set());
  
  // Individual tab refreshing states
  const [refreshingTab, setRefreshingTab] = useState(null);
  
  // Error states
  const [errors, setErrors] = useState({});
  
  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await apiClient.get('/project-performance/accounts');
      if (response.data.success) {
        setAccounts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }, []);
  
  // Fetch overview data
  const fetchOverview = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingTab('overview');
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/project-performance/overview', config);
      if (response.data.success) {
        setOverviewData(response.data.data);
        setErrors(prev => ({ ...prev, overview: null }));
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
      setErrors(prev => ({ ...prev, overview: error.message || 'Failed to load overview data' }));
      toast.error('Failed to load overview data');
    } finally {
      if (showRefreshing) {
        setRefreshingTab(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]); // Removed getFilterParams from dependencies - call it inside the function instead
  
  // Fetch funnel data
  const fetchFunnel = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingTab('funnel');
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/project-performance/funnel', config);
      if (response.data.success) {
        setFunnelData(response.data.data);
        setErrors(prev => ({ ...prev, funnel: null }));
      }
    } catch (error) {
      console.error('Error fetching funnel:', error);
      setErrors(prev => ({ ...prev, funnel: error.message || 'Failed to load funnel data' }));
      toast.error('Failed to load funnel data');
    } finally {
      if (showRefreshing) {
        setRefreshingTab(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);
  
  // Fetch financial data
  const fetchFinancial = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingTab('financial');
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/project-performance/financial', config);
      if (response.data.success) {
        setFinancialData(response.data.data);
        setErrors(prev => ({ ...prev, financial: null }));
      }
    } catch (error) {
      console.error('Error fetching financial:', error);
      setErrors(prev => ({ ...prev, financial: error.message || 'Failed to load financial data' }));
      toast.error('Failed to load financial data');
    } finally {
      if (showRefreshing) {
        setRefreshingTab(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);
  
  // Fetch objectives data
  const fetchObjectives = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingTab('objectives');
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/project-performance/objectives', config);
      if (response.data.success) {
        setObjectivesData(response.data.data);
        setErrors(prev => ({ ...prev, objectives: null }));
      }
    } catch (error) {
      console.error('Error fetching objectives:', error);
      setErrors(prev => ({ ...prev, objectives: error.message || 'Failed to load objectives data' }));
      toast.error('Failed to load objectives data');
    } finally {
      if (showRefreshing) {
        setRefreshingTab(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);
  
  // Fetch team data
  const fetchTeam = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingTab('team');
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/project-performance/team', config);
      if (response.data.success) {
        setTeamData(response.data.data);
        setErrors(prev => ({ ...prev, team: null }));
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setErrors(prev => ({ ...prev, team: error.message || 'Failed to load team data' }));
      toast.error('Failed to load team data');
    } finally {
      if (showRefreshing) {
        setRefreshingTab(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);
  
  // Fetch queue data
  const fetchQueue = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingTab('queue');
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/project-performance/queue', config);
      if (response.data.success) {
        setQueueData(response.data.data);
        setErrors(prev => ({ ...prev, queue: null }));
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      setErrors(prev => ({ ...prev, queue: error.message || 'Failed to load queue data' }));
      toast.error('Failed to load queue data');
    } finally {
      if (showRefreshing) {
        setRefreshingTab(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);
  
  // Fetch data for a specific tab
  const fetchTabData = useCallback(async (tabName, showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshingTab(tabName);
    }
    
    try {
      switch (tabName) {
        case 'overview':
          await fetchOverview(showRefreshing);
          break;
        case 'funnel':
          await fetchFunnel(showRefreshing);
          break;
        case 'financial':
          await fetchFinancial(showRefreshing);
          break;
        case 'objectives':
          await fetchObjectives(showRefreshing);
          break;
        case 'team':
          await fetchTeam(showRefreshing);
          break;
        case 'queue':
          await fetchQueue(showRefreshing);
          break;
        default:
          break;
      }
      
      // Mark tab as loaded
      setLoadedTabs(prev => new Set([...prev, tabName]));
    } finally {
      if (showRefreshing) {
        setRefreshingTab(null);
      }
    }
  }, [fetchOverview, fetchFunnel, fetchFinancial, fetchObjectives, fetchTeam, fetchQueue]);
  
  // Fetch all data (for refresh all button)
  const fetchAllData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      await Promise.all([
        fetchOverview(showRefreshing),
        fetchFunnel(showRefreshing),
        fetchFinancial(showRefreshing),
        fetchObjectives(showRefreshing),
        fetchTeam(showRefreshing),
        fetchQueue(showRefreshing)
      ]);
      
      // Mark all tabs as loaded
      setLoadedTabs(new Set(['overview', 'funnel', 'financial', 'objectives', 'team', 'queue']));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchOverview, fetchFunnel, fetchFinancial, fetchObjectives, fetchTeam, fetchQueue]);
  
  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  
  // Initial load - only fetch accounts
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  
  // Load first tab (overview) on initial load - only once
  useEffect(() => {
    if (initialized && !loadedTabs.has('overview') && isInitialMount.current) {
      setLoading(true);
      fetchTabData('overview').finally(() => {
        setLoading(false);
        isInitialMount.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]); // Only depend on initialized, fetchTabData is stable
  
  // Load tab data when tab is clicked (lazy loading)
  useEffect(() => {
    if (initialized && activeTab && !loadedTabs.has(activeTab)) {
      fetchTabData(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Only depend on activeTab - other deps are stable or checked inside
  
  // Reload active tab data when account changes (only after initial mount)
  useEffect(() => {
    if (initialized && !isInitialMount.current && activeTab && loadedTabs.has(activeTab)) {
      fetchTabData(activeTab, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]); // Only depend on selectedAccount - other deps are stable or checked inside
  
  // Reload active tab data when GPC filter override changes (after initial load)
  // Use a ref to track previous override value to prevent unnecessary fetches
  const prevOverrideRef = useRef(override);
  useEffect(() => {
    // Only fetch if override actually changed and we're past initial mount
    if (initialized && !isInitialMount.current && activeTab && loadedTabs.has(activeTab) && prevOverrideRef.current !== override) {
      prevOverrideRef.current = override;
      fetchTabData(activeTab, true);
    } else if (prevOverrideRef.current !== override) {
      prevOverrideRef.current = override;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override]); // Only depend on override - other deps are stable or checked inside
  
  // Handle account change
  const handleAccountChange = (e) => {
    setSelectedAccount(e.target.value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchAllData(true);
    toast.success('Refreshing data...');
  };
  
  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="project-performance" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-container">
            <Loader className="spinning" size={24} />
            <p>Loading project performance data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="project-performance" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease' }}>
        <div className="project-performance-container">
          <div className="project-performance-header">
            <div className="header-content">
              <div className="header-left">
                <button
                  className="header-menu-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="page-title">Project Performance Dashboard</h1>
                  <p className="page-subtitle">Monitor project health, metrics, and performance analytics</p>
                </div>
              </div>
              <div className="header-right">
                <GPCFilterToggle />
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Project Performance Dashboard" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>
          
          <div className="project-performance-content">
            {/* Filters and Tabs */}
            <div className="dashboard-filters-tabs">
              {/* Tabs on Left */}
              <div className="tabs-section-left">
                <div className="dashboard-tabs">
                  <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'funnel' ? 'active' : ''}`}
                    onClick={() => setActiveTab('funnel')}
                  >
                    Funnel
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
                    onClick={() => setActiveTab('financial')}
                  >
                    Financial
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'objectives' ? 'active' : ''}`}
                    onClick={() => setActiveTab('objectives')}
                  >
                    Objectives
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
                    onClick={() => setActiveTab('team')}
                  >
                    Team
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queue')}
                  >
                    Queue
                  </button>
                </div>
              </div>
              
              {/* Account Filter in Center */}
              <div className="filter-section-center">
                <label htmlFor="account-filter">Filter by Account:</label>
                <select
                  id="account-filter"
                  value={selectedAccount}
                  onChange={handleAccountChange}
                  className="account-filter-select"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map(account => (
                    <option key={account} value={account}>{account}</option>
                  ))}
                </select>
              </div>
              
              {/* Refresh Button on Right */}
              <div className="refresh-section-right">
                <button 
                  className="btn-action" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh all data"
                >
                  {refreshing ? <Loader size={16} className="spinning" /> : <RefreshCw size={16} />}
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <OverviewCards 
                  data={overviewData} 
                  error={errors.overview}
                  onRefresh={() => fetchOverview(true)}
                  refreshing={refreshingTab === 'overview'}
                />
              )}
              
              {activeTab === 'funnel' && (
                <FunnelChart 
                  data={funnelData} 
                  error={errors.funnel}
                  onRefresh={() => fetchFunnel(true)}
                  refreshing={refreshingTab === 'funnel'}
                />
              )}
              
              {activeTab === 'financial' && (
                <FinancialChart 
                  data={financialData} 
                  error={errors.financial}
                  onRefresh={() => fetchFinancial(true)}
                  refreshing={refreshingTab === 'financial'}
                />
              )}
              
              {activeTab === 'objectives' && (
                <ObjectiveChart 
                  data={objectivesData} 
                  error={errors.objectives}
                  onRefresh={() => fetchObjectives(true)}
                  refreshing={refreshingTab === 'objectives'}
                />
              )}
              
              {activeTab === 'team' && (
                <TeamChart 
                  data={teamData} 
                  error={errors.team}
                  onRefresh={() => fetchTeam(true)}
                  refreshing={refreshingTab === 'team'}
                />
              )}
              
              {activeTab === 'queue' && (
                <QueueChart 
                  data={queueData} 
                  error={errors.queue}
                  onRefresh={() => fetchQueue(true)}
                  refreshing={refreshingTab === 'queue'}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPerformance;

