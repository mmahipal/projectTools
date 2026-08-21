// MappingEditor component - Edits a single field mapping

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { TRANSFORMATION_TYPES } from '../constants';
import { requiresSourceField } from '../utils/mappingUtils';

const MappingEditor = ({
  mapping,
  fields,
  sourceFields,
  loadingFields,
  updateMapping,
  targetPicklistValues = {},
  fetchTargetPicklistValues,
  conditionPicklistValues = {},
  fetchConditionPicklistValues,
  showTransformationHelpModal,
  setShowTransformationHelpModal,
  transformationComponents = {} // Object mapping transformation types to components
}) => {
  const handleTargetFieldChange = async (e) => {
    const selectedFieldName = e.target.value;
    const selectedField = fields.find(f => f.name === selectedFieldName);
    const updates = { targetField: selectedFieldName };
    
    // Fetch picklist values if target field is a picklist and transformation is conditional
    if (selectedField && (selectedField.type === 'picklist' || selectedField.type === 'multipicklist') && mapping.transformation === TRANSFORMATION_TYPES.CONDITIONAL) {
      if (fetchTargetPicklistValues) {
        fetchTargetPicklistValues(mapping.id, selectedFieldName);
      }
    }
    
    updateMapping(mapping.id, updates);
  };

  const handleTransformationChange = async (e) => {
    const newTransformation = e.target.value;
    // Reset transformation-specific fields when transformation changes
    const updates = {
      transformation: newTransformation,
      sourceField: requiresSourceField(newTransformation) ? mapping.sourceField : '',
      formula: '',
      concatenateFields: [],
      valueMappings: [{ from: '', to: '' }],
      conditions: [{ id: Date.now(), field: '', operator: 'equals', value: '', logicalOperator: 'AND' }],
      findText: '',
      replaceText: '',
      defaultValue: '',
      cases: [{ value: '', targetValue: '' }]
    };
    
    // If changing to conditional and target field is already selected and is a picklist, fetch picklist values
    if (newTransformation === TRANSFORMATION_TYPES.CONDITIONAL && mapping.targetField) {
      const selectedField = fields.find(f => f.name === mapping.targetField);
      if (selectedField && (selectedField.type === 'picklist' || selectedField.type === 'multipicklist')) {
        if (fetchTargetPicklistValues) {
          fetchTargetPicklistValues(mapping.id, mapping.targetField);
        }
      }
    }
    
    updateMapping(mapping.id, updates);
  };

  const handleSourceFieldChange = (e) => {
    updateMapping(mapping.id, { sourceField: e.target.value });
  };

  const needsSourceField = requiresSourceField(mapping.transformation);
  // For card view: Target Field and Transformation in single row, Source Field below if needed
  const gridColumns = needsSourceField ? '1fr 1fr' : '1fr 1fr';

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div className="form-grid compact-grid field-mapping-card-editor" style={{ 
        gap: '12px', 
        gridTemplateColumns: gridColumns,
        width: '100%'
      }}>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#002329', marginBottom: 0, minWidth: 'auto', paddingRight: 0 }}>
            Target Field *
          </label>
          {loadingFields ? (
            <div style={{ padding: '8px', fontSize: '13px', color: '#666', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f9fafb' }}>Loading...</div>
          ) : (
            <select
              value={mapping.targetField}
              onChange={handleTargetFieldChange}
              disabled={!fields || fields.length === 0}
              style={{ 
                fontSize: '13px', 
                padding: '8px 12px', 
                height: '38px', 
                width: '100%', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px', 
                backgroundColor: '#fff',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="">--Select Target Field--</option>
              {fields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label} ({field.type})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#002329', marginBottom: 0, minWidth: 'auto', paddingRight: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Transformation *
            <button
              type="button"
              onClick={() => setShowTransformationHelpModal(true)}
              style={{
                background: 'none',
                border: '1px solid #0284c7',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#0284c7',
                fontSize: '10px',
                padding: 0,
                flexShrink: 0
              }}
              title="Transformation help"
            >
              <HelpCircle size={14} />
            </button>
          </label>
          <select
            value={mapping.transformation}
            onChange={handleTransformationChange}
            style={{ 
              fontSize: '13px', 
              padding: '8px 12px', 
              height: '38px', 
              width: '100%', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px', 
              backgroundColor: '#fff',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            <option value="copy">Copy (Direct)</option>
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
            <option value="textReplace">Text Replace</option>
            <option value="concatenate">Concatenate</option>
            <option value="formula">Formula</option>
            <option value="dateFormat">Date Format</option>
            <option value="numberFormat">Number Format</option>
            <option value="valueMap">Value Map</option>
            <option value="conditional">Conditional</option>
            <option value="switch">Switch/Case</option>
            <option value="defaultValue">Default Value</option>
            <option value="typeConversion">Type Conversion</option>
            <option value="validateFormat">Format Validation</option>
            <option value="removeSpecialChars">Remove Special Characters</option>
          </select>
        </div>

        {needsSourceField && (
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#002329', marginBottom: 0, minWidth: 'auto', paddingRight: 0 }}>
              Source Field *
            </label>
            <select
              value={mapping.sourceField}
              onChange={handleSourceFieldChange}
              disabled={!sourceFields || sourceFields.length === 0}
              style={{ 
                fontSize: '13px', 
                padding: '8px 12px', 
                height: '38px', 
                width: '100%', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px', 
                backgroundColor: '#fff',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="">--Select Source Field--</option>
              {sourceFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label} ({field.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Render transformation-specific fields */}
      {transformationComponents[mapping.transformation] && (
        <div style={{ marginTop: '12px' }}>
          {React.createElement(transformationComponents[mapping.transformation], {
            mapping,
            updateMapping: (updates) => updateMapping(mapping.id, updates),
            fields,
            sourceFields,
            targetPicklistValues: targetPicklistValues[mapping.id] || [],
            conditionPicklistValues: conditionPicklistValues || {},
            conditionReferenceSearch: {},
            handleConditionReferenceSearch: () => {},
            fetchConditionPicklistValues: fetchConditionPicklistValues || (() => {})
          })}
        </div>
      )}
    </div>
  );
};

export default MappingEditor;

