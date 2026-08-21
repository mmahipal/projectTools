/**
 * Client Tool Account Validation Warning Component
 * Displays validation warnings and conflicts
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ClientToolAccountValidationWarning = ({ 
  warnings = [], 
  conflicts = [], 
  onDismiss,
  type = 'warning' // 'warning' or 'error'
}) => {
  if (warnings.length === 0 && conflicts.length === 0) {
    return null;
  }

  const allMessages = [
    ...warnings,
    ...conflicts.map(c => c.message || c)
  ];

  if (allMessages.length === 0) {
    return null;
  }

  const bgColor = type === 'error' ? '#fef2f2' : '#fffbeb';
  const borderColor = type === 'error' ? '#fecaca' : '#fde68a';
  const textColor = type === 'error' ? '#991b1b' : '#92400e';
  const iconColor = type === 'error' ? '#dc2626' : '#f59e0b';

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        padding: '12px',
        marginTop: '8px',
        marginBottom: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <AlertTriangle size={16} style={{ color: iconColor, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '500', fontSize: '13px', color: textColor, marginBottom: '4px' }}>
            {type === 'error' ? 'Validation Error' : 'Warning'}
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: textColor }}>
            {allMessages.map((message, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {message}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: textColor,
              opacity: 0.7
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientToolAccountValidationWarning;

