import React, { useState, useEffect } from 'react';
import { Wrench, RefreshCw, Loader, AlertCircle } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';

const ToolPerformanceMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/workstream-analytics/tool-performance');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch tool performance');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load tool performance';
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
        <p style={{ color: '#706e6b', fontSize: '14px', margin: 0 }}>Loading tool performance...</p>
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

  const { toolPerformance, totalTools } = data;

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Wrench size={20} color="#0176d3" />
          Delivery Tool Performance Metrics
        </h3>
        <button onClick={fetchData} disabled={loading} style={{ padding: '8px 16px', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Total Tools: </span>
        <span style={{ fontSize: '16px', fontWeight: '600' }}>{totalTools}</span>
      </div>

      {/* Tool Performance Table */}
      <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>TOOL NAME</th>
              <th style={{ textAlign: 'right' }}>TOTAL WS</th>
              <th style={{ textAlign: 'right' }}>ACTIVE</th>
              <th style={{ textAlign: 'right' }}>COMPLETED</th>
              <th style={{ textAlign: 'right' }}>COMPLETION RATE</th>
              <th style={{ textAlign: 'right' }}>AVG AGE (DAYS)</th>
            </tr>
          </thead>
          <tbody>
            {toolPerformance.map((tool, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontSize: '13px' }}>{tool.toolName}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{tool.totalWorkstreams}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{tool.activeWorkstreams}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{tool.completedWorkstreams}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                  {tool.completionRate}%
                </td>
                <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{tool.averageAge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ToolPerformanceMetrics;

