import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import './EmailModal.css';

const EmailModal = ({ selectedCount, selectedRecords, onConfirm, onClose }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailData.to.trim()) {
      alert('Please enter recipient email');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(emailData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Mail size={20} className="modal-icon email-icon" />
            <h3 className="modal-title">Send Email</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">
            Send email for <strong>{selectedCount}</strong> record(s)
          </p>
          
          <div className="modal-form">
            <label className="modal-label">To <span className="required">*</span></label>
            <input
              type="email"
              className="modal-input"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              placeholder="recipient@example.com"
              required
            />
            
            <label className="modal-label">Subject</label>
            <input
              type="text"
              className="modal-input"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              placeholder="Email subject"
            />
            
            <label className="modal-label">Message</label>
            <textarea
              className="modal-textarea"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              placeholder="Email message..."
              rows={6}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="modal-btn modal-btn-confirm email-btn" 
            onClick={handleSubmit}
            disabled={loading || !emailData.to.trim()}
          >
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;



