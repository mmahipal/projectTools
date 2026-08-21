import React, { useState } from 'react';
import { Download, Loader, Search, X, RefreshCw, Check, X as XIcon, Plus, ChevronDown, Filter } from 'lucide-react';
import TableHeader from '../Table/TableHeader';
import TableCell from '../Table/TableCell';

const ContributorMatchMatrixTable = ({ 
  records, 
  loading, 
  loadingMore,
  availableFields, 
  searchTerm = '', 
  onSearchChange,
  selectedColumns,
  onColumnChange,
  matchingFields,
  tableContainerRef,
  hasMore,
  onRefresh,
  refreshing,
  showFilters,
  onToggleFilters,
  filters,
  onContributorProjectClick
}) => {
  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      return;
    }

    const headers = selectedColumns.map(col => {
      const field = availableFields.find(f => f.name === col || f.name === `${col}__c`);
      return field ? field.label : col.replace(/_/g, ' ');
    });
    
    const csvRows = [headers.join(',')];
    
    records.forEach(record => {
      const row = selectedColumns.map(col => {
        const value = record[col] !== undefined ? record[col] : '';
        let formattedValue = '';
        
        if (typeof value === 'boolean') {
          formattedValue = value ? 'Yes' : 'No';
        } else {
          formattedValue = String(value || '');
        }
        
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
    link.setAttribute('download', `contributor_match_matrix_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderBooleanValue = (value) => {
    if (value === true || value === 'true') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669' }}>
          <Check size={14} />
        </span>
      );
    } else if (value === false || value === 'false') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
          <XIcon size={14} />
        </span>
      );
    }
    return <span style={{ color: '#999' }}>—</span>;
  };

  const getFieldLabel = (fieldName) => {
    const field = availableFields.find(f => f.name === fieldName || f.name === `${fieldName}__c`);
    if (field) return field.label;
    
    // Default labels
    const labelMap = {
      'Contributor_Project': 'Contributor Project',
      'Full_Match': 'Full Match',
      'Five_Core_Match': 'Five Core Match',
      'Country_Match': 'Country Match',
      'Language_Match': 'Language Match',
      'Work_Type_Match': 'Work Type Match',
      'Contributor': 'Contributor',
      'Project': 'Project',
      'Objective': 'Objective',
      'Status': 'Status'
    };
    
    return labelMap[fieldName] || fieldName.replace(/_/g, ' ');
  };

  const getColumnValue = (record, columnName) => {
    if (columnName === 'Contributor_Project') {
      return record.Name || record.Id || '';
    }
    // Try direct match first
    if (record[columnName] !== undefined) {
      return record[columnName];
    }
    // Try with __c suffix
    if (record[`${columnName}__c`] !== undefined) {
      return record[`${columnName}__c`];
    }
    return '';
  };

  const isBooleanColumn = (columnName) => {
    return matchingFields.some(f => {
      const fName = (f.name || '').replace(/__c$/, '');
      return fName === columnName || f.name === columnName || f.name === `${columnName}__c`;
    });
  };

  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const defaultColumns = [
    'Contributor_Project',
    'Full_Match',
    'Five_Core_Match',
    'Country_Match',
    'Language_Match',
    'Work_Type_Match'
  ];

  const handleColumnToggle = (fieldName) => {
    onColumnChange(prevColumns => {
      if (prevColumns.includes(fieldName)) {
        // Allow removing any column, including default columns
        return prevColumns.filter(col => col !== fieldName);
      } else {
        return [...prevColumns, fieldName];
      }
    });
  };

  // Get all available matching fields for column selector (exclude info fields and deprecated fields)
  const allMatchingFields = [
    ...defaultColumns.map(col => ({
      name: col,
      label: getFieldLabel(col)
    })),
    ...matchingFields
      .filter(f => {
        const fieldName = (f.name || '').replace(/__c$/, '');
        const fieldLabel = (f.label || '').toLowerCase();
        // Exclude default columns, info fields, and deprecated fields
        return !defaultColumns.includes(fieldName) &&
               !fieldLabel.includes('info') &&
               !fieldLabel.includes('deprecated') &&
               !f.deprecated;
      })
      .map(f => ({
        name: (f.name || '').replace(/__c$/, ''),
        label: f.label || getFieldLabel(f.name)
      }))
  ];

  if (loading && records.length === 0) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading Contributor Match Matrix data...</p>
      </div>
    );
  }

  return (
    <div className="case-table-container" ref={tableContainerRef} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
      <div className="content-header">
        <h2 style={{ marginLeft: '16px' }}>Contributor Match Matrix ({records.length})</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onSearchChange && (
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search contributors..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => onSearchChange('')} className="search-clear-btn" title="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing || loading}
            className="btn-action"
            title="Refresh table"
          >
            {refreshing ? <Loader size={16} className="spinning" /> : <RefreshCw size={16} />}
            <span>Refresh</span>
          </button>
          {onToggleFilters && (
            <button
              onClick={onToggleFilters}
              className={`btn-action ${showFilters ? 'active' : ''}`}
              title="Filter data"
            >
              <Filter size={16} />
              <span>Filter</span>
              {filters && Object.keys(filters).length > 0 && (
                <span className="action-badge">{Object.keys(filters).length}</span>
              )}
            </button>
          )}
          <div className="column-selector-wrapper" style={{ zIndex: 10002 }}>
            <button
              className="btn-column-selector"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              <Plus size={14} />
              <span>Add Columns</span>
              <ChevronDown size={14} />
            </button>
            {showColumnSelector && (
              <div className="column-selector-dropdown" style={{ zIndex: 10002 }}>
                <div className="column-selector-header">
                  <span>   Select Columns</span>
                  <button onClick={() => setShowColumnSelector(false)}>×</button>
                </div>
                <div className="column-selector-list">
                  {allMatchingFields
                    .filter(field => {
                      // Show all fields except those already in default columns (but allow toggling)
                      return true;
                    })
                    .map(field => (
                      <label key={field.name} className="column-selector-item">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(field.name)}
                          onChange={() => handleColumnToggle(field.name)}
                        />
                        <span>{field.label || field.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
          <button
            className="btn-export-csv"
            onClick={handleExportCSV}
            title="Export to CSV"
            disabled={!records || records.length === 0}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {!records || records.length === 0 ? (
        <div className="case-table-empty">
          <p>No contributor match data available</p>
        </div>
      ) : (
        <>
          <div className="case-table-scroll-wrapper">
            <table className="case-table contributor-match-matrix-table">
              <thead>
                <tr>
                  {selectedColumns.map((column, index) => (
                    <TableHeader 
                      key={column}
                      style={column === 'Contributor_Project' ? { minWidth: '300px', width: '300px' } : { width: '120px', minWidth: '120px', maxWidth: '120px' }}
                    >
                      {getFieldLabel(column)}
                    </TableHeader>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.Id || index}>
                    {selectedColumns.map(column => {
                      const value = getColumnValue(record, column);
                      const isBoolean = isBooleanColumn(column);
                      const isContributorProject = column === 'Contributor_Project';
                      
                      return (
                        <TableCell key={column}>
                          {isContributorProject && record.Id ? (
                            <span
                              className="clickable-field"
                              onClick={() => onContributorProjectClick && onContributorProjectClick(record.Id, value)}
                              style={{
                                color: '#0284c7',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              {value || ''}
                            </span>
                          ) : isBoolean ? (
                            renderBooleanValue(value)
                          ) : (
                            String(value || '')
                          )}
                        </TableCell>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {hasMore && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {loadingMore && <Loader className="spinning" size={16} />}
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {loadingMore ? 'Loading more...' : ''}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContributorMatchMatrixTable;

