// ValueMapField component - Handles value map transformation fields

import React from 'react';
import { Plus, X } from 'lucide-react';

const ValueMapField = ({ mapping, updateMapping }) => {
  const valueMappings = mapping.valueMappings || [{ from: '', to: '' }];

  const addMapping = () => {
    updateMapping({
      valueMappings: [...valueMappings, { from: '', to: '' }]
    });
  };

  const removeMapping = (index) => {
    const newMappings = [...valueMappings];
    newMappings.splice(index, 1);
    updateMapping({
      valueMappings: newMappings.length > 0 ? newMappings : [{ from: '', to: '' }]
    });
  };

  const updateMappingValue = (index, field, value) => {
    const newMappings = [...valueMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    updateMapping({ valueMappings: newMappings });
  };

  return (
    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
      <label>Value Mappings *</label>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
        Map source values to target values.
      </div>
      {valueMappings.map((valueMap, index) => (
        <div key={index} style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '8px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={valueMap.from}
            onChange={(e) => updateMappingValue(index, 'from', e.target.value)}
            placeholder="Source value"
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', flex: 1, border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>→</span>
          <input
            type="text"
            value={valueMap.to}
            onChange={(e) => updateMappingValue(index, 'to', e.target.value)}
            placeholder="Target value"
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', flex: 1, border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          />
          {valueMappings.length > 1 && (
            <button
              type="button"
              onClick={() => removeMapping(index)}
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
        onClick={addMapping}
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
        Add Mapping
      </button>
    </div>
  );
};

export default ValueMapField;

