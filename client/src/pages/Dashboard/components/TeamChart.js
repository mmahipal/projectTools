import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

const TeamChart = ({ data, error, onRefresh, refreshing = false }) => {
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
    return <div className="loading-container">Loading team data...</div>;
  }
  
  const handleExport = () => {
    const exportData = [
      ['Manager', 'Total Projects', 'Open Projects', 'Closed Projects'],
      ...data.projectsByManager.map(m => [m.manager, m.projectCount, m.openCount, m.closedCount])
    ];
    
    if (data.projectsByQualityLead && data.projectsByQualityLead.length > 0) {
      exportData.push(['', '', '', '']);
      exportData.push(['Quality Lead', 'Project Count']);
      exportData.push(...data.projectsByQualityLead.map(q => [q.lead, q.projectCount]));
    }
    
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Team');
    XLSX.writeFile(wb, `project-performance-team-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  // Prepare stacked bar chart data
  const managerChartData = data.projectsByManager.map(m => ({
    manager: (m.manager || m.managerId || 'Unknown').substring(0, 30),
    Open: m.openCount || 0,
    Closed: m.closedCount || 0,
    Total: m.projectCount || 0
  }));
  
  // Calculate minimum width for chart based on number of managers
  const chartMinWidth = Math.max(600, managerChartData.length * 100);
  
  return (
    <div className="team-tab">
      <div className="section-header">
        <h2>Team Performance</h2>
        <div className="section-actions">
          <button onClick={onRefresh} className="action-btn" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="action-btn">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      
      {/* Summary */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#E6F7FF' }}>
            <Users size={24} color="#08979C" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Managers</div>
            <div className="kpi-value">{data.projectsByManager?.length || 0}</div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        {data.projectsByManager && data.projectsByManager.length > 0 && (
          <div className="chart-card">
            <h3>Projects by Project Manager</h3>
            <div className="chart-scroll-container">
              <div style={{ minWidth: `${chartMinWidth}px`, width: '100%' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={managerChartData} margin={{ right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="manager" 
                      angle={-45} 
                      textAnchor="end" 
                      height={120}
                      interval={0}
                      label={{ value: 'Project Manager', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Project Count', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Open" stackId="a" fill="#52C41A" />
                    <Bar dataKey="Closed" stackId="a" fill="#FF4D4F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {data.projectsByQualityLead && data.projectsByQualityLead.length > 0 && (
          <div className="chart-card">
            <h3>Projects by Quality Lead</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.projectsByQualityLead}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="lead" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  interval={0}
                  label={{ value: 'Quality Lead', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Project Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="projectCount" fill="#08979C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* Manager Table */}
      {data.projectsByManager && data.projectsByManager.length > 0 && (
        <div className="chart-card">
          <h3>Manager Performance Details</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Manager Name</th>
                  <th>Total Projects</th>
                  <th>Open Projects</th>
                  <th>Closed Projects</th>
                </tr>
              </thead>
              <tbody>
                {data.projectsByManager.map((manager, index) => (
                  <tr key={index}>
                    <td>{manager.manager || manager.managerId || 'Unknown'}</td>
                    <td>{manager.projectCount || 0}</td>
                    <td>{manager.openCount || 0}</td>
                    <td>{manager.closedCount || 0}</td>
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

export default TeamChart;

