import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, Download, Target } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#08979C', '#13C2C2', '#36CFC9', '#5CDBD3', '#87E8DE', '#B5F5EC'];

const ObjectiveChart = ({ data, error, onRefresh, refreshing = false }) => {
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
    return <div className="loading-container">Loading objectives data...</div>;
  }
  
  const handleExport = () => {
    const exportData = [
      ['Metric', 'Value'],
      ['Total Objectives', data.totalObjectives],
      ['Avg Objectives per Project', data.avgObjectivesPerProject],
      ['', ''],
      ['Objectives by Country', 'Count'],
      ...data.objectivesByCountry.map(c => [c.country, c.count]),
      ['', ''],
      ['Objectives by Work Type', 'Count'],
      ...data.objectivesByWorkType.map(w => [w.workType, w.count])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Objectives');
    XLSX.writeFile(wb, `project-performance-objectives-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  return (
    <div className="objectives-tab">
      <div className="section-header">
        <h2>Project Objectives Performance</h2>
        <div className="section-actions">
          <button onClick={onRefresh} className="action-btn" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="action-btn">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#E6F7FF' }}>
            <Target size={24} color="#08979C" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Objectives</div>
            <div className="kpi-value">{data.totalObjectives || 0}</div>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#F6FFED' }}>
            <Target size={24} color="#52C41A" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Avg per Project</div>
            <div className="kpi-value">{data.avgObjectivesPerProject?.toFixed(2) || 0}</div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Objectives by Country</h3>
          {data.objectivesByCountry && data.objectivesByCountry.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.objectivesByCountry}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="country" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  label={{ value: 'Country', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#08979C" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">No data available for Objectives by Country</div>
          )}
        </div>
        
        <div className="chart-card">
          <h3>Objectives by Work Type</h3>
          {data.objectivesByWorkType && data.objectivesByWorkType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.objectivesByWorkType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ workType, percent }) => `${workType}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="workType"
                >
                  {data.objectivesByWorkType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  formatter={(value, entry) => {
                    // Find the matching entry by matching the color or count
                    const dataEntry = data.objectivesByWorkType.find((d, idx) => 
                      COLORS[idx % COLORS.length] === entry.color || d.count === entry.payload?.count
                    );
                    return <span style={{ color: entry.color }}>{dataEntry?.workType || value}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">No data available for Objectives by Work Type</div>
          )}
        </div>
      </div>
      
      {/* Top Projects by Objectives */}
      {data.objectivesByProject && data.objectivesByProject.length > 0 && (
        <div className="chart-card">
          <h3>Top Projects by Objective Count</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Project ID</th>
                  <th>Objective Count</th>
                </tr>
              </thead>
              <tbody>
                {data.objectivesByProject.slice(0, 20).map((project, index) => (
                  <tr key={index}>
                    <td>{project.projectName || project.projectId}</td>
                    <td>{project.projectId}</td>
                    <td>{project.objectiveCount}</td>
                  </tr>
                ))}
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

export default ObjectiveChart;

