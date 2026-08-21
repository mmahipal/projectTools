import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Menu, RefreshCw, Loader, Filter, Plus } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../components/BookmarkButton';
import { useGPCFilter } from '../context/GPCFilterContext';
import { applyGPCFilterToParams } from '../utils/gpcFilter';
import GPCFilterToggle from '../components/GPCFilter/GPCFilterToggle';
import PaymentAdjustmentsTable from '../components/PaymentAdjustments/PaymentAdjustmentsTable';
import PaymentAdjustmentsFilterBuilder from '../components/PaymentAdjustments/PaymentAdjustmentsFilterBuilder';
import NewPaymentAdjustmentModal from '../components/PaymentAdjustments/NewPaymentAdjustmentModal';
import ViewPaymentAdjustmentModal from '../components/PaymentAdjustments/ViewPaymentAdjustmentModal';
import TruncatedSpan from '../components/TruncatedSpan';
import '../styles/PaymentAdjustments.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const PaymentAdjustments = () => {
  // const { user, logout } = useAuth(); // Unused - kept for potential future use
  const { getFilterParams } = useGPCFilter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [cursor, setCursor] = useState(null); // For cursor-based pagination when offset > 2000
  const cursorRef = useRef(null); // Ref to track cursor synchronously
  const [selectedColumns, setSelectedColumns] = useState([
    'Name',
    'Contributor__c',
    'Contributor_Project__c',
    'Payment_Adjustment_Amount__c',
    'Adjustment_Type__c',
    'Adjustment_Notes__c',
    'Payment_Adjustment_Date__c',
    'Payment_ID__c',
    'Status__c',
    'CreatedBy'
  ]);
  const [paymentAdjustmentFields, setPaymentAdjustmentFields] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const tableContainerRef = useRef(null);
  const [showNewModal, setShowNewModal] = useState(false);
  
  // View modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalPaymentAdjustmentId, setViewModalPaymentAdjustmentId] = useState(null);

  // Memoize fetchAvailableFields to prevent unnecessary re-renders
  const fetchAvailableFields = useCallback(async () => {
    try {
      const response = await apiClient.get('/payment-adjustments/fields');
      if (response.data.success) {
        const fields = response.data.fields || [];
        setAvailableFields(fields);
        setPaymentAdjustmentFields(fields);
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
  const fetchRecords = useCallback(async (reset = false, customOffset = null) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
      setCursor(null);
      cursorRef.current = null;
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      const currentOffset = reset ? 0 : (customOffset !== null ? customOffset : offset);
      params.append('offset', currentOffset.toString());
      params.append('limit', '1000');
      
      // Use ref cursor for synchronous access (always up-to-date)
      const currentCursor = cursorRef.current;
      
      // Add cursor for cursor-based pagination when offset >= 2000
      if (currentOffset >= 2000 && currentCursor) {
        params.append('cursor', currentCursor);
      } else if (currentOffset >= 2000 && !currentCursor) {
        console.warn(`[PaymentAdjustments] Offset ${currentOffset} >= 2000 but no cursor available. This may cause pagination to stop.`);
      }
      
      // Use refs to get current values without causing dependency issues
      const currentSearchTerm = debouncedSearchTermRef.current;
      const currentFilters = filtersRef.current;
      
      if (currentSearchTerm && currentSearchTerm.trim()) {
        params.append('search', currentSearchTerm.trim());
      }
      
      if (Object.keys(currentFilters).length > 0) {
        params.append('filters', JSON.stringify(currentFilters));
      }
      
      // Apply GPC-Filter
      const gpcFilterParams = getFilterParams();
      applyGPCFilterToParams(params, gpcFilterParams);
      
      const response = await apiClient.get(`/payment-adjustments?${params.toString()}`);
      if (response.data.success) {
        const newRecords = response.data.records || [];
        const responseCursor = response.data.cursor || null;
        
        // Update cursor ref immediately for next fetch (critical for offset > 2000)
        if (responseCursor) {
          cursorRef.current = responseCursor;
          setCursor(responseCursor);
        } else if (currentOffset >= 2000) {
          console.warn(`[PaymentAdjustments] No cursor returned at offset ${currentOffset}. Pagination may stop.`);
        }
        
        if (reset) {
          setRecords(newRecords);
          setOffset(newRecords.length);
        } else {
          setRecords(prev => {
            // Avoid duplicates by checking IDs
            const existingIds = new Set(prev.map(r => r.Id));
            const uniqueNewRecords = newRecords.filter(r => !existingIds.has(r.Id));
            return [...prev, ...uniqueNewRecords];
          });
          setOffset(prev => prev + newRecords.length);
        }
        // Update hasMore based on whether we got a full batch
        setHasMore(newRecords.length === 1000);
      } else {
        toast.error(response.data.error || 'Failed to fetch Payment Adjustments data');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch Payment Adjustments data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [offset, getFilterParams]); // Removed filters and debouncedSearchTerm from dependencies

  // Initial load - only runs once on mount
  useEffect(() => {
    fetchRecords(true);
    fetchAvailableFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  // Observe sidebar width changes
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      setSidebarWidth(sidebarOpen ? 320 : 80);
      return;
    }

    const updateSidebarWidth = () => {
      const width = sidebar.offsetWidth;
      if (width > 0) {
        setSidebarWidth(width);
      } else {
        setSidebarWidth(sidebarOpen ? 320 : 80);
      }
    };

    const timeoutId = setTimeout(updateSidebarWidth, 0);
    const resizeObserver = new ResizeObserver(() => {
      updateSidebarWidth();
    });

    resizeObserver.observe(sidebar);
    sidebar.addEventListener('transitionend', updateSidebarWidth);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      sidebar.removeEventListener('transitionend', updateSidebarWidth);
    };
  }, [sidebarOpen]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use refs to prevent multiple simultaneous fetches and track previous values
  const isFetchingRef = useRef(false);
  const prevFiltersRef = useRef(JSON.stringify(filters));
  const prevSearchTermRef = useRef(debouncedSearchTerm);
  const isInitialMountRef = useRef(true);
  
  // Reset and fetch when filters or search term changes
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
    setOffset(0);
    setRecords([]);
    setHasMore(true);
    cursorRef.current = null; // Reset cursor ref
    
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
    setCursor(null);
    cursorRef.current = null;
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

  // Infinite scroll - attach to scroll wrapper
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const scrollWrapper = container.querySelector('.case-table-scroll-wrapper');
    if (!scrollWrapper) return;

    let isFetching = false;
    let scrollTimeout = null;

    const handleScroll = () => {
      // Clear any pending timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Debounce scroll events
      scrollTimeout = setTimeout(() => {
        // Don't trigger if already loading, fetching, or no more data
        if (loadingMore || isFetching || !hasMore) return;
        
        const { scrollTop, scrollHeight, clientHeight } = scrollWrapper;
        
        // Trigger when within 200px of bottom
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        if (distanceFromBottom < 200) {
          isFetching = true;
          // Use current records length as offset for next batch
          const currentOffset = records.length;
          fetchRecords(false, currentOffset).finally(() => {
            isFetching = false;
          });
        }
      }, 100); // 100ms debounce
    };

    scrollWrapper.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also check on mount in case content is already scrolled
    handleScroll();
    
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollWrapper.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, loadingMore, records.length]); // Removed fetchRecords from dependencies

  if (loading && records.length === 0) {
    const currentSidebarWidth = sidebarOpen ? sidebarWidth : 80;
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div 
          className="payment-adjustments-loading-wrapper" 
          style={{ 
            marginLeft: `${currentSidebarWidth}px`, 
            width: `calc(100% - ${currentSidebarWidth}px)`,
            left: `${currentSidebarWidth}px`,
            zIndex: 1
          }}
        >
          <div className="payment-adjustments-loading-content">
            <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
            <p style={{ color: '#666', fontSize: '14px', margin: 0, fontFamily: 'Poppins' }}>Loading Payment Adjustments data...</p>
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
      }} className="payment-adjustments-main-wrapper">
        <div className="payment-adjustments-container">
          <div className="payment-adjustments-header">
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
                  <h1 className="page-title">
                    <TruncatedSpan title="Payment Adjustments">Payment Adjustments</TruncatedSpan>
                  </h1>
                  <p className="page-subtitle">View and manage payment adjustments</p>
                </div>
              </div>
              <div className="header-right">
                <GPCFilterToggle />
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Payment Adjustments" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          <div className="payment-adjustments-content">
            <div className="payment-adjustments-main-content">
              {showFilters && (
                <PaymentAdjustmentsFilterBuilder
                  availableFields={availableFields.filter(field => {
                    // Include fields that are in selectedColumns
                    // Also handle CreatedBy/CreatedById mapping
                    return selectedColumns.includes(field.name) || 
                           (field.name === 'CreatedById' && selectedColumns.includes('CreatedBy')) ||
                           (field.name === 'CreatedBy' && selectedColumns.includes('CreatedBy'));
                  })}
                  filters={filters}
                  onSubmit={handleFilterSubmit}
                  onClear={handleClearFilters}
                  onClose={() => setShowFilters(false)}
                  records={records}
                />
              )}

              <PaymentAdjustmentsTable 
                records={records}
                loading={loading}
                loadingMore={loadingMore}
                availableFields={availableFields}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedColumns={selectedColumns}
                onColumnChange={setSelectedColumns}
                adjustmentFields={paymentAdjustmentFields}
                tableContainerRef={tableContainerRef}
                hasMore={hasMore}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filters={filters}
                onNewClick={() => setShowNewModal(true)}
                onRecordClick={(recordId, recordName) => {
                  setViewModalPaymentAdjustmentId(recordId);
                  setShowViewModal(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <NewPaymentAdjustmentModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSave={(record) => {
          setShowNewModal(false);
          // Refresh the table
          fetchRecords(true);
        }}
      />

      {/* View Payment Adjustment Modal */}
      <ViewPaymentAdjustmentModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewModalPaymentAdjustmentId(null);
        }}
        paymentAdjustmentId={viewModalPaymentAdjustmentId}
      />
    </div>
  );
};

export default PaymentAdjustments;

