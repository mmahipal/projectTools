import React from 'react';
import { BarChart3 } from 'lucide-react';
import './MetricsRow.css';

const MetricsRow = ({ selfReportedTime, systemTracked, payment, loading }) => {
  if (loading) {
    return (
      <div className="metrics-row">
        <div className="metrics-loading">Loading metrics...</div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="metrics-row">
      <div className="card-header">
        <BarChart3 size={18} className="card-icon" />
        <h3 className="card-title">METRICS</h3>
      </div>
      <div className="metrics-content">
        <div className="metric-item">
          <div className="metric-label">Self Reported Time</div>
          <div className="metric-value">{formatNumber(selfReportedTime || 0)}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">System Tracked</div>
          <div className="metric-value">{formatNumber(systemTracked || 0)}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Payment</div>
          <div className="metric-value">{formatCurrency(payment || 0)}</div>
        </div>
      </div>
    </div>
  );
};

export default MetricsRow;


