// DynamicFieldsSection component for QuickSetupWizard

import React from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';

const DynamicFieldsSection = ({
  addedFields,
  availableFields,
  register,
  errors,
  fieldErrors,
  watch,
  setValue,
  fieldValues,
  setFieldValues,
  handleRemoveField,
  fieldHasValue
}) => {
  if (addedFields.size === 0) {
    return null;
  }

  return (
    <div className="section-content" style={{ marginBottom: '24px', border: '2px solid #00B8D9', borderRadius: '8px', padding: '12px', backgroundColor: '#f0f9ff' }}>
      <h2 style={{ marginBottom: '12px', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
        <Plus size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: '#00B8D9' }} />
        Additional Fields
        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
          (Newly Added)
        </span>
      </h2>
      <div className="form-grid compact-grid">
        {Array.from(addedFields).map(fieldKey => {
          const field = availableFields.find(f => f.key === fieldKey);
          if (!field) return null;
          
          const isHighlighted = addedFields.has(fieldKey);
          const hasValue = fieldHasValue(fieldKey);
          
          return (
            <div
              key={fieldKey}
              className="form-group"
              style={{
                border: isHighlighted ? '2px solid #00B8D9' : '1px solid #ddd',
                borderRadius: '4px',
                padding: '12px',
                backgroundColor: isHighlighted ? '#f0f9ff' : '#fff',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: '600', fontSize: '14px' }}>
                  {field.label}
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveField(fieldKey)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#ff4d4f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove field"
                >
                  <X size={16} />
                </button>
              </div>
              
              {field.description && (
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>{field.description}</p>
              )}
              
              {field.type === 'text' && (
                <input
                  {...register(fieldKey, { required: false })}
                  value={watch(fieldKey) || fieldValues[fieldKey] || ''}
                  onChange={(e) => {
                    setValue(fieldKey, e.target.value);
                    setFieldValues(prev => ({ ...prev, [fieldKey]: e.target.value }));
                  }}
                  className={fieldErrors[fieldKey] ? 'error-field' : ''}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: hasValue ? '1px solid #ddd' : '2px solid #ffa500',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                  placeholder={field.example || `Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.type === 'textarea' && (
                <textarea
                  {...register(fieldKey, { required: false })}
                  value={watch(fieldKey) || fieldValues[fieldKey] || ''}
                  onChange={(e) => {
                    setValue(fieldKey, e.target.value);
                    setFieldValues(prev => ({ ...prev, [fieldKey]: e.target.value }));
                  }}
                  className={fieldErrors[fieldKey] ? 'error-field' : ''}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: hasValue ? '1px solid #ddd' : '2px solid #ffa500',
                    borderRadius: '4px',
                    fontSize: '13px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder={field.example || `Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.type === 'select' && field.options && (
                <select
                  {...register(fieldKey, { required: false })}
                  value={watch(fieldKey) || fieldValues[fieldKey] || ''}
                  onChange={(e) => {
                    setValue(fieldKey, e.target.value);
                    setFieldValues(prev => ({ ...prev, [fieldKey]: e.target.value }));
                  }}
                  className={fieldErrors[fieldKey] ? 'error-field' : ''}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: hasValue ? '1px solid #ddd' : '2px solid #ffa500',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <option value="">--None--</option>
                  {field.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              
              {field.type === 'number' && (
                <input
                  type="number"
                  {...register(fieldKey, { required: false, valueAsNumber: true })}
                  value={watch(fieldKey) || fieldValues[fieldKey] || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setValue(fieldKey, value);
                    setFieldValues(prev => ({ ...prev, [fieldKey]: value }));
                  }}
                  className={fieldErrors[fieldKey] ? 'error-field' : ''}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: hasValue ? '1px solid #ddd' : '2px solid #ffa500',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                  placeholder={field.example || `Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.type === 'date' && (
                <input
                  type="date"
                  {...register(fieldKey, { required: false })}
                  value={watch(fieldKey) || fieldValues[fieldKey] || ''}
                  onChange={(e) => {
                    setValue(fieldKey, e.target.value);
                    setFieldValues(prev => ({ ...prev, [fieldKey]: e.target.value }));
                  }}
                  className={fieldErrors[fieldKey] ? 'error-field' : ''}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: hasValue ? '1px solid #ddd' : '2px solid #ffa500',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              )}
              
              {field.type === 'checkbox' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    {...register(fieldKey)}
                    checked={watch(fieldKey) || fieldValues[fieldKey] || false}
                    onChange={(e) => {
                      setValue(fieldKey, e.target.checked);
                      setFieldValues(prev => ({ ...prev, [fieldKey]: e.target.checked }));
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px' }}>Enable {field.label}</span>
                </label>
              )}
              
              {!hasValue && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#ffa500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  <span>Field added but no value provided</span>
                </div>
              )}
              
              {errors[fieldKey] && <span className="error" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Required</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicFieldsSection;

