/**
 * Queue Status Analytics Dashboard Component
 * Displays analytics and metrics for queue status
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, TrendingUp, Download, RefreshCw, Loader } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
// import * as XLSX from 'xlsx'; // Unused
import '../styles/CaseManagement.css';

const QueueStatusDashboard = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Use apiClient with extended timeout for analytics
      // apiClient already includes auth token and CSRF handling via interceptors
      const response = await apiClient.get('/queue-status-management/analytics/dashboard', {
        timeout: 120000 // 2 minutes timeout for analytics
      });
      if (response.data.success) {
        setDashboardData(response.data.data);
        const totalCount = response.data.data?.projectsByStatus?.total || response.data.totalCount || 0;
        const sampleCount = response.data.recordCount || 0;
        if (response.data._metadata) {
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch dashboard data';
      if (error.message?.includes('timeout') || error.response?.status === 504) {
        toast.error('Dashboard request timed out. Try again or contact support if the issue persists.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'xlsx') => {
    setExporting(true);
    try {
      const response = await apiClient.get(`/queue-status-management/analytics/export?format=${format}`, {
        responseType: format === 'json' ? 'json' : 'blob'
      });

      if (format === 'xlsx' || format === 'csv') {
        const blob = new Blob([response.data], {
          type: format === 'xlsx' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `queue-status-report-${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success(`Report exported as ${format.toUpperCase()}`);
      } else {
        // JSON export
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `queue-status-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Report exported as JSON');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>No data available</p>
      </div>
    );
  }

  const { projectsByStatus, timeInQueue, changeFrequency } = dashboardData;

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Queue Status Analytics</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchDashboardData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            {exporting ? <Loader size={14} className="spinning" /> : <Download size={14} />}
            Export
          </button>
        </div>
      </div>

      {/* Contributor Projects by Queue Status */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} />
          Contributor Projects by Queue Status
        </h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px', fontStyle: 'italic' }}>
          Note: Queue Status is tracked at the Contributor Project level. One Project may have multiple Contributor Projects with different queue statuses.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Object.entries(projectsByStatus).filter(([key]) => key !== 'total').map(([status, count]) => (
            <div
              key={status}
              style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{status}</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{count}</div>
            </div>
          ))}
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{projectsByStatus.total}</div>
          </div>
        </div>
      </div>

      {/* Time in Queue Metrics */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} />
          Time in Queue Metrics
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Count</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Avg Days</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Min Days</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Max Days</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(timeInQueue).filter(([status]) => status !== '--None--' || timeInQueue[status].count > 0).map(([status, metrics]) => (
                <tr key={status} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{status}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>{metrics.count}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>{metrics.averageDays.toFixed(1)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>{metrics.minDays === Infinity ? '-' : metrics.minDays}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>{metrics.maxDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Frequency */}
      {changeFrequency && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} />
            Status Change Frequency (Last 30 Days)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Changes</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{changeFrequency.totalChanges}</div>
            </div>
            {Object.entries(changeFrequency.byStatus || {}).map(([status, count]) => (
              <div
                key={status}
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Changes to {status}</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{count}</div>
              </div>
            ))}
          </div>
          {changeFrequency.topTransitions && changeFrequency.topTransitions.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Top Transitions</h4>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '12px' }}>
                {changeFrequency.topTransitions.map((transition, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px',
                      borderBottom: index < changeFrequency.topTransitions.length - 1 ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>{transition.transition}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{transition.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueueStatusDashboard;

