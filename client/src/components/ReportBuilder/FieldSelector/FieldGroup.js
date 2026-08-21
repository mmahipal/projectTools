import React from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import FieldItem from './FieldItem';
import './FieldSelector.css';

const FieldGroup = ({
  groupName,
  fields,
  selectedFields,
  onFieldToggle,
  expanded,
  onToggleExpand,
  getFieldIcon
}) => {
  const selectedCount = fields.filter(f => selectedFields.includes(f.name)).length;

  return (
    <div className="field-group">
      <div
        className="field-group-header"
        onClick={onToggleExpand}
      >
        <div className="field-group-title">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="field-group-name">{groupName}</span>
          <span className="field-group-count">
            ({selectedCount}/{fields.length} selected)
          </span>
        </div>
      </div>

      {expanded && (
        <div className="field-group-items">
          {fields.map(field => (
            <FieldItem
              key={field.name}
              field={field}
              selected={selectedFields.includes(field.name)}
              onToggle={onFieldToggle}
              getFieldIcon={getFieldIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldGroup;

