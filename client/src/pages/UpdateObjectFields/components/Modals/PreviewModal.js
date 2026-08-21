// PreviewModal component - Preview update results

import React from 'react';
import { Eye, X } from 'lucide-react';

const PreviewModal = ({ show, previewData, loadingPreview, onClose }) => {
  if (!show || !previewData) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '20px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          boxSizing: 'border-box',
          color: '#002329',
          fontFamily: 'Poppins',
          fontSize: '14px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Eye size={20} color="#08979C" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#002329' }}>
              Preview Update (Dry-Run)
            </h2>
          </div>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {loadingPreview ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading preview...
            </div>
          ) : (
            <>
              {/* Summary Section */}
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#002329' }}>
                  Update Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#666' }}>Object Type:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '500' }}>{previewData.objectType}</span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>Total Records:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '500', color: '#08979C' }}>{previewData.totalCount}</span>
                  </div>
                </div>
              </div>

              {/* Preview Content - This would render based on previewData.type */}
              <div style={{ fontSize: '13px', color: '#666' }}>
                Preview content rendering based on previewData.type (single/multiple/mapping)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;

