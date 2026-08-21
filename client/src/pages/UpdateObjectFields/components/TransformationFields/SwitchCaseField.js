// SwitchCaseField component - Handles switch/case transformation fields

import React from 'react';
import { Plus, X } from 'lucide-react';

const SwitchCaseField = ({ mapping, updateMapping }) => {
  const cases = mapping.cases || [{ value: '', targetValue: '' }];

  const addCase = () => {
    updateMapping({
      cases: [...cases, { value: '', targetValue: '' }]
    });
  };

  const removeCase = (index) => {
    const newCases = [...cases];
    newCases.splice(index, 1);
    updateMapping({
      cases: newCases.length > 0 ? newCases : [{ value: '', targetValue: '' }]
    });
  };

  const updateCase = (index, field, value) => {
    const newCases = [...cases];
    newCases[index] = { ...newCases[index], [field]: value };
    updateMapping({ cases: newCases });
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        Map multiple source values to different target values. Similar to a switch/case statement.
      </div>
      {cases.map((caseItem, index) => (
        <div key={index} style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '8px', 
          alignItems: 'center' 
        }}>
          <input
            type="text"
            value={caseItem.value}
            onChange={(e) => updateCase(index, 'value', e.target.value)}
            placeholder="Source value"
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', flex: 1, border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>→</span>
          <input
            type="text"
            value={caseItem.targetValue}
            onChange={(e) => updateCase(index, 'targetValue', e.target.value)}
            placeholder="Target value"
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', flex: 1, border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          />
          {cases.length > 1 && (
            <button
              type="button"
              onClick={() => removeCase(index)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addCase}
        style={{
          padding: '6px 12px',
          fontSize: '11px',
          backgroundColor: '#f0f9ff',
          color: '#0284c7',
          border: '1px solid #bae6fd',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <Plus size={12} />
        Add Case
      </button>
      <div className="form-group" style={{ marginTop: '12px' }}>
        <label>Default Value (if no case matches)</label>
        <input
          type="text"
          value={mapping.switchDefaultValue || ''}
          onChange={(e) => updateMapping({ switchDefaultValue: e.target.value })}
          placeholder="Default value"
          style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
        />
      </div>
    </div>
  );
};

export default SwitchCaseField;

