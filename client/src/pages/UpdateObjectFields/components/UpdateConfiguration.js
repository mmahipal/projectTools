// UpdateConfiguration component - Handles mode selection and routes to appropriate update component

import React from 'react';
import { UPDATE_MODE_TYPES, DEFAULT_MULTIPLE_FIELD_UPDATE, DEFAULT_FIELD_MAPPING } from '../constants';

const UpdateConfiguration = ({
  updateModeType,
  setUpdateModeType,
  setMultipleFieldUpdates,
  setSelectedField,
  setNewValue,
  setCurrentValue,
  setSourceObject,
  setSourceFields,
  setFieldMappings,
  children // Will render SingleFieldUpdate, MultipleFieldsUpdate, or FieldMappingView
}) => {
  const handleModeChange = (mode) => {
    setUpdateModeType(mode);
    
    // Reset state based on mode
    setSelectedField('');
    setNewValue('');
    setCurrentValue('');
    
    if (mode === UPDATE_MODE_TYPES.MULTIPLE) {
      setMultipleFieldUpdates([DEFAULT_MULTIPLE_FIELD_UPDATE]);
    } else if (mode === UPDATE_MODE_TYPES.MAPPING) {
      setSourceObject('');
      setSourceFields([]);
      setFieldMappings([DEFAULT_FIELD_MAPPING]);
    }
  };

  return (
    <div className="form-section fade-in" style={{ position: 'relative', zIndex: 0 }}>
      <div className="section-content" style={{ padding: '8px' }}>
        <h2 style={{ margin: 0, marginBottom: '8px' }}>Update Configuration</h2>
        
        {/* Mode Selection - Centered and Compact */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '16px',
          marginBottom: '8px'
        }}>
          <label style={{ 
            fontSize: '13px', 
            fontWeight: '500', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <input
              type="radio"
              name="updateModeType"
              value={UPDATE_MODE_TYPES.SINGLE}
              checked={updateModeType === UPDATE_MODE_TYPES.SINGLE}
              onChange={(e) => handleModeChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            Single Field
          </label>
          <label style={{ 
            fontSize: '13px', 
            fontWeight: '500', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <input
              type="radio"
              name="updateModeType"
              value={UPDATE_MODE_TYPES.MULTIPLE}
              checked={updateModeType === UPDATE_MODE_TYPES.MULTIPLE}
              onChange={(e) => handleModeChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            Multiple Fields
          </label>
          <label style={{ 
            fontSize: '13px', 
            fontWeight: '500', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <input
              type="radio"
              name="updateModeType"
              value={UPDATE_MODE_TYPES.MAPPING}
              checked={updateModeType === UPDATE_MODE_TYPES.MAPPING}
              onChange={(e) => handleModeChange(e.target.value)}
              style={{ marginRight: '4px' }}
            />
            Field Mapping
          </label>
        </div>

        {/* Render the appropriate update component */}
        {children}
      </div>
    </div>
  );
};

export default UpdateConfiguration;

