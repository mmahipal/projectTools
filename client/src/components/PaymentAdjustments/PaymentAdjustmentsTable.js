import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader, Search, X, RefreshCw, Plus, ChevronDown, Filter } from 'lucide-react';
import TableHeader from '../Table/TableHeader';
import TableCell from '../Table/TableCell';
import TruncatedSpan from '../TruncatedSpan';

const PaymentAdjustmentsTable = ({ 
  records, 
  loading, 
  loadingMore,
  availableFields, 
  searchTerm = '', 
  onSearchChange,
  selectedColumns,
  onColumnChange,
  adjustmentFields,
  tableContainerRef,
  hasMore,
  onRefresh,
  refreshing,
  showFilters,
  onToggleFilters,
  filters,
  onNewClick,
  onRecordClick
}) => {
  const columnSelectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setShowColumnSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    link.setAttribute('download', `payment_adjustments_${new Date().toISOString().split('T')[0]}.csv`);
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
      'Name': 'Payment Adjustment Name',
      'Contributor__c': 'Contributor',
      'Contributor_Project__c': 'Contributor Project',
      'Payment_Adjustment_Amount__c': 'Payment Adjustment Amount',
      'Adjustment_Type__c': 'Adjustment Type',
      'Adjustment_Notes__c': 'Adjustment Notes',
      'Payment_Adjustment_Date__c': 'Payment Adjustment Date',
      'Payment_ID__c': 'Payment ID',
      'Status__c': 'Status',
      'CreatedBy': 'Created By',
      'CreatedById': 'Created By',
      'CreatedBy.Id': 'Created By'
    };
    
    return labelMap[fieldName] || fieldName.replace(/__c$/, '').replace(/_/g, ' ');
  };

  const getColumnValue = (record, columnName) => {
    // Handle relationship fields
    if (columnName === 'Contributor__c' && record.Contributor__r) {
      return record.Contributor__r.Name || record[columnName];
    }
    if (columnName === 'Contributor_Project__c' && record.Contributor_Project__r) {
      return record.Contributor_Project__r.Name || record[columnName];
    }
    if (columnName === 'CreatedBy' && record.CreatedBy) {
      return record.CreatedBy.Name || record.CreatedBy;
    }
    
    if (record[columnName] !== undefined) {
      return record[columnName];
    }
    return '';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (typeof value === 'object' && value.Name) {
      return value.Name;
    }
    return String(value);
  };

  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const defaultColumns = [
    'Name',
    'Contributor__c',
    'Contributor_Project__c',
    'Payment_Adjustment_Amount__c',
    'Adjustment_Type__c',
    'Adjustment_Notes__c',
    'Payment_Adjustment_Date__c',
    'Payment_ID__c',
    'Status__c',
    'CreatedBy'
  ];

  const handleColumnToggle = (fieldName) => {
    if (selectedColumns.includes(fieldName)) {
      // Allow removing any column, including default columns
      onColumnChange(selectedColumns.filter(col => col !== fieldName));
    } else {
      onColumnChange([...selectedColumns, fieldName]);
    }
  };

  // Get all available adjustment fields for column selector (only Payment_Adjustment__c fields)
  const allAdjustmentFields = [
    ...defaultColumns.map(col => ({
      name: col,
      label: getFieldLabel(col)
    })),
    ...adjustmentFields
      .filter(f => {
        const fieldName = f.name || '';
        // Exclude default columns and deprecated fields, only include Payment_Adjustment__c fields
        return !defaultColumns.includes(fieldName) && !f.deprecated && fieldName.includes('__c');
      })
      .map(f => ({
        name: f.name,
        label: f.label || getFieldLabel(f.name)
      }))
  ];

  if (loading && records.length === 0) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
        <p style={{ color: '#666', fontSize: '14px', margin: 0, fontFamily: 'Poppins' }}>Loading Payment Adjustments data...</p>
      </div>
    );
  }

  return (
    <div className="case-table-container" ref={tableContainerRef} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
      <div className="content-header">
        <TruncatedSpan title={`Payment Adjustments (${records.length})`}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#002329', paddingLeft: '24px', paddingRight: '16px' }}>Payment Adjustments ({records.length})</h2>
        </TruncatedSpan>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onNewClick && (
            <button
              onClick={onNewClick}
              className="btn-new-payment-adjustment"
              title="New Payment Adjustment"
            >
              <Plus size={16} />
              <span>New Payment Adjustment</span>
            </button>
          )}
          {onSearchChange && (
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search for contributor..."
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
          <div className="column-selector-wrapper" ref={columnSelectorRef}>
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
                  {allAdjustmentFields
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
          <p>No Payment Adjustments data available</p>
        </div>
      ) : (
        <>
          <div className="case-table-scroll-wrapper">
            <table 
              className="case-table payment-adjustments-table"
              style={{ '--num-columns': selectedColumns.length }}
            >
              <thead>
                <tr>
                  {selectedColumns.map((column) => (
                    <TableHeader 
                      key={column}
                      className="column-equal"
                    >
                      {getFieldLabel(column)}
                    </TableHeader>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.Id || index}>
                    {selectedColumns.map((column) => {
                      const value = getColumnValue(record, column);
                      const isNameColumn = column === 'Name';
                      
                      return (
                        <TableCell 
                          key={column}
                          className="column-equal"
                        >
                          {isNameColumn && record.Id && onRecordClick ? (
                            <span
                              className="clickable-field"
                              onClick={() => onRecordClick(record.Id, value)}
                              style={{
                                cursor: 'pointer',
                                color: '#0176d3',
                                textDecoration: 'underline',
                                textDecorationColor: '#0176d3'
                              }}
                              title="Click to view payment adjustment details"
                            >
                              {formatValue(value)}
                            </span>
                          ) : (
                            formatValue(value)
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
              {loadingMore && <Loader className="spinning" size={16} style={{ color: '#08979C' }} />}
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

export default PaymentAdjustmentsTable;

