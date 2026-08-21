// SaveSetModal component - Save transformation set

import React from 'react';
import { X } from 'lucide-react';

const SaveSetModal = ({ show, setName, setNameValue, onSave, onClose }) => {
  if (!show) return null;

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
        maxWidth: '400px',
        fontFamily: 'Poppins'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#002329' }}>
            Save Transformation Set
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: '#666',
              borderRadius: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          value={setName}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="Enter set name"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px'
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSave();
            }
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#08979C',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSetModal;

