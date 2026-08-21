import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import '../../../styles/ContributorTimeStatus/StatusDistributionChart.css';

const StatusDistributionChart = ({ data, error }) => {
  if (error) {
    return (
      <div className="chart-error">
        <p>Error loading chart data: {error}</p>
      </div>
    );
  }
  
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="chart-empty">
        <p>No data available</p>
      </div>
    );
  }
  
  // Status color mapping
  const statusColors = {
    'Draft': '#94a3b8',
    'Invite': '#3b82f6',
    'App Received': '#8b5cf6',
    'Matched': '#ec4899',
    'Qualified': '#f59e0b',
    'Active': '#10b981',
    'Production': '#06b6d4',
    'Removed': '#ef4444'
  };
  
  // Prepare chart data
  const chartData = Object.keys(data).map(status => ({
    name: status,
    value: data[status] || 0
  })).filter(item => item.value > 0);
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">{data.value.toFixed(1)}% of total time</p>
        </div>
      );
    }
    return null;
  };
  
  const renderCustomLabel = ({ name, percent }) => {
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };
  
  return (
    <div className="status-distribution-chart">
      <div className="chart-header">
        <h3 className="chart-title">Time Distribution by Status</h3>
        <p className="chart-subtitle">Percentage of total time spent in each status</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => `${value}: ${chartData.find(d => d.name === value)?.value.toFixed(1) || 0}%`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusDistributionChart;



