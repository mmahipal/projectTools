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
import '../../../styles/ContributorTimeStatus/StatusTransitionChart.css';

const StatusTransitionChart = ({ data, error }) => {
  if (error) {
    return (
      <div className="transition-chart-error">
        <p>Error loading transition data: {error}</p>
      </div>
    );
  }
  
  if (!data || !data.transitions || Object.keys(data.transitions).length === 0) {
    return (
      <div className="transition-chart-empty">
        <p>No transition data available</p>
      </div>
    );
  }
  
  // Prepare chart data
  const chartData = Object.keys(data.transitions).map(key => {
    const transition = data.transitions[key];
    return {
      transition: key,
      averageDays: transition.averageDays || 0,
      medianDays: transition.medianDays || 0,
      minDays: transition.minDays || 0,
      maxDays: transition.maxDays || 0,
      count: transition.count || 0
    };
  }).sort((a, b) => b.averageDays - a.averageDays);
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.transition}</p>
          <p className="tooltip-value">Average: {data.averageDays.toFixed(1)} days</p>
          <p className="tooltip-value">Median: {data.medianDays.toFixed(1)} days</p>
          <p className="tooltip-value">Min: {data.minDays} days</p>
          <p className="tooltip-value">Max: {data.maxDays} days</p>
          <p className="tooltip-value">Count: {data.count}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="status-transition-chart">
      <div className="chart-header">
        <h3 className="chart-title">Status Transition Times</h3>
        <p className="chart-subtitle">Average time to move between statuses</p>
      </div>
      
      <div className="transition-table-container">
        <table className="transition-table">
          <thead>
            <tr>
              <th>Transition</th>
              <th>Average Days</th>
              <th>Median Days</th>
              <th>Min Days</th>
              <th>Max Days</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, index) => (
              <tr key={item.transition}>
                <td>
                  <strong>{item.transition}</strong>
                </td>
                <td>{item.averageDays.toFixed(1)}</td>
                <td>{item.medianDays.toFixed(1)}</td>
                <td>{item.minDays}</td>
                <td>{item.maxDays}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis 
            dataKey="transition" 
            angle={-45}
            textAnchor="end"
            height={120}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="averageDays" name="Average Days" fill="#08979C" radius={[8, 8, 0, 0]} />
          <Bar dataKey="medianDays" name="Median Days" fill="#06b6d4" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusTransitionChart;



