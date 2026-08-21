import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, Loader, AlertCircle } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';

const ComparativeAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/workstream-analytics/comparative');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch comparative analysis');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load comparative analysis';
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
        <p style={{ color: '#706e6b', fontSize: '14px', margin: 0 }}>Loading comparative analysis...</p>
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

  const { toolComparison, objectiveComparison, summary } = data;

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Users size={20} color="#0176d3" />
          Comparative Analysis Across Workstreams
        </h3>
        <button onClick={fetchData} disabled={loading} style={{ padding: '8px 16px', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Workstreams</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#0176d3' }}>{summary.totalWorkstreams}</div>
        </div>
        <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Tools</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#0176d3' }}>{summary.totalTools}</div>
        </div>
        <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Objectives</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#0176d3' }}>{summary.totalObjectives}</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Tool Comparison */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Comparison by Delivery Tool</h4>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>TOOL</th>
                  <th style={{ textAlign: 'right' }}>COUNT</th>
                  <th style={{ textAlign: 'right' }}>ACTIVE</th>
                  <th style={{ textAlign: 'right' }}>AVG AGE</th>
                </tr>
              </thead>
              <tbody>
                {toolComparison.map((tool, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px' }}>{tool.toolName}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{tool.count}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{tool.activeCount}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{tool.averageAge} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Objective Comparison */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Comparison by Project Objective</h4>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>OBJECTIVE</th>
                  <th style={{ textAlign: 'right' }}>WS COUNT</th>
                  <th style={{ textAlign: 'right' }}>ACTIVE</th>
                  <th style={{ textAlign: 'right' }}>COMPLETED</th>
                </tr>
              </thead>
              <tbody>
                {objectiveComparison.slice(0, 50).map((obj, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px' }}>{obj.objectiveName}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{obj.workstreamCount}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{obj.activeCount}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{obj.completedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparativeAnalysis;

