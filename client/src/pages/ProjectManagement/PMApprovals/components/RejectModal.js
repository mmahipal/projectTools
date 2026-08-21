import React, { useState } from 'react';
import { X, XCircle } from 'lucide-react';
import './RejectModal.css';

const RejectModal = ({ selectedCount, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <XCircle size={20} className="modal-icon reject-icon" />
            <h3 className="modal-title">Reject Records</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">
            Are you sure you want to reject <strong>{selectedCount}</strong> record(s)?
          </p>
          
          <div className="modal-form">
            <label className="modal-label">Reason <span className="required">*</span></label>
            <textarea
              className="modal-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={4}
              required
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="modal-btn modal-btn-confirm reject-btn" 
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;



