import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import '../../../styles/ContributorTimeStatus/TimeInStatusChart.css';

const TimeInStatusChart = ({ data, error }) => {
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
    status,
    averageDays: data[status]?.days || 0,
    minDays: data[status]?.minDays || 0,
    maxDays: data[status]?.maxDays || 0,
    count: data[status]?.count || 0
  })).sort((a, b) => {
    // Sort by status order
    const order = ['Draft', 'Invite', 'App Received', 'Matched', 'Qualified', 'Active', 'Production', 'Removed'];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.status}</p>
          <p className="tooltip-value">Average: {data.averageDays.toFixed(1)} days</p>
          <p className="tooltip-value">Min: {data.minDays} days</p>
          <p className="tooltip-value">Max: {data.maxDays} days</p>
          <p className="tooltip-value">Count: {data.count}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="time-in-status-chart">
      <div className="chart-header">
        <h3 className="chart-title">Average Time in Status</h3>
        <p className="chart-subtitle">Days spent in each status</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis 
            dataKey="status" 
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="averageDays" name="Average Days" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeInStatusChart;



