import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, LogOut, RefreshCw, Loader } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import ProjectRosterFunnelTable from '../components/ProjectRosterFunnel/ProjectRosterFunnelTable';
import '../styles/ProjectRosterFunnel.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const ProjectRosterFunnel = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(null); // Initialize as null, not 0
  const infiniteScrollRef = useRef(null);
  const tableContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const LIMIT = 500; // Records per page

  useEffect(() => {
    fetchData(0, false); // Initial load
  }, []);

  const fetchData = useCallback(async (currentOffset = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    } else {
      setLoading(true);
    }
    
    try {
      // Use extended timeout for this endpoint (5 minutes)
      const response = await apiClient.get('/project-roster-funnel', {
        timeout: 300000, // 5 minutes
        params: {
          limit: LIMIT,
          offset: currentOffset
        }
      });
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
          console.log(`Loaded ${response.data.totalProcessed} Project Objectives (offset: ${currentOffset}, limit: ${LIMIT}, hasMore: ${response.data.hasMore})`);
        }
      } else {
        toast.error(response.data.error || 'Failed to fetch Project Roster Funnel data');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The dataset is large. Try refreshing or contact support.');
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Project Roster Funnel data';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
    }
  }, [LIMIT]);

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
      <div style={{ marginLeft: `${sidebarWidth}px`, transition: 'margin-left 0.3s ease, width 0.3s ease', width: `calc(100% - ${sidebarWidth}px)` }}>
        <div className="project-roster-funnel-container">
          <div className="project-roster-funnel-header">
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
                  <h1 className="page-title">Project Roster Funnel</h1>
                  <p className="page-subtitle">View contributor counts by status for each Project Objective</p>
                </div>
              </div>
              <div className="header-user-profile">
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

          <div className="project-roster-funnel-content">
            <div className="project-roster-funnel-main-content">
              <ProjectRosterFunnelTable 
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

export default ProjectRosterFunnel;

