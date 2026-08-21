// TypeConversionField component - Handles type conversion transformation fields

import React from 'react';
import { TARGET_TYPES } from '../../constants';

const TypeConversionField = ({ mapping, updateMapping }) => {
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        Convert the source field value to a different data type.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label>Target Type *</label>
          <select
            value={mapping.targetType || 'string'}
            onChange={(e) => updateMapping({ 
              targetType: e.target.value, 
              conversionFormat: e.target.value === 'date' ? 'YYYY-MM-DD' : '' 
            })}
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          >
            {TARGET_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        {mapping.targetType === 'date' && (
          <div className="form-group">
            <label>Date Format (Optional)</label>
            <input
              type="text"
              value={mapping.conversionFormat || 'YYYY-MM-DD'}
              onChange={(e) => updateMapping({ conversionFormat: e.target.value })}
              placeholder="YYYY-MM-DD"
              style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeConversionField;

