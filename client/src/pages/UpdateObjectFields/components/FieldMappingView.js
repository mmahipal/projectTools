// FieldMappingView component - Container for field mapping functionality

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { OBJECT_OPTIONS } from '../constants';

const FieldMappingView = ({
  selectedObject,
  sourceObject,
  setSourceObject,
  sourceFields,
  setSourceFields,
  fetchFields,
  objectOptions = OBJECT_OPTIONS,
  fieldMappings,
  useHybridView,
  setUseHybridView,
  selectedMappingId,
  setSelectedMappingId,
  showMappingModeHelp,
  setShowMappingModeHelp,
  showFieldMappingHelpModal,
  setShowFieldMappingHelpModal,
  children // Will render HybridView or CardView
}) => {
  return (
    <div style={{ marginTop: '8px' }}>
      {/* Compact Header with Help Icon */}
      <div style={{ 
        marginBottom: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#002329' }}>
            Field Mapping
          </h3>
          <button
            type="button"
            onClick={() => setShowMappingModeHelp(!showMappingModeHelp)}
            style={{
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '11px',
              padding: 0
            }}
            title="Click for help on Field Mapping Mode"
          >
            <HelpCircle size={12} />
          </button>
        </div>
      </div>

      {/* Help Text - Only shown when help icon is clicked */}
      {showMappingModeHelp && (
        <div style={{ 
          marginBottom: '8px', 
          padding: '8px', 
          backgroundColor: '#eff6ff', 
          borderRadius: '6px',
          border: '1px solid #bfdbfe',
          fontSize: '11px',
          color: '#1e40af'
        }}>
          <strong>Field Mapping Mode:</strong> In this mode, you map fields from a source object to a target object with optional transformations. 
          <strong> You do NOT need to enter manual field update details (like "Current Value" or "New Value")</strong> - the system automatically copies and transforms values from source records to target records based on your mappings.
        </div>
      )}

      {/* Source Object and Target Object in Single Row with Different Frames */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px', 
        marginBottom: '8px' 
      }}>
        {/* Source Object Frame */}
        <div style={{ 
          padding: '6px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '6px',
          border: '1px solid #bae6fd'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginBottom: '6px', 
            fontSize: '11px', 
            fontWeight: '600',
            color: '#0284c7'
          }}>
            Source Object *
          </label>
          <select
            value={sourceObject}
            onChange={(e) => {
              const newSourceObject = e.target.value;
              setSourceObject(newSourceObject);
              setSourceFields([]);
              if (newSourceObject) {
                fetchFields(newSourceObject, true);
              }
            }}
            style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
          >
            <option value="">--Select Source Object--</option>
            {objectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Target Object Frame */}
        <div style={{ 
          padding: '6px', 
          backgroundColor: '#ffffff', 
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginBottom: '6px', 
            fontSize: '11px', 
            fontWeight: '600',
            color: '#002329'
          }}>
            Target Object *
          </label>
          <div style={{ 
            fontSize: '12px', 
            padding: '6px 10px', 
            height: '32px', 
            display: 'flex',
            alignItems: 'center',
            color: selectedObject ? '#002329' : '#9ca3af',
            backgroundColor: '#fff',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}>
            {selectedObject || 'Select target object above'}
          </div>
        </div>
      </div>

      {/* Field Mappings Header with Help and Hybrid View Toggle */}
      <div style={{ 
        marginBottom: '8px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '6px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#002329' }}>
            Field Mappings ({fieldMappings.length})
          </div>
          <button
            type="button"
            onClick={() => setShowFieldMappingHelpModal(true)}
            style={{
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '11px',
              padding: 0
            }}
            title="Click for help on Field Mappings"
          >
            <HelpCircle size={12} />
          </button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#374151' }}>
          <input
            type="checkbox"
            checked={useHybridView}
            onChange={(e) => {
              setUseHybridView(e.target.checked);
              if (e.target.checked && fieldMappings.length > 0 && !selectedMappingId) {
                setSelectedMappingId(fieldMappings[0].id);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          Hybrid View
        </label>
      </div>

      {/* Render HybridView or CardView */}
      {children}
    </div>
  );
};

export default FieldMappingView;

