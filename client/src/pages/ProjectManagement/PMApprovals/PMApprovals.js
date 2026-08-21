import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/Sidebar';
import useSidebarWidth from '../../../hooks/useSidebarWidth';
import { Menu, RefreshCw, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import UserProfileDropdown from '../../../components/UserProfileDropdown/UserProfileDropdown';
import apiClient from '../../../config/api';
import toast from 'react-hot-toast';
import BookmarkButton from '../../../components/BookmarkButton';
import DeadlinesPanel from './components/DeadlinesPanel';
import RecordsCount from './components/RecordsCount';
import FieldFilter from './components/FieldFilter';
import PendingHoursCard from './components/PendingHoursCard';
import MetricsRow from './components/MetricsRow';
import PendingUnitsCard from './components/PendingUnitsCard';
import ApprovalsTable from './components/ApprovalsTable';
import ActionButtons from './components/ActionButtons';
import ApprovalModal from './components/ApprovalModal';
import RejectModal from './components/RejectModal';
import EmailModal from './components/EmailModal';
import ViewPaymentTransactionModal from './components/ViewPaymentTransactionModal';
import { useGPCFilter } from '../../../context/GPCFilterContext';
import { applyGPCFilterToParams } from '../../../utils/gpcFilter';
import GPCFilterToggle from '../../../components/GPCFilter/GPCFilterToggle';
import './PMApprovals.css';
import '../../../styles/Sidebar.css';
import '../../../styles/GlobalHeader.css';

// Map client-side field names to Salesforce field names for sorting
const mapSortFieldToSalesforce = (clientFieldName) => {
  const fieldMap = {
    'transactionId': 'Transaction_ID__c',
    'contributorName': 'Contact__r.Name',
    'email': 'Contact__r.Email',
    'projectName': 'Contributor_Project__r.Project_Objective__r.Project__r.Name',
    'projectObjectiveName': 'Project_Objective__r.Name',
    'accountName': 'Contributor_Project__r.Project_Objective__r.Project__r.Account__r.Name',
    'transactionDate': 'Transaction_Date__c',
    'variancePercent': 'Variance_Percent__c',
    'payrate': 'Payrate__c',
    'totalPayment': 'Total_Payment__c',
    'status': 'Status__c'
  };
  return fieldMap[clientFieldName] || clientFieldName; // Return as-is if not in map (might already be Salesforce field name)
};

// Map Salesforce field names back to client-side field names
const mapSalesforceToClientField = (salesforceFieldName) => {
  const reverseMap = {
    'Transaction_ID__c': 'transactionId',
    'Contact__r.Name': 'contributorName',
    'Contact__r.Email': 'email',
    'Contributor_Project__r.Project_Objective__r.Project__r.Name': 'projectName',
    'Project_Objective__r.Name': 'projectObjectiveName',
    'Contributor_Project__r.Project_Objective__r.Project__r.Account__r.Name': 'accountName',
    'Transaction_Date__c': 'transactionDate',
    'Variance_Percent__c': 'variancePercent',
    'Payrate__c': 'payrate',
    'Total_Payment__c': 'totalPayment',
    'Status__c': 'status'
  };
  return reverseMap[salesforceFieldName] || salesforceFieldName; // Return as-is if not in map
};

// Client-side sorting function
const sortRecords = (records, sortField, sortOrder) => {
  if (!sortField || !Array.isArray(records) || records.length === 0) {
    return records;
  }

  const sorted = [...records].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Convert to strings for comparison if not already
    const aStr = String(aValue).trim().toLowerCase();
    const bStr = String(bValue).trim().toLowerCase();

    // Try to parse as numbers for numeric fields
    const numericFields = ['variancePercent', 'payrate', 'totalPayment', 'selfReportedHours', 'selfReportedUnits', 'systemTrackedHours', 'systemTrackedUnits'];
    if (numericFields.includes(sortField)) {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      return sortOrder === 'ASC' ? aNum - bNum : bNum - aNum;
    }

    // Try to parse as dates for date fields
    if (sortField === 'transactionDate') {
      const aDate = aValue ? new Date(aValue).getTime() : 0;
      const bDate = bValue ? new Date(bValue).getTime() : 0;
      return sortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
    }

    // String comparison
    if (aStr < bStr) return sortOrder === 'ASC' ? -1 : 1;
    if (aStr > bStr) return sortOrder === 'ASC' ? 1 : -1;
    return 0;
  });

  return sorted;
};

// GPC Filter helper function - applies consistent filtering logic
// Logic: OR within accounts, OR within projects, AND between accounts and projects
const applyGPCFilterToRecord = (record, preferences, shouldApplyFilter) => {
  if (!shouldApplyFilter || !shouldApplyFilter()) {
    return true; // No filter applied
  }

  if (!record) return false;

  const interestedAccountNames = (preferences.interestedAccounts || [])
    .map(acc => {
      if (typeof acc === 'object' && acc !== null && acc.name) {
        return acc.name;
      }
      return typeof acc === 'string' ? acc : '';
    })
    .filter(Boolean);
  
  const interestedProjectNames = (preferences.interestedProjects || [])
    .map(proj => {
      if (typeof proj === 'object' && proj !== null && proj.name) {
        return proj.name;
      }
      return typeof proj === 'string' ? proj : '';
    })
    .filter(Boolean);

  // If no preferences are set, show all records
  if (interestedAccountNames.length === 0 && interestedProjectNames.length === 0) {
    return true;
  }

  const recordAccountName = String(record.accountName || '').trim();
  const recordProjectName = String(record.projectName || '').trim();

  // OR logic within accounts: match if record matches any interested account
  const accountMatch = interestedAccountNames.length === 0 || 
    interestedAccountNames.some(accName => 
      recordAccountName.toLowerCase() === accName.toLowerCase()
    );

  // OR logic within projects: match if record matches any interested project
  const projectMatch = interestedProjectNames.length === 0 || 
    interestedProjectNames.some(projName => 
      recordProjectName.toLowerCase() === projName.toLowerCase()
    );

  // AND logic between accounts and projects:
  // - If both accounts and projects are selected: must match account AND project
  // - If only accounts selected: must match account
  // - If only projects selected: must match project
  if (interestedAccountNames.length > 0 && interestedProjectNames.length > 0) {
    // Both selected: AND logic
    return accountMatch && projectMatch;
  } else if (interestedAccountNames.length > 0) {
    // Only accounts selected: match account
    return accountMatch;
  } else if (interestedProjectNames.length > 0) {
    // Only projects selected: match project
    return projectMatch;
  }

  return true; // No preferences, show all
};

const PMApprovals = () => {
  const { user, logout } = useAuth();
  const { getFilterParams, shouldApplyFilter, preferences } = useGPCFilter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [deadlines, setDeadlines] = useState(null);
  // Filter states - field-based filtering
  const [filter, setFilter] = useState({ field: '', value: '' });
  const [sortBy, setSortBy] = useState('transactionDate');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  // Table states
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [uniqueRecordsCount, setUniqueRecordsCount] = useState(0);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showViewTransactionModal, setShowViewTransactionModal] = useState(false);
  const [viewTransactionId, setViewTransactionId] = useState(null);
  
  // Track if warning has been shown to avoid duplicates
  const warningShownRef = useRef(false);
  
  // Track if auto-loading is in progress
  const autoLoadingRef = useRef(false);
  
  // Track current records to avoid stale closures
  const recordsRef = useRef([]);
  
  // Map-based record storage for O(1) lookup and guaranteed uniqueness
  const recordsMapRef = useRef(new Map());
  
  // Track total unique records loaded (for display and comparison)
  const uniqueRecordsCountRef = useRef(0);
  
  // Track total duplicates filtered out across all batches
  const totalDuplicatesRef = useRef(0);
  
  // Track total records received from server (including duplicates)
  const totalRecordsReceivedRef = useRef(0);
  
  const tableContainerRef = useRef(null);
  
  // Keep recordsRef and recordsMapRef in sync with records state
  useEffect(() => {
    // Ensure records is always an array
    const recordsArray = Array.isArray(records) ? records : [];
    recordsRef.current = recordsArray;
    // Update map whenever records change
    const newMap = new Map();
    recordsArray.forEach(record => {
      if (record && record.id) {
        newMap.set(record.id, record);
      }
    });
    recordsMapRef.current = newMap;
  }, [records]);

  // Fetch deadlines
  const fetchDeadlines = useCallback(async () => {
    try {
      const response = await apiClient.get('/pm-approvals/deadlines');
      if (response.data.success) {
        setDeadlines(response.data.deadlines);
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  }, []);

  // Fetch filter options
  // No longer need to fetch filter options - values come from table data

  // Fetch summary metrics
  const fetchSummary = useCallback(async (silent = false) => {
    try {
      const params = new URLSearchParams();
      // For summary, use the filter if available (server-side filters only)
      if (filter && filter.field && filter.value && !['accountName', 'projectName'].includes(filter.field)) {
        params.append('filterField', filter.field);
        params.append('filterValue', filter.value);
      }
      
      const response = await apiClient.get(`/pm-approvals/summary?${params.toString()}`);
      if (response.data.success) {
        setSummary(response.data.data);
        
        if (response.data.warning && !silent && !warningShownRef.current) {
          warningShownRef.current = true;
          toast(response.data.warning, {
            duration: 8000,
            icon: '⚠️',
            style: {
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      if (!silent && error.code !== 'ECONNREFUSED' && error.code !== 'ERR_NETWORK' && !error.isBackendDown) {
        toast.error('Failed to load summary metrics');
      }
    }
  }, [filter]);

  // Simplified fetch records function - loads 5000 records per batch
  const fetchRecords = useCallback(async (reset = false, startOffset = null, filterOverride = null, sortByOverride = null, sortOrderOverride = null) => {
    // Prevent concurrent fetches
    if (autoLoadingRef.current && !reset) {
      return;
    }
    
    autoLoadingRef.current = true;
    
    // Use filterOverride if provided, otherwise use current filter state
    const activeFilter = filterOverride !== null ? filterOverride : filter;
    // Use sort overrides if provided, otherwise use current sort state
    const activeSortBy = sortByOverride !== null ? sortByOverride : sortBy;
    const activeSortOrder = sortOrderOverride !== null ? sortOrderOverride : sortOrder;
    
    if (reset) {
      setLoading(true);
      setRecords([]);
      recordsRef.current = [];
      recordsMapRef.current = new Map(); // Reset map
      uniqueRecordsCountRef.current = 0; // Reset unique count
      totalDuplicatesRef.current = 0; // Reset duplicates count
      totalRecordsReceivedRef.current = 0; // Reset total received
      setOffset(0);
      setTotalRecords(0);
      setUniqueRecordsCount(0);
      setDuplicatesCount(0);
      setHasMore(true);
      autoLoadingRef.current = false; // Allow reset to proceed
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = startOffset !== null ? startOffset : offset;
      const params = new URLSearchParams();
      params.append('offset', currentOffset.toString());
      params.append('limit', '5000'); // Request 5,000 records per batch
      // Map client-side field name to Salesforce field name for server query
      const salesforceSortBy = mapSortFieldToSalesforce(activeSortBy) || 'Transaction_Date__c';
      params.append('sortBy', salesforceSortBy);
      params.append('sortOrder', activeSortOrder);
      
      // Add field-based filter parameters
      if (activeFilter && activeFilter.field && activeFilter.value) {
        params.append('filterField', activeFilter.field);
        params.append('filterValue', activeFilter.value);
      }
      
      // Note: GPC-Filter is applied client-side for PM Approvals
      // because Payment_Transactions_Needing_Approval__c doesn't have direct Account__c field
      
      const response = await apiClient.get(`/pm-approvals/list?${params.toString()}`);
      
      if (response.data.success) {
        // Ensure records is an array
        const recordsData = response.data.records;
        const newRecords = Array.isArray(recordsData) ? recordsData : [];
        const total = response.data.total || 0;
        const effectiveOffset = response.data.effectiveOffset !== undefined 
          ? response.data.effectiveOffset 
          : (currentOffset + newRecords.length);
        const hasMoreData = response.data.hasMore || false;
        
        setTotalRecords(total);
        
        // SYSTEMATIC DEDUPLICATION: Use Map-based approach for guaranteed uniqueness
        if (reset) {
          // Reset: Build new map from scratch
          const recordsMap = new Map();
          const uniqueRecords = [];
          let duplicateCount = 0;
          
          newRecords.forEach(record => {
            if (record && record.id) {
              // Only add if not already in map (guarantees uniqueness)
              if (!recordsMap.has(record.id)) {
                recordsMap.set(record.id, record);
                uniqueRecords.push(record);
              } else {
                duplicateCount++;
                console.warn(`Duplicate record detected during reset: ${record.id}`);
              }
            }
          });
          
          recordsMapRef.current = recordsMap;
          setRecords(uniqueRecords);
          recordsRef.current = uniqueRecords;
          uniqueRecordsCountRef.current = uniqueRecords.length;
          totalRecordsReceivedRef.current = newRecords.length;
          
          // Calculate duplicates consistently: total received - unique count
          // This ensures the count is always accurate regardless of batch order
          const calculatedDuplicates = totalRecordsReceivedRef.current - uniqueRecordsCountRef.current;
          totalDuplicatesRef.current = calculatedDuplicates;
          
          setUniqueRecordsCount(uniqueRecords.length);
          setDuplicatesCount(calculatedDuplicates);
          setOffset(uniqueRecords.length);
          
          if (newRecords.length !== uniqueRecords.length) {
            console.warn(`Deduplication: ${newRecords.length} records received, ${uniqueRecords.length} unique records after deduplication, ${calculatedDuplicates} duplicates filtered`);
          }
          
          // Check if we have more records to load (for reset case)
          // Continue loading as long as server says hasMore=true, regardless of unique count
          // This ensures we process all batches to find all unique records
          const stillHasMoreReset = hasMoreData && (newRecords.length > 0);
          setHasMore(stillHasMoreReset);
          
          // Auto-load next batch if server indicates more records available
          // We continue loading even if all records in this batch were duplicates,
          // because there might be more unique records in subsequent batches
          if (stillHasMoreReset) {
            setTimeout(() => {
              fetchRecords(false, effectiveOffset).catch((err) => {
                console.error('Error auto-loading next batch:', err);
                setHasMore(false);
              });
            }, 50); // Small delay to keep UI responsive
          } else {
            setHasMore(false);
          }
        } else {
          // Append: Use functional update with Map-based deduplication
          let uniqueNewRecordsCount = 0;
          setRecords(prev => {
            // Get current map for O(1) lookup
            const currentMap = recordsMapRef.current;
            const uniqueNewRecords = [];
            let duplicateCount = 0;
            
            newRecords.forEach(record => {
              if (record && record.id) {
                if (!currentMap.has(record.id)) {
                  // New record - add to map and list
                  currentMap.set(record.id, record);
                  uniqueNewRecords.push(record);
                } else {
                  // Duplicate detected
                  duplicateCount++;
                  console.warn(`Duplicate record detected during append: ${record.id}`);
                }
              }
            });
            
            // Track how many unique records were actually added
            uniqueNewRecordsCount = uniqueNewRecords.length;
            
            // Update total duplicates and total received
            totalDuplicatesRef.current += duplicateCount;
            totalRecordsReceivedRef.current += newRecords.length;
            
            if (duplicateCount > 0) {
              console.warn(`Deduplication: ${duplicateCount} duplicate(s) filtered out from ${newRecords.length} new records`);
            }
            
            // Build new array from map values to ensure no duplicates
            const updatedRecords = Array.from(currentMap.values());
            recordsMapRef.current = currentMap;
            recordsRef.current = updatedRecords;
            uniqueRecordsCountRef.current = updatedRecords.length; // Update unique count
            
            // Calculate duplicates consistently: total received - unique count
            // This ensures the count is always accurate regardless of batch order
            const calculatedDuplicates = totalRecordsReceivedRef.current - uniqueRecordsCountRef.current;
            
            // Update state for display - use calculated duplicates for consistency
            setUniqueRecordsCount(updatedRecords.length);
            setDuplicatesCount(calculatedDuplicates);
            
            // Also update the ref to keep it in sync
            totalDuplicatesRef.current = calculatedDuplicates;
            
            return updatedRecords;
          });
          setOffset(effectiveOffset);
          
          // Check if we have more records to load
          // IMPORTANT: Continue loading as long as server says hasMore=true
          // This ensures we process all batches to find all unique records, even if
          // some batches contain only duplicates
          // Only stop if:
          // 1. Server says hasMore=false (no more batches)
          // 2. We received 0 records from API (end of data)
          const stillHasMore = hasMoreData && (newRecords.length > 0);
          setHasMore(stillHasMore);
          
          // Auto-load next batch if server indicates more records available
          // Continue loading even if all records in this batch were duplicates,
          // because there might be more unique records in subsequent batches
          if (stillHasMore) {
            setTimeout(() => {
              fetchRecords(false, effectiveOffset).catch((err) => {
                console.error('Error auto-loading next batch:', err);
                setHasMore(false);
              });
            }, 50); // Small delay to keep UI responsive
          } else {
            setHasMore(false);
          }
        }
        
        if (response.data.warning && reset && !warningShownRef.current) {
          warningShownRef.current = true;
          toast(response.data.warning, {
            duration: 8000,
            icon: '⚠️',
            style: {
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a'
            }
          });
        }
      } else {
        toast.error(response.data.error || 'Failed to fetch approvals');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      if (error.code !== 'ECONNREFUSED' && error.code !== 'ERR_NETWORK' && !error.isBackendDown) {
        toast.error('Failed to fetch approvals');
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      autoLoadingRef.current = false;
    }
  }, [filter, sortBy, sortOrder, offset]);

  // Track if initial load has been done
  const initialLoadDoneRef = useRef(false);
  
  // Initial load - only runs once on mount
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      fetchDeadlines();
      fetchSummary(true);
      fetchRecords(true);
    }
  }, [fetchDeadlines, fetchSummary, fetchRecords]);

  // Normalize sortBy to always use client-side field names (only if it's a Salesforce field name)
  useEffect(() => {
    const clientSortField = mapSalesforceToClientField(sortBy);
    // Only update if it's actually a Salesforce field name (mapping changed it)
    // This prevents infinite loops since if it's already a client-side name, clientSortField === sortBy
    if (clientSortField !== sortBy && sortBy) {
      setSortBy(clientSortField);
    }
  }, [sortBy]);

  // Note: Filters and sort changes no longer trigger data reset
  // Data persists during the session and only reloads when refresh button is clicked

  const handleRefresh = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRefreshing(true);
    setOffset(0);
    setRecords([]);
    recordsRef.current = [];
    setHasMore(true);
    setSelectedRows([]);
    setTotalRecords(0);
    warningShownRef.current = false;
    autoLoadingRef.current = false;
    fetchRecords(true).finally(() => {
      setRefreshing(false);
    });
    fetchSummary();
  }, [fetchRecords, fetchSummary]);


  const handleApplyFilter = useCallback((filterData) => {
    // Handle new structure from FieldFilter: { filters: [...], sortBy: '', sortOrder: '' }
    // or old structure: { field: '', value: '' }
    let activeFilter = null;
    let newSortBy = sortBy;
    let newSortOrder = sortOrder;
    let needsRefetch = false;

    // Check if it's the new structure (from FieldFilter)
    if (filterData.filters !== undefined) {
      // New structure: { filters: [...], sortBy: '', sortOrder: '' }
      const activeFilters = filterData.filters.filter(f => f.field && f.value);
      if (activeFilters.length > 0) {
        // Use the first filter for now (supporting single filter)
        activeFilter = activeFilters[0];
      }
      
      // Update sort if provided
      if (filterData.sortBy !== undefined) {
        // Map client-side field name to Salesforce field name
        const clientSortField = filterData.sortBy || 'transactionDate';
        newSortBy = mapSortFieldToSalesforce(clientSortField) || 'Transaction_Date__c';
        needsRefetch = true;
      }
      if (filterData.sortOrder !== undefined) {
        newSortOrder = filterData.sortOrder || 'DESC';
        needsRefetch = true;
      }
    } else {
      // Old structure: { field: '', value: '' }
      activeFilter = filterData;
    }

    // Update sort state if changed
    if (newSortBy !== sortBy || newSortOrder !== sortOrder) {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      // No need to refetch - sorting is now client-side
    }

    // ALL filtering is now client-side - just update the filter state
    if (activeFilter) {
      setFilter(activeFilter);
      setSelectedRows([]);
    } else if (needsRefetch && !activeFilter) {
      // Only sort changed, no filter - just update sort state (already done above)
      setSelectedRows([]);
    }
  }, [fetchRecords, fetchSummary, sortBy, sortOrder]);

  const handleClearFilter = useCallback(() => {
    // All filtering is client-side - just clear the filter and sort state
    setFilter({ field: '', value: '' });
    setSortBy('transactionDate');
    setSortOrder('DESC');
    setSelectedRows([]);
    // No server refetch needed - filtering and sorting are client-side
  }, []);

  const handleSort = useCallback((column, order) => {
    // Use client-side field name directly for client-side sorting
    const clientField = column || 'transactionDate';
    const newSortBy = clientField;
    const newSortOrder = order || 'DESC';
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setSelectedRows([]);
    // No server refetch needed - sorting is now client-side
  }, []);

  const handleRowSelect = (recordId) => {
    setSelectedRows(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  const handleApprove = () => {
    if (selectedRows.length === 0) {
      toast.error('Please select at least one record to approve');
      return;
    }
    setShowApprovalModal(true);
  };

  const handleReject = () => {
    if (selectedRows.length === 0) {
      toast.error('Please select at least one record to reject');
      return;
    }
    setShowRejectModal(true);
  };

  const handleSendEmail = () => {
    if (selectedRows.length === 0) {
      toast.error('Please select at least one record to email');
      return;
    }
    setShowEmailModal(true);
  };

  const handleApprovalConfirm = async (comment) => {
    try {
      const response = await apiClient.post('/pm-approvals/approve', {
        transactionIds: selectedRows,
        comment: comment || ''
      });
      
      if (response.data.success) {
        toast.success(`Successfully approved ${response.data.approved} record(s)`);
        setRecords(prev => {
          const filtered = prev.filter(r => !selectedRows.includes(r.id));
          // Update map to match filtered records
          const newMap = new Map();
          filtered.forEach(record => {
            if (record && record.id) {
              newMap.set(record.id, record);
            }
          });
          recordsMapRef.current = newMap;
          recordsRef.current = filtered;
          return filtered;
        });
        setSelectedRows([]);
        setShowApprovalModal(false);
        fetchSummary();
      } else {
        toast.error(response.data.error || 'Failed to approve records');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve records');
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      const response = await apiClient.post('/pm-approvals/reject', {
        transactionIds: selectedRows,
        reason: reason || ''
      });
      
      if (response.data.success) {
        toast.success(`Successfully rejected ${response.data.rejected} record(s)`);
        setRecords(prev => {
          const filtered = prev.filter(r => !selectedRows.includes(r.id));
          // Update map to match filtered records
          const newMap = new Map();
          filtered.forEach(record => {
            if (record && record.id) {
              newMap.set(record.id, record);
            }
          });
          recordsMapRef.current = newMap;
          recordsRef.current = filtered;
          return filtered;
        });
        setSelectedRows([]);
        setShowRejectModal(false);
        fetchSummary();
      } else {
        toast.error(response.data.error || 'Failed to reject records');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject records');
    }
  };

  const handleEmailConfirm = async (emailData) => {
    toast.info('Email functionality coming soon');
    setShowEmailModal(false);
  };

  const handleTransactionClick = (transactionId) => {
    setViewTransactionId(transactionId);
    setShowViewTransactionModal(true);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div 
        className="pm-approvals-page" 
        style={{ 
          marginLeft: `${sidebarWidth}px`, 
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'margin-left 0.2s ease, width 0.2s ease'
        }}
      >
        <div className="pm-approvals-container">
          {/* Header */}
          <div className="pm-approvals-header">
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
                  <h1 className="page-title">PM Approvals for Self Reported Time</h1>
                </div>
              </div>
              <div className="header-right">
                <GPCFilterToggle />
                <BookmarkButton />
                <button
                  className="refresh-btn"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh"
                >
                  <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                </button>
              </div>
              <div className="header-user-profile">
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="pm-approvals-content">
            {/* Left Sidebar */}
            <div className={`pm-approvals-sidebar ${leftPanelCollapsed ? 'collapsed' : ''}`}>
              <button
                className="left-panel-toggle"
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                aria-label={leftPanelCollapsed ? 'Expand left panel' : 'Collapse left panel'}
                title={leftPanelCollapsed ? 'Expand left panel' : 'Collapse left panel'}
              >
                {leftPanelCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              {!leftPanelCollapsed && (
                <>
                  <DeadlinesPanel deadlines={deadlines} loading={!deadlines} />
                  <RecordsCount 
                count={(() => {
                  // Apply consistent filtering (GPC + field filter) to get accurate count
                  let filteredRecords = Array.isArray(records) ? records : [];
                  
                  // Apply GPC filter first
                  filteredRecords = filteredRecords.filter(record => 
                    applyGPCFilterToRecord(record, preferences, shouldApplyFilter)
                  );
                  
                  // Then apply field-based filter if active
                  if (filter.field && filter.value) {
                    filteredRecords = filteredRecords.filter(record => {
                      if (!record) return false;
                      const fieldValue = String(record[filter.field] || '').trim();
                      const filterValue = String(filter.value || '').trim();
                      return fieldValue === filterValue;
                    });
                  }
                  
                  return filteredRecords.length;
                })()}
                total={(() => {
                  // Total should also reflect filtered count for consistency
                  let filteredRecords = Array.isArray(records) ? records : [];
                  
                  // Apply GPC filter
                  filteredRecords = filteredRecords.filter(record => 
                    applyGPCFilterToRecord(record, preferences, shouldApplyFilter)
                  );
                  
                  return filteredRecords.length;
                })()}
                duplicates={duplicatesCount || 0}
                loading={loading} 
                isLoadingMore={loadingMore || hasMore}
              />
              <FieldFilter
                records={records}
                onApplyFilter={handleApplyFilter}
                onClearFilter={handleClearFilter}
                loading={loading}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSortChange={handleSort}
              />
                  <ActionButtons
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onSendEmail={handleSendEmail}
                    disabled={loading}
                    selectedCount={selectedRows.length}
                  />
                </>
              )}
            </div>

            {/* Main Content Area */}
            <div className="pm-approvals-main" ref={tableContainerRef}>
              {/* Summary Metrics */}
              <div className="summary-metrics-section">
                {(() => {
                  // Calculate summary from filtered records
                  // Apply both field filter and GPC filter consistently
                  let filteredRecords = Array.isArray(records) ? records : [];
                  
                  // Apply GPC filter first
                  filteredRecords = filteredRecords.filter(record => 
                    applyGPCFilterToRecord(record, preferences, shouldApplyFilter)
                  );
                  
                  // Then apply field-based filter if active
                  if (filter.field && filter.value) {
                    filteredRecords = filteredRecords.filter(record => {
                      if (!record) return false;
                      const fieldValue = String(record[filter.field] || '').trim();
                      const filterValue = String(filter.value || '').trim();
                      return fieldValue === filterValue;
                    });
                  }
                  
                  // Calculate summary from filtered records
                  const calculatedSummary = filteredRecords.reduce((acc, record) => {
                    const selfReportedHours = parseFloat(record.selfReportedHours) || 0;
                    const systemTrackedHours = parseFloat(record.systemTrackedHours) || 0;
                    const selfReportedUnits = parseFloat(record.selfReportedUnits) || 0;
                    const totalPayment = parseFloat(record.totalPayment) || 0;
                    
                    acc.totalPendingHours += selfReportedHours;
                    acc.totalHours += systemTrackedHours;
                    acc.selfReportedTime += selfReportedHours;
                    acc.systemTracked += systemTrackedHours;
                    acc.totalPayment += totalPayment;
                    acc.totalPendingUnits += selfReportedUnits;
                    
                    return acc;
                  }, {
                    totalPendingHours: 0,
                    totalHours: 0,
                    selfReportedTime: 0,
                    systemTracked: 0,
                    totalPayment: 0,
                    totalPendingUnits: 0
                  });
                  
                  // Always use calculated summary from filtered records for consistency
                  const displaySummary = calculatedSummary;
                  
                  return (
                    <>
                      <PendingHoursCard
                        totalPendingHours={displaySummary.totalPendingHours || 0}
                        totalHours={displaySummary.totalHours || 0}
                      />
                      <MetricsRow
                        selfReportedTime={displaySummary.selfReportedTime || 0}
                        systemTracked={displaySummary.systemTracked || 0}
                        payment={displaySummary.totalPayment || 0}
                      />
                      <PendingUnitsCard
                        totalPendingUnits={displaySummary.totalPendingUnits || 0}
                      />
                    </>
                  );
                })()}
              </div>

              {/* Table */}
              <div className="approvals-table-section">
                <ApprovalsTable
                  records={(() => {
                    // Apply client-side filtering and sorting for all fields
                    let processedRecords = Array.isArray(records) ? records : [];
                    
                    // Apply GPC-Filter (client-side for PM Approvals)
                    // Uses consistent filter logic: OR within accounts/projects, AND between them
                    processedRecords = processedRecords.filter(record => 
                      applyGPCFilterToRecord(record, preferences, shouldApplyFilter)
                    );
                    
                    // Apply field-based filtering
                    if (filter.field && filter.value) {
                      processedRecords = processedRecords.filter(record => {
                        if (!record) return false;
                        const fieldValue = String(record[filter.field] || '').trim();
                        const filterValue = String(filter.value || '').trim();
                        return fieldValue === filterValue;
                      });
                    }
                    
                    // Apply client-side sorting
                    if (sortBy) {
                      // Ensure we use client-side field name for sorting
                      // If sortBy is a Salesforce field name, map it to client-side
                      const clientSortField = mapSalesforceToClientField(sortBy);
                      processedRecords = sortRecords(processedRecords, clientSortField, sortOrder);
                    }
                    
                    return processedRecords;
                  })()}
                  loading={loading}
                  onRowClick={(record) => {}}
                  onSort={handleSort}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  selectedRows={selectedRows}
                  onRowSelect={handleRowSelect}
                  onTransactionClick={handleTransactionClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showApprovalModal && (
        <ApprovalModal
          selectedCount={selectedRows.length}
          onConfirm={handleApprovalConfirm}
          onClose={() => setShowApprovalModal(false)}
        />
      )}
      {showRejectModal && (
        <RejectModal
          selectedCount={selectedRows.length}
          onConfirm={handleRejectConfirm}
          onClose={() => setShowRejectModal(false)}
        />
      )}
      {showEmailModal && (
        <EmailModal
          selectedCount={selectedRows.length}
          onConfirm={handleEmailConfirm}
          onClose={() => setShowEmailModal(false)}
        />
      )}
      {showViewTransactionModal && (
        <ViewPaymentTransactionModal
          isOpen={showViewTransactionModal}
          onClose={() => {
            setShowViewTransactionModal(false);
            setViewTransactionId(null);
          }}
          transactionId={viewTransactionId}
        />
      )}
    </div>
  );
};

export default PMApprovals;
