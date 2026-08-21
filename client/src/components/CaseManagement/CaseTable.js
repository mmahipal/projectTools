import React, { useState } from 'react';
import { ChevronDown, Plus, Loader, Download } from 'lucide-react';
import TableHeader from '../Table/TableHeader';
import TableCell from '../Table/TableCell';

const CaseTable = ({ cases, loading, selectedColumns, availableFields, onColumnChange, onCaseClick }) => {
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  // Calculate column width - Contributor column is smaller
  const getColumnWidth = (columnName) => {
    if (selectedColumns.length === 0) return 'auto';
    
    // Contributor column (ContactId) gets 12% width
    if (columnName === 'ContactId') {
      return '12%';
    }
    
    // Calculate remaining width for other columns
    const contributorColumnCount = selectedColumns.filter(col => col === 'ContactId').length;
    const otherColumnCount = selectedColumns.length - contributorColumnCount;
    const contributorWidth = contributorColumnCount * 12; // 12% per contributor column
    const remainingWidth = 100 - contributorWidth;
    
    // Distribute remaining width equally among other columns
    return otherColumnCount > 0 ? `${remainingWidth / otherColumnCount}%` : 'auto';
  };

  const getFieldLabel = (fieldName) => {
    const labelMap = {
      'Case_Reason__c': 'Reason',
      'ContactId': 'Contributor',
      'OwnerId': 'Case Owner',
      'CaseNumber': 'Case Number',
      'CreatedDate': 'Date/Time Opened',
      'CaseDuration': 'Case Duration'
    };
    
    if (labelMap[fieldName]) {
      return labelMap[fieldName];
    }
    
    const field = availableFields.find(f => f.name === fieldName);
    return field ? field.label : fieldName;
  };

  const calculateCaseDuration = (caseItem) => {
    const createdDate = caseItem.CreatedDate;
    const closedDate = caseItem.ClosedDate;
    
    if (!createdDate) return '';
    
    const startDate = createdDate instanceof Date ? createdDate : new Date(createdDate);
    const endDate = closedDate ? (closedDate instanceof Date ? closedDate : new Date(closedDate)) : new Date();
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getFieldValue = (caseItem, fieldName) => {
    if (fieldName === 'CaseDuration') {
      return calculateCaseDuration(caseItem);
    }
    
    if (fieldName.includes('.')) {
      const [relationship, field] = fieldName.split('.');
      return caseItem[relationship]?.[field] || caseItem[`${relationship}__r`]?.[field] || '';
    }
    
    if (fieldName === 'ContactId') {
      return caseItem['Contact.Name'] || caseItem.Contact?.Name || caseItem[fieldName] || '';
    }
    
    if (fieldName === 'OwnerId') {
      return caseItem['Owner.Name'] || caseItem.Owner?.Name || caseItem[fieldName] || '';
    }
    
    return caseItem[fieldName] || '';
  };

  const formatValue = (value, fieldName) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    if (fieldName === 'CreatedDate' || fieldName === 'LastModifiedDate' || fieldName === 'ClosedDate') {
      if (value instanceof Date || (typeof value === 'string' && value)) {
        const dateObj = value instanceof Date ? value : new Date(value);
        if (!isNaN(dateObj.getTime())) {
          const date = dateObj.toLocaleDateString();
          const time = dateObj.toLocaleTimeString();
          return (
            <div className="date-time-cell">
              <div className="date-value">{date}</div>
              <div className="time-value">{time}</div>
            </div>
          );
        }
      }
      return String(value);
    }
    
    if (value instanceof Date) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  const formatValueForCSV = (value, fieldName) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    if (fieldName === 'CaseDuration') {
      return String(value);
    }
    
    if (fieldName === 'CreatedDate' || fieldName === 'LastModifiedDate' || fieldName === 'ClosedDate') {
      if (value instanceof Date || (typeof value === 'string' && value)) {
        const dateObj = value instanceof Date ? value : new Date(value);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleString();
        }
      }
      return String(value);
    }
    
    if (value instanceof Date) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = selectedColumns.map(col => getFieldLabel(col));
    const rows = cases.map(caseItem => 
      selectedColumns.map(column => {
        const value = getFieldValue(caseItem, column);
        const formattedValue = formatValueForCSV(value, column);
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (formattedValue.includes(',') || formattedValue.includes('\n') || formattedValue.includes('"')) {
          return `"${formattedValue.replace(/"/g, '""')}"`;
        }
        return formattedValue;
      })
    );

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cases_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleColumnToggle = (fieldName) => {
    if (selectedColumns.includes(fieldName)) {
      if (selectedColumns.length > 1) {
        onColumnChange(selectedColumns.filter(col => col !== fieldName));
      }
    } else {
      onColumnChange([...selectedColumns, fieldName]);
    }
  };

  const defaultColumns = [
    'CaseNumber',
    'Case_Reason__c',
    'Type',
    'ContactId',
    'OwnerId',
    'Status',
    'CreatedDate',
    'CaseDuration'
  ];

  if (loading) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading cases...</p>
      </div>
    );
  }

  return (
    <div className="case-table-container">
      <div className="case-table-header">
        <h3>Cases ({cases.length})</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn-export-csv"
            onClick={handleExportCSV}
            title="Export to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <div className="column-selector-wrapper">
            <button
              className="btn-column-selector"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              <Plus size={14} />
              <span>Add Columns</span>
              <ChevronDown size={14} />
            </button>
          {showColumnSelector && (
            <div className="column-selector-dropdown">
              <div className="column-selector-header">
                <span>   Select Columns</span>
                <button onClick={() => setShowColumnSelector(false)}>×</button>
              </div>
              <div className="column-selector-list">
                {availableFields
                  .filter(field => !defaultColumns.includes(field.name) && field.name !== 'CaseDuration')
                  .map(field => (
                    <label key={field.name} className="column-selector-item">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(field.name)}
                        onChange={() => handleColumnToggle(field.name)}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="case-table-empty">
          <p>No cases found</p>
        </div>
      ) : (
        <div className="case-table-scroll-wrapper">
          <table 
            className="case-table"
          >
            <thead>
              <tr>
                {selectedColumns.map(column => {
                  const colWidth = getColumnWidth(column);
                  const isContributor = column === 'ContactId';
                  const style = isContributor 
                    ? { width: '12%', minWidth: '90px', maxWidth: '12%', paddingLeft: '8px', paddingRight: '8px', boxSizing: 'border-box' }
                    : { width: colWidth, minWidth: 0, maxWidth: colWidth };
                  return (
                    <TableHeader 
                      key={column} 
                      style={style}
                      data-column={column}
                      className={isContributor ? 'case-table-contributor-column' : ''}
                    >
                      {getFieldLabel(column)}
                    </TableHeader>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {cases.map(caseItem => (
                <tr
                  key={caseItem.Id}
                  onClick={() => onCaseClick(caseItem.Id)}
                  className="case-table-row"
                >
                  {selectedColumns.map(column => {
                    const colWidth = getColumnWidth(column);
                    const isContributor = column === 'ContactId';
                    const style = isContributor 
                      ? { width: '4.5%', minWidth: '50px', maxWidth: '4.5%', paddingLeft: '8px', paddingRight: '8px', boxSizing: 'border-box' }
                      : { width: colWidth, minWidth: 0, maxWidth: colWidth };
                    return (
                      <TableCell 
                        key={column} 
                        style={style}
                        data-column={column}
                        className={isContributor ? 'case-table-contributor-column' : ''}
                      >
                        {formatValue(getFieldValue(caseItem, column), column)}
                      </TableCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CaseTable;

