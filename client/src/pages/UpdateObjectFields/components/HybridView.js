// HybridView component - Hybrid Summary + Detail View for field mappings

import React from 'react';
import { Plus, Trash2, Copy, Check, X } from 'lucide-react';
import { getMappingStatus, getMappingSummary } from '../utils/mappingUtils';

const HybridView = ({
  fieldMappings,
  fields,
  sourceFields,
  selectedMappingId,
  setSelectedMappingId,
  addMapping,
  removeMapping,
  duplicateMapping,
  getStatus,
  getSummary,
  onTemplateClick,
  children // Will render MappingEditor for selected mapping
}) => {
  const selectedMapping = fieldMappings.find(m => m.id === selectedMappingId);

  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      marginTop: '8px',
      minHeight: '600px',
      height: 'calc(100vh - 400px)',
      maxHeight: '900px'
    }}>
      {/* Left Panel: Summary List */}
      <div style={{ 
        width: '32%', 
        border: '1px solid #e5e7eb', 
        borderRadius: '6px',
        backgroundColor: '#fafafa',
        padding: '8px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginBottom: '8px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={addMapping}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '11px',
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Plus size={12} />
            Add
          </button>
          {onTemplateClick && (
            <button
              type="button"
              onClick={onTemplateClick}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '11px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              Template
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {fieldMappings.map((mapping) => {
            const status = getStatus ? getStatus(mapping) : getMappingStatus(mapping);
            const summary = getSummary ? getSummary(mapping) : getMappingSummary(mapping, fields, sourceFields);
            const isSelected = mapping.id === selectedMappingId;

            return (
              <div
                key={mapping.id}
                onClick={() => setSelectedMappingId(mapping.id)}
                style={{
                  padding: '8px',
                  marginBottom: '6px',
                  borderRadius: '4px',
                  border: `1px solid ${isSelected ? '#0284c7' : '#e5e7eb'}`,
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'start',
                  marginBottom: '4px'
                }}>
                  <div style={{ flex: 1, fontSize: '11px', fontWeight: '500', color: '#002329' }}>
                    {summary}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '4px',
                    marginLeft: '6px'
                  }}>
                    {status === 'valid' ? (
                      <Check size={12} style={{ color: '#10b981' }} />
                    ) : (
                      <X size={12} style={{ color: '#ef4444' }} />
                    )}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '4px',
                  marginTop: '4px'
                }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateMapping(mapping.id);
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                    title="Duplicate"
                  >
                    <Copy size={10} />
                  </button>
                  {fieldMappings.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMapping(mapping.id);
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                      title="Remove"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Selected Mapping Editor */}
      <div style={{ 
        flex: 1, 
        border: '1px solid #e5e7eb', 
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        padding: '12px',
        overflowY: 'auto'
      }}>
        {selectedMapping ? (
          children || <div>Mapping Editor for mapping {selectedMapping.id}</div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: '#9ca3af',
            fontSize: '13px'
          }}>
            Select a mapping from the left panel to edit
          </div>
        )}
      </div>
    </div>
  );
};

export default HybridView;

