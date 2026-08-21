// SingleFieldUpdate component - Handles single field update form

import React from 'react';
import FieldValueInput from './FieldValueInput';
import { UPDATE_MODES } from '../constants';

const SingleFieldUpdate = ({
  selectedObject,
  fields,
  loadingFields,
  selectedField,
  setSelectedField,
  updateMode,
  setUpdateMode,
  currentValue,
  setCurrentValue,
  newValue,
  setNewValue,
  selectedFieldInfo,
  picklistValues,
  // Reference search props for new value
  referenceSearchTerm,
  setReferenceSearchTerm,
  referenceSearchResults,
  searchingReference,
  showReferenceDropdown,
  setShowReferenceDropdown,
  // Reference search props for current value
  currentValueReferenceSearchTerm,
  setCurrentValueReferenceSearchTerm,
  currentValueReferenceSearchResults,
  searchingCurrentValueReference,
  showCurrentValueReferenceDropdown,
  setShowCurrentValueReferenceDropdown
}) => {
  const handleFieldChange = (fieldName) => {
    setSelectedField(fieldName);
    setNewValue('');
    setCurrentValue('');
  };

  const handleNewValueReferenceSelect = (record) => {
    setNewValue(record.id || record.Id);
    setReferenceSearchTerm(record.name || record.Name);
    setShowReferenceDropdown(false);
  };

  const handleCurrentValueReferenceSelect = (record) => {
    setCurrentValue(record.id || record.Id);
    setCurrentValueReferenceSearchTerm(record.name || record.Name);
    setShowCurrentValueReferenceDropdown(false);
  };

  return (
    <div>
      <div 
        key={`single-field-grid-${updateMode}`}
        className="form-grid compact-grid single-field-update-grid" 
        style={{ 
          gridTemplateColumns: updateMode === UPDATE_MODES.SPECIFIC ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', 
          gap: '10px',
          display: 'grid',
          width: '100%',
          minWidth: 0
        }}
      >
        <div className="form-group">
          <label>Field *</label>
          {loadingFields ? (
            <div style={{ padding: '6px', fontSize: '12px', color: '#666' }}>Loading fields...</div>
          ) : (
            <select
              value={selectedField}
              onChange={(e) => handleFieldChange(e.target.value)}
              disabled={!selectedObject || fields.length === 0}
              style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
            >
              <option value="">--Select Field--</option>
              {fields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label} ({field.type})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label>Update Mode *</label>
          <select
            value={updateMode}
            onChange={(e) => {
              setUpdateMode(e.target.value);
              setCurrentValue('');
            }}
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          >
            <option value={UPDATE_MODES.ALL}>Update All Records</option>
            <option value={UPDATE_MODES.SPECIFIC}>Update Only Records with Specific Value</option>
          </select>
        </div>

        {updateMode === UPDATE_MODES.SPECIFIC && (
          <div className="form-group">
            <label>Current Value *</label>
            <FieldValueInput
              value={currentValue}
              onChange={setCurrentValue}
              fieldInfo={selectedFieldInfo}
              picklistValues={picklistValues}
              placeholder="Enter current value to update"
              disabled={!selectedField}
              isCurrentValue={true}
              currentValueReferenceSearchTerm={currentValueReferenceSearchTerm}
              setCurrentValueReferenceSearchTerm={setCurrentValueReferenceSearchTerm}
              currentValueReferenceSearchResults={currentValueReferenceSearchResults}
              searchingCurrentValueReference={searchingCurrentValueReference}
              showCurrentValueReferenceDropdown={showCurrentValueReferenceDropdown}
              setShowCurrentValueReferenceDropdown={setShowCurrentValueReferenceDropdown}
              onCurrentValueReferenceSelect={handleCurrentValueReferenceSelect}
            />
          </div>
        )}

        <div className="form-group">
          <label>
            New Value *
            {selectedFieldInfo && selectedFieldInfo.required && <span style={{ color: 'red' }}> *</span>}
          </label>
          <FieldValueInput
            value={newValue}
            onChange={setNewValue}
            fieldInfo={selectedFieldInfo}
            picklistValues={picklistValues}
            placeholder={selectedFieldInfo ? `Enter new value for ${selectedFieldInfo.label}` : 'Enter new value'}
            disabled={!selectedField}
            referenceSearchTerm={referenceSearchTerm}
            setReferenceSearchTerm={setReferenceSearchTerm}
            referenceSearchResults={referenceSearchResults}
            searchingReference={searchingReference}
            showReferenceDropdown={showReferenceDropdown}
            setShowReferenceDropdown={setShowReferenceDropdown}
            onReferenceSelect={handleNewValueReferenceSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default SingleFieldUpdate;

