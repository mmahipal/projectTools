import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useAuth } from '../context/AuthContext'; // Unused
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../components/BookmarkButton';
import { useGPCFilter } from '../context/GPCFilterContext';
import { applyGPCFilterToConfig } from '../utils/gpcFilter';
import GPCFilterToggle from '../components/GPCFilter/GPCFilterToggle';
import ActiveProjectObjectivesByQualStepTable from '../components/ActiveProjectObjectivesByQualStep/ActiveProjectObjectivesByQualStepTable';
import '../styles/ActiveProjectObjectivesByQualStep.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const ActiveProjectObjectivesByQualStep = () => {
  // const { user, logout } = useAuth(); // Unused - kept for potential future use
  const { getFilterParams } = useGPCFilter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const infiniteScrollRef = useRef(null);
  const tableContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const searchTimeoutRef = useRef(null);

  const LIMIT = 1000; // Records per page

  // Track initial mount to prevent duplicate fetches
  const isInitialMountRef = useRef(true);

  // Define fetchData BEFORE useEffect hooks that use it
  const fetchData = useCallback(async (currentOffset = 0, append = false, search = '') => {
    if (append) {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    } else {
      setLoading(true);
    }
    
    try {
      const params = {
        limit: LIMIT,
        offset: currentOffset
      };
      
      // Add search parameter if provided
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      // Apply GPC-Filter - ensure we have a function to call
      let gpcFilterParams = {};
      if (typeof getFilterParams === 'function') {
        try {
          gpcFilterParams = getFilterParams();
        } catch (error) {
          // If getFilterParams fails, continue without filters
          gpcFilterParams = {};
        }
      }
      
      const config = applyGPCFilterToConfig({
        timeout: 300000, // 5 minutes
        params
      }, gpcFilterParams);
      
      const response = await apiClient.get('/active-project-objectives-by-qual-step', config);
      if (response.data.success) {
        const newData = response.data.data || [];
        
        // Deduplicate data by qualStepId to prevent duplicates
        if (append) {
          setData(prev => {
            const existingIds = new Set(prev.map(item => item.qualStepId));
            const uniqueNewData = newData.filter(item => item.qualStepId && !existingIds.has(item.qualStepId));
            if (uniqueNewData.length < newData.length) {
              console.warn(`[Active Project Objectives by Qual Step] Filtered out ${newData.length - uniqueNewData.length} duplicate qualification step(s) during append`);
            }
            return [...prev, ...uniqueNewData];
          });
        } else {
          // Deduplicate even on initial load
          const seenIds = new Set();
          const uniqueData = newData.filter(item => {
            if (!item.qualStepId) return true; // Keep items without IDs
            if (seenIds.has(item.qualStepId)) {
              console.warn(`[Active Project Objectives by Qual Step] Duplicate record detected during reset: ${item.qualStepId}`);
              return false;
            }
            seenIds.add(item.qualStepId);
            return true;
          });
          if (uniqueData.length < newData.length) {
            console.warn(`[Active Project Objectives by Qual Step] Deduplication: ${newData.length} records received, ${uniqueData.length} unique records after filtering`);
          }
          setData(uniqueData);
        }
        setHasMore(response.data.hasMore || false);
        hasMoreRef.current = response.data.hasMore || false;
        setOffset(currentOffset + newData.length);
        // Only update totalCount if it's provided (first page) or if we don't have one yet
        if (response.data.total !== null && response.data.total !== undefined) {
          setTotalCount(response.data.total);
        }
        
        if (response.data.totalProcessed) {
        }
      } else {
        toast.error(response.data.error || 'Failed to fetch Active Project Objectives by Qual Step data');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The dataset is large. Try refreshing or contact support.');
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Active Project Objectives by Qual Step data';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
    }
  }, [LIMIT, getFilterParams]);

  // Initial load - only runs once on mount
  useEffect(() => {
    let isMounted = true;
    isInitialMountRef.current = true;
    
    const performInitialFetch = async () => {
      // Small delay to ensure all contexts are initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) return;
      
      // Call fetchData directly to ensure it runs
      try {
        setLoading(true);
        
        const params = {
          limit: LIMIT,
          offset: 0
        };
        
        // Get filter params - ensure we have a function to call
        let gpcFilterParams = {};
        if (typeof getFilterParams === 'function') {
          try {
            gpcFilterParams = getFilterParams();
          } catch (error) {
            gpcFilterParams = {};
          }
        }
        
        const config = applyGPCFilterToConfig({
          timeout: 300000,
          params
        }, gpcFilterParams);
        
        const response = await apiClient.get('/active-project-objectives-by-qual-step', config);
        
        if (!isMounted) return;
        
        if (response.data.success) {
          const newData = response.data.data || [];
          
          // Deduplicate data by qualStepId to prevent duplicates
          const seenIds = new Set();
          const uniqueData = newData.filter(item => {
            if (!item.qualStepId) return true; // Keep items without IDs
            if (seenIds.has(item.qualStepId)) {
              return false;
            }
            seenIds.add(item.qualStepId);
            return true;
          });
          
          setData(uniqueData);
          setHasMore(response.data.hasMore || false);
          hasMoreRef.current = response.data.hasMore || false;
          setOffset(newData.length);
          if (response.data.total !== null && response.data.total !== undefined) {
            setTotalCount(response.data.total);
          }
        } else {
          toast.error(response.data.error || 'Failed to fetch Active Project Objectives by Qual Step data');
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          toast.error('Request timed out. The dataset is large. Try refreshing or contact support.');
        } else {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Active Project Objectives by Qual Step data';
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
          loadingMoreRef.current = false;
          // Mark initial mount as complete
          isInitialMountRef.current = false;
        }
      }
    };
    
    performInitialFetch();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  const loadMoreData = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) {
      return;
    }
    fetchData(offset, true, debouncedSearchTerm);
  }, [offset, debouncedSearchTerm, fetchData]);

  // Set up IntersectionObserver for infinite scroll
  useEffect(() => {
    const element = infiniteScrollRef.current;
    if (!element || !hasMore || loadingMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadMoreData();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, loadMoreData]);

  const handleRefresh = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    setTotalCount(null);
    hasMoreRef.current = true;
    fetchData(0, false, debouncedSearchTerm).finally(() => {
      setRefreshing(false);
    });
  }, [debouncedSearchTerm, fetchData]);

  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ marginLeft: `${sidebarWidth}px`, width: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 80px)', transition: 'margin-left 0.3s ease' }}>
        <div className="active-project-objectives-by-qual-step-container">
          <div className="active-project-objectives-by-qual-step-header">
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
                  <h1 className="page-title">Active Project Objectives by Qualification Step</h1>
                  <p className="page-subtitle">View project objectives (non-closed) for each Qualification Step</p>
                </div>
              </div>
              <div className="header-right">
                <GPCFilterToggle />
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Active Project Objectives by Qualification Step" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          <div className="active-project-objectives-by-qual-step-content">
            <div className="active-project-objectives-by-qual-step-main-content">
              <ActiveProjectObjectivesByQualStepTable 
                data={data}
                loading={loading}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                loadingMore={loadingMore}
                hasMore={hasMore}
                totalCount={totalCount}
                infiniteScrollRef={infiniteScrollRef}
                tableContainerRef={tableContainerRef}
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

export default ActiveProjectObjectivesByQualStep;

