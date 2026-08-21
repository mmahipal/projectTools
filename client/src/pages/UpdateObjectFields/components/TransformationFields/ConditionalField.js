// ConditionalField component - Handles conditional transformation fields

import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { CONDITION_OPERATORS, LOGICAL_OPERATORS } from '../../constants';

const ConditionalField = ({ 
  mapping, 
  updateMapping, 
  sourceFields,
  fields = [],
  targetPicklistValues = [],
  conditionPicklistValues = {},
  conditionReferenceSearch = {},
  handleConditionReferenceSearch,
  fetchConditionPicklistValues
}) => {
  const addCondition = () => {
    const newCondition = {
      id: Date.now(),
      field: '',
      operator: 'equals',
      value: '',
      logicalOperator: 'AND'
    };
    updateMapping({
      conditions: [...(mapping.conditions || []), newCondition]
    });
  };

  const removeCondition = (conditionId) => {
    updateMapping({
      conditions: (mapping.conditions || []).filter(c => c.id !== conditionId)
    });
  };

  const updateCondition = (conditionId, updates) => {
    updateMapping({
      conditions: (mapping.conditions || []).map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    });
  };

  const noValueOperators = ['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'];

  return (
    <div style={{ marginTop: '8px', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginTop: '12px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#002329' }}>Conditions *</label>
          <button
            type="button"
            onClick={addCondition}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0f2fe';
              e.currentTarget.style.borderColor = '#7dd3fc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.borderColor = '#bae6fd';
            }}
          >
            <Plus size={14} />
            Add Condition
          </button>
        </div>

        {(mapping.conditions || []).map((condition, index) => (
          <div key={condition.id} style={{ 
            marginBottom: '12px', 
            padding: '12px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '6px',
            backgroundColor: '#fafafa',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {index > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <select
                  value={condition.logicalOperator}
                  onChange={(e) => updateCondition(condition.id, { logicalOperator: e.target.value })}
                  style={{ 
                    fontSize: '12px', 
                    padding: '6px 10px', 
                    height: '32px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px', 
                    backgroundColor: '#fff', 
                    fontWeight: '600',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {LOGICAL_OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '8px',
              width: '100%'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px', 
                alignItems: 'start',
                width: '100%'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>Field</label>
                  <select
                    value={condition.field}
                    onChange={(e) => {
                      const fieldName = e.target.value;
                      updateCondition(condition.id, { field: fieldName });
                      if (fieldName && fetchConditionPicklistValues) {
                        fetchConditionPicklistValues(mapping.id, fieldName);
                      }
                    }}
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 10px', 
                      height: '32px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '4px', 
                      backgroundColor: '#fff',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">--Select Field--</option>
                    {sourceFields.map(field => (
                      <option key={field.name} value={field.name}>{field.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <label style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>Operator</label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 10px', 
                      height: '32px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '4px', 
                      backgroundColor: '#fff',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {CONDITION_OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!noValueOperators.includes(condition.operator) && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>Value</label>
                    {(() => {
                      const conditionField = sourceFields.find(f => f.name === condition.field);
                      const isPicklist = conditionField && (conditionField.type === 'picklist' || conditionField.type === 'multipicklist');
                      const picklistKey = `${mapping.id}-${condition.field}`;
                      const picklistValues = conditionPicklistValues[picklistKey] || conditionField?.picklistValues || [];
                      
                      if (isPicklist && picklistValues.length > 0) {
                        return (
                          <select
                            value={condition.value || ''}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            style={{ 
                              fontSize: '12px', 
                              padding: '6px 10px', 
                              height: '32px', 
                              border: '1px solid #d1d5db', 
                              borderRadius: '4px', 
                              backgroundColor: '#fff',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <option value="">--Select Value--</option>
                            {picklistValues.map((value, idx) => (
                              <option key={idx} value={value}>{value}</option>
                            ))}
                          </select>
                        );
                      } else {
                        return (
                          <input
                            type="text"
                            value={condition.value || ''}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            placeholder="Value"
                            style={{ 
                              fontSize: '12px', 
                              padding: '6px 10px', 
                              height: '32px', 
                              border: '1px solid #d1d5db', 
                              borderRadius: '4px', 
                              backgroundColor: '#fff',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          />
                        );
                      }
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCondition(condition.id)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      flexShrink: 0
                    }}
                    title="Remove condition"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#002329', marginBottom: 0 }}>
            Then Value *
          </label>
          {(() => {
            const targetField = fields.find(f => f.name === mapping.targetField);
            const isTargetPicklist = targetField && (targetField.type === 'picklist' || targetField.type === 'multipicklist');
            const thenPicklistValues = isTargetPicklist ? (targetPicklistValues || targetField?.picklistValues || []) : [];
            
            if (isTargetPicklist) {
              return (
                <select
                  value={mapping.thenValue || ''}
                  onChange={(e) => updateMapping({ thenValue: e.target.value })}
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
                  <option value="">--Select Value--</option>
                  {thenPicklistValues.length > 0 ? (
                    thenPicklistValues.map((value, idx) => (
                      <option key={idx} value={value}>{value}</option>
                    ))
                  ) : (
                    <option value="" disabled>Loading values...</option>
                  )}
                </select>
              );
            } else {
              return (
                <input
                  type="text"
                  value={mapping.thenValue || ''}
                  onChange={(e) => updateMapping({ thenValue: e.target.value })}
                  placeholder="Value when condition is true"
                  style={{ 
                    fontSize: '13px', 
                    padding: '8px 12px', 
                    height: '38px', 
                    width: '100%', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              );
            }
          })()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: '#002329', marginBottom: 0 }}>
            Else Value *
          </label>
          {(() => {
            const targetField = fields.find(f => f.name === mapping.targetField);
            const isTargetPicklist = targetField && (targetField.type === 'picklist' || targetField.type === 'multipicklist');
            const elsePicklistValues = isTargetPicklist ? (targetPicklistValues || targetField?.picklistValues || []) : [];
            
            if (isTargetPicklist) {
              return (
                <select
                  value={mapping.elseValue || ''}
                  onChange={(e) => updateMapping({ elseValue: e.target.value })}
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
                  <option value="">--Select Value--</option>
                  {elsePicklistValues.length > 0 ? (
                    elsePicklistValues.map((value, idx) => (
                      <option key={idx} value={value}>{value}</option>
                    ))
                  ) : (
                    <option value="" disabled>Loading values...</option>
                  )}
                </select>
              );
            } else {
              return (
                <input
                  type="text"
                  value={mapping.elseValue || ''}
                  onChange={(e) => updateMapping({ elseValue: e.target.value })}
                  placeholder="Value when condition is false"
                  style={{ 
                    fontSize: '13px', 
                    padding: '8px 12px', 
                    height: '38px', 
                    width: '100%', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default ConditionalField;

