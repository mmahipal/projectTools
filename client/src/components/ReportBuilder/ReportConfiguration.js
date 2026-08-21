import React, { useState } from 'react';
import { FileText, Save, X, Filter, Eye, BarChart3, Clock, RefreshCw } from 'lucide-react';
import FilterBuilder from './FilterBuilder';
import FieldSelector from './FieldSelector';
import RelationshipBrowser from './RelationshipBrowser/RelationshipBrowser';

const ReportConfiguration = ({
  reportConfig,
  setReportConfig,
  availableObjects,
  availableFields,
  filterOptions,
  loadingFields,
  loading,
  isPreviewing,
  isGenerating,
  previewData,
  viewMode,
  onSave,
  onPreview,
  onGenerate,
  onSchedule,
  onFieldToggle,
  onFilterChange
}) => {
  // Get all available fields including relationship fields
  const getAllAvailableFields = () => {
    const allFields = [...availableFields];
    
    // Add relationship fields from selected fields
    reportConfig.fields.forEach(fieldName => {
      // Check if it's a relationship field (contains . or starts with SUBQUERY:)
      if (fieldName.includes('.') || fieldName.startsWith('SUBQUERY:')) {
        // Check if already in allFields
        const exists = allFields.find(f => f.name === fieldName);
        if (!exists) {
          // Extract field label from field name
          const parts = fieldName.replace('SUBQUERY:', '').split('.');
          const displayName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fieldName;
          allFields.push({
            name: fieldName,
            label: displayName,
            type: 'string', // Default type for relationship fields
            isRelationship: true
          });
        }
      }
    });
    
    return allFields;
  };
  
  const allAvailableFields = getAllAvailableFields();
  return (
    <div style={{ flex: 1 }}>
      {!viewMode ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#08979C" />
              Report Configuration
            </h2>
            <button
              onClick={onSave}
              style={{
                padding: '6px 12px',
                background: '#08979C',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Poppins',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={14} />
              Save
            </button>
          </div>

          {/* Report Name and Category in one row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Report Name *
              </label>
              <input
                type="text"
                value={reportConfig.name}
                onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                placeholder="Enter report name"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Category
              </label>
              <input
                type="text"
                value={reportConfig.category}
                onChange={(e) => setReportConfig({ ...reportConfig, category: e.target.value })}
                placeholder="Category"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          {/* Object Type and Record Limit in one row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Object Type *
              </label>
              <select
                value={reportConfig.objectType}
                onChange={(e) => setReportConfig({ ...reportConfig, objectType: e.target.value, fields: [], filters: {} })}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: '#fff'
                }}
              >
                <option value="">Select Object Type</option>
                {availableObjects.map(obj => (
                  <option key={obj.value} value={obj.value}>{obj.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Record Limit
              </label>
              <input
                type="number"
                value={reportConfig.limit}
                onChange={(e) => setReportConfig({ ...reportConfig, limit: parseInt(e.target.value) || 1000 })}
                min="1"
                max="10000"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          {/* Fields Selection */}
          {reportConfig.objectType && (
            <div style={{ marginBottom: '12px' }}>
              {loadingFields ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666', fontSize: '12px' }}>Loading fields...</div>
              ) : (
                <>
                  <FieldSelector
                    availableFields={availableFields}
                    selectedFields={reportConfig.fields.filter(f => !f.includes('.') && !f.startsWith('SUBQUERY:'))}
                    onFieldToggle={onFieldToggle}
                    onSelectAll={() => {
                      availableFields.forEach(field => {
                        if (!reportConfig.fields.includes(field.name)) {
                          onFieldToggle(field.name);
                        }
                      });
                    }}
                    onSelectNone={() => {
                      reportConfig.fields
                        .filter(f => !f.includes('.') && !f.startsWith('SUBQUERY:'))
                        .forEach(fieldName => {
                          onFieldToggle(fieldName);
                        });
                    }}
                  />
                  
                  {/* Relationship Browser for Cross-Object Fields */}
                  <RelationshipBrowser
                    objectType={reportConfig.objectType}
                    selectedFields={reportConfig.fields.filter(f => f.includes('.') || f.startsWith('SUBQUERY:'))}
                    onFieldToggle={onFieldToggle}
                    availableFields={availableFields}
                  />
                </>
              )}
            </div>
          )}

          {/* Advanced Filters */}
          {reportConfig.objectType && allAvailableFields.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <FilterBuilder
                availableFields={allAvailableFields}
                filterOptions={filterOptions}
                filters={reportConfig.filters}
                onFiltersChange={(newFilters) => {
                  setReportConfig({ ...reportConfig, filters: newFilters });
                }}
              />
            </div>
          )}

          {/* Sort and Group By Options */}
          {reportConfig.objectType && allAvailableFields.length > 0 && reportConfig.fields.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Sort By & Group By (Optional)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: reportConfig.sortBy ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '2px' }}>Group By</label>
                  <select
                    value={reportConfig.groupBy || ''}
                    onChange={(e) => setReportConfig({ ...reportConfig, groupBy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: '#fff'
                    }}
                  >
                    <option value="">No grouping</option>
                    {reportConfig.fields
                      .filter(fieldName => !fieldName.startsWith('SUBQUERY:')) // Exclude raw subquery fields
                      .map(fieldName => {
                        const field = allAvailableFields.find(f => f.name === fieldName);
                        return field ? (
                          <option key={field.name} value={field.name}>{field.label || field.name}</option>
                        ) : null;
                      })}
                    {/* Add flattened subquery fields for grouping */}
                    {reportConfig.fields
                      .filter(fieldName => fieldName.startsWith('SUBQUERY:'))
                      .map(fieldName => {
                        const parts = fieldName.replace('SUBQUERY:', '').split('.');
                        if (parts.length >= 2) {
                          const relationshipName = parts[0];
                          const childField = parts[parts.length - 1];
                          // Add flattened fields: relationshipName.childField and relationshipName.Count
                          return [
                            { name: `${relationshipName}.${childField}`, label: `${relationshipName} ${childField}` },
                            { name: `${relationshipName}.Count`, label: `${relationshipName} Count` }
                          ];
                        }
                        return [];
                      })
                      .flat()
                      .map(field => (
                        <option key={field.name} value={field.name}>{field.label}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '2px' }}>Sort By</label>
                  <select
                    value={reportConfig.sortBy || ''}
                    onChange={(e) => setReportConfig({ ...reportConfig, sortBy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: '#fff'
                    }}
                  >
                    <option value="">No sorting</option>
                    {reportConfig.fields
                      .filter(fieldName => !fieldName.startsWith('SUBQUERY:')) // Exclude raw subquery fields
                      .map(fieldName => {
                        const field = allAvailableFields.find(f => f.name === fieldName);
                        return field ? (
                          <option key={field.name} value={field.name}>{field.label || field.name}</option>
                        ) : null;
                      })}
                    {/* Add flattened subquery fields for sorting */}
                    {reportConfig.fields
                      .filter(fieldName => fieldName.startsWith('SUBQUERY:'))
                      .map(fieldName => {
                        const parts = fieldName.replace('SUBQUERY:', '').split('.');
                        if (parts.length >= 2) {
                          const relationshipName = parts[0];
                          const childField = parts[parts.length - 1];
                          // Add flattened fields: relationshipName.childField and relationshipName.Count
                          return [
                            { name: `${relationshipName}.${childField}`, label: `${relationshipName} ${childField}` },
                            { name: `${relationshipName}.Count`, label: `${relationshipName} Count` }
                          ];
                        }
                        return [];
                      })
                      .flat()
                      .map(field => (
                        <option key={field.name} value={field.name}>{field.label}</option>
                      ))}
                  </select>
                </div>
                {reportConfig.sortBy && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '2px' }}>Order</label>
                    <select
                      value={reportConfig.sortOrder}
                      onChange={(e) => setReportConfig({ ...reportConfig, sortOrder: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: '#fff'
                      }}
                    >
                      <option value="ASC">Ascending</option>
                      <option value="DESC">Descending</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button
              type="button"
              id="preview-report-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                // Only call if not already processing
                if (!isPreviewing && !isGenerating && reportConfig.objectType && reportConfig.fields.length > 0) {
                  onPreview(e);
                } else {
                }
              }}
              disabled={isPreviewing || isGenerating || !reportConfig.objectType || reportConfig.fields.length === 0}
              style={{
                flex: 1,
                padding: '8px 14px',
                background: '#08979C',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: (isPreviewing || isGenerating || !reportConfig.objectType || reportConfig.fields.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Poppins',
                opacity: ((isPreviewing || isGenerating) || !reportConfig.objectType || reportConfig.fields.length === 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minWidth: '120px',
                position: 'relative',
                zIndex: 1
              }}
            >
              {isPreviewing ? (
                <>
                  <RefreshCw size={14} className="spinner" />
                  Previewing...
                </>
              ) : (
                <>
                  <Eye size={14} />
                  Preview
                </>
              )}
            </button>
            <button
              type="button"
              id="generate-report-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                // Only call if not already processing
                if (!isPreviewing && !isGenerating && reportConfig.objectType && reportConfig.fields.length > 0) {
                  onGenerate(e);
                } else {
                }
              }}
              disabled={isPreviewing || isGenerating || !reportConfig.objectType || reportConfig.fields.length === 0}
              style={{
                flex: 1,
                padding: '8px 14px',
                background: '#08979C',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: (isPreviewing || isGenerating || !reportConfig.objectType || reportConfig.fields.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Poppins',
                opacity: ((isPreviewing || isGenerating) || !reportConfig.objectType || reportConfig.fields.length === 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minWidth: '120px',
                position: 'relative',
                zIndex: 1
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 size={14} />
                  Generate Report
                </>
              )}
            </button>
            {previewData && previewData.length > 0 && !viewMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSchedule();
                }}
                style={{
                  padding: '8px 14px',
                  background: '#08979C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Poppins',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={14} />
                Schedule
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportConfiguration;

