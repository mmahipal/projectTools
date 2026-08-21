import React, { useState } from 'react';
import { Check, X, Info } from 'lucide-react';
import './FieldSelector.css';

const FieldItem = ({ field, selected, onToggle, getFieldIcon }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = () => {
    onToggle(field.name);
  };

  const fieldType = (field.type || 'string').toLowerCase();
  const isRequired = field.required || false;

  return (
    <div
      className={`field-item ${selected ? 'selected' : ''}`}
      onClick={handleToggle}
    >
      <div className="field-item-content">
        <div className="field-item-icon">
          {getFieldIcon(field.type)}
        </div>
        <div className="field-item-info">
          <div className="field-item-label">
            <span className="field-item-name">{field.label || field.name}</span>
            {isRequired && (
              <span className="field-item-required">*</span>
            )}
            {field.inlineHelpText && (
              <div
                className="field-item-help-icon"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Info size={12} />
                {showTooltip && (
                  <div className="field-item-tooltip">
                    {field.inlineHelpText}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="field-item-meta">
            <span className="field-item-api-name">{field.name}</span>
            <span className="field-item-type">{fieldType}</span>
          </div>
        </div>
      </div>
      <div className="field-item-check">
        {selected ? (
          <Check size={16} className="field-item-check-icon" />
        ) : (
          <div className="field-item-check-empty" />
        )}
      </div>
    </div>
  );
};

export default FieldItem;

