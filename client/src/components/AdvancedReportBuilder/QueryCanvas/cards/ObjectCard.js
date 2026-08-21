import React, { useState } from 'react';
import { Plus, Package, X } from 'lucide-react';
import FieldChip from '../FieldChip';
import InfoModal from '../../InfoModal';
import '../../../../styles/ObjectCard.css';

const ObjectCard = ({ objectType, fields, onFieldAdd, onFieldRemove, onFieldReorder, onRemove, showRemove = false }) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) {
        return; // No data to process
      }
      
      const data = JSON.parse(dataStr);
      
      // Handle field reordering
      if (data.type === 'field-reorder' && onFieldReorder) {
        const chipElement = e.target.closest('.field-chip-wrapper');
        if (chipElement) {
          const dropIndex = parseInt(chipElement.dataset.index);
          if (!isNaN(dropIndex) && draggedIndex !== null && draggedIndex !== dropIndex) {
            onFieldReorder(draggedIndex, dropIndex);
          }
        }
        setDraggedIndex(null);
        return;
      }
      
      // Handle new field addition
      if (data.type === 'field') {
        const fieldName = typeof data.field === 'string' ? data.field : data.field.name;
        // Only accept fields that belong to this object (no relationship prefix)
        // Also check if the source object matches this card's object
        if (!fieldName.includes('.') && !fieldName.startsWith('SUBQUERY:')) {
          // If sourceObjectType is specified, only accept if it matches this object
          if (data.sourceObjectType && data.sourceObjectType !== objectType) {
            // Field belongs to a different object, don't add it here
            return;
          }
          onFieldAdd(data.field);
        }
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
    
    // Find the index of the field chip being dragged over
    const chipElement = e.target.closest('.field-chip-wrapper');
    if (chipElement && chipElement.dataset.index !== undefined) {
      setDragOverIndex(parseInt(chipElement.dataset.index));
    }
  };

  const handleDragStart = (e, fieldName, index) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="query-card object-card">
      <div className="card-header">
        <div className="card-title">
          <Package size={18} />
          <span>{objectType || 'Select Object'}</span>
        </div>
        {showRemove && onRemove && (
          <button className="card-remove-btn" onClick={onRemove} title="Remove object">
            <X size={16} />
          </button>
        )}
      </div>
      
      <div
        className="card-content"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {fields.length === 0 ? (
          <div className="card-empty">
            <p>Drag fields here or click + Add Field</p>
            <button
              className="add-field-btn"
              onClick={() => {
                setShowInfoModal(true);
              }}
            >
              <Plus size={14} /> Add Field
            </button>
          </div>
        ) : (
          <div 
            className="card-fields"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOverIndex(null)}
          >
            {fields.map((field, index) => {
              const fieldName = typeof field === 'string' ? field : field.name;
              const fieldLabel = typeof field === 'string' ? field : (field.label || field.name);
              return (
                <div
                  key={fieldName}
                  data-index={index}
                  className={`field-chip-wrapper ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                >
                  <FieldChip
                    label={fieldLabel}
                    name={fieldName}
                    index={index}
                    draggable={true}
                    onRemove={() => onFieldRemove(fieldName)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              );
            })}
            <button
              className="add-field-btn-small"
              onClick={() => {
                setShowInfoModal(true);
              }}
            >
              <Plus size={12} /> Add Field
            </button>
          </div>
        )}
      </div>

      {/* Info Modal */}
      <InfoModal
        show={showInfoModal}
        message="Use the left panel to drag fields here, or select fields from the object browser."
        onClose={() => setShowInfoModal(false)}
        title="How to Add Fields"
      />
    </div>
  );
};

export default ObjectCard;

