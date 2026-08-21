import React from 'react';
import { Clock } from 'lucide-react';
import './DeadlinesPanel.css';

const DeadlinesPanel = ({ deadlines, loading }) => {
  if (loading) {
    return (
      <div className="deadlines-panel">
        <div className="deadlines-loading">Loading deadlines...</div>
      </div>
    );
  }

  if (!deadlines) {
    return null;
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="deadlines-panel">
      <div className="deadlines-header">
        <Clock size={16} />
        <h4 className="deadlines-title">Deadlines</h4>
      </div>
      <div className="deadlines-list">
        <div className="deadline-item">
          <div className="deadline-label">Contributor Deadline for Submitting Hours:</div>
          <div className="deadline-value">{formatDateTime(deadlines.contributorDeadline)}</div>
        </div>
        <div className="deadline-item">
          <div className="deadline-label">PM Approval Deadline:</div>
          <div className="deadline-value">{formatDateTime(deadlines.pmApprovalDeadline)}</div>
        </div>
        <div className="deadline-item">
          <div className="deadline-label">Payment Generation Date:</div>
          <div className="deadline-value">{formatDateTime(deadlines.paymentGenerationDate)}</div>
        </div>
      </div>
    </div>
  );
};

export default DeadlinesPanel;



