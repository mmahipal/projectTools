import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Loader, AlertCircle, BarChart3, Table } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';

const TrendAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'graph'
  const [visibleMetrics, setVisibleMetrics] = useState({
    created: true,
    modified: true,
    active: true,
    completed: true
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/workstream-analytics/trends?period=${period}`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch trends');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load trends';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

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
        <p style={{ color: '#706e6b', fontSize: '14px', margin: 0 }}>Loading trend analysis...</p>
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

  const { trends, period: dataPeriod } = data;

  // Render graph view
  const renderGraphView = () => {
    if (!trends || trends.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No data to display</div>;
    }

    const maxValue = Math.max(
      ...trends.map(t => Math.max(
        visibleMetrics.created ? t.created : 0,
        visibleMetrics.modified ? t.modified : 0,
        visibleMetrics.active ? t.active : 0,
        visibleMetrics.completed ? t.completed : 0
      ))
    ) || 1;

    const metrics = [
      { key: 'created', label: 'Created', color: '#0176d3', data: trends.map(t => t.created) },
      { key: 'modified', label: 'Modified', color: '#059669', data: trends.map(t => t.modified) },
      { key: 'active', label: 'Active', color: '#7c3aed', data: trends.map(t => t.active) },
      { key: 'completed', label: 'Completed', color: '#f59e0b', data: trends.map(t => t.completed) }
    ];

    const toggleMetric = (key) => {
      setVisibleMetrics(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    };

    return (
      <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '6px' }}>
        {/* Interactive Legend with Checkboxes */}
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          background: '#fff', 
          borderRadius: '8px', 
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            marginBottom: '12px', 
            color: '#002329' 
          }}>
            Select Metrics to Display
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '16px' 
          }}>
            {metrics.map(metric => (
              <label
                key={metric.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: visibleMetrics[metric.key] ? `${metric.color}10` : '#f9fafb',
                  border: `2px solid ${visibleMetrics[metric.key] ? metric.color : '#e5e7eb'}`,
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!visibleMetrics[metric.key]) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!visibleMetrics[metric.key]) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleMetrics[metric.key]}
                  onChange={() => toggleMetric(metric.key)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: metric.color
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}>
                  <div style={{ 
                    width: '20px', 
                    height: '3px', 
                    background: visibleMetrics[metric.key] ? metric.color : '#d1d5db',
                    borderRadius: '2px',
                    transition: 'all 0.2s ease'
                  }}></div>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '500',
                    color: visibleMetrics[metric.key] ? '#002329' : '#9ca3af',
                    transition: 'color 0.2s ease'
                  }}>
                    {metric.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Combined Line Chart */}
        <div style={{ 
          position: 'relative', 
          height: '400px', 
          padding: '30px 50px 80px 60px', 
          background: '#fff', 
          borderRadius: '8px', 
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '20px', 
            color: '#002329' 
          }}>
            Trend Analysis Over Time
          </div>
          
          <svg width="100%" height="320" viewBox="0 0 900 320" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
            {/* Y-axis grid lines and labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const value = Math.round(maxValue * ratio);
              const y = 280 - (ratio * 250);
              return (
                <g key={i}>
                  <line x1="50" y1={y} x2="850" y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="45" y={y + 4} fontSize="11" fill="#666" textAnchor="end" fontWeight="500">{value}</text>
                </g>
              );
            })}
            
            {/* X-axis line */}
            <line x1="50" y1="280" x2="850" y2="280" stroke="#d1d5db" strokeWidth="2" />
            
            {/* Y-axis line */}
            <line x1="50" y1="30" x2="50" y2="280" stroke="#d1d5db" strokeWidth="2" />
            
            {/* Lines for each metric */}
            {trends.length > 1 && metrics.map(metric => {
              if (!visibleMetrics[metric.key]) return null;
              
              const points = trends.map((trend, i) => {
                const x = 60 + (i / (trends.length - 1)) * 780;
                const value = metric.data[i];
                const y = 280 - (value / maxValue) * 250;
                return { x, y, value };
              });

              return (
                <g key={metric.key}>
                  {/* Area under the line (subtle fill) */}
                  <polygon
                    points={`50,280 ${points.map(p => `${p.x},${p.y}`).join(' ')} 850,280`}
                    fill={`url(#gradient-${metric.key})`}
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id={`gradient-${metric.key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={metric.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Line */}
                  <polyline
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={metric.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={visibleMetrics[metric.key] ? 1 : 0.3}
                  />
                  
                  {/* Data points */}
                  {points.map((point, i) => (
                    <g key={i}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill={metric.color}
                        stroke="#fff"
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                      >
                        <title>{`${trends[i].date}: ${point.value} ${metric.label.toLowerCase()}`}</title>
                      </circle>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
          
          {/* X-axis labels */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '12px', 
            fontSize: '11px', 
            color: '#666', 
            paddingLeft: '60px', 
            paddingRight: '50px',
            fontWeight: '500'
          }}>
            {trends.map((trend, i) => (
              <span 
                key={i} 
                style={{ 
                  transform: 'rotate(-45deg)', 
                  display: 'inline-block', 
                  transformOrigin: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <TrendingUp size={20} color="#0176d3" />
          Trend Analysis Over Time
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', border: '1px solid #d9d9d9', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'table' ? '#0176d3' : 'transparent',
                color: viewMode === 'table' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Table size={14} />
              Table
            </button>
            <button
              onClick={() => setViewMode('graph')}
              style={{
                padding: '6px 12px',
                background: viewMode === 'graph' ? '#0176d3' : 'transparent',
                color: viewMode === 'graph' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <BarChart3 size={14} />
              Graph
            </button>
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '13px' }}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
          </select>
          <button onClick={fetchData} disabled={loading} style={{ padding: '8px 16px', background: '#0176d3', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        /* Trends Table */
        <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>DATE</th>
                <th style={{ textAlign: 'right' }}>CREATED</th>
                <th style={{ textAlign: 'right' }}>MODIFIED</th>
                <th style={{ textAlign: 'right' }}>ACTIVE</th>
                <th style={{ textAlign: 'right' }}>COMPLETED</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((trend, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px' }}>{trend.date}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{trend.created}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{trend.modified}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{trend.active}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>{trend.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        renderGraphView()
      )}
    </div>
  );
};

export default TrendAnalysis;
