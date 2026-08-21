import React from 'react';
import './DualProductivityCell.css';

const DualProductivityCell = ({ 
  selfReportedHours = 0, 
  systemTrackedHours = 0, 
  selfReportedUnits = 0, 
  systemTrackedUnits = 0,
  showSelfReported = true
}) => {
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === 0) return '-';
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="dual-productivity-cell">
      <div className="productivity-data">
        <div className="productivity-row">
          <span className="productivity-label"><em>Hours</em></span>
          <span className="productivity-value">
            {showSelfReported ? formatNumber(selfReportedHours) : formatNumber(systemTrackedHours)}
          </span>
        </div>
        <div className="productivity-row">
          <span className="productivity-label"><em>Units</em></span>
          <span className="productivity-value">
            {showSelfReported ? formatNumber(selfReportedUnits) : formatNumber(systemTrackedUnits)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DualProductivityCell;

