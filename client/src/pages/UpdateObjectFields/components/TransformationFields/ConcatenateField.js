// ConcatenateField component - Handles concatenate transformation fields

import React from 'react';

const ConcatenateField = ({ mapping, updateMapping, sourceFields }) => {
  const toggleField = (fieldName) => {
    const fields = [...(mapping.concatenateFields || [])];
    const index = fields.indexOf(fieldName);
    if (index > -1) {
      fields.splice(index, 1);
    } else {
      fields.push(fieldName);
    }
    updateMapping({ concatenateFields: fields });
  };

  return (
    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
      <label>Source Fields (Select multiple) *</label>
      {(!sourceFields || sourceFields.length === 0) ? (
        <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', marginTop: '4px' }}>
          No source fields available. Please select a source object first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {sourceFields.map((field) => {
          const isSelected = (mapping.concatenateFields || []).includes(field.name);
          return (
            <label key={field.name} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
              backgroundColor: isSelected ? '#dbeafe' : '#f3f4f6',
              borderRadius: '4px',
              border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`
            }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleField(field.name)}
              />
              {field.label}
            </label>
          );
        })}
        </div>
      )}
      {(mapping.concatenateFields || []).length > 0 && (
        <>
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Field Order (Optional)
            </label>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
              Selected fields: {mapping.concatenateFields?.join(', ') || 'None'}
            </div>
            <textarea
              value={mapping.fieldOrder || ''}
              onChange={(e) => updateMapping({ fieldOrder: e.target.value })}
              placeholder={`Enter field names in desired order, one per line or comma-separated.\nExample:\n${mapping.concatenateFields?.slice(0, 2).join('\n') || 'Field1\nField2'}\n\nOr copy-paste variables like: {Field1}, {Field2}`}
              style={{ 
                fontSize: '12px', 
                padding: '8px', 
                width: '100%', 
                minHeight: '100px',
                maxHeight: '200px',
                border: '1px solid #d1d5db', 
                borderRadius: '4px', 
                backgroundColor: '#fff',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Leave empty to use selected order. Use field names or variables like {'{FieldName}'}.
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Separator *
            </label>
            <input
              type="text"
              value={mapping.separator || ' '}
              onChange={(e) => updateMapping({ separator: e.target.value })}
              placeholder="Enter separator (e.g., space, comma, dash)"
              style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', maxWidth: '300px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ConcatenateField;

