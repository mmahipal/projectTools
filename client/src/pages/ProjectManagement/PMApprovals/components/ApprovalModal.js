import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import './ApprovalModal.css';

const ApprovalModal = ({ selectedCount, onConfirm, onClose }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(comment);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content approval-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <CheckCircle size={20} className="modal-icon approve-icon" />
            <h3 className="modal-title">Approve Records</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">
            Are you sure you want to approve <strong>{selectedCount}</strong> record(s)?
          </p>
          
          <div className="modal-form">
            <label className="modal-label">Comment (optional)</label>
            <textarea
              className="modal-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={4}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="modal-btn modal-btn-confirm approve-btn" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;



