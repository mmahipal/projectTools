// DefaultValueField component - Handles default value transformation fields

import React from 'react';
import { APPLY_WHEN_OPTIONS } from '../../constants';

const DefaultValueField = ({ mapping, updateMapping }) => {
  return (
    <div style={{ marginTop: '8px' }}>
      <div className="form-group">
        <label>Default Value *</label>
        <input
          type="text"
          value={mapping.defaultValue || ''}
          onChange={(e) => updateMapping({ defaultValue: e.target.value })}
          placeholder="Default value to use"
          style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
        />
      </div>

      <div className="form-group">
        <label>Apply When</label>
        <select
          value={mapping.applyWhen || 'empty'}
          onChange={(e) => updateMapping({ applyWhen: e.target.value })}
          style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
        >
          {APPLY_WHEN_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DefaultValueField;

