import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, RefreshCw, Loader } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import toast from 'react-hot-toast';
import apiClient from '../config/api';
import { useGPCFilter } from '../context/GPCFilterContext';
import { applyGPCFilterToConfig } from '../utils/gpcFilter';
import GPCFilterToggle from '../components/GPCFilter/GPCFilterToggle';
import BookmarkButton from '../components/BookmarkButton';
import OverviewCards from './ContributorTimeStatus/components/OverviewCards';
import TimeInStatusChart from './ContributorTimeStatus/components/TimeInStatusChart';
import StatusDistributionChart from './ContributorTimeStatus/components/StatusDistributionChart';
import StatusTimelineTable from './ContributorTimeStatus/components/StatusTimelineTable';
import BottleneckAnalysis from './ContributorTimeStatus/components/BottleneckAnalysis';
import StatusTransitionChart from './ContributorTimeStatus/components/StatusTransitionChart';
import '../styles/ContributorTimeStatusDashboard.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const ContributorTimeStatusDashboard = () => {
  const { user, logout } = useAuth();
  const { getFilterParams } = useGPCFilter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccount] = useState('all'); // Keep for API calls but don't show filter
  const [, setAccounts] = useState([]); // Keep for potential future use
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [bottleneckData, setBottleneckData] = useState(null);
  const [transitionData, setTransitionData] = useState(null);
  
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
      setRefreshing(true);
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/contributor-time-status/overview', config);
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
        setRefreshing(false);
      }
    }
  }, [selectedAccount]);
  
  // Fetch timeline data
  const fetchTimeline = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params: { ...params, limit: 100, offset: 0 }, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/contributor-time-status/timeline', config);
      if (response.data.success) {
        setTimelineData(response.data);
        setErrors(prev => ({ ...prev, timeline: null }));
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setErrors(prev => ({ ...prev, timeline: error.message || 'Failed to load timeline data' }));
      toast.error('Failed to load timeline data');
    } finally {
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  }, [selectedAccount]);
  
  // Fetch bottleneck data
  const fetchBottlenecks = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params: { ...params, minDays: 0 }, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/contributor-time-status/bottlenecks', config);
      if (response.data.success) {
        setBottleneckData(response.data.data);
        setErrors(prev => ({ ...prev, bottlenecks: null }));
      }
    } catch (error) {
      console.error('Error fetching bottlenecks:', error);
      setErrors(prev => ({ ...prev, bottlenecks: error.message || 'Failed to load bottleneck data' }));
      toast.error('Failed to load bottleneck data');
    } finally {
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  }, [selectedAccount]);
  
  // Fetch transition data
  const fetchTransitions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    }
    try {
      const params = selectedAccount !== 'all' ? { account: selectedAccount } : {};
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params: { ...params }, timeout: 300000 }, gpcFilterParams);
      const response = await apiClient.get('/contributor-time-status/transitions', config);
      if (response.data.success) {
        setTransitionData(response.data.data);
        setErrors(prev => ({ ...prev, transitions: null }));
      }
    } catch (error) {
      console.error('Error fetching transitions:', error);
      setErrors(prev => ({ ...prev, transitions: error.message || 'Failed to load transition data' }));
      toast.error('Failed to load transition data');
    } finally {
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  }, [selectedAccount]);
  
  // Load all data
  const loadAllData = useCallback(async (showRefreshing = false) => {
    await Promise.all([
      fetchOverview(showRefreshing),
      fetchTimeline(showRefreshing),
      fetchBottlenecks(showRefreshing),
      fetchTransitions(showRefreshing)
    ]);
    if (!showRefreshing) {
      setLoading(false);
    }
  }, [fetchOverview, fetchTimeline, fetchBottlenecks, fetchTransitions]);
  
  // Initial load
  useEffect(() => {
    fetchAccounts();
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Reload when account changes
  useEffect(() => {
    if (!loading) {
      loadAllData(true);
    }
  }, [selectedAccount]);
  
  // Handle refresh
  const handleRefresh = () => {
    loadAllData(true);
  };
  
  return (
    <div className="contributor-time-status-dashboard">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div 
        className="dashboard-content"
        style={{ 
          marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease',
          width: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 80px)'
        }}
      >
        <div className="contributor-time-status-container">
          {/* Header */}
          <div className="contributor-time-status-header">
            <div className="header-content">
              <div className="header-left">
                <button
                  className="header-menu-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="page-title">Contributor Time Through Status</h1>
                  <p className="page-subtitle">Track time spent by contributors in each status</p>
                </div>
              </div>
              <div className="header-right">
                <GPCFilterToggle />
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Contributor Time Through Status" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="dashboard-loading">
              <Loader size={32} className="spinning" />
              <p>Loading contributor time status data...</p>
            </div>
          )}
          
          {/* Content */}
          {!loading && (
            <div className="dashboard-content-area">
              {/* Actions */}
              <div className="dashboard-actions">
                <button
                  className="btn-action"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh all data"
                >
                  {refreshing ? <Loader size={16} className="spinning" /> : <RefreshCw size={16} />}
                  <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
                </button>
              </div>
              
              {/* Overview Cards */}
              {overviewData && (
                <OverviewCards 
                  data={overviewData}
                  error={errors.overview}
                />
              )}
              
              {/* Charts Row */}
              <div className="charts-row">
                <div className="chart-container">
                  {overviewData && (
                    <TimeInStatusChart 
                      data={overviewData.averageTimeByStatus}
                      error={errors.overview}
                    />
                  )}
                </div>
                <div className="chart-container">
                  {overviewData && (
                    <StatusDistributionChart 
                      data={overviewData.totalTimeDistribution}
                      error={errors.overview}
                    />
                  )}
                </div>
              </div>
              
              {/* Status Transitions */}
              {transitionData && (
                <div className="transitions-section">
                  <StatusTransitionChart 
                    data={transitionData}
                    error={errors.transitions}
                  />
                </div>
              )}
              
              {/* Bottleneck Analysis */}
              {bottleneckData && (
                <div className="bottlenecks-section">
                  <BottleneckAnalysis 
                    data={bottleneckData}
                    error={errors.bottlenecks}
                  />
                </div>
              )}
              
              {/* Timeline Table */}
              {timelineData && (
                <div className="timeline-section">
                  <StatusTimelineTable 
                    data={timelineData}
                    error={errors.timeline}
                    onRefresh={fetchTimeline}
                    selectedAccount={selectedAccount}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributorTimeStatusDashboard;

