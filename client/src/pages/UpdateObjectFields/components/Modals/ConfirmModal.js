// ConfirmModal component - Confirmation dialog

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
  show, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!show) return null;

  const colors = {
    warning: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', button: '#f59e0b' },
    danger: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', button: '#dc2626' },
    info: { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af', button: '#2563eb' }
  };

  const color = colors[type] || colors.warning;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        fontFamily: 'Poppins'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertTriangle size={24} style={{ color: color.button }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#002329' }}>
            Confirm Action
          </h2>
          <button
            onClick={onCancel}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} style={{ color: '#666' }} />
          </button>
        </div>

        <p style={{ marginBottom: '24px', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              backgroundColor: color.button,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

