import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#08979C', '#13C2C2', '#36CFC9', '#5CDBD3', '#87E8DE', '#B5F5EC', '#E6FFFB'];

const FunnelChart = ({ data, error, onRefresh, refreshing = false }) => {
  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={onRefresh} className="retry-btn">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }
  
  if (!data) {
    return <div className="loading-container">Loading funnel data...</div>;
  }
  
  const handleExport = () => {
    const exportData = [
      ['Funnel Stage', 'Count'],
      ...data.funnelStages.map(s => [s.name, s.count]),
      ['', ''],
      ['Conversion', 'From', 'To', 'Rate (%)', 'From Count', 'To Count'],
      ...data.conversions.map(c => [c.from, c.to, c.rate, c.fromCount, c.toCount])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Funnel');
    XLSX.writeFile(wb, `project-performance-funnel-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  // Prepare funnel data with fill colors
  const funnelData = data.funnelStages.map((stage, index) => ({
    ...stage,
    fill: COLORS[index % COLORS.length]
  }));
  
  return (
    <div className="funnel-tab">
      <div className="section-header">
        <h2>Contributor Funnel Metrics</h2>
        <div className="section-actions">
          <button onClick={onRefresh} className="action-btn" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="action-btn">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      
      <div className="funnel-summary">
        <div className="summary-card">
          <div className="summary-label">Total Active Contributors</div>
          <div className="summary-value">{data.totalActive || 0}</div>
        </div>
      </div>
      
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Funnel Stages</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.funnelStages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                label={{ value: 'Count', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120}
                label={{ value: 'Funnel Stage', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#08979C">
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Conversion Rates</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.conversions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="from" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                label={{ value: 'From Stage', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="rate" fill="#13C2C2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Conversion Table */}
      <div className="chart-card">
        <h3>Conversion Details</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>From Stage</th>
                <th>To Stage</th>
                <th>Conversion Rate (%)</th>
                <th>From Count</th>
                <th>To Count</th>
              </tr>
            </thead>
            <tbody>
              {data.conversions.map((conv, index) => (
                <tr key={index}>
                  <td>{conv.from}</td>
                  <td>{conv.to}</td>
                  <td>{conv.rate.toFixed(2)}%</td>
                  <td>{conv.fromCount}</td>
                  <td>{conv.toCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {data.lastRefreshed && (
        <div className="last-refreshed">
          Last refreshed: {new Date(data.lastRefreshed).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default FunnelChart;

