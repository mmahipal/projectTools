import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, RefreshCw, Loader, Search } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../components/BookmarkButton';
import OnboardingContributorsTable from '../components/OnboardingContributors/OnboardingContributorsTable';
import '../styles/OnboardingContributors.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const OnboardingContributors = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(true);
  const [contributors, setContributors] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState([
    'Name',
    'Email',
    'Contributor_Type__c',
    'Gender__c',
    'Source_Details__c',
    'MailingCountry'
  ]);

  // Track initial mount to prevent duplicate fetches
  const isInitialMountRef = useRef(true);
  const prevSearchTermRef = useRef('');

  // Initial load - only runs once on mount
  useEffect(() => {
    isInitialMountRef.current = true;
    fetchContributors();
    fetchAvailableFields();
    // Mark initial mount as complete after a short delay to allow debounce to settle
    const initTimer = setTimeout(() => {
      isInitialMountRef.current = false;
      prevSearchTermRef.current = searchTerm;
    }, 600); // Slightly longer than debounce delay
    
    return () => clearTimeout(initTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Skip on initial mount - initial load is handled separately
    if (isInitialMountRef.current) {
      return;
    }
    
    // Check if search term actually changed
    if (prevSearchTermRef.current === debouncedSearchTerm) {
      return; // No actual change, skip fetch
    }
    
    // Update ref immediately to prevent duplicate checks
    prevSearchTermRef.current = debouncedSearchTerm;
    
    // Reset and fetch when debounced search term changes
    setOffset(0);
    setContributors([]);
    fetchContributors(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const fetchAvailableFields = async () => {
    try {
      const response = await apiClient.get('/onboarding-contributors/fields');
      if (response.data.success) {
        setAvailableFields(response.data.fields || []);
      }
    } catch (error) {
      console.error('Error fetching available fields:', error);
    }
  };

  const fetchContributors = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    }
    
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams();
      params.append('limit', '1000');
      params.append('offset', currentOffset.toString());
      params.append('orderBy', 'CreatedDate');
      params.append('orderDirection', 'DESC');
      
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }
      
      // Use extended timeout for this endpoint (5 minutes)
      const response = await apiClient.get(`/onboarding-contributors/contributors?${params.toString()}`, {
        timeout: 300000, // 5 minutes
        // Add headers to help with proxy timeouts
        headers: {
          'Connection': 'keep-alive'
        }
      });
      if (response.data.success) {
        if (reset) {
          setContributors(response.data.contributors || []);
        } else {
          setContributors(prev => [...prev, ...(response.data.contributors || [])]);
        }
        setHasMore(response.data.hasMore || false);
        setOffset(currentOffset + (response.data.contributors?.length || 0));
      } else {
        toast.error(response.data.error || 'Failed to fetch Onboarding Contributors');
      }
    } catch (error) {
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.response?.status === 504 || error.response?.data?.timeout) {
        toast.error('Request timed out. The query is taking too long. Please try with a smaller limit or add search filters.', {
          duration: 5000
        });
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Onboarding Contributors';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offset, debouncedSearchTerm]);

  const handleRefresh = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRefreshing(true);
    setOffset(0);
    setContributors([]);
    fetchContributors(true).finally(() => {
      setRefreshing(false);
    });
  }, [fetchContributors]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchContributors(false);
    }
  }, [loading, hasMore, fetchContributors]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleColumnSelect = (columns) => {
    setSelectedColumns(columns);
  };

  if (loading && contributors.length === 0) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease', transition: 'margin-left 0.3s ease', width: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 80px)' }}>
          <div className="onboarding-contributors-container">
            <div className="onboarding-contributors-header">
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
                    <h1 className="page-title">Onboarding Contributors</h1>
                    <p className="page-subtitle">View and manage contributors in onboarding status</p>
                  </div>
                </div>
                <div className="header-user-profile">
                  <BookmarkButton pageName="Onboarding Contributors" pageType="page" />
                  <UserProfileDropdown />
                </div>
              </div>
            </div>
            <div className="loading-container">
              <Loader className="spinning" size={24} />
              <p>Loading onboarding contributors...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease', transition: 'margin-left 0.3s ease', width: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 80px)' }}>
        <div className="onboarding-contributors-container">
          <div className="onboarding-contributors-header">
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
                  <h1 className="page-title">Onboarding Contributors</h1>
                  <p className="page-subtitle">View and manage contributors in onboarding status</p>
                </div>
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Onboarding Contributors" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          <div className="onboarding-contributors-content">
            <div className="onboarding-contributors-main-content">
              <OnboardingContributorsTable
                contributors={contributors}
                loading={loading}
                refreshing={refreshing}
                availableFields={availableFields}
                selectedColumns={selectedColumns}
                onColumnSelect={handleColumnSelect}
                onRefresh={handleRefresh}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingContributors;

