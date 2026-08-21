// ValidateFormatField component - Handles format validation transformation fields

import React from 'react';
import { VALIDATION_TYPES, ON_INVALID_OPTIONS } from '../../constants';

const ValidateFormatField = ({ mapping, updateMapping }) => {
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        Validate the source field value against a format pattern. If invalid, apply the specified action.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div className="form-group">
          <label>Validation Type *</label>
          <select
            value={mapping.validationType || 'email'}
            onChange={(e) => updateMapping({ 
              validationType: e.target.value, 
              customPattern: e.target.value !== 'custom' ? '' : mapping.customPattern 
            })}
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          >
            {VALIDATION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>On Invalid</label>
          <select
            value={mapping.onInvalid || 'default'}
            onChange={(e) => updateMapping({ onInvalid: e.target.value })}
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          >
            {ON_INVALID_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      {mapping.validationType === 'custom' && (
        <div className="form-group">
          <label>Custom Regex Pattern *</label>
          <input
            type="text"
            value={mapping.customPattern || ''}
            onChange={(e) => updateMapping({ customPattern: e.target.value })}
            placeholder="e.g., ^[A-Z]{2}\\d{4}$"
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          />
          <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
            Enter a valid regular expression pattern
          </div>
        </div>
      )}
      {mapping.onInvalid === 'default' && (
        <div className="form-group">
          <label>Default Value</label>
          <input
            type="text"
            value={mapping.defaultValue || ''}
            onChange={(e) => updateMapping({ defaultValue: e.target.value })}
            placeholder="Default value if validation fails"
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          />
        </div>
      )}
    </div>
  );
};

export default ValidateFormatField;

