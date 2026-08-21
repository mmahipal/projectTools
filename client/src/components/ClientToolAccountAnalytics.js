import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import AccountStatusDashboard from './ClientToolAccountAnalytics/AccountStatusDashboard';
import ProjectCoverageAnalytics from './ClientToolAccountAnalytics/ProjectCoverageAnalytics';
import AccountUtilizationAnalytics from './ClientToolAccountAnalytics/AccountUtilizationAnalytics';

const ClientToolAccountAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/client-tool-account/analytics/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load analytics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '60px 20px',
        gap: '16px',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'Poppins' }}>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '60px 20px',
        gap: '16px'
      }}>
        <AlertCircle size={32} style={{ color: '#d32f2f' }} />
        <p style={{ color: '#d32f2f', fontSize: '14px' }}>{error}</p>
        <button
          onClick={fetchAnalytics}
          style={{
            padding: '8px 16px',
            background: '#0176d3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
          Client Tool Account Analytics
        </h2>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: loading ? 0.6 : 1
          }}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Phase 1 Analytics */}
      {data?.accountStatus && (
        <AccountStatusDashboard data={data.accountStatus} />
      )}
      
      {data?.projectCoverage && (
        <ProjectCoverageAnalytics data={data.projectCoverage} />
      )}
      
      {data?.accountUtilization && (
        <AccountUtilizationAnalytics data={data.accountUtilization} />
      )}

      {(!data || (!data.accountStatus && !data.projectCoverage && !data.accountUtilization)) && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#666',
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <p>No analytics data available</p>
        </div>
      )}
    </div>
  );
};

export default ClientToolAccountAnalytics;

