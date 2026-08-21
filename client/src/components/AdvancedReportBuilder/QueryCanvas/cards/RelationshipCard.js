import React from 'react';
import { X, Link2 } from 'lucide-react';
import FieldChip from '../FieldChip';
import '../../../../styles/RelationshipCard.css';

const RelationshipCard = ({ relationship, fields, onFieldAdd, onFieldRemove, onRemove }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) {
        return; // No data to process
      }
      
      const data = JSON.parse(dataStr);
      if (data.type === 'relationship-field' && 
          data.relationshipName === relationship.relationshipName) {
        const fieldName = typeof data.field === 'string' ? data.field : data.field.name;
        const fieldLabel = typeof data.field === 'string' ? data.field : (data.field.label || data.field.name);
        const fieldWithPath = {
          name: `${relationship.relationshipName}.${fieldName}`,
          label: `${relationship.relationshipName} ${fieldLabel}`,
          type: data.field?.type || 'string'
        };
        onFieldAdd(fieldWithPath);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      // Silently fail - don't show browser alert
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="query-card relationship-card">
      <div className="card-header">
        <div className="card-title">
          <Link2 size={18} />
          <span>{relationship.fieldLabel || relationship.relationshipName}</span>
          <span className="card-subtitle">→ {relationship.targetObject}</span>
        </div>
        <button className="card-remove-btn" onClick={onRemove} title="Remove relationship">
          <X size={16} />
        </button>
      </div>
      
      <div
        className="card-content"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {fields.length === 0 ? (
          <div className="card-empty">
            <p>Drag related fields here</p>
          </div>
        ) : (
          <div className="card-fields">
            {fields.map(field => {
              const fieldName = typeof field === 'string' ? field : field.name;
              const fieldLabel = typeof field === 'string' ? field : (field.label || field.name);
              return (
                <FieldChip
                  key={fieldName}
                  label={fieldLabel}
                  name={fieldName}
                  onRemove={() => onFieldRemove(fieldName)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipCard;

