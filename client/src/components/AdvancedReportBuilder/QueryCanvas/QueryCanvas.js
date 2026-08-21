import React, { useState } from 'react';
import ObjectCard from './cards/ObjectCard';
import RelationshipCard from './cards/RelationshipCard';
import SubqueryCard from './cards/SubqueryCard';
import FilterCard from './cards/FilterCard';
import SortGroupCard from './cards/SortGroupCard';
import EmptyState from './EmptyState';
import InfoModal from '../InfoModal';
import '../../../styles/QueryCanvas.css';

const QueryCanvas = ({
  reportConfig,
  // Legacy single-object methods
  onFieldAdd,
  onFieldRemove,
  onRelationshipAdd,
  onRelationshipRemove,
  onSubqueryAdd,
  onSubqueryRemove,
  onFilterAdd,
  onFilterRemove,
  onSortUpdate,
  onGroupByUpdate,
  onConfigUpdate,
  // New multi-object methods
  onObjectAdd,
  onObjectRemove,
  onFieldAddToObject,
  onFieldRemoveFromObject,
  onFieldReorderInObject,
  onRelationshipAddToObject,
  onRelationshipRemoveFromObject,
  onSubqueryAddToObject,
  onSubqueryRemoveFromObject,
  onFilterAddToObject,
  onFilterRemoveFromObject
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) {
        return; // No data to process
      }
      
      const data = JSON.parse(dataStr);
      
      if (data.type === 'field') {
        // In multi-object mode, route to the correct object based on sourceObjectType
        if (isMultiObjectMode && data.sourceObjectType && onFieldAddToObject) {
          onFieldAddToObject(data.sourceObjectType, data.field);
        } else {
          onFieldAdd(data.field);
        }
      } else if (data.type === 'relationship') {
        // In multi-object mode, add to first object; otherwise use legacy method
        if (isMultiObjectMode && onRelationshipAddToObject && reportConfig.objects && reportConfig.objects.length > 0) {
          onRelationshipAddToObject(reportConfig.objects[0].objectType, data.relationship);
        } else {
          onRelationshipAdd(data.relationship);
        }
      } else if (data.type === 'relationship-field') {
        // Add field from relationship
        const fieldName = typeof data.field === 'string' ? data.field : data.field.name;
        const fieldLabel = typeof data.field === 'string' ? data.field : (data.field.label || data.field.name);
        const fieldWithPath = {
          name: `${data.relationshipName}.${fieldName}`,
          label: `${data.relationshipName} ${fieldLabel}`,
          type: data.field?.type || 'string'
        };
        // In multi-object mode, add to first object; otherwise use legacy method
        if (isMultiObjectMode && onFieldAddToObject && reportConfig.objects && reportConfig.objects.length > 0) {
          onFieldAddToObject(reportConfig.objects[0].objectType, fieldWithPath);
        } else {
          onFieldAdd(fieldWithPath);
        }
      } else if (data.type === 'subquery') {
        // In multi-object mode, add to first object; otherwise use legacy method
        if (isMultiObjectMode && onSubqueryAddToObject && reportConfig.objects && reportConfig.objects.length > 0) {
          onSubqueryAddToObject(reportConfig.objects[0].objectType, data.subquery);
        } else {
          onSubqueryAdd(data.subquery);
        }
      } else if (data.type === 'subquery-field') {
        // Add field from subquery
        const fieldName = typeof data.field === 'string' ? data.field : data.field.name;
        const fieldLabel = typeof data.field === 'string' ? data.field : (data.field.label || data.field.name);
        const fieldWithPath = {
          name: `SUBQUERY:${data.relationshipName}.${fieldName}`,
          label: `${data.relationshipName} ${fieldLabel}`,
          type: data.field?.type || 'string'
        };
        // In multi-object mode, add to first object; otherwise use legacy method
        if (isMultiObjectMode && onFieldAddToObject && reportConfig.objects && reportConfig.objects.length > 0) {
          onFieldAddToObject(reportConfig.objects[0].objectType, fieldWithPath);
        } else {
          onFieldAdd(fieldWithPath);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      // Silently fail - don't show browser alert
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Support both multi-object and legacy single-object modes
  const isMultiObjectMode = reportConfig && reportConfig.objects && reportConfig.objects.length > 0;
  const hasObjects = isMultiObjectMode || (reportConfig && reportConfig.objectType);

  // Legacy single-object field filtering - ensure these are always defined
  const allFields = reportConfig?.fields || [];
  const primaryObjectFields = allFields.filter(f => {
    const fieldName = typeof f === 'string' ? f : (f?.name || '');
    return fieldName && !fieldName.includes('.') && !fieldName.startsWith('SUBQUERY:');
  });

  const relationshipFields = allFields.filter(f => {
    const fieldName = typeof f === 'string' ? f : (f?.name || '');
    return fieldName && fieldName.includes('.') && !fieldName.startsWith('SUBQUERY:');
  });

  const subqueryFields = allFields.filter(f => {
    const fieldName = typeof f === 'string' ? f : (f?.name || '');
    return fieldName && fieldName.startsWith('SUBQUERY:');
  });

  if (!hasObjects) {
    return (
      <div
        className="query-canvas"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <EmptyState 
          onObjectSelect={(objectType) => {
            if (onObjectAdd) {
              onObjectAdd(objectType);
            } else {
              onConfigUpdate({ objectType });
            }
          }} 
        />
      </div>
    );
  }

  return (
    <div
      className="query-canvas"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="canvas-content">
        {/* Multi-Object Mode: Show all objects */}
        {isMultiObjectMode && reportConfig.objects.map((objConfig, index) => {
          const objFields = objConfig.fields || [];
          const objRelationshipFields = objFields.filter(f => {
            const fieldName = typeof f === 'string' ? f : f.name;
            return fieldName.includes('.') && !fieldName.startsWith('SUBQUERY:');
          });
          const objSubqueryFields = objFields.filter(f => {
            const fieldName = typeof f === 'string' ? f : f.name;
            return fieldName.startsWith('SUBQUERY:');
          });
          const objPrimaryFields = objFields.filter(f => {
            const fieldName = typeof f === 'string' ? f : f.name;
            return !fieldName.includes('.') && !fieldName.startsWith('SUBQUERY:');
          });

          return (
            <div key={objConfig.objectType} className="object-card-container">
              <ObjectCard
                objectType={objConfig.objectType}
                fields={objPrimaryFields}
                onFieldAdd={(field) => {
                  // Always use the multi-object method when in multi-object mode
                  if (onFieldAddToObject) {
                    onFieldAddToObject(objConfig.objectType, field);
                  } else {
                    onFieldAdd(field);
                  }
                }}
                onFieldRemove={(fieldName) => {
                  if (onFieldRemoveFromObject) {
                    onFieldRemoveFromObject(objConfig.objectType, fieldName);
                  } else {
                    onFieldRemove(fieldName);
                  }
                }}
                onFieldReorder={(fromIndex, toIndex) => {
                  if (onFieldReorderInObject) {
                    onFieldReorderInObject(objConfig.objectType, fromIndex, toIndex);
                  }
                }}
                onRemove={onObjectRemove ? () => onObjectRemove(objConfig.objectType) : undefined}
                showRemove={true}
              />

              {/* Relationships for this object */}
              {objConfig.relationships?.map(relationship => {
                const relFields = objRelationshipFields.filter(f => {
                  const fieldName = typeof f === 'string' ? f : f.name;
                  return fieldName.startsWith(`${relationship.relationshipName}.`);
                });
                return (
                  <RelationshipCard
                    key={relationship.relationshipName}
                    relationship={relationship}
                    fields={relFields}
                    onFieldAdd={(field) => onFieldAddToObject?.(objConfig.objectType, field) || onFieldAdd?.(field)}
                    onFieldRemove={(fieldName) => onFieldRemoveFromObject?.(objConfig.objectType, fieldName) || onFieldRemove?.(fieldName)}
                    onRemove={() => onRelationshipRemoveFromObject?.(objConfig.objectType, relationship.relationshipName) || onRelationshipRemove?.(relationship.relationshipName)}
                  />
                );
              })}

              {/* Subqueries for this object */}
              {objConfig.subqueries?.map(subquery => {
                const subFields = objSubqueryFields.filter(f => {
                  const fieldName = typeof f === 'string' ? f : f.name;
                  return fieldName.startsWith(`SUBQUERY:${subquery.relationshipName}.`);
                });
                return (
                  <SubqueryCard
                    key={subquery.relationshipName}
                    subquery={subquery}
                    fields={subFields}
                    onFieldAdd={(field) => onFieldAddToObject?.(objConfig.objectType, field) || onFieldAdd?.(field)}
                    onFieldRemove={(fieldName) => onFieldRemoveFromObject?.(objConfig.objectType, fieldName) || onFieldRemove?.(fieldName)}
                    onRemove={() => onSubqueryRemoveFromObject?.(objConfig.objectType, subquery.relationshipName) || onSubqueryRemove?.(subquery.relationshipName)}
                  />
                );
              })}

              {/* Filters for this object */}
              {objConfig.filters && objConfig.filters.length > 0 && (
                <FilterCard
                  filters={objConfig.filters}
                  onFilterAdd={(filter) => onFilterAddToObject?.(objConfig.objectType, filter) || onFilterAdd?.(filter)}
                  onFilterRemove={(filterIndex) => onFilterRemoveFromObject?.(objConfig.objectType, filterIndex) || onFilterRemove?.(filterIndex)}
                  availableFields={objFields}
                />
              )}
            </div>
          );
        })}

        {/* Legacy Single-Object Mode */}
        {!isMultiObjectMode && reportConfig.objectType && (
          <>
            <ObjectCard
              objectType={reportConfig.objectType}
              fields={primaryObjectFields}
              onFieldAdd={onFieldAdd}
              onFieldRemove={onFieldRemove}
            />

            {/* Relationship Cards */}
            {reportConfig.relationships?.map(relationship => {
              const relFields = relationshipFields.filter(f => {
                const fieldName = typeof f === 'string' ? f : f.name;
                return fieldName.startsWith(`${relationship.relationshipName}.`);
              });
              return (
                <RelationshipCard
                  key={relationship.relationshipName}
                  relationship={relationship}
                  fields={relFields}
                  onFieldAdd={onFieldAdd}
                  onFieldRemove={onFieldRemove}
                  onRemove={() => onRelationshipRemove(relationship.relationshipName)}
                />
              );
            })}

            {/* Subquery Cards */}
            {reportConfig.subqueries?.map(subquery => {
              const subFields = subqueryFields.filter(f => {
                const fieldName = typeof f === 'string' ? f : f.name;
                return fieldName.startsWith(`SUBQUERY:${subquery.relationshipName}.`);
              });
              return (
                <SubqueryCard
                  key={subquery.relationshipName}
                  subquery={subquery}
                  fields={subFields}
                  onFieldAdd={onFieldAdd}
                  onFieldRemove={onFieldRemove}
                  onRemove={() => onSubqueryRemove(subquery.relationshipName)}
                />
              );
            })}

            {/* Filter Card */}
            {reportConfig.filters && (reportConfig.filters.length > 0 || reportConfig.objectType) && (
              <FilterCard
                filters={reportConfig.filters}
                onFilterAdd={onFilterAdd}
                onFilterRemove={onFilterRemove}
                availableFields={reportConfig.fields || []}
              />
            )}

            {/* Sort & Group Card */}
            {reportConfig.fields && reportConfig.fields.length > 0 && (
              <SortGroupCard
                sortBy={reportConfig.sortBy}
                sortOrder={reportConfig.sortOrder}
                groupBy={reportConfig.groupBy}
                availableFields={reportConfig.fields}
                onSortUpdate={onSortUpdate}
                onGroupByUpdate={onGroupByUpdate}
              />
            )}

            {/* Add Relationship Button */}
            {reportConfig.objectType && (
              <div className="add-relationship-section">
                <button
                  className="add-relationship-btn"
                  onClick={() => {
                    setInfoMessage('Click on a relationship in the left panel to add it to your report.');
                    setShowInfoModal(true);
                  }}
                >
                  + Add Relationship
                </button>
              </div>
            )}

            {/* Add Subquery Button */}
            {reportConfig.objectType && (
              <div className="add-subquery-section">
                <button
                  className="add-subquery-btn"
                  onClick={() => {
                    setInfoMessage('Click on a child record in the left panel to add it to your report.');
                    setShowInfoModal(true);
                  }}
                >
                  + Add Child Records
                </button>
              </div>
            )}
          </>
        )}

        {/* Add Object Button (Multi-Object Mode) */}
        {isMultiObjectMode && (
          <div className="add-object-section">
            <button
              className="add-object-btn"
              onClick={() => {
                setInfoMessage('Select an object from the left panel to add it to your report.');
                setShowInfoModal(true);
              }}
            >
              + Add Another Object
            </button>
          </div>
        )}
      </div>

      {/* Info Modal */}
      <InfoModal
        show={showInfoModal}
        message={infoMessage}
        onClose={() => setShowInfoModal(false)}
        title="How to Add"
      />
    </div>
  );
};

export default QueryCanvas;

