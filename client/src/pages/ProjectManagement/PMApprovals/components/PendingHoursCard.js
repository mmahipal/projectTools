import React from 'react';
import { Clock } from 'lucide-react';
import './PendingHoursCard.css';

const PendingHoursCard = ({ totalPendingHours, totalHours, loading }) => {
  if (loading) {
    return (
      <div className="pending-hours-card">
        <div className="card-loading">Loading...</div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const progressPercent = totalHours > 0 ? (totalPendingHours / totalHours) * 100 : 0;

  return (
    <div className="pending-hours-card">
      <div className="card-header">
        <Clock size={18} className="card-icon" />
        <h3 className="card-title">TOTAL PENDING HOURS</h3>
      </div>
      <div className="card-value">{formatNumber(totalPendingHours || 0)}</div>
      {totalHours > 0 && (
        <div className="card-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="progress-label">Total: {formatNumber(totalHours)}</div>
        </div>
      )}
    </div>
  );
};

export default PendingHoursCard;


