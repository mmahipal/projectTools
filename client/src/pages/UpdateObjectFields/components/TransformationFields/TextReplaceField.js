// TextReplaceField component - Handles text replace transformation fields

import React from 'react';
import { REPLACE_MODES } from '../../constants';

const TextReplaceField = ({ mapping, updateMapping }) => {
  return (
    <div style={{ marginTop: '8px' }}>
      <div className="form-group">
        <label>Find Text *</label>
        <input
          type="text"
          value={mapping.findText || ''}
          onChange={(e) => updateMapping({ findText: e.target.value })}
          placeholder="Text to find"
          style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
        />
      </div>

      <div className="form-group">
        <label>Replace With *</label>
        <input
          type="text"
          value={mapping.replaceText || ''}
          onChange={(e) => updateMapping({ replaceText: e.target.value })}
          placeholder="Text to replace with"
          style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
        />
      </div>

      <div className="form-group">
        <label>Replace Mode</label>
        <select
          value={mapping.replaceMode || 'all'}
          onChange={(e) => updateMapping({ replaceMode: e.target.value })}
          style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
        >
          {REPLACE_MODES.map(mode => (
            <option key={mode.value} value={mode.value}>{mode.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={mapping.caseSensitive || false}
            onChange={(e) => updateMapping({ caseSensitive: e.target.checked })}
          />
          Case Sensitive
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={mapping.useRegex || false}
            onChange={(e) => updateMapping({ useRegex: e.target.checked })}
          />
          Use Regex
        </label>
      </div>
    </div>
  );
};

export default TextReplaceField;

