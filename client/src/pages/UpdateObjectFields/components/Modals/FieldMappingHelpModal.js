// FieldMappingHelpModal component - Field mapping help guide

import React from 'react';
import { X, Info } from 'lucide-react';

const FieldMappingHelpModal = ({ show, onClose }) => {
  if (!show) return null;

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
        zIndex: 10000,
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
          maxWidth: '600px',
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
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={20} color="#0284c7" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#002329' }}>
              Field Mappings Help
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
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            maxHeight: '60vh'
          }}
        >
          <div style={{ 
            lineHeight: '1.6',
            color: '#002329',
            fontSize: '13px'
          }}>
            <p style={{ marginTop: 0, marginBottom: '12px' }}>
              <strong>Field Mappings:</strong> Define how fields from the source object are mapped to fields in the target object.
            </p>
            <p style={{ marginTop: 0, marginBottom: '12px' }}>
              Each mapping can use different transformations to transform the data during the mapping process:
            </p>
            <ul style={{ marginTop: '8px', marginBottom: '12px', paddingLeft: '20px' }}>
              <li><strong>Copy:</strong> Directly copy the source field value</li>
              <li><strong>Formula:</strong> Calculate a value using expressions</li>
              <li><strong>Concatenate:</strong> Combine multiple source fields</li>
              <li><strong>Value Map:</strong> Map specific values (e.g., "Yes" → true)</li>
              <li><strong>Conditional:</strong> Apply if-then-else logic</li>
              <li><strong>Switch/Case:</strong> Map multiple values to different targets</li>
              <li>And more transformation types...</li>
            </ul>
            <p style={{ marginTop: 0, marginBottom: '12px' }}>
              <strong>Hybrid View:</strong> Use the hybrid view to see a summary list of all mappings on the left and edit details on the right.
            </p>
            <p style={{ marginTop: 0, marginBottom: '12px' }}>
              <strong>Card View:</strong> Use the card view to see all mappings as individual cards that you can edit inline.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldMappingHelpModal;

