import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#08979C', '#13C2C2', '#36CFC9', '#5CDBD3', '#87E8DE', '#B5F5EC'];

const FinancialChart = ({ data, error, onRefresh, refreshing = false }) => {
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
    return <div className="loading-container">Loading financial data...</div>;
  }
  
  const handleExport = () => {
    const exportData = [
      ['Financial Metric', 'Value'],
      ['Total Paid', data.totalPaid],
      ['Total Outstanding', data.totalOutstanding],
      ['', ''],
      ['Payment Status', 'Count'],
      ...data.paymentStatusDistribution.map(s => [s.status, s.count]),
      ['', ''],
      ['Payment Method', 'Count'],
      ...data.paymentMethodDistribution.map(m => [m.method, m.count])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial');
    XLSX.writeFile(wb, `project-performance-financial-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div className="financial-tab">
      <div className="section-header">
        <h2>Financial Performance</h2>
        <div className="section-actions">
          <button onClick={onRefresh} className="action-btn" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="action-btn">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      
      {data.message && (
        <div className="info-message">
          {data.message}
        </div>
      )}
      
      {/* Financial Summary Cards */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#F6FFED' }}>
            <DollarSign size={24} color="#52C41A" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Paid</div>
            <div className="kpi-value">{formatCurrency(data.totalPaid || 0)}</div>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#FFF1F0' }}>
            <DollarSign size={24} color="#FF4D4F" />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Outstanding</div>
            <div className="kpi-value">{formatCurrency(data.totalOutstanding || 0)}</div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        {data.paymentStatusDistribution && data.paymentStatusDistribution.length > 0 && (
          <div className="chart-card">
            <h3>Payment Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.paymentStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {data.paymentStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  formatter={(value, entry) => {
                    // Find the matching entry by matching the color or count
                    const dataEntry = data.paymentStatusDistribution.find((d, idx) => 
                      COLORS[idx % COLORS.length] === entry.color || d.count === entry.payload?.count
                    );
                    return <span style={{ color: entry.color }}>{dataEntry?.status || value}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {data.paymentMethodDistribution && data.paymentMethodDistribution.length > 0 && (
          <div className="chart-card">
            <h3>Payment Method Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.paymentMethodDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="method" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  label={{ value: 'Payment Method', position: 'insideBottom', offset: -5 }}
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
        )}
      </div>
      
      {data.lastRefreshed && (
        <div className="last-refreshed">
          Last refreshed: {new Date(data.lastRefreshed).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default FinancialChart;

