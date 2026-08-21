import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Loader, AlertCircle } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';

const CompletionRatesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/workstream-analytics/completion-rates');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch completion rates');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load completion rates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container" style={{ 
        minHeight: 'calc(100vh - 200px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px 20px',
        color: '#666',
        width: '100%',
        textAlign: 'center',
        gap: '16px',
        fontFamily: 'Poppins, sans-serif'
      }}>
        <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
        <p style={{ color: '#706e6b', fontSize: '14px', margin: 0 }}>Loading completion rates...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '16px' }}>
        <AlertCircle size={32} style={{ color: '#d32f2f' }} />
        <p style={{ color: '#d32f2f', fontSize: '14px' }}>{error || 'No data available'}</p>
        <button onClick={fetchData} style={{ padding: '8px 16px', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const { completionData, overallStats } = data;

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <BarChart3 size={20} color="#0176d3" />
          Project Objective Completion Rates
        </h3>
        <button onClick={fetchData} disabled={loading} style={{ padding: '8px 16px', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      {/* Overall Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Total Objectives</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#0176d3' }}>{overallStats.totalObjectives}</div>
        </div>
        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>With Workstreams</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>{overallStats.objectivesWithWorkstreams}</div>
        </div>
        <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Avg Completion Rate</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#d97706' }}>{overallStats.averageCompletionRate}%</div>
        </div>
      </div>

      {/* Completion Data Table */}
      <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>OBJECTIVE</th>
              <th style={{ textAlign: 'right' }}>TOTAL WS</th>
              <th style={{ textAlign: 'right' }}>COMPLETED</th>
              <th style={{ textAlign: 'right' }}>ACTIVE</th>
              <th style={{ textAlign: 'right' }}>COMPLETION RATE</th>
            </tr>
          </thead>
          <tbody>
            {completionData.slice(0, 100).map((item) => (
              <tr key={item.objectiveId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontSize: '13px' }}>{item.objectiveName}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{item.totalWorkstreams}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{item.completedWorkstreams}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{item.activeWorkstreams}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                  {item.completionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletionRatesAnalytics;

