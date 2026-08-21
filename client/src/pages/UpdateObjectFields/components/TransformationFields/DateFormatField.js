// DateFormatField component - Handles date format transformation fields

import React from 'react';
import { DATE_FORMAT_OPTIONS } from '../../constants';

const DateFormatField = ({ mapping, updateMapping }) => {
  return (
    <div className="form-group" style={{ marginTop: '8px' }}>
      <label>Date Format *</label>
      <select
        value={mapping.dateFormat || 'YYYY-MM-DD'}
        onChange={(e) => updateMapping({ dateFormat: e.target.value })}
        style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
      >
        {DATE_FORMAT_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
        Select the date format to apply to the source date field value.
      </div>
    </div>
  );
};

export default DateFormatField;

