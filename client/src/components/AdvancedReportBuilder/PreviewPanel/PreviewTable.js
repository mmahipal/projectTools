import React from 'react';
import '../../../styles/PreviewTable.css';

// Utility function to get field label from API name
const getFieldLabel = (apiName, reportConfig) => {
  if (!reportConfig || !apiName) return apiName;

  // Handle multi-object mode
  if (reportConfig.objects && reportConfig.objects.length > 0) {
    // Parse the field name: "project_Name" or "project_Project_Status__c" or "project objective_Name"
    // The format is: "objectType_FieldName"
    const underscoreIndex = apiName.indexOf('_');
    if (underscoreIndex === -1) {
      // No underscore, try to find in all objects
      for (const obj of reportConfig.objects) {
        if (obj.fields) {
          const field = obj.fields.find(f => {
            const fName = typeof f === 'string' ? f : (f?.name || '');
            return fName === apiName;
          });
          if (field) {
            if (typeof field === 'string') return field;
            return field.label || field.name || apiName;
          }
        }
      }
      return apiName;
    }

    // Find the object type (first part before first underscore)
    const objectType = apiName.substring(0, underscoreIndex);
    // Reconstruct the field name (everything after the first underscore)
    const fieldName = apiName.substring(underscoreIndex + 1);

    // Find the object in reportConfig
    const obj = reportConfig.objects.find(o => o.objectType === objectType);
    if (obj && obj.fields) {
      // Find the field in the object's fields array
      const field = obj.fields.find(f => {
        const fName = typeof f === 'string' ? f : (f?.name || '');
        return fName === fieldName || fName === apiName;
      });

      if (field) {
        // Return the label if available, otherwise use the name
        if (typeof field === 'string') {
          return field;
        }
        return field.label || field.name || apiName;
      }
    }
  }

  // Handle legacy single-object mode
  if (reportConfig.fields && reportConfig.fields.length > 0) {
    const field = reportConfig.fields.find(f => {
      const fName = typeof f === 'string' ? f : (f?.name || '');
      return fName === apiName;
    });

    if (field) {
      if (typeof field === 'string') {
        return field;
      }
      return field.label || field.name || apiName;
    }
  }

  // Fallback: try to format the API name nicely
  return apiName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const PreviewTable = ({ data, reportConfig }) => {
  if (!data || data.length === 0) {
    return <div className="preview-table-empty">No data available</div>;
  }

  // Get all unique keys from data
  const allKeys = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_')) {
        allKeys.add(key);
      }
    });
  });

  const columns = Array.from(allKeys);

  return (
    <div className="preview-table-container">
      <table className="preview-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column}>{getFieldLabel(column, reportConfig)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td key={column}>
                  {row[column] !== null && row[column] !== undefined
                    ? String(row[column])
                    : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewTable;

