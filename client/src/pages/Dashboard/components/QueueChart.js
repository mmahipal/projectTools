import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, List } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#08979C', '#13C2C2', '#36CFC9', '#5CDBD3', '#87E8DE', '#B5F5EC'];

const QueueChart = ({ data, error, onRefresh, refreshing = false }) => {
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
    return <div className="loading-container">Loading queue data...</div>;
  }
  
  const handleExport = () => {
    const exportData = [
      ['Queue Status', 'Count'],
      ...data.queueDistribution.map(q => [q.queueStatus, q.count]),
      ['', ''],
      ['Total in Queues', data.totalInQueues]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Queue');
    XLSX.writeFile(wb, `project-performance-queue-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  return (
    <div className="queue-tab">
      <div className="section-header">
        <h2>Queue Status Metrics</h2>
        <div className="section-actions">
          <button onClick={onRefresh} className="action-btn" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="action-btn">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      
      {/* Summary Card */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#E6F7FF' }}>
            <List size={24} color="#08979C" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total in Queues</div>
            <div className="kpi-value">{data.totalInQueues || 0}</div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        {data.queueDistribution && data.queueDistribution.length > 0 && (
          <>
            <div className="chart-card">
              <h3>Queue Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.queueDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ queueStatus, percent }) => `${queueStatus}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="queueStatus"
                  >
                    {data.queueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    formatter={(value, entry) => {
                      // Find the matching entry by matching the color or count
                      const dataEntry = data.queueDistribution.find((d, idx) => 
                        COLORS[idx % COLORS.length] === entry.color || d.count === entry.payload?.count
                      );
                      return <span style={{ color: entry.color }}>{dataEntry?.queueStatus || value}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-card">
              <h3>Queue Status Count</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.queueDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="queueStatus" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                    label={{ value: 'Queue Status', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#08979C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      
      {/* Queue Table */}
      {data.queueDistribution && data.queueDistribution.length > 0 && (
        <div className="chart-card">
          <h3>Queue Status Details</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Queue Status</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.queueDistribution.map((queue, index) => {
                  const percentage = data.totalInQueues > 0 
                    ? ((queue.count / data.totalInQueues) * 100).toFixed(2)
                    : 0;
                  return (
                    <tr key={index}>
                      <td>{queue.queueStatus || 'Unknown'}</td>
                      <td>{queue.count || 0}</td>
                      <td>{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {data.lastRefreshed && (
        <div className="last-refreshed">
          Last refreshed: {new Date(data.lastRefreshed).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default QueueChart;

