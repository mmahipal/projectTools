import React from 'react';
import { Download, Loader, Search, X } from 'lucide-react';

const MFALogTable = ({ logs, loading, availableFields, searchTerm = '', onSearchChange }) => {
  const getFieldLabel = (fieldName) => {
    const labelMap = {
      'Contact__c': 'Contributor',
      'Name': 'MFA Verification Log Name',
      'Flow__c': 'Flow',
      'Status__c': 'Status',
      'IP_Address__c': 'IP Address'
    };
    
    if (labelMap[fieldName]) {
      return labelMap[fieldName];
    }
    
    const field = availableFields.find(f => f.name === fieldName);
    return field ? field.label : fieldName;
  };

  const getFieldValue = (logItem, fieldName) => {
    if (fieldName === 'Contact__c') {
      return logItem['Contact__r.Name'] || logItem[fieldName] || '';
    }
    
    // Handle field name variations
    if (fieldName === 'IP_Address__c' && !logItem[fieldName]) {
      return logItem['IPAddress__c'] || '';
    }
    
    return logItem[fieldName] || '';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const formatValueForCSV = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const handleExportCSV = () => {
    const headers = [
      'Contributor',
      'MFA Verification Log Name',
      'Flow',
      'Status',
      'IP Address'
    ];
    
    const fieldNames = [
      'Contact__c',
      'Name',
      'Flow__c',
      'Status__c',
      'IP_Address__c'
    ];
    
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = fieldNames.map(fieldName => {
        const value = getFieldValue(log, fieldName);
        const formattedValue = formatValueForCSV(value);
        // Escape commas and quotes in CSV
        if (formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')) {
          return `"${formattedValue.replace(/"/g, '""')}"`;
        }
        return formattedValue;
      });
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mfa_verification_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const defaultColumns = [
    'Contact__c',
    'Name',
    'Flow__c',
    'Status__c',
    'IP_Address__c'
  ];

  if (loading) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading MFA Verification Logs...</p>
      </div>
    );
  }

  return (
    <div className="case-table-container">
      <div className="case-table-header">
        <h3>MFA Verification Logs ({logs.length})</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {onSearchChange && (
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="search-clear-btn"
                  title="Clear search"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <button
            className="btn-export-csv"
            onClick={handleExportCSV}
            title="Export to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="case-table-empty">
          <p>No MFA Verification Logs found</p>
        </div>
      ) : (
        <div className="case-table-scroll-wrapper">
          <table className="case-table">
            <thead>
              <tr>
                {defaultColumns.map(column => (
                  <th key={column}>
                    {getFieldLabel(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.Id} className="case-table-row">
                  {defaultColumns.map(column => (
                    <td key={column}>
                      {formatValue(getFieldValue(log, column))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MFALogTable;



