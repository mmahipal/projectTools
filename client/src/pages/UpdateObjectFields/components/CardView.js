// CardView component - Card-based view for field mappings

import React from 'react';
import { Trash2, Copy, Check, X, Plus } from 'lucide-react';
import { getMappingStatus, getMappingSummary } from '../utils/mappingUtils';

const CardView = ({
  fieldMappings,
  fields,
  sourceFields,
  addMapping,
  removeMapping,
  duplicateMapping,
  getStatus,
  getSummary,
  onTemplateClick,
  children // Will render MappingEditor for each mapping
}) => {
  return (
    <div>
      {/* Add Mapping Button */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={addMapping}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
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
          <Plus size={16} />
          Add Mapping
        </button>
        {onTemplateClick && (
          <button
            type="button"
            onClick={onTemplateClick}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fde68a';
              e.currentTarget.style.borderColor = '#fcd34d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fef3c7';
              e.currentTarget.style.borderColor = '#fde68a';
            }}
          >
            Template
          </button>
        )}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', 
        gap: '16px',
        marginTop: '8px'
      }}>
      {fieldMappings.map((mapping) => {
        const status = getStatus ? getStatus(mapping) : getMappingStatus(mapping);
        const summary = getSummary ? getSummary(mapping) : getMappingSummary(mapping, fields, sourceFields);

        return (
          <div
            key={mapping.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0, // Prevent overflow
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Card Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'start',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#002329', 
                  marginBottom: '6px',
                  wordBreak: 'break-word'
                }}>
                  {summary}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {status === 'valid' ? (
                    <>
                      <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>Valid</span>
                    </>
                  ) : (
                    <>
                      <X size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500' }}>Incomplete</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => duplicateMapping(mapping.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Duplicate"
                >
                  <Copy size={12} />
                </button>
                {fieldMappings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMapping(mapping.id)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Card Content - Mapping Editor */}
            <div style={{ 
              flex: 1, 
              minWidth: 0,
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {children ? React.cloneElement(children, { mapping }) : (
                <div>Mapping Editor for mapping {mapping.id}</div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default CardView;

