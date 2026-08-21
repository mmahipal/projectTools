import React from 'react';
import { Target } from 'lucide-react';
import './PendingUnitsCard.css';

const PendingUnitsCard = ({ totalPendingUnits, loading }) => {
  if (loading) {
    return (
      <div className="pending-units-card">
        <div className="card-loading">Loading...</div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="pending-units-card">
      <div className="card-header">
        <Target size={18} className="card-icon" />
        <h3 className="card-title">TOTAL PENDING UNITS</h3>
      </div>
      <div className="card-value">{formatNumber(totalPendingUnits || 0)}</div>
    </div>
  );
};

export default PendingUnitsCard;


