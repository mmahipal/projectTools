import React from 'react';
import { X, GripVertical } from 'lucide-react';
import '../../../styles/FieldChip.css';

const FieldChip = ({ label, name, onRemove, onDragStart, onDragEnd, draggable = false, index }) => {
  const handleDragStart = (e) => {
    if (draggable && onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'field-reorder',
        fieldName: name,
        index: index
      }));
      onDragStart(e, name, index);
    }
  };

  const handleDragEnd = (e) => {
    if (draggable && onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <div 
      className={`field-chip ${draggable ? 'field-chip-draggable' : ''}`}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {draggable && (
        <span className="chip-drag-handle" title="Drag to reorder">
          <GripVertical size={12} />
        </span>
      )}
      <span className="chip-label">{label}</span>
      <button className="chip-remove" onClick={onRemove} title="Remove field">
        <X size={12} />
      </button>
    </div>
  );
};

export default FieldChip;

