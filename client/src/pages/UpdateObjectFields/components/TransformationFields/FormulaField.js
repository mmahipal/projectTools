// FormulaField component - Handles formula transformation fields

import React from 'react';
import { Plus } from 'lucide-react';

const FormulaField = ({ mapping, updateMapping, sourceFields }) => {
  const handleFormulaChange = (e) => {
    updateMapping({ formula: e.target.value });
  };

  // Extract field references from formula (simple pattern matching)
  const fieldReferences = mapping.formula ? mapping.formula.match(/\{([^}]+)\}/g) || [] : [];

  return (
    <div className="form-group" style={{ marginTop: '8px' }}>
      <label>
        Formula *
        <span style={{ fontSize: '10px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
          Use {'{FieldName}'} to reference source fields
        </span>
      </label>
      <textarea
        value={mapping.formula}
        onChange={handleFormulaChange}
        placeholder="e.g., {Amount} * 1.1 or {FirstName} + ' ' + {LastName}"
        rows={3}
        style={{ 
          fontSize: '12px', 
          padding: '6px 10px', 
          width: '100%', 
          border: '1px solid #d1d5db', 
          borderRadius: '4px', 
          backgroundColor: '#fff',
          fontFamily: 'monospace'
        }}
      />
      {fieldReferences.length > 0 && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
          Referenced fields: {fieldReferences.map(ref => ref.replace(/[{}]/g, '')).join(', ')}
        </div>
      )}
      {sourceFields.length > 0 && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '11px' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Available Fields:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {sourceFields.map(field => (
              <button
                key={field.name}
                type="button"
                onClick={() => {
                  const currentFormula = mapping.formula || '';
                  updateMapping({ formula: currentFormula + `{${field.name}}` });
                }}
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                {field.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaField;

