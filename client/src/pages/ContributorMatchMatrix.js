import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Menu, Loader } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../components/BookmarkButton';
import ContributorMatchMatrixTable from '../components/ContributorMatchMatrix/ContributorMatchMatrixTable';
import ContributorMatchMatrixFilterBuilder from '../components/ContributorMatchMatrix/ContributorMatchMatrixFilterBuilder';
import ObjectViewModal from '../components/ClientToolAccount/ObjectViewModal';
import useSidebarWidth from '../hooks/useSidebarWidth';
import '../styles/ContributorMatchMatrix.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const ContributorMatchMatrix = () => {
  // const { user, logout } = useAuth(); // Unused - kept for potential future use
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'Contributor_Project',
    'Full_Match',
    'Five_Core_Match',
    'Country_Match',
    'Language_Match',
    'Work_Type_Match'
  ]);
  const [matchingFields, setMatchingFields] = useState([]);
  const tableContainerRef = useRef(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalObjectId, setViewModalObjectId] = useState(null);
  const [viewModalObjectName, setViewModalObjectName] = useState(null);

  // Memoize fetchAvailableFields to prevent unnecessary re-renders
  const fetchAvailableFieldsMemo = useCallback(async () => {
    try {
      const response = await apiClient.get('/contributor-match-matrix/fields');
      if (response.data.success) {
        const fields = response.data.fields || [];
        setAvailableFields(fields);
        setMatchingFields(fields);
      }
    } catch (error) {
      console.error('Error fetching available fields:', error);
    }
  }, []);

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

  // Define fetchRecords BEFORE useEffect hooks that use it
  // Removed offset from dependencies to prevent unnecessary recreations
  const fetchRecords = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      const currentOffset = reset ? 0 : offset;
      params.append('offset', currentOffset.toString());
      params.append('limit', '1000');
      
      // Use refs to get current values without causing dependency issues
      const currentSearchTerm = debouncedSearchTermRef.current;
      const currentFilters = filtersRef.current;
      
      if (currentSearchTerm && currentSearchTerm.trim()) {
        params.append('search', currentSearchTerm.trim());
      }
      
      if (Object.keys(currentFilters).length > 0) {
        params.append('filters', JSON.stringify(currentFilters));
      }
      
      const response = await apiClient.get(`/contributor-match-matrix?${params.toString()}`);
      if (response.data.success) {
        if (reset) {
          setRecords(response.data.records || []);
          setOffset(response.data.records?.length || 0);
        } else {
          setRecords(prev => [...prev, ...(response.data.records || [])]);
          setOffset(prev => prev + (response.data.records?.length || 0));
        }
        setHasMore(response.data.hasMore || false);
        if (response.data.matchingFields) {
          setMatchingFields(response.data.matchingFields);
        }
      } else {
        toast.error(response.data.error || 'Failed to fetch Contributor Match Matrix data');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Contributor Match Matrix data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [offset]); // Removed filters and debouncedSearchTerm from dependencies

  // Track initial mount to prevent duplicate fetches
  const isInitialMountRef = useRef(true);
  const isFetchingRef = useRef(false);
  const prevFiltersRef = useRef(JSON.stringify(filters));
  const prevSearchTermRef = useRef(debouncedSearchTerm);

  // Initial load - only runs once on mount
  useEffect(() => {
    isInitialMountRef.current = true;
    fetchRecords(true);
    fetchAvailableFieldsMemo();
    // Mark initial mount as complete after a short delay to allow debounce to settle
    const initTimer = setTimeout(() => {
      isInitialMountRef.current = false;
      prevFiltersRef.current = JSON.stringify(filters);
      prevSearchTermRef.current = debouncedSearchTerm;
    }, 600); // Slightly longer than debounce delay
    
    return () => clearTimeout(initTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Reset and fetch when filters or search term changes (but not on initial mount)
  useEffect(() => {
    // Skip on initial mount - initial load is handled separately
    if (isInitialMountRef.current) {
      return;
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
    setOffset(0);
    setRecords([]);
    setHasMore(true);
    
    // Use setTimeout to batch state updates and prevent multiple renders
    const timeoutId = setTimeout(() => {
      fetchRecords(true).finally(() => {
        isFetchingRef.current = false;
      });
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      // Don't reset isFetchingRef in cleanup - let the fetch complete
    };
  }, [filters, debouncedSearchTerm]); // Removed fetchRecords from dependencies

  const handleRefresh = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRefreshing(true);
    setOffset(0);
    setRecords([]);
    setHasMore(true);
    fetchRecords(true).finally(() => {
      setRefreshing(false);
    });
  }, []); // Removed fetchRecords from dependencies - it's stable now

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
  };

  const handleClearFilters = async () => {
    setFilters({});
    setShowFilters(false);
  };

  const handleContributorProjectClick = (contributorProjectId, contributorProjectName) => {
    if (contributorProjectId) {
      setViewModalObjectId(contributorProjectId);
      setViewModalObjectName(contributorProjectName || 'Contributor Project');
      setShowViewModal(true);
    }
  };

  // Infinite scroll - attach to scroll wrapper
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || !hasMore || loadingMore) return;

    // Find the scroll wrapper element inside the container
    const scrollWrapper = container.querySelector('.case-table-scroll-wrapper');
    if (!scrollWrapper) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollWrapper;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        fetchRecords(false);
      }
    };

    scrollWrapper.addEventListener('scroll', handleScroll);
    return () => scrollWrapper.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore]); // Removed fetchRecords from dependencies

  if (loading && records.length === 0) {
    const currentSidebarWidth = sidebarOpen ? sidebarWidth : 80;
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div 
          className="contributor-match-matrix-loading-wrapper" 
          style={{ 
            marginLeft: `${currentSidebarWidth}px`, 
            width: `calc(100% - ${currentSidebarWidth}px)`,
            left: `${currentSidebarWidth}px`,
            zIndex: 1
          }}
        >
          <div className="contributor-match-matrix-loading-content">
            <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
            <p style={{ color: '#666', fontSize: '14px', margin: 0, fontFamily: 'Poppins' }}>Loading Contributor Match Matrix data...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentSidebarWidth = sidebarOpen ? sidebarWidth : 80;
  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ 
        marginLeft: `${currentSidebarWidth}px`, 
        transition: 'margin-left 0.3s ease, width 0.3s ease', 
        width: `calc(100% - ${currentSidebarWidth}px)` 
      }} className="contributor-match-matrix-main-wrapper">
        <div className="contributor-match-matrix-container">
          <div className="contributor-match-matrix-header">
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
                  <h1 className="page-title">Contributor Match Matrix</h1>
                  <p className="page-subtitle">View contributor matching status across projects</p>
                </div>
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Contributor Match Matrix" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          <div className="contributor-match-matrix-content">
            <div className="contributor-match-matrix-main-content">
              {showFilters && (
                <ContributorMatchMatrixFilterBuilder
                  availableFields={availableFields}
                  filters={filters}
                  onSubmit={handleFilterSubmit}
                  onClear={handleClearFilters}
                  onClose={() => setShowFilters(false)}
                />
              )}

              <ContributorMatchMatrixTable 
                records={records}
                loading={loading}
                loadingMore={loadingMore}
                availableFields={availableFields}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedColumns={selectedColumns}
                onColumnChange={setSelectedColumns}
                matchingFields={matchingFields}
                tableContainerRef={tableContainerRef}
                hasMore={hasMore}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filters={filters}
                onContributorProjectClick={handleContributorProjectClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Object View Modal */}
      <ObjectViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewModalObjectId(null);
          setViewModalObjectName(null);
        }}
        objectType="Contributor_Project__c"
        objectId={viewModalObjectId}
        objectName={viewModalObjectName}
        readOnly={true}
      />
    </div>
  );
};

export default ContributorMatchMatrix;

