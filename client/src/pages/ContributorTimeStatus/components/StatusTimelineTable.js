import React, { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { exportData } from '../../../utils/crossFeature/exportService';
import toast from 'react-hot-toast';
import apiClient from '../../../config/api';
import '../../../styles/ContributorTimeStatus/StatusTimelineTable.css';

const StatusTimelineTable = ({ data, error, onRefresh, selectedAccount }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(data?.pagination?.hasMore || false);
  const [offset, setOffset] = useState(0);
  const [allData, setAllData] = useState(data?.data || []);
  
  useEffect(() => {
    if (data) {
      setAllData(data.data || []);
      setHasMore(data.pagination?.hasMore || false);
      setOffset(data.pagination?.offset || 0);
    }
  }, [data]);
  
  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };
  
  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const params = {
        limit: 100,
        offset: offset + 100
      };
      if (selectedAccount && selectedAccount !== 'all') {
        params.account = selectedAccount;
      }
      
      const response = await apiClient.get('/contributor-time-status/timeline', {
        params,
        timeout: 300000
      });
      
      if (response.data.success) {
        setAllData(prev => [...prev, ...(response.data.data || [])]);
        setOffset(response.data.pagination?.offset || 0);
        setHasMore(response.data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
      toast.error('Failed to load more data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = (format) => {
    if (!allData || allData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    // Flatten data for export
    const exportDataArray = allData.map(item => ({
      'Contributor Name': item.contributorName,
      'Project Name': item.projectName,
      'Project Objective': item.projectObjectiveName,
      'Current Status': item.currentStatus,
      'Days in Current Status': item.daysInCurrentStatus,
      'Total Time to Active': item.totalTimeToActive || 'N/A',
      'Total Time in Project': item.totalTimeInProject
    }));
    
    exportData(exportDataArray, 'contributor-time-status', format);
    toast.success(`Exported ${allData.length} records as ${format.toUpperCase()}`);
  };
  
  if (error) {
    return (
      <div className="timeline-table-error">
        <p>Error loading timeline data: {error}</p>
      </div>
    );
  }
  
  if (!allData || allData.length === 0) {
    return (
      <div className="timeline-table-empty">
        <p>No timeline data available</p>
      </div>
    );
  }
  
  // Status color mapping
  const statusColors = {
    'Draft': '#94a3b8',
    'Invite': '#3b82f6',
    'App Received': '#8b5cf6',
    'Matched': '#ec4899',
    'Qualified': '#f59e0b',
    'Active': '#10b981',
    'Production': '#06b6d4',
    'Removed': '#ef4444'
  };
  
  return (
    <div className="status-timeline-table">
      <div className="table-header">
        <div className="table-title-section">
          <h3 className="table-title">Contributor Status Timeline</h3>
          <p className="table-subtitle">Individual contributor journey through statuses</p>
        </div>
        <div className="table-actions">
          <button
            className="export-btn"
            onClick={() => handleExport('excel')}
          >
            <Download size={16} /> Export Excel
          </button>
          <button
            className="export-btn"
            onClick={() => handleExport('csv')}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            className="refresh-btn"
            onClick={() => onRefresh(true)}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="timeline-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Contributor</th>
              <th>Project</th>
              <th>Objective</th>
              <th>Current Status</th>
              <th>Days in Status</th>
              <th>Time to Active</th>
              <th>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {allData.map((item, index) => {
              const isExpanded = expandedRows.has(item.contributorProjectId);
              return (
                <React.Fragment key={item.contributorProjectId}>
                  <tr className="main-row">
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => toggleRow(item.contributorProjectId)}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td>{item.contributorName}</td>
                    <td>{item.projectName}</td>
                    <td>{item.projectObjectiveName}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          background: statusColors[item.currentStatus] || '#94a3b8',
                          color: '#fff'
                        }}
                      >
                        {item.currentStatus}
                      </span>
                    </td>
                    <td>{item.daysInCurrentStatus} days</td>
                    <td>{item.totalTimeToActive ? `${item.totalTimeToActive} days` : 'N/A'}</td>
                    <td>{item.totalTimeInProject} days</td>
                  </tr>
                  {isExpanded && (
                    <tr className="expanded-row">
                      <td colSpan="8">
                        <div className="timeline-details">
                          <h4>Status Timeline</h4>
                          <div className="timeline-visual">
                            {item.statusTimeline.map((period, idx) => (
                              <div key={idx} className="timeline-period">
                                <div 
                                  className="timeline-bar"
                                  style={{ 
                                    background: statusColors[period.status] || '#94a3b8',
                                    width: `${(period.days / item.totalTimeInProject) * 100}%`
                                  }}
                                  title={`${period.status}: ${period.days} days`}
                                >
                                  <span className="timeline-label">{period.status}</span>
                                </div>
                                <div className="timeline-info">
                                  <span>{period.startDate} to {period.endDate}</span>
                                  <span>{period.days} days</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="timeline-list">
                            {item.statusTimeline.map((period, idx) => (
                              <div key={idx} className="timeline-item">
                                <div 
                                  className="status-indicator"
                                  style={{ background: statusColors[period.status] || '#94a3b8' }}
                                />
                                <div className="timeline-item-content">
                                  <strong>{period.status}</strong>
                                  <span>{period.startDate} - {period.endDate}</span>
                                  <span>{period.days} days</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {hasMore && (
        <div className="load-more-container">
          <button
            className="load-more-btn"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusTimelineTable;

