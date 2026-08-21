// TransformationHelpModal component - Transformation types help guide

import React from 'react';
import { X } from 'lucide-react';

const TRANSFORMATION_GUIDES = [
  { name: 'Copy (Direct)', desc: 'Directly copies the source field value to the target field without any modification.', example: 'Source: "John" → Target: "John"' },
  { name: 'Uppercase', desc: 'Converts all text to uppercase letters.', example: 'Source: "john doe" → Target: "JOHN DOE"' },
  { name: 'Lowercase', desc: 'Converts all text to lowercase letters.', example: 'Source: "JOHN DOE" → Target: "john doe"' },
  { name: 'Text Replace', desc: 'Finds and replaces specific text patterns. Supports case-sensitive and regex mode.', example: 'Source: "john@old.com", Find: "old", Replace: "new" → Target: "john@new.com"' },
  { name: 'Concatenate', desc: 'Combines multiple source fields into one target field with a separator.', example: 'Fields: "John", "Doe", Separator: " " → Target: "John Doe"' },
  { name: 'Formula', desc: 'Calculates values using expressions with field references like {FieldName}.', example: 'Formula: "{Amount} * 1.1" → Adds 10% to Amount' },
  { name: 'Date Format', desc: 'Formats date values to a specific format (YYYY-MM-DD, MM/DD/YYYY, etc.).', example: 'Source: "2024-01-15" → Target: "15/01/2024"' },
  { name: 'Number Format', desc: 'Formats numbers with specified decimals and separators.', example: 'Source: "1234.5" → Target: "1,234.50" (2 decimals)' },
  { name: 'Value Map', desc: 'Maps specific input values to different output values.', example: 'Map: "Yes"→true, "No"→false. Source: "Yes" → Target: true' },
  { name: 'Switch/Case', desc: 'Maps multiple input values to different outputs with a default fallback.', example: 'Cases: "High"→"P1", "Medium"→"P2", Default: "P3"' },
  { name: 'Conditional', desc: 'Applies if-then-else logic with multiple conditions (AND/OR). Supports operators like equals, contains, isEmpty, startsWith, etc.', example: 'If Status = "Active" AND Amount > 1000, Then: "Premium", Else: "Standard"' },
  { name: 'Default Value', desc: 'Uses a default value when the source field is empty or null.', example: 'Source: "" (empty), Default: "N/A" → Target: "N/A"' },
  { name: 'Type Conversion', desc: 'Converts data from one type to another (string, number, boolean, date).', example: 'Source: "123" (text) → Target: 123 (number)' },
  { name: 'Format Validation', desc: 'Validates data against specific formats (email, phone, URL, etc.). Can use default value or skip on invalid.', example: 'Validates: "john@example.com" (valid email) → passes; "invalid" → uses default' },
  { name: 'Remove Special Characters', desc: 'Cleans text by removing special characters, keeping only letters/numbers, or specific patterns.', example: 'Source: "Phone: (123) 456-7890" → Target: "1234567890"' }
];

const TransformationHelpModal = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '85vh',
        overflow: 'auto',
        fontFamily: 'Poppins',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#002329' }}>
            Transformation Types Guide
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: '#666',
              borderRadius: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {TRANSFORMATION_GUIDES.map((transform, idx) => (
            <div key={idx} style={{
              padding: '14px',
              backgroundColor: '#f9fafb',
              borderLeft: '4px solid #08979C',
              borderRadius: '4px'
            }}>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#002329', 
                marginBottom: '6px' 
              }}>
                {transform.name}
              </h3>
              <p style={{ 
                fontSize: '12px', 
                color: '#4b5563', 
                marginBottom: '6px', 
                lineHeight: '1.5' 
              }}>
                {transform.desc}
              </p>
              <div style={{ 
                fontSize: '11px', 
                color: '#059669', 
                backgroundColor: '#d1fae5', 
                padding: '6px 8px', 
                borderRadius: '3px',
                fontFamily: 'monospace'
              }}>
                <strong>Example:</strong> {transform.example}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#08979C',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransformationHelpModal;

