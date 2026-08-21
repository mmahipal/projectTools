import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, FolderOpen, Users, RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

// Enhanced color palette with better differentiation for Project Status Distribution
const COLORS = [
  '#10B981', // Green - Active/Completed
  '#3B82F6', // Blue - In Progress
  '#F59E0B', // Amber - Pending/Warning
  '#EF4444', // Red - Failed/Blocked
  '#8B5CF6', // Purple - On Hold
  '#06B6D4', // Cyan - Planning
  '#EC4899', // Pink - Review
  '#6366F1', // Indigo - Approved
  '#14B8A6', // Teal - Draft
  '#F97316', // Orange - Cancelled
  '#84CC16', // Lime - New
  '#64748B'  // Slate - Unknown
];

const OverviewCards = ({ data, error, onRefresh, refreshing = false }) => {
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
    return <div className="loading-container">Loading overview data...</div>;
  }
  
  const handleExport = () => {
    const exportData = [
      ['Metric', 'Value'],
      ['Total Projects', data.totalProjects],
      ['Average Duration (days)', data.avgDuration],
      ['Average Time to Market (days)', data.avgTimeToMarket],
      ['Recent Projects (30 days)', data.recentProjectsCount],
      ['', ''],
      ['Status Distribution', 'Count'],
      ...data.statusDistribution.map(s => [s.status, s.count]),
      ['', ''],
      ['Projects by Type', 'Count'],
      ...data.projectsByType.map(t => [t.type, t.count])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    XLSX.writeFile(wb, `project-performance-overview-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  return (
    <div className="overview-tab">
      <div className="section-header">
        <h2>Project Overview</h2>
        <div className="section-actions">
          <button onClick={onRefresh} className="action-btn" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="action-btn">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#E6F7FF' }}>
            <FolderOpen size={24} color="#08979C" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Projects</div>
            <div className="kpi-value">{data.totalProjects || 0}</div>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#F6FFED' }}>
            <Clock size={24} color="#52C41A" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Avg Duration</div>
            <div className="kpi-value">{data.avgDuration || 0} days</div>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#FFF7E6' }}>
            <TrendingUp size={24} color="#FA8C16" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Time to Market</div>
            <div className="kpi-value">{data.avgTimeToMarket || 0} days</div>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#F0F5FF' }}>
            <Users size={24} color="#2F54EB" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Recent Projects</div>
            <div className="kpi-value">{data.recentProjectsCount || 0}</div>
            <div className="kpi-sublabel">Last 30 days</div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
              >
                {data.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                formatter={(value, entry) => {
                  // Find the matching entry by matching the color or count
                  const dataEntry = data.statusDistribution.find((d, idx) => 
                    COLORS[idx % COLORS.length] === entry.color || d.count === entry.payload?.count
                  );
                  return <span style={{ color: entry.color }}>{dataEntry?.status || value}</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Projects by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.projectsByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="type" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
                label={{ value: 'Project Type', position: 'insideBottom', offset: -5 }}
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
      </div>
      
      {data.lastRefreshed && (
        <div className="last-refreshed">
          Last refreshed: {new Date(data.lastRefreshed).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default OverviewCards;

