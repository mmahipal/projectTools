import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { Menu, RefreshCw, DollarSign, TrendingUp, Users, AlertCircle, CheckCircle, BarChart3, Download, Loader, Clock } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import BookmarkButton from '../components/BookmarkButton';
import { useGPCFilter } from '../context/GPCFilterContext';
import { applyGPCFilterToConfig } from '../utils/gpcFilter';
import GPCFilterToggle from '../components/GPCFilter/GPCFilterToggle';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';
import '../styles/ContributorPaymentsDashboard.css';

const COLORS = ['#08979C', '#13C2C2', '#36CFC9', '#5CDBD3', '#87E8DE', '#B5F5EC', '#E6FFFB'];

// Enhanced color palette for Payments by Status with better contrast
const STATUS_COLORS = [
  '#10B981', // Green - Success/Completed
  '#3B82F6', // Blue - Pending/In Progress
  '#F59E0B', // Amber - Warning/Partial
  '#EF4444', // Red - Failed/Error
  '#8B5CF6', // Purple - Other
  '#06B6D4', // Cyan - Info
  '#EC4899', // Pink - Special
  '#6366F1', // Indigo - Alternative
  '#14B8A6', // Teal - Active
  '#F97316', // Orange - Attention
  '#84CC16', // Lime - New
  '#64748B'  // Slate - Unknown/No Status
];

const ContributorPaymentsDashboard = () => {
  const { user, logout } = useAuth();
  const { getFilterParams } = useGPCFilter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [refreshing, setRefreshing] = useState(false);

  // Individual widget states - each widget has its own state
  const [totalContributors, setTotalContributors] = useState({ value: 0, lastRefreshed: null });
  const [totalPayments, setTotalPayments] = useState({ value: 0, lastRefreshed: null });
  const [averagePayment, setAveragePayment] = useState({ value: 0, lastRefreshed: null });
  const [pendingCount, setPendingCount] = useState({ value: 0, lastRefreshed: null });
  const [paymentsByStatus, setPaymentsByStatus] = useState({ data: [], lastRefreshed: null });
  const [paymentsByMethod, setPaymentsByMethod] = useState({ data: [], lastRefreshed: null });
  const [paymentsOverTime, setPaymentsOverTime] = useState({ data: [], lastRefreshed: null });
  const [topContributors, setTopContributors] = useState({ data: [], lastRefreshed: null });
  const [paymentsByCountry, setPaymentsByCountry] = useState({ data: [], lastRefreshed: null });
  const [averagePaymentByCountry, setAveragePaymentByCountry] = useState({ data: [], lastRefreshed: null });

  // Widget loading states - each widget has its own loading state
  const [widgetStates, setWidgetStates] = useState({});
  
  // Flag to prevent saving during initial load
  const [isLoadingBaseline, setIsLoadingBaseline] = useState(true);

  // Format currency with elegant million/billion formatting
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return '$0.00';
    const num = parseFloat(amount);
    if (Math.abs(num) >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (Math.abs(num) >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (Math.abs(num) >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    }
  };

  // Format number
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Never';
    }
  };

  // Individual widget fetch functions - each widget has its own API

  const fetchTotalContributors = useCallback(async (silent = false, widgetKey = 'totalContributors') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/total-contributors', config);
      setTotalContributors({ value: response.data.totalContributors || 0, lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) toast.success('Total contributors updated');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: errorMsg } }));
      setTotalContributors({ value: 0, lastRefreshed: null });
      if (!silent) toast.error(`Error loading total contributors: ${errorMsg}`);
    }
  }, [getFilterParams]);

  const fetchTotalPayments = useCallback(async (silent = false, widgetKey = 'totalPayments') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/total-payments', config);
      if (response.data.warning) {
        if (!silent) toast.warning(response.data.warning);
      }
      setTotalPayments({ value: response.data.totalPayments || 0, lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent && !response.data.warning) toast.success('Total payments updated');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: errorMsg } }));
      setTotalPayments({ value: 0, lastRefreshed: null });
      if (!silent) toast.error(`Error loading total payments: ${errorMsg}`);
    }
  }, [getFilterParams]);

  const fetchAveragePayment = useCallback(async (silent = false, widgetKey = 'averagePayment') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/average-payment', config);
      setAveragePayment({ value: response.data.avgPaymentAmount, lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) toast.success('Average payment updated');
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      if (!silent) toast.error('Error loading average payment');
    }
  }, [getFilterParams]);

  const fetchPendingCount = useCallback(async (silent = false, widgetKey = 'pendingCount') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/pending-count', config);
      setPendingCount({ value: response.data.pendingAmount, lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) toast.success('Pending amount updated');
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      if (!silent) toast.error('Error loading pending amount');
    }
  }, [getFilterParams]);

  const fetchPaymentsByStatus = useCallback(async (silent = false, widgetKey = 'paymentsByStatus') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/payments-by-status', config);
      setPaymentsByStatus({ data: response.data.data || [], lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) {
        if (response.data.data && response.data.data.length > 0) {
          toast.success('Payments by status updated');
        } else {
          toast('No payment status data found', { icon: '⚠️' });
        }
      }
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      if (!silent) toast.error(`Error loading payments by status: ${error.message}`);
    }
  }, [getFilterParams]);

  const fetchPaymentsByMethod = useCallback(async (silent = false, widgetKey = 'paymentsByMethod') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/payments-by-method', config);
      setPaymentsByMethod({ data: response.data.data || [], lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) {
        if (response.data.data && response.data.data.length > 0) {
          toast.success('Payments by method updated');
        } else {
          toast('No payment method data found', { icon: '⚠️' });
        }
      }
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      if (!silent) toast.error(`Error loading payments by method: ${error.message}`);
    }
  }, [getFilterParams]);

  const fetchPaymentsOverTime = useCallback(async (silent = false, widgetKey = 'paymentsOverTime') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/payments-over-time', config);
      setPaymentsOverTime({ data: response.data.data || [], lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) {
        if (response.data.data && response.data.data.length > 0) {
          toast.success('Payments over time updated');
        } else {
          toast('No payment over time data found', { icon: '⚠️' });
        }
      }
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      if (!silent) toast.error(`Error loading payments over time: ${error.message}`);
    }
  }, [getFilterParams]);

  const fetchTopContributors = useCallback(async (silent = false, widgetKey = 'topContributors') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({ params: { limit: 10 } }, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/top-contributors', config);
      setTopContributors({ data: response.data.data || [], lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) toast.success('Top contributors updated');
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      if (!silent) toast.error('Error loading top contributors');
    }
  }, [getFilterParams]);

  const fetchPaymentsByCountry = useCallback(async (silent = false, widgetKey = 'paymentsByCountry') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/payments-by-country', config);
      
      // Check for errors in response
      if (response.data.error) {
        const errorMsg = response.data.suggestion || response.data.error;
        setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: errorMsg } }));
        setPaymentsByCountry({ data: [], lastRefreshed: response.data.lastRefreshed || new Date().toISOString() });
        if (!silent) toast.error(`Error: ${errorMsg}`);
        return;
      }
      
      const data = response.data.data || [];
      setPaymentsByCountry({ 
        data, 
        lastRefreshed: response.data.lastRefreshed || new Date().toISOString(),
        message: response.data.message,
        totalRecords: response.data.totalRecords
      });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      
      if (!silent) {
        if (data.length > 0) {
          toast.success(`Payments by country updated (${data.length} countries)`);
        } else {
          const message = response.data.message || 'No payment by country data found';
          toast(message, { icon: '⚠️', duration: 4000 });
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: errorMessage } }));
      setPaymentsByCountry({ data: [], lastRefreshed: null });
      if (!silent) toast.error(`Error loading payments by country: ${errorMessage}`);
    }
  }, [getFilterParams]);


  const fetchAveragePaymentByCountry = useCallback(async (silent = false, widgetKey = 'averagePaymentByCountry') => {
    setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: true, error: null } }));
    try {
      const gpcFilterParams = getFilterParams();
      const config = applyGPCFilterToConfig({}, gpcFilterParams);
      const response = await apiClient.get('/contributor-payments/average-payment-by-country', config);
      setAveragePaymentByCountry({ data: response.data.data || [], lastRefreshed: response.data.lastRefreshed });
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: null } }));
      if (!silent) {
        if (response.data.data && response.data.data.length > 0) {
          toast.success('Average payment by country updated');
        } else {
          toast('No average payment by country data found', { icon: '⚠️' });
        }
      }
    } catch (error) {
      setWidgetStates(prev => ({ ...prev, [widgetKey]: { loading: false, error: error.message } }));
      if (!silent) toast.error(`Error loading average payment by country: ${error.message}`);
    }
  }, [getFilterParams]);

  // Widget-level refresh handlers
  const handleWidgetRefresh = (widgetKey) => {
    switch(widgetKey) {
      case 'totalContributors':
        fetchTotalContributors(false, widgetKey);
        break;
      case 'totalPayments':
        fetchTotalPayments(false, widgetKey);
        break;
      case 'averagePayment':
        fetchAveragePayment(false, widgetKey);
        break;
      case 'pendingCount':
        fetchPendingCount(false, widgetKey);
        break;
      case 'paymentsByStatus':
        fetchPaymentsByStatus(false, widgetKey);
        break;
      case 'paymentsByMethod':
        fetchPaymentsByMethod(false, widgetKey);
        break;
      case 'paymentsOverTime':
        fetchPaymentsOverTime(false, widgetKey);
        break;
      case 'topContributors':
        fetchTopContributors(false, widgetKey);
        break;
      case 'paymentsByCountry':
        fetchPaymentsByCountry(false, widgetKey);
        break;
      case 'averagePaymentByCountry':
        fetchAveragePaymentByCountry(false, widgetKey);
        break;
      default:
        break;
    }
  };

  // Render widget refresh button
  const renderWidgetRefresh = (widgetKey) => {
    const state = widgetStates[widgetKey];
    return (
      <button
        className="widget-refresh-btn"
        onClick={() => handleWidgetRefresh(widgetKey)}
        disabled={state?.loading}
        title={state?.loading ? 'Refreshing...' : state?.error ? 'Retry' : 'Refresh this widget'}
      >
        <RefreshCw size={14} className={state?.loading ? 'spinning' : ''} />
      </button>
    );
  };

  // Helper to show loading/error state in widget
  const renderWidgetStatus = (widgetKey) => {
    const state = widgetStates[widgetKey];
    if (state?.loading) {
      return (
        <div className="widget-loading">
          <Loader size={20} className="spinning" />
          <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>Loading...</span>
        </div>
      );
    }
    if (state?.error) {
      return (
        <div className="widget-error">
          <span>Error: {state.error}</span>
          <button onClick={() => handleWidgetRefresh(widgetKey)} className="retry-btn">Retry</button>
        </div>
      );
    }
    return null;
  };

  // Refresh all widgets
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchTotalContributors(true, 'totalContributors'),
      fetchTotalPayments(true, 'totalPayments'),
      fetchAveragePayment(true, 'averagePayment'),
      fetchPendingCount(true, 'pendingCount'),
      fetchPaymentsByStatus(true, 'paymentsByStatus'),
      fetchPaymentsByMethod(true, 'paymentsByMethod'),
      fetchPaymentsOverTime(true, 'paymentsOverTime'),
      fetchTopContributors(true, 'topContributors'),
      fetchPaymentsByCountry(true, 'paymentsByCountry'),
      fetchAveragePaymentByCountry(true, 'averagePaymentByCountry')
    ]).finally(() => {
      setRefreshing(false);
      toast.success('All widgets refreshed');
    });
  };

  // Export to Excel
  const handleExport = useCallback(() => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Contributors', totalContributors.value],
        ['Total Payments', formatCurrency(totalPayments.value)],
        ['Average Payment', formatCurrency(averagePayment.value)],
        ['Pending Amount', formatCurrency(pendingCount.value)]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Payments by Status
      if (paymentsByStatus.data.length > 0) {
        const statusData = [['Status', 'Count', 'Total Amount', 'Outstanding Amount']];
        paymentsByStatus.data.forEach(item => {
          statusData.push([item.status, item.count, item.totalAmount, item.outstandingAmount]);
        });
        const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
        XLSX.utils.book_append_sheet(workbook, statusSheet, 'Payments by Status');
      }

      // Top Contributors
      if (topContributors.data.length > 0) {
        const contributorsData = [['Name', 'Email', 'Total Payment', 'Outstanding', 'Status', 'Last Payment Date', 'Method']];
        topContributors.data.forEach(item => {
          contributorsData.push([
            item.name,
            item.email,
            formatCurrency(item.totalPaymentAmount),
            formatCurrency(item.outstandingBalance),
            item.paymentStatus,
            formatDate(item.lastPaymentDate),
            item.paymentMethod
          ]);
        });
        const contributorsSheet = XLSX.utils.aoa_to_sheet(contributorsData);
        XLSX.utils.book_append_sheet(workbook, contributorsSheet, 'Top Contributors');
      }

      XLSX.writeFile(workbook, `contributor-payments-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  }, [totalContributors, totalPayments, averagePayment, pendingCount, paymentsByStatus, topContributors]);

  // Load baseline data from localStorage on mount
  useEffect(() => {
    const loadBaselineData = () => {
      try {
        const baselineData = localStorage.getItem('contributorPaymentsBaseline');
        if (baselineData) {
          const parsed = JSON.parse(baselineData);
          
          // Restore all widget states from baseline
          if (parsed.totalContributors) {
            setTotalContributors(parsed.totalContributors);
          }
          if (parsed.totalPayments) {
            setTotalPayments(parsed.totalPayments);
          }
          if (parsed.averagePayment) {
            setAveragePayment(parsed.averagePayment);
          }
          if (parsed.pendingCount) {
            setPendingCount(parsed.pendingCount);
          }
          if (parsed.paymentsByStatus) {
            setPaymentsByStatus(parsed.paymentsByStatus);
          }
          if (parsed.paymentsByMethod) {
            setPaymentsByMethod(parsed.paymentsByMethod);
          }
          if (parsed.paymentsOverTime) {
            setPaymentsOverTime(parsed.paymentsOverTime);
          }
          if (parsed.topContributors) {
            setTopContributors(parsed.topContributors);
          }
          if (parsed.paymentsByCountry) {
            setPaymentsByCountry(parsed.paymentsByCountry);
          }
          if (parsed.averagePaymentByCountry) {
            setAveragePaymentByCountry(parsed.averagePaymentByCountry);
          }
          
          // Baseline data loaded from localStorage successfully
        } else {
          // No baseline data found in localStorage
        }
      } catch (error) {
        console.error('❌ Error loading baseline data:', error);
      } finally {
        // Mark baseline loading as complete after a short delay to ensure state updates
        setTimeout(() => {
          setIsLoadingBaseline(false);
        }, 100);
      }
    };
    
    loadBaselineData();
  }, []);
  
  // Save baseline data to localStorage whenever any widget data is updated
  useEffect(() => {
    // Don't save during initial baseline load
    if (isLoadingBaseline) {
      return;
    }
    
    const saveBaselineData = () => {
      try {
        const baselineData = {
          totalContributors,
          totalPayments,
          averagePayment,
          pendingCount,
          paymentsByStatus,
          paymentsByMethod,
          paymentsOverTime,
          topContributors,
          paymentsByCountry,
          averagePaymentByCountry,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('contributorPaymentsBaseline', JSON.stringify(baselineData));
      } catch (error) {
        console.error('❌ Error saving baseline data:', error);
      }
    };
    
    // Only save if at least one widget has data
    if (totalContributors.value > 0 || 
        totalPayments.value > 0 || 
        paymentsByStatus.data.length > 0 ||
        paymentsByMethod.data.length > 0 ||
        paymentsOverTime.data.length > 0 ||
        topContributors.data.length > 0 ||
        paymentsByCountry.data.length > 0 ||
        averagePaymentByCountry.data.length > 0) {
      saveBaselineData();
    }
  }, [isLoadingBaseline, totalContributors, totalPayments, averagePayment, pendingCount, paymentsByStatus, paymentsByMethod, paymentsOverTime, topContributors, paymentsByCountry, averagePaymentByCountry]);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="contributor-payments-dashboard" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease' }}>
        <div className="contributor-payments-container">
          <div className="contributor-payments-header">
            <div className="header-content">
              <div className="header-left">
                <button
                  className="header-menu-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="page-title">Contributor Payments Analytics</h1>
                  <p className="page-subtitle">View payment metrics and analytics</p>
                </div>
              </div>
              <div className="header-right">
                <GPCFilterToggle />
              </div>
              <div className="header-user-profile">
                <BookmarkButton pageName="Contributor Payments Analytics" pageType="page" />
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          <div className="contributor-payments-content">
            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginBottom: '24px',
              alignItems: 'center'
            }}>
              <button 
                className="btn-secondary" 
                onClick={handleRefresh}
                disabled={refreshing}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  background: '#f5f5f5',
                  color: '#002329',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !refreshing && (e.target.style.background = '#e6e6e6')}
                onMouseLeave={(e) => !refreshing && (e.target.style.background = '#f5f5f5')}
                title="Refresh All"
              >
                {refreshing ? <Loader size={16} className="spinning" /> : <RefreshCw size={16} />}
                <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleExport}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  background: '#f5f5f5',
                  color: '#002329',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e6e6e6'}
                onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
                title="Export to Excel"
              >
                <Download size={16} />
                Export
              </button>
            </div>

            {/* GPC-Filter Toggle */}
            <div style={{ marginBottom: '24px' }}>
              <GPCFilterToggle />
            </div>

            {/* KPI Cards - Grid Layout */}
            <div className="kpi-grid">
              {/* Widget 1: Total Contributors */}
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Total Contributors</span>
                  <div className="widget-actions">
                    {renderWidgetRefresh('totalContributors')}
                  </div>
                </div>
                {renderWidgetStatus('totalContributors') || (
                  <>
                    <div className="kpi-value">{formatNumber(totalContributors.value)}</div>
                    <div className="kpi-footer">As of {formatDate(totalContributors.lastRefreshed)}</div>
                  </>
                )}
              </div>

              {/* Widget 2: Total Payments */}
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Total Payments</span>
                  <div className="widget-actions">
                    {renderWidgetRefresh('totalPayments')}
                  </div>
                </div>
                {renderWidgetStatus('totalPayments') || (
                  <>
                    <div className="kpi-value">{formatCurrency(totalPayments.value)}</div>
                    <div className="kpi-footer">As of {formatDate(totalPayments.lastRefreshed)}</div>
                  </>
                )}
              </div>

              {/* Widget 3: Average Payment */}
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Average Payment</span>
                  <div className="widget-actions">
                    {renderWidgetRefresh('averagePayment')}
                  </div>
                </div>
                {renderWidgetStatus('averagePayment') || (
                  <>
                    <div className="kpi-value">{formatCurrency(averagePayment.value)}</div>
                    <div className="kpi-footer">As of {formatDate(averagePayment.lastRefreshed)}</div>
                  </>
                )}
              </div>

              {/* Widget 4: Pending Amount */}
              <div className="kpi-card yellow">
                <div className="kpi-header">
                  <span className="kpi-label">Pending</span>
                  <div className="widget-actions">
                    {renderWidgetRefresh('pendingCount')}
                  </div>
                </div>
                {renderWidgetStatus('pendingCount') || (
                  <>
                    <div className="kpi-value">{formatCurrency(pendingCount.value)}</div>
                    <div className="kpi-footer">As of {formatDate(pendingCount.lastRefreshed)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Top Contributors Table - Right after summary */}
            <div className="charts-grid">
              {/* Widget 12: Top Contributors Table */}
              <div className="chart-card top-contributors-table-card" style={{ gridColumn: '1 / -1' }}>
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#08979C" />
                    <h3>Top Contributors by Payment Amount</h3>
                  </div>
                  <div className="widget-actions">
                    {renderWidgetRefresh('topContributors')}
                  </div>
                </div>
                {renderWidgetStatus('topContributors') || (
                  topContributors.data.length > 0 ? (
                    <>
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Total Payment</th>
                              <th>Outstanding</th>
                              <th>Status</th>
                              <th>Last Payment Date</th>
                              <th>Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topContributors.data.map((contributor) => (
                              <tr key={contributor.id}>
                                <td>{contributor.name}</td>
                                <td>{contributor.email}</td>
                                <td>{formatCurrency(contributor.totalPaymentAmount)}</td>
                                <td>{formatCurrency(contributor.outstandingBalance)}</td>
                                <td>
                                  <span className={`status-badge status-${contributor.paymentStatus?.toLowerCase()}`}>
                                    {contributor.paymentStatus}
                                  </span>
                                </td>
                                <td>{formatDate(contributor.lastPaymentDate)}</td>
                                <td>{contributor.paymentMethod}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="chart-footer">As of {formatDate(topContributors.lastRefreshed)}</div>
                    </>
                  ) : (
                    <div className="no-data">No top contributors data available</div>
                  )
                )}
              </div>
            </div>

            {/* Charts Grid - Grid Layout - All Graph Widgets */}
            <div className="charts-grid">
              {/* Widget 8: Payments by Status */}
              <div className="chart-card">
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#08979C" />
                    <h3>Payments by Status</h3>
                  </div>
                  <div className="widget-actions">
                    {renderWidgetRefresh('paymentsByStatus')}
                  </div>
                </div>
                {renderWidgetStatus('paymentsByStatus') || (
                  paymentsByStatus.data.length > 0 ? (
                    <>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={paymentsByStatus.data}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => {
                                // Only show label if percentage is >= 5% to avoid clutter
                                if (percent >= 0.05) {
                                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                                }
                                return '';
                              }}
                              outerRadius={100}
                              innerRadius={30}
                              fill="#8884d8"
                              dataKey="count"
                              paddingAngle={2}
                            >
                              {paymentsByStatus.data.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={STATUS_COLORS[index % STATUS_COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0];
                                  const entry = data.payload;
                                  const color = STATUS_COLORS[paymentsByStatus.data.findIndex(e => e.status === entry.status) % STATUS_COLORS.length];
                                  return (
                                    <div style={{
                                      backgroundColor: 'white',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}>
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        marginBottom: '8px'
                                      }}>
                                        <div style={{
                                          width: '16px',
                                          height: '16px',
                                          borderRadius: '4px',
                                          backgroundColor: color,
                                          border: '1px solid #d1d5db'
                                        }}></div>
                                        <strong style={{ fontSize: '14px', color: '#111827' }}>
                                          {entry.status || 'No Status'}
                                        </strong>
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                                        <div>Count: <strong style={{ color: '#111827' }}>{formatNumber(entry.count)}</strong></div>
                                        {entry.totalAmount !== undefined && (
                                          <div>Total Amount: <strong style={{ color: '#111827' }}>{formatCurrency(entry.totalAmount)}</strong></div>
                                        )}
                                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#9ca3af' }}>
                                          Percentage: {((entry.count / paymentsByStatus.data.reduce((sum, e) => sum + e.count, 0)) * 100).toFixed(1)}%
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend showing status colors */}
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        {paymentsByStatus.data.map((entry, index) => {
                          const color = STATUS_COLORS[index % STATUS_COLORS.length];
                          return (
                            <div 
                              key={`legend-${index}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '3px',
                                backgroundColor: color,
                                border: '1px solid #d1d5db',
                                flexShrink: 0
                              }}></div>
                              <span style={{ color: '#374151' }}>
                                {entry.status || 'No Status'} ({formatNumber(entry.count)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="chart-footer">As of {formatDate(paymentsByStatus.lastRefreshed)}</div>
                    </>
                  ) : (
                    <div className="no-data">No payment status data available</div>
                  )
                )}
              </div>

              {/* Widget 9: Payments by Method */}
              <div className="chart-card">
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#08979C" />
                    <h3>Payments by Method</h3>
                  </div>
                  <div className="widget-actions">
                    {renderWidgetRefresh('paymentsByMethod')}
                  </div>
                </div>
                {renderWidgetStatus('paymentsByMethod') || (
                  paymentsByMethod.data.length > 0 ? (
                    <>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={paymentsByMethod.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="method" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="count" fill="#08979C" name="Count" />
                            <Bar dataKey="totalAmount" fill="#13C2C2" name="Total Amount" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="chart-footer">As of {formatDate(paymentsByMethod.lastRefreshed)}</div>
                    </>
                  ) : (
                    <div className="no-data">No payment method data available</div>
                  )
                )}
              </div>

              {/* Widget 10: Payments Over Time */}
              <div className="chart-card">
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#08979C" />
                    <h3>Payments Over Time</h3>
                  </div>
                  <div className="widget-actions">
                    {renderWidgetRefresh('paymentsOverTime')}
                  </div>
                </div>
                {renderWidgetStatus('paymentsOverTime') || (
                  paymentsOverTime.data.length > 0 ? (
                    <>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={paymentsOverTime.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="totalAmount" stroke="#08979C" name="Total Amount" />
                            <Line type="monotone" dataKey="count" stroke="#13C2C2" name="Count" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="chart-footer">As of {formatDate(paymentsOverTime.lastRefreshed)}</div>
                    </>
                  ) : (
                    <div className="no-data">No payment over time data available</div>
                  )
                )}
              </div>

              {/* Widget 11: Payments by Country - Full Width */}
              <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#08979C" />
                    <h3>Payments by Country</h3>
                  </div>
                  <div className="widget-actions">
                    {renderWidgetRefresh('paymentsByCountry')}
                  </div>
                </div>
                {renderWidgetStatus('paymentsByCountry') || (
                  paymentsByCountry.data.length > 0 ? (
                    <>
                      <div className="chart-container" style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}>
                        <div style={{ minWidth: `${Math.max(800, paymentsByCountry.data.length * 80)}px`, height: '350px' }}>
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={paymentsByCountry.data} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="country" 
                                angle={-45} 
                                textAnchor="end" 
                                height={100}
                                interval={0}
                                tick={{ fontSize: 12 }}
                              />
                            <YAxis 
                              yAxisId="left" 
                              tickFormatter={(value) => formatCurrency(value)}
                              label={{ value: 'Total Amount ($)', angle: -90, position: 'insideLeft' }}
                            />
                            <YAxis 
                              yAxisId="right" 
                              orientation="right"
                              tickFormatter={(value) => formatNumber(value)}
                              label={{ value: 'Contributor Count', angle: 90, position: 'insideRight' }}
                            />
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div style={{
                                      backgroundColor: 'white',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}>
                                      <div style={{ 
                                        fontSize: '14px', 
                                        fontWeight: 'bold',
                                        color: '#111827',
                                        marginBottom: '8px'
                                      }}>
                                        {label || 'Unknown Country'}
                                      </div>
                                      {payload.map((entry, index) => (
                                        <div 
                                          key={`tooltip-${index}`}
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginTop: '4px',
                                            fontSize: '13px'
                                          }}
                                        >
                                          <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px' 
                                          }}>
                                            <div style={{
                                              width: '12px',
                                              height: '12px',
                                              backgroundColor: entry.color,
                                              borderRadius: '2px'
                                            }}></div>
                                            <span style={{ color: '#6b7280' }}>
                                              {entry.name}:
                                            </span>
                                          </div>
                                          <strong style={{ color: '#111827' }}>
                                            {entry.dataKey === 'count' 
                                              ? formatNumber(entry.value) 
                                              : formatCurrency(entry.value)
                                            }
                                          </strong>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Bar 
                              yAxisId="left"
                              dataKey="totalAmount" 
                              fill="#08979C" 
                              name="Total Amount ($)" 
                            />
                            <Bar 
                              yAxisId="right"
                              dataKey="count" 
                              fill="#13C2C2" 
                              name="Contributor Count" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="chart-footer">
                        As of {formatDate(paymentsByCountry.lastRefreshed)} - Showing all {paymentsByCountry.data.length} countries (scroll horizontally to view all)
                        {paymentsByCountry.totalRecords && ` - Total records: ${paymentsByCountry.totalRecords}`}
                      </div>
                    </>
                  ) : (
                    <div className="no-data">
                      {paymentsByCountry.message ? (
                        <div>
                          <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>No payment by country data available</p>
                          <p style={{ fontSize: '14px', color: '#666' }}>{paymentsByCountry.message}</p>
                        </div>
                      ) : (
                        'No payment by country data available'
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Widget 15: Average Payment by Country - Full Width */}
              <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#08979C" />
                    <h3>Average Payment by Country</h3>
                  </div>
                  <div className="widget-actions">
                    {renderWidgetRefresh('averagePaymentByCountry')}
                  </div>
                </div>
                {renderWidgetStatus('averagePaymentByCountry') || (
                  averagePaymentByCountry.data.length > 0 ? (
                    <>
                      <div className="chart-container" style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}>
                        <div style={{ minWidth: `${Math.max(800, averagePaymentByCountry.data.length * 80)}px`, height: '350px' }}>
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={averagePaymentByCountry.data} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="country" 
                                angle={-45} 
                                textAnchor="end" 
                                height={100}
                                interval={0}
                                tick={{ fontSize: 12 }}
                              />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div style={{
                                      backgroundColor: 'white',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}>
                                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                                        {data.country}
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                        Average: <strong style={{ color: '#111827' }}>{data.averageAmountFormatted || data.averageAmount}</strong>
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                        Total: <strong style={{ color: '#111827' }}>{data.totalAmountFormatted || data.totalAmount}</strong>
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                        Contributors: <strong style={{ color: '#111827' }}>{data.countFormatted || data.count}</strong>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Bar dataKey="averageAmount" fill="#08979C" name="Average Payment ($)" />
                          </BarChart>
                        </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="chart-footer">As of {formatDate(averagePaymentByCountry.lastRefreshed)} - Showing all {averagePaymentByCountry.data.length} countries (scroll horizontally to view all)</div>
                    </>
                  ) : (
                    <div className="no-data">No average payment by country data available</div>
                  )
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorPaymentsDashboard;
