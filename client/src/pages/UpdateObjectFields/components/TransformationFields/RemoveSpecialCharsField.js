// RemoveSpecialCharsField component - Handles remove special characters transformation fields

import React from 'react';
import { REMOVE_MODES } from '../../constants';

const RemoveSpecialCharsField = ({ mapping, updateMapping }) => {
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        Clean the source field value by removing special characters based on the selected mode.
      </div>
      <div className="form-group">
        <label>Remove Mode *</label>
        <select
          value={mapping.removeMode || 'removeAll'}
          onChange={(e) => updateMapping({ removeMode: e.target.value })}
          style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
        >
          {REMOVE_MODES.map(mode => (
            <option key={mode.value} value={mode.value}>{mode.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default RemoveSpecialCharsField;

