import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { Filter, ArrowUpDown, ArrowUp, ArrowDown, Calendar, User, Tag, Package } from 'lucide-react';
import '../styles/AuditLogs.css';

const AuditLogs = () => {
  const { user, hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    user: '',
    action: 'All',
    objectType: 'All',
    startDate: '',
    endDate: ''
  });
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [sortField, setSortField] = useState('timestamp');
  const [allLogs, setAllLogs] = useState([]); // Store all logs to extract unique object types

  const actionOptions = ['All', 'Added', 'Modified', 'Deleted', 'Published', 'Updated', 'Created'];

  useEffect(() => {
    if (hasPermission('all')) {
      fetchAuditLogs();
    }
  }, [filters, sortOrder, sortField]);

  // Fetch all logs once to extract unique object types
  useEffect(() => {
    if (hasPermission('all')) {
      fetchAllLogsForObjectTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllLogsForObjectTypes = async () => {
    try {
      const response = await apiClient.get('/audit-logs?sortOrder=desc');
      if (response.data.success) {
        setAllLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching all logs for object types:', error);
    }
  };

  // Get unique object types from all logs
  const getUniqueObjectTypes = () => {
    const objectTypes = new Set();
    allLogs.forEach(log => {
      if (log.objectType) {
        objectTypes.add(log.objectType);
      }
    });
    return Array.from(objectTypes).sort();
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.user) params.append('user', filters.user);
      if (filters.action && filters.action !== 'All') params.append('action', filters.action);
      if (filters.objectType && filters.objectType !== 'All') params.append('objectType', filters.objectType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('sortOrder', sortOrder);

      const response = await apiClient.get(`/audit-logs?${params.toString()}`);
      if (response.data.success) {
        let logsData = response.data.logs || [];
        
        // Client-side sorting by field
        logsData.sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];
          
          if (sortField === 'timestamp') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          } else if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });
        
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getActionColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('add') || actionLower.includes('create')) {
      return '#52c41a'; // Green
    } else if (actionLower.includes('modify') || actionLower.includes('update')) {
      return '#1890ff'; // Blue
    } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return '#ff4d4f'; // Red
    }
    return '#666'; // Default gray
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    }
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  if (!hasPermission('all')) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Filters */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Filter size={18} style={{ color: '#08979C' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins', margin: 0 }}>Filters</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#002329', fontFamily: 'Poppins' }}>
              <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
              User
            </label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              placeholder="Filter by user email"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#002329', fontFamily: 'Poppins' }}>
              <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Poppins',
                backgroundColor: '#fff'
              }}
            >
              {actionOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#002329', fontFamily: 'Poppins' }}>
              <Package size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Object Type
            </label>
            <select
              value={filters.objectType}
              onChange={(e) => handleFilterChange('objectType', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Poppins',
                backgroundColor: '#fff'
              }}
            >
              <option value="All">All</option>
              {getUniqueObjectTypes().map(objectType => (
                <option key={objectType} value={objectType}>{objectType}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#002329', fontFamily: 'Poppins' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#002329', fontFamily: 'Poppins' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
            />
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setFilters({ user: '', action: 'All', objectType: 'All', startDate: '', endDate: '' });
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              color: '#002329',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'Poppins',
              fontWeight: 500
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>No audit logs found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                  <th 
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#002329', 
                      fontFamily: 'Poppins',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => handleSort('timestamp')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Timestamp
                      {getSortIcon('timestamp')}
                    </div>
                  </th>
                  <th 
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#002329', 
                      fontFamily: 'Poppins',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => handleSort('user')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      User
                      {getSortIcon('user')}
                    </div>
                  </th>
                  <th 
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#002329', 
                      fontFamily: 'Poppins',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => handleSort('action')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Action
                      {getSortIcon('action')}
                    </div>
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Object Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Object Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Salesforce ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                      {log.user || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: getActionColor(log.action),
                        color: '#fff',
                        display: 'inline-block'
                      }}>
                        {log.action || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                      {log.objectType || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#002329' }}>
                      {log.objectName || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins', color: '#666' }}>
                      {log.salesforceId ? (
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {log.salesforceId.length > 15 ? `${log.salesforceId.substring(0, 15)}...` : log.salesforceId}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'Poppins' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: log.status === 'success' ? '#52c41a' : '#ff4d4f',
                        color: '#fff'
                      }}>
                        {log.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {logs.length > 0 && (
          <div style={{ 
            padding: '16px', 
            borderTop: '1px solid #e0e0e0', 
            backgroundColor: '#f9f9f9',
            fontSize: '14px',
            fontFamily: 'Poppins',
            color: '#666'
          }}>
            Total: {logs.length} audit log{logs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;

