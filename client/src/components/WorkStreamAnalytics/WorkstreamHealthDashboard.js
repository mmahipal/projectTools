import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Loader, Wrench } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';

const WorkstreamHealthDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/workstream-analytics/health-dashboard');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch health dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load health dashboard';
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
        <p style={{ color: '#706e6b', fontSize: '14px', margin: 0 }}>Loading health dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '16px' }}>
        <AlertCircle size={32} style={{ color: '#d32f2f' }} />
        <p style={{ color: '#d32f2f', fontSize: '14px' }}>{error || 'No data available'}</p>
        <button
          onClick={fetchData}
          style={{
            padding: '8px 16px',
            background: '#0176d3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
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

  const { totalWorkstreams, activeWorkstreams, inactiveWorkstreams, completedWorkstreams, healthByTool, healthScore, statusDistribution } = data;

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Activity size={20} color="#0176d3" />
          Workstream Health Dashboard
        </h3>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#0176d3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
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

      {/* Health Score */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Overall Health Score</div>
        <div style={{ fontSize: '32px', fontWeight: '600', color: '#0176d3' }}>{healthScore}%</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {activeWorkstreams} of {totalWorkstreams} workstreams are active
        </div>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Active</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>{activeWorkstreams}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {totalWorkstreams > 0 ? ((activeWorkstreams / totalWorkstreams) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <XCircle size={20} color="#dc2626" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Inactive</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>{inactiveWorkstreams}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {totalWorkstreams > 0 ? ((inactiveWorkstreams / totalWorkstreams) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Completed</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>{completedWorkstreams}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {totalWorkstreams > 0 ? ((completedWorkstreams / totalWorkstreams) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity size={20} color="#0176d3" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Total</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#0176d3' }}>{totalWorkstreams}</div>
        </div>
      </div>

      {/* Health by Tool */}
      {healthByTool && Object.keys(healthByTool).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '2px solid #e5e7eb',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0176d3 0%, #5ab8e8 100%)',
              boxShadow: '0 4px 12px rgba(1, 118, 211, 0.3)'
            }}>
              <Wrench size={24} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                margin: 0,
                marginBottom: '4px',
                background: 'linear-gradient(135deg, #0176d3 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}>
                Health by Delivery Tool
              </h4>
              <p style={{ 
                fontSize: '13px', 
                color: '#666', 
                margin: 0,
                fontWeight: '400'
              }}>
                Performance metrics across different delivery tools
              </p>
            </div>
            <div style={{
              width: '4px',
              height: '48px',
              background: 'linear-gradient(180deg, #0176d3 0%, #059669 100%)',
              borderRadius: '2px',
              marginLeft: '8px'
            }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {Object.entries(healthByTool).map(([tool, stats]) => {
              const activePercentage = stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0;
              const healthColor = activePercentage >= 70 ? '#059669' : activePercentage >= 40 ? '#f59e0b' : '#dc2626';
              return (
                <div 
                  key={tool} 
                  style={{ 
                    padding: '20px', 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                    borderRadius: '12px', 
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = '#0176d3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  {/* Decorative accent */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${healthColor} 0%, ${healthColor}dd 100%)`
                  }}></div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#002329',
                      letterSpacing: '-0.01em'
                    }}>
                      {tool}
                    </div>
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: `${healthColor}15`,
                      border: `1px solid ${healthColor}40`,
                      fontSize: '11px',
                      fontWeight: '600',
                      color: healthColor
                    }}>
                      {activePercentage}% Active
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      padding: '10px', 
                      background: '#f0f9ff', 
                      borderRadius: '8px',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>Total</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0176d3' }}>{stats.total}</div>
                    </div>
                    <div style={{ 
                      padding: '10px', 
                      background: '#f0fdf4', 
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>Active</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>{stats.active}</div>
                    </div>
                    <div style={{ 
                      padding: '10px', 
                      background: '#fef2f2', 
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>Inactive</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>{stats.inactive}</div>
                    </div>
                    <div style={{ 
                      padding: '10px', 
                      background: '#f5f3ff', 
                      borderRadius: '8px',
                      border: '1px solid #ddd6fe'
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>Completed</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#7c3aed' }}>{stats.completed}</div>
                    </div>
                  </div>
                  
                  {/* Health indicator bar */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '11px', 
                      color: '#666', 
                      marginBottom: '6px',
                      fontWeight: '500'
                    }}>
                      <span>Health Status</span>
                      <span style={{ color: healthColor, fontWeight: '600' }}>
                        {activePercentage >= 70 ? 'Excellent' : activePercentage >= 40 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${activePercentage}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${healthColor} 0%, ${healthColor}dd 100%)`,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                        boxShadow: `0 0 8px ${healthColor}40`
                      }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkstreamHealthDashboard;

