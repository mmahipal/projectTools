import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, RefreshCw, Loader, Filter } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../components/BookmarkButton';
import MFALogTable from '../components/MFAVerificationLogs/MFALogTable';
import MFALogFilterBuilder from '../components/MFAVerificationLogs/MFALogFilterBuilder';
import '../styles/MFAVerificationLogs.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const MFAVerificationLogs = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchAvailableFields();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use refs to prevent multiple simultaneous fetches and track previous values
  const isFetchingRef = useRef(false);
  const prevFiltersRef = useRef(JSON.stringify(filters));
  const prevSearchTermRef = useRef(debouncedSearchTerm);
  const isInitialMountRef = useRef(true);
  
  useEffect(() => {
    // Skip on initial mount - let the initial useEffect handle the first fetch
    if (isInitialMountRef.current) {
      // Mark initial mount as complete after debounce settles
      const initTimer = setTimeout(() => {
        isInitialMountRef.current = false;
        prevFiltersRef.current = JSON.stringify(filters);
        prevSearchTermRef.current = debouncedSearchTerm;
      }, 600); // Slightly longer than debounce delay (500ms)
      
      return () => clearTimeout(initTimer);
    }
    
    // Check if filters or search term actually changed
    const currentFiltersStr = JSON.stringify(filters);
    const filtersChanged = prevFiltersRef.current !== currentFiltersStr;
    const searchTermChanged = prevSearchTermRef.current !== debouncedSearchTerm;
    
    if (!filtersChanged && !searchTermChanged) {
      return; // No actual change, skip fetch
    }
    
    // Update refs immediately to prevent duplicate checks
    prevFiltersRef.current = currentFiltersStr;
    prevSearchTermRef.current = debouncedSearchTerm;
    
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    
    // Use setTimeout to batch state updates and prevent multiple renders
    const timeoutId = setTimeout(() => {
      fetchLogs().finally(() => {
        isFetchingRef.current = false;
      });
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      // Don't reset isFetchingRef in cleanup - let the fetch complete
    };
  }, [filters, debouncedSearchTerm]); // Removed fetchLogs from dependencies

  const fetchAvailableFields = async () => {
    try {
      const response = await apiClient.get('/mfa-verification-logs/fields');
      if (response.data.success) {
        setAvailableFields(response.data.fields || []);
      }
    } catch (error) {
      console.error('Error fetching available fields:', error);
    }
  };

  // Use refs to track current filter and search values to avoid dependency issues
  const filtersRef = useRef(filters);
  const debouncedSearchTermRef = useRef(debouncedSearchTerm);
  
  // Update refs when values change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  useEffect(() => {
    debouncedSearchTermRef.current = debouncedSearchTerm;
  }, [debouncedSearchTerm]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('orderBy', 'CreatedDate');
      params.append('orderDirection', 'DESC');
      
      // Use refs to get current values without causing dependency issues
      const currentFilters = filtersRef.current;
      const currentSearchTerm = debouncedSearchTermRef.current;
      
      if (currentFilters.length > 0) {
        // Validate and format filters before sending
        const validFilters = currentFilters.filter(f => f.field && f.operator && (f.value !== '' || f.operator === 'isEmpty' || f.operator === 'isNotEmpty'));
        if (validFilters.length > 0) {
          params.append('filters', JSON.stringify(validFilters));
        }
      }
      
      if (currentSearchTerm && currentSearchTerm.trim()) {
        params.append('search', currentSearchTerm.trim());
      }
      
      const response = await apiClient.get(`/mfa-verification-logs/logs?${params.toString()}`);
      if (response.data.success) {
        setLogs(response.data.logs || []);
      } else {
        toast.error(response.data.error || 'Failed to fetch MFA Verification Logs');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch MFA Verification Logs';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Removed filters and debouncedSearchTerm from dependencies

  const handleRefresh = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRefreshing(true);
    fetchLogs().finally(() => {
      setRefreshing(false);
    });
  }, []); // Removed fetchLogs from dependencies - it's stable now

  const handleFilterSubmit = async (newFilters) => {
    // Use functional update to ensure we're using the latest state
    setFilters(prevFilters => {
      // Only update if filters actually changed to prevent unnecessary re-renders
      const filtersChanged = JSON.stringify(prevFilters) !== JSON.stringify(newFilters);
      if (!filtersChanged) {
        return prevFilters;
      }
      return newFilters;
    });
    setShowFilters(false);
    // Don't explicitly fetch - useEffect will handle it
  };

  const handleClearFilters = async () => {
    setFilters(prevFilters => {
      // Only update if filters actually changed
      if (prevFilters.length === 0) {
        return prevFilters;
      }
      return [];
    });
    setShowFilters(false);
    // Don't explicitly fetch - useEffect will handle it
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease', transition: 'margin-left 0.3s ease', width: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 80px)' }}>
        <div className="mfa-verification-logs-container">
          <div className="mfa-verification-logs-header">
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
                  <h1 className="page-title">MFA Verification Logs</h1>
                  <p className="page-subtitle">View and manage MFA verification logs from Salesforce</p>
                </div>
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="MFA Verification Logs" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          <div className="mfa-verification-logs-content">
            <div className="mfa-verification-logs-main-content">
              <div className="mfa-verification-logs-actions">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="btn-action"
                  title="Refresh logs"
                >
                  {refreshing ? <Loader size={16} className="spinning" /> : <RefreshCw size={16} />}
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-action ${showFilters ? 'active' : ''}`}
                  title="Filter logs"
                >
                  <Filter size={16} />
                  <span>Filter</span>
                  {filters.length > 0 && (
                    <span className="action-badge">{filters.length}</span>
                  )}
                </button>
              </div>

              {showFilters && (
                <MFALogFilterBuilder
                  availableFields={availableFields}
                  filters={filters}
                  onSubmit={handleFilterSubmit}
                  onClear={handleClearFilters}
                  onClose={() => setShowFilters(false)}
                />
              )}

              <MFALogTable 
                logs={logs}
                loading={loading}
                availableFields={availableFields}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerificationLogs;

