import React, { useState } from 'react';
import { Download, Loader, Search, X, RefreshCw, Plus, ChevronDown, Filter } from 'lucide-react';
import TruncatedSpan from '../TruncatedSpan';
import TableHeader from '../Table/TableHeader';
import TableCell from '../Table/TableCell';

const POProductivityTargetsTable = ({ 
  records, 
  loading, 
  loadingMore,
  availableFields, 
  searchTerm = '', 
  onSearchChange,
  selectedColumns,
  onColumnChange,
  productivityFields,
  tableContainerRef,
  hasMore,
  onRefresh,
  refreshing,
  showFilters,
  onToggleFilters,
  filters
}) => {
  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      return;
    }

    const headers = selectedColumns.map(col => {
      return getFieldLabel(col);
    });
    
    const csvRows = [headers.join(',')];
    
    records.forEach(record => {
      const row = selectedColumns.map(col => {
        const value = getColumnValue(record, col);
        let formattedValue = '';
        
        if (value === null || value === undefined) {
          formattedValue = '';
        } else if (typeof value === 'boolean') {
          formattedValue = value ? 'Yes' : 'No';
        } else if (typeof value === 'number') {
          // Target Contributors should be exported as integer (no decimals)
          if (col === 'Target_Contributors__c') {
            formattedValue = String(Math.round(value));
          } else {
            formattedValue = value.toFixed(2);
          }
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
    link.setAttribute('download', `po_productivity_targets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFieldLabel = (fieldName) => {
    const field = availableFields.find(f => f.name === fieldName || f.name === `${fieldName}__c`);
    if (field) return field.label;
    
    // Default labels
    const labelMap = {
      'Name': 'Project Objective Name',
      'Target_Contributors__c': 'Target Contributors',
      'Weekly_Contributor_Production_Hours__c': 'Weekly Contributor Production Hours',
      'Weekly_Target_Production_Hours_Calc__c': 'Weekly Target Production Hours (Calc)',
      'Total_Target_Productivity_Hours__c': 'Total Target Productivity Hours',
      'Productivity_Target_Type__c': 'Productivity Target Type'
    };
    
    return labelMap[fieldName] || fieldName.replace(/__c$/, '').replace(/_/g, ' ');
  };

  const getColumnValue = (record, columnName) => {
    if (record[columnName] !== undefined) {
      return record[columnName];
    }
    return '';
  };

  const formatValue = (value, columnName) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Target Contributors should be displayed as integer (no decimals)
      if (columnName === 'Target_Contributors__c') {
        return Math.round(value).toLocaleString('en-US');
      }
      // Other numeric fields can have decimals
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(value);
  };

  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const defaultColumns = [
    'Name',
    'Target_Contributors__c',
    'Weekly_Contributor_Production_Hours__c',
    'Weekly_Target_Production_Hours_Calc__c',
    'Total_Target_Productivity_Hours__c',
    'Productivity_Target_Type__c'
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

  // Get all available productivity fields for column selector
  const allProductivityFields = [
    ...defaultColumns.map(col => ({
      name: col,
      label: getFieldLabel(col)
    })),
    ...productivityFields
      .filter(f => {
        const fieldName = f.name || '';
        // Exclude default columns and deprecated fields
        return !defaultColumns.includes(fieldName) && !f.deprecated;
      })
      .map(f => ({
        name: f.name,
        label: f.label || getFieldLabel(f.name)
      }))
  ];

  if (loading && records.length === 0) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading PO Productivity Targets data...</p>
      </div>
    );
  }

  return (
    <div className="case-table-container" ref={tableContainerRef} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
      <div className="content-header">
        <TruncatedSpan title={`PO Productivity Targets (${records.length})`}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#002329' }}>PO Productivity Targets ({records.length})</h2>
        </TruncatedSpan>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onSearchChange && (
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search project objectives..."
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
              {filters && Array.isArray(filters) && filters.length > 0 && (
                <span className="action-badge">{filters.length}</span>
              )}
            </button>
          )}
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
                  {allProductivityFields
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
          <p>No PO Productivity Targets data available</p>
        </div>
      ) : (
        <>
          <div className="case-table-scroll-wrapper">
            <table 
              className="case-table po-productivity-targets-table"
              style={{ '--num-columns': selectedColumns.length }}
            >
              <thead>
                <tr>
                  {selectedColumns.map((column, index) => (
                    <TableHeader 
                      key={column}
                      className={index === 0 ? 'column-name' : 'column-other'}
                    >
                      {getFieldLabel(column)}
                    </TableHeader>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.Id || index}>
                    {selectedColumns.map((column, colIndex) => {
                      const value = getColumnValue(record, column);
                      return (
                        <TableCell 
                          key={column}
                          className={colIndex === 0 ? 'column-name' : 'column-other'}
                        >
                          {formatValue(value, column)}
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

export default POProductivityTargetsTable;

