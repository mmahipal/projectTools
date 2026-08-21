import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    if (!status) return 'status-unknown';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved')) return 'status-approved';
    if (statusLower.includes('review')) return 'status-review';
    if (statusLower.includes('rejected')) return 'status-rejected';
    return 'status-default';
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;



