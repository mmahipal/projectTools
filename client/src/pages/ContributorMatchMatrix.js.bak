import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Menu, LogOut, RefreshCw, Loader, Filter, Check, X } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../components/BookmarkButton';
import ContributorMatchMatrixTable from '../components/ContributorMatchMatrix/ContributorMatchMatrixTable';
import ContributorMatchMatrixFilterBuilder from '../components/ContributorMatchMatrix/ContributorMatchMatrixFilterBuilder';
import useSidebarWidth from '../hooks/useSidebarWidth';
import '../styles/ContributorMatchMatrix.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const ContributorMatchMatrix = () => {
  const { user, logout } = useAuth();
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

  useEffect(() => {
    fetchRecords(true);
    fetchAvailableFields();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setOffset(0);
    setRecords([]);
    setHasMore(true);
    fetchRecords(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, debouncedSearchTerm]);

  const fetchAvailableFields = async () => {
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
  };

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
      
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }
      
      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
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
  }, [filters, debouncedSearchTerm, offset]);

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
  }, [fetchRecords]);

  const handleFilterSubmit = async (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = async () => {
    setFilters({});
    setShowFilters(false);
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
  }, [hasMore, loadingMore, fetchRecords]);

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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorMatchMatrix;

