// MultipleFieldsUpdate component - Handles multiple fields update form

import React, { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FieldValueInput from './FieldValueInput';
import { DEFAULT_MULTIPLE_FIELD_UPDATE, UPDATE_MODES } from '../constants';
import toast from 'react-hot-toast';

const MultipleFieldsUpdate = ({
  selectedObject,
  fields,
  loadingFields,
  multipleFieldUpdates,
  setMultipleFieldUpdates,
  fetchPicklistValues,
  searchReference
}) => {
  // Sync fieldInfo when fields change to prevent losing selections
  // This ensures that when fields are re-fetched, the fieldInfo in multipleFieldUpdates stays in sync
  // IMPORTANT: This should NOT run when user is actively selecting values - only when fields array changes
  useEffect(() => {
    if (fields.length > 0) {
      // Use functional update to get latest state and avoid stale closures
      setMultipleFieldUpdates(prevUpdates => {
        if (prevUpdates.length === 0) return prevUpdates;
        
        // Check if any fieldUpdate needs fieldInfo syncing
        let hasChanges = false;
        const updated = prevUpdates.map(fieldUpdate => {
          if (fieldUpdate.fieldName && fieldUpdate.fieldName !== '') {
            const currentFieldInfo = fields.find(f => f.name === fieldUpdate.fieldName);
            // Only update if fieldInfo is missing or stale
            if (currentFieldInfo && (!fieldUpdate.fieldInfo || fieldUpdate.fieldInfo.name !== currentFieldInfo.name)) {
              hasChanges = true;
              return {
                ...fieldUpdate, // Preserve ALL fields including newValue, currentValue, etc.
                fieldInfo: currentFieldInfo,
                // Only update picklistValues if they're missing or empty, don't overwrite if already fetched
                picklistValues: (currentFieldInfo.type === 'picklist' || currentFieldInfo.type === 'multipicklist')
                  ? (fieldUpdate.picklistValues && fieldUpdate.picklistValues.length > 0 
                      ? fieldUpdate.picklistValues // Keep existing picklistValues if already fetched
                      : (currentFieldInfo.picklistValues || [])) // Use from fieldInfo if not fetched yet
                  : fieldUpdate.picklistValues || []
              };
            }
          }
          return fieldUpdate; // No changes needed
        });
        
        // Only return updated array if something actually changed
        return hasChanges ? updated : prevUpdates;
      });
    }
  }, [fields]); // Only depend on fields - use functional update to avoid needing multipleFieldUpdates in deps
  const addFieldUpdate = () => {
    setMultipleFieldUpdates(prevUpdates => [...prevUpdates, {
      ...DEFAULT_MULTIPLE_FIELD_UPDATE,
      id: Date.now()
    }]);
  };

  const removeFieldUpdate = (id) => {
    setMultipleFieldUpdates(prevUpdates => {
      if (prevUpdates.length > 1) {
        return prevUpdates.filter(field => field.id !== id);
      } else {
        toast.error('At least one field update is required');
        return prevUpdates;
      }
    });
  };

  const updateFieldUpdate = (id, updates) => {
    setMultipleFieldUpdates(prevUpdates => {
      const updated = prevUpdates.map(field => {
        if (field.id === id) {
          const merged = { ...field, ...updates };
          return merged;
        }
        return field;
      });
      return updated;
    });
  };

  const handleFieldChange = (fieldUpdateId, fieldName) => {
    const fieldInfo = fields.find(f => f.name === fieldName);
    const updates = {
      fieldName: fieldName,
      fieldInfo: fieldInfo,
      newValue: '',
      currentValue: '',
      picklistValues: fieldInfo && (fieldInfo.type === 'picklist' || fieldInfo.type === 'multipicklist') 
        ? (fieldInfo.picklistValues || []) 
        : [],
      referenceSearchTerm: '',
      referenceSearchResults: [],
      currentValueReferenceSearchTerm: '',
      currentValueReferenceSearchResults: []
    };
    updateFieldUpdate(fieldUpdateId, updates);
    
    // Fetch picklist values if needed
    if (fieldInfo && (fieldInfo.type === 'picklist' || fieldInfo.type === 'multipicklist')) {
      // First use picklist values from fieldInfo if available
      const initialPicklistValues = fieldInfo.picklistValues && fieldInfo.picklistValues.length > 0
        ? fieldInfo.picklistValues
        : [];
      
      // Update with initial values immediately
      if (initialPicklistValues.length > 0) {
        setMultipleFieldUpdates(prevUpdates => prevUpdates.map(field => {
          if (field.id === fieldUpdateId) {
            return { ...field, picklistValues: initialPicklistValues };
          }
          return field;
        }));
      }
      
      // Always fetch from API to ensure we have the latest values
      // This is especially important for Contributor Project and other objects
      fetchPicklistValues(selectedObject, fieldName).then(values => {
        // Use functional update to preserve newValue and other fields
        setMultipleFieldUpdates(prevUpdates => prevUpdates.map(field => {
          if (field.id === fieldUpdateId) {
            // Preserve all existing values, only update picklistValues
            return { ...field, picklistValues: values && values.length > 0 ? values : initialPicklistValues };
          }
          return field;
        }));
      }).catch(error => {
        console.error('[MultipleFieldsUpdate] Error fetching picklist values:', error);
        // If API call fails but we have initial values, keep them
        if (initialPicklistValues.length > 0) {
        }
      });
    }
  };

  const handleReferenceSearch = async (fieldUpdateId, searchTerm, isCurrentValue = false) => {
    if (!searchTerm || searchTerm.trim() === '') {
      // Clear results if search term is empty
      setMultipleFieldUpdates(prevUpdates => prevUpdates.map(field => {
        if (field.id === fieldUpdateId) {
          return {
            ...field,
            [isCurrentValue ? 'currentValueReferenceSearchResults' : 'referenceSearchResults']: [],
            [isCurrentValue ? 'searchingCurrentValueReference' : 'searchingReference']: false,
            [isCurrentValue ? 'showCurrentValueReferenceDropdown' : 'showReferenceDropdown']: false
          };
        }
        return field;
      }));
      return;
    }

    // Use functional update to get latest fieldUpdate
    setMultipleFieldUpdates(prevUpdates => {
      const fieldUpdate = prevUpdates.find(f => f.id === fieldUpdateId);
      if (!fieldUpdate || !fieldUpdate.fieldInfo || !fieldUpdate.fieldInfo.referenceTo) {
        console.warn('[MultipleFieldsUpdate] Cannot search reference - missing fieldInfo or referenceTo:', {
          hasFieldInfo: !!fieldUpdate?.fieldInfo,
          referenceTo: fieldUpdate?.fieldInfo?.referenceTo,
          fieldName: fieldUpdate?.fieldName
        });
        return prevUpdates;
      }

      const referenceObject = fieldUpdate.fieldInfo.referenceTo;

      // Update searching state
      const updated = prevUpdates.map(field => {
        if (field.id === fieldUpdateId) {
          return {
            ...field,
            [isCurrentValue ? 'searchingCurrentValueReference' : 'searchingReference']: true,
            [isCurrentValue ? 'showCurrentValueReferenceDropdown' : 'showReferenceDropdown']: true
          };
        }
        return field;
      });
      
      // Perform search asynchronously
      searchReference(referenceObject, searchTerm)
        .then(results => {
          setMultipleFieldUpdates(prev => prev.map(field => {
            if (field.id === fieldUpdateId) {
              return {
                ...field,
                [isCurrentValue ? 'currentValueReferenceSearchResults' : 'referenceSearchResults']: results,
                [isCurrentValue ? 'searchingCurrentValueReference' : 'searchingReference']: false
              };
            }
            return field;
          }));
        })
        .catch(error => {
          console.error('[MultipleFieldsUpdate] Reference search error:', error);
          setMultipleFieldUpdates(prev => prev.map(field => {
            if (field.id === fieldUpdateId) {
              return {
                ...field,
                [isCurrentValue ? 'currentValueReferenceSearchResults' : 'referenceSearchResults']: [],
                [isCurrentValue ? 'searchingCurrentValueReference' : 'searchingReference']: false
              };
            }
            return field;
          }));
        });
      
      return updated;
    });
  };

  const handleReferenceSelect = (fieldUpdateId, record, isCurrentValue = false) => {
    updateFieldUpdate(fieldUpdateId, {
      [isCurrentValue ? 'currentValue' : 'newValue']: record.id || record.Id,
      [isCurrentValue ? 'currentValueReferenceSearchTerm' : 'referenceSearchTerm']: record.name || record.Name,
      [isCurrentValue ? 'showCurrentValueReferenceDropdown' : 'showReferenceDropdown']: false,
      [isCurrentValue ? 'searchingCurrentValueReference' : 'searchingReference']: false,
      [isCurrentValue ? 'currentValueReferenceSearchResults' : 'referenceSearchResults']: []
    });
  };

  return (
    <div>
      {multipleFieldUpdates.map((fieldUpdate, index) => (
        <div key={fieldUpdate.id} style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Field Update {index + 1}</h3>
            {multipleFieldUpdates.length > 1 && (
              <button
                type="button"
                onClick={() => removeFieldUpdate(fieldUpdate.id)}
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
                  gap: '4px'
                }}
              >
                <Trash2 size={12} />
                Remove
              </button>
            )}
          </div>
          <div 
            key={`multiple-field-grid-${fieldUpdate.id}-${fieldUpdate.updateMode}`}
            className="form-grid compact-grid single-field-update-grid" 
            style={{ 
              gridTemplateColumns: fieldUpdate.updateMode === UPDATE_MODES.SPECIFIC ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', 
              gap: '10px',
              display: 'grid',
              width: '100%',
              minWidth: 0,
              alignItems: 'start'
            }}
          >
            <div className="form-group">
              <label>Field *</label>
              {loadingFields ? (
                <div style={{ padding: '6px', fontSize: '12px', color: '#666' }}>Loading fields...</div>
              ) : (
                <select
                  key={`field-select-${fieldUpdate.id}-${fieldUpdate.fieldName || 'empty'}`}
                  value={fieldUpdate.fieldName || ''}
                  onChange={(e) => handleFieldChange(fieldUpdate.id, e.target.value)}
                  disabled={!selectedObject || fields.length === 0}
                  style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
                >
                  <option value="">--Select Field--</option>
                  {fields.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.label} ({field.type})
                    </option>
                  ))}
                  {/* Preserve selected field even if not in current fields list (temporary) */}
                  {fieldUpdate.fieldName && !fields.find(f => f.name === fieldUpdate.fieldName) && (
                    <option key={fieldUpdate.fieldName} value={fieldUpdate.fieldName} disabled>
                      {fieldUpdate.fieldName} (Not available)
                    </option>
                  )}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Update Mode *</label>
              <select
                value={fieldUpdate.updateMode}
                onChange={(e) => updateFieldUpdate(fieldUpdate.id, {
                  updateMode: e.target.value,
                  currentValue: ''
                })}
                style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
              >
                <option value={UPDATE_MODES.ALL}>Update All Records</option>
                <option value={UPDATE_MODES.SPECIFIC}>Update Only Records with Specific Value</option>
              </select>
            </div>

            {fieldUpdate.updateMode === UPDATE_MODES.SPECIFIC && (
              <div className="form-group">
                <label>Current Value *</label>
                <FieldValueInput
                  value={fieldUpdate.currentValue}
                  onChange={(value) => updateFieldUpdate(fieldUpdate.id, { currentValue: value })}
                  fieldInfo={fieldUpdate.fieldInfo}
                  picklistValues={fieldUpdate.picklistValues}
                  placeholder="Enter current value to update"
                  disabled={!fieldUpdate.fieldName}
                  isCurrentValue={true}
                  currentValueReferenceSearchTerm={fieldUpdate.currentValueReferenceSearchTerm}
                  setCurrentValueReferenceSearchTerm={(term) => {
                    updateFieldUpdate(fieldUpdate.id, { currentValueReferenceSearchTerm: term });
                    if (term && term.trim() !== '') {
                      handleReferenceSearch(fieldUpdate.id, term, true);
                    }
                  }}
                  currentValueReferenceSearchResults={fieldUpdate.currentValueReferenceSearchResults}
                  searchingCurrentValueReference={fieldUpdate.searchingCurrentValueReference}
                  showCurrentValueReferenceDropdown={fieldUpdate.showCurrentValueReferenceDropdown}
                  setShowCurrentValueReferenceDropdown={(show) => updateFieldUpdate(fieldUpdate.id, { showCurrentValueReferenceDropdown: show })}
                  onCurrentValueReferenceSelect={(record) => handleReferenceSelect(fieldUpdate.id, record, true)}
                />
              </div>
            )}

            <div className="form-group">
              <label>New Value *</label>
              <FieldValueInput
                key={`new-value-${fieldUpdate.id}-${fieldUpdate.fieldName || 'empty'}-${fieldUpdate.newValue || 'empty'}`}
                value={fieldUpdate.newValue || ''}
                onChange={(value) => {
                  updateFieldUpdate(fieldUpdate.id, { newValue: value });
                }}
                fieldInfo={fieldUpdate.fieldInfo}
                picklistValues={fieldUpdate.picklistValues}
                placeholder={fieldUpdate.fieldInfo ? `Enter new value for ${fieldUpdate.fieldInfo.label}` : 'Enter new value'}
                disabled={!fieldUpdate.fieldName}
                referenceSearchTerm={fieldUpdate.referenceSearchTerm}
                setReferenceSearchTerm={(term) => {
                  // Update search term without clearing newValue
                  // newValue will be set when a record is selected via onReferenceSelect
                  updateFieldUpdate(fieldUpdate.id, { referenceSearchTerm: term });
                  if (term && term.trim() !== '') {
                    handleReferenceSearch(fieldUpdate.id, term, false);
                  }
                }}
                referenceSearchResults={fieldUpdate.referenceSearchResults}
                searchingReference={fieldUpdate.searchingReference}
                showReferenceDropdown={fieldUpdate.showReferenceDropdown}
                setShowReferenceDropdown={(show) => updateFieldUpdate(fieldUpdate.id, { showReferenceDropdown: show })}
                onReferenceSelect={(record) => handleReferenceSelect(fieldUpdate.id, record, false)}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addFieldUpdate}
        style={{
          padding: '8px 16px',
          fontSize: '12px',
          backgroundColor: '#f0f9ff',
          color: '#0284c7',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '12px'
        }}
      >
        <Plus size={14} />
        Add Another Field
      </button>
    </div>
  );
};

export default MultipleFieldsUpdate;

