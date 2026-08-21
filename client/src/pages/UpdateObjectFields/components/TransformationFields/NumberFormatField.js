// NumberFormatField component - Handles number format transformation fields

import React from 'react';

const NumberFormatField = ({ mapping, updateMapping }) => {
  return (
    <div className="form-group" style={{ marginTop: '8px' }}>
      <label>Number Format *</label>
      <input
        type="text"
        value={mapping.numberFormat || '0.00'}
        onChange={(e) => updateMapping({ numberFormat: e.target.value })}
        placeholder="e.g., 0.00, 0,000.00"
        style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
      />
      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
        Specify decimal places: "0.00" for 2 decimals, "0" for whole numbers. Use "0,000.00" for thousands separator.
      </div>
    </div>
  );
};

export default NumberFormatField;

