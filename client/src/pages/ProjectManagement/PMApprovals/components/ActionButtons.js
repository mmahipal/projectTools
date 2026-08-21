import React from 'react';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import './ActionButtons.css';

const ActionButtons = ({ 
  onApprove, 
  onReject, 
  onSendEmail,
  disabled = false,
  selectedCount = 0
}) => {
  return (
    <div className="action-buttons-panel">
      <button
        className="action-btn action-approve"
        onClick={onApprove}
        disabled={disabled || selectedCount === 0}
        title={selectedCount === 0 ? 'Select records to approve' : `Approve ${selectedCount} record(s)`}
      >
        <CheckCircle size={18} />
        APPROVE
      </button>
      <button
        className="action-btn action-reject"
        onClick={onReject}
        disabled={disabled || selectedCount === 0}
        title={selectedCount === 0 ? 'Select records to reject' : `Reject ${selectedCount} record(s)`}
      >
        <XCircle size={18} />
        REJECT
      </button>
      <button
        className="action-btn action-email"
        onClick={onSendEmail}
        disabled={disabled || selectedCount === 0}
        title={selectedCount === 0 ? 'Select records to email' : `Send email for ${selectedCount} record(s)`}
      >
        <Mail size={18} />
        SEND EMAIL
      </button>
    </div>
  );
};

export default ActionButtons;



