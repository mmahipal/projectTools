import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { useGPCFilter } from '../context/GPCFilterContext';
import { applyGPCFilterToConfig } from '../utils/gpcFilter';
import GPCFilterToggle from '../components/GPCFilter/GPCFilterToggle';
import ActiveContributorsByProjectTable from '../components/ActiveContributorsByProject/ActiveContributorsByProjectTable';
import '../styles/ActiveContributorsByProject.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const ActiveContributorsByProject = () => {
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
  const infiniteScrollRef = useRef(null);
  const tableContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const LIMIT = 1000; // Records per page

  const fetchData = useCallback(async (currentOffset = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    } else {
      setLoading(true);
    }
    
    try {
      // Get filter params - ensure we have a function to call
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
        params: {
          limit: LIMIT,
          offset: currentOffset
        }
      }, gpcFilterParams);
      
      const response = await apiClient.get('/active-contributors-by-project', config);
      if (response.data.success) {
        const newData = response.data.data || [];
        if (append) {
          setData(prev => [...prev, ...newData]);
        } else {
          setData(newData);
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
        toast.error(response.data.error || 'Failed to fetch Active Contributors by Project data');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The dataset is large. Try refreshing or contact support.');
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Active Contributors by Project data';
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
    
    const performInitialFetch = async () => {
      // Small delay to ensure all contexts are initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) return;
      
      // Call fetchData directly to ensure it runs
      try {
        setLoading(true);
        
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
          params: {
            limit: LIMIT,
            offset: 0
          }
        }, gpcFilterParams);
        
        const response = await apiClient.get('/active-contributors-by-project', config);
        
        if (!isMounted) return;
        
        if (response.data.success) {
          const newData = response.data.data || [];
          setData(newData);
          setHasMore(response.data.hasMore || false);
          hasMoreRef.current = response.data.hasMore || false;
          setOffset(newData.length);
          if (response.data.total !== null && response.data.total !== undefined) {
            setTotalCount(response.data.total);
          }
        } else {
          toast.error(response.data.error || 'Failed to fetch Active Contributors by Project data');
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          toast.error('Request timed out. The dataset is large. Try refreshing or contact support.');
        } else {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Active Contributors by Project data';
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
          loadingMoreRef.current = false;
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
    fetchData(offset, true);
  }, [offset, fetchData]);

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
    setTotalCount(null); // Reset totalCount on refresh to get fresh count
    hasMoreRef.current = true;
    fetchData(0, false).finally(() => {
      setRefreshing(false);
    });
  }, [fetchData]);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ marginLeft: `${sidebarWidth}px`, width: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 80px)', transition: 'margin-left 0.3s ease' }}>
        <div className="active-contributors-by-project-container">
          <div className="active-contributors-by-project-header">
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
                  <h1 className="page-title">Active Contributors by Project</h1>
                  <p className="page-subtitle">View active contributors for each Project Objective</p>
                </div>
              </div>
              <div className="header-right">
                <GPCFilterToggle />
              </div>
              <div className="header-user-profile">
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          <div className="active-contributors-by-project-content">
            <div className="active-contributors-by-project-main-content">
              <ActiveContributorsByProjectTable 
                data={data}
                loading={loading}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                loadingMore={loadingMore}
                hasMore={hasMore}
                totalCount={totalCount}
                infiniteScrollRef={infiniteScrollRef}
                tableContainerRef={tableContainerRef}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveContributorsByProject;

