import React from 'react';
import { X, Info } from 'lucide-react';
import '../../styles/InfoModal.css';

const InfoModal = ({ show, message, onClose, title = 'Information', children, size = 'medium' }) => {
  if (!show) return null;

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className={`info-modal info-modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <div className="info-modal-title">
            <Info size={20} />
            <h3>{title}</h3>
          </div>
          <button className="info-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="info-modal-content">
          {children || <p>{message}</p>}
        </div>
        {!children && (
          <div className="info-modal-actions">
            <button className="info-modal-ok" onClick={onClose}>
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoModal;

