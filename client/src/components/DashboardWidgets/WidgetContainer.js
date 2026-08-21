import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';

const WidgetContainer = ({ widget, onRemove, onConfigure, onMove }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('widgetId', widget.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '16px',
        marginBottom: '16px',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        position: 'relative'
      }}
    >
      {/* Widget Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{widget.title}</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onConfigure && (
            <button
              onClick={() => onConfigure(widget)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Settings size={14} color="#666" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(widget.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} color="#666" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div style={{ minHeight: '100px' }}>
        {widget.component}
      </div>
    </div>
  );
};

export default WidgetContainer;

