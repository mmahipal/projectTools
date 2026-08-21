import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader, Plus, ChevronDown, RefreshCw, Search } from 'lucide-react';

const OnboardingContributorsTable = ({ 
  contributors, 
  loading, 
  refreshing,
  availableFields, 
  selectedColumns, 
  onColumnSelect,
  onRefresh,
  onLoadMore,
  hasMore,
  searchTerm = '',
  onSearchChange
}) => {
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const scrollContainerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const defaultColumns = [
    'Name',
    'Email',
    'Contributor_Type__c',
    'Gender__c',
    'Source_Details__c',
    'MailingCountry'
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || isLoadingMore || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Auto-load when user reaches the bottom (within 50px)
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      
      if (isAtBottom) {
        setIsLoadingMore(true);
        onLoadMore();
        // Don't reset isLoadingMore here - let the parent handle it
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSelector && !event.target.closest('.column-selector-wrapper')) {
        setShowColumnSelector(false);
      }
    };

    if (showColumnSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnSelector]);

  const getFieldLabel = (fieldName) => {
    const labelMap = {
      'Name': 'Name',
      'Email': 'Email',
      'Contributor_Type__c': 'Contributor Type',
      'ContributorType__c': 'Contributor Type',
      'Gender__c': 'Gender',
      'Source_Details__c': 'Source Details',
      'SourceDetails__c': 'Source Details',
      'MailingCountry': 'Current Residing Country',
      'MailingCity': 'City',
      'MailingState': 'State',
      'MailingPostalCode': 'Postal Code',
      'MailingStreet': 'Street',
      'Phone': 'Phone',
      'MobilePhone': 'Mobile Phone',
      'Birthdate': 'Birthdate',
      'AccountId': 'Account',
      'Account.Name': 'Account Name'
    };
    
    if (labelMap[fieldName]) {
      return labelMap[fieldName];
    }
    
    const field = availableFields.find(f => f.name === fieldName);
    return field ? field.label : fieldName;
  };

  const getFieldValue = (contributor, fieldName) => {
    // Handle relationship fields
    if (fieldName === 'Account.Name') {
      return contributor['Account.Name'] || contributor.Account?.Name || '';
    }
    
    // Handle field name variations
    if (fieldName === 'Contributor_Type__c' && !contributor[fieldName]) {
      return contributor['ContributorType__c'] || '';
    }
    
    if (fieldName === 'Source_Details__c' && !contributor[fieldName]) {
      return contributor['SourceDetails__c'] || '';
    }
    
    return contributor[fieldName] || '';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  const formatValueForCSV = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  };

  const handleExportCSV = () => {
    const headers = selectedColumns.map(col => getFieldLabel(col));
    const csvRows = [headers.join(',')];
    
    contributors.forEach(contributor => {
      const row = selectedColumns.map(fieldName => {
        const value = getFieldValue(contributor, fieldName);
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
    link.setAttribute('download', `onboarding_contributors_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleColumnToggle = (fieldName) => {
    if (selectedColumns.includes(fieldName)) {
      // Don't allow removing default columns
      if (defaultColumns.includes(fieldName)) {
        return;
      }
      onColumnSelect(selectedColumns.filter(col => col !== fieldName));
    } else {
      onColumnSelect([...selectedColumns, fieldName]);
    }
  };

  const allDisplayableFields = availableFields.filter(field => {
    // Exclude system fields and relationship objects
    if (field.type === 'base64') return false;
    if (field.name.startsWith('Jigsaw')) return false;
    if (field.name === 'IsDeleted') return false;
    if (field.name === 'MasterRecordId') return false;
    // Include relationship fields that have a dot (e.g., Account.Name)
    if (field.name.includes('.')) return true;
    // Exclude relationship objects that end with __r
    if (field.name.endsWith('__r') && !field.name.includes('.')) return false;
    return true;
  });

  if (loading && contributors.length === 0) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading onboarding contributors...</p>
      </div>
    );
  }

  return (
    <div className="case-table-container">
      <div className="case-table-header" style={{ paddingLeft: '24px' }}>
        <h3>Onboarding Contributors ({contributors.length})</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {onSearchChange && (
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search contributors..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e)}
                className="search-input"
              />
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing || loading}
            className="btn-action"
            title="Refresh contributors"
          >
            {refreshing ? <Loader size={16} className="spinning" /> : <RefreshCw size={16} />}
            <span>Refresh</span>
          </button>
          <button
            className="btn-export-csv"
            onClick={handleExportCSV}
            title="Export to CSV"
            disabled={contributors.length === 0}
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
                  {allDisplayableFields
                    .filter(field => {
                      // Show all fields except those already in default columns
                      return !defaultColumns.includes(field.name);
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
        </div>
      </div>

      {contributors.length === 0 ? (
        <div className="case-table-empty">
          <p>No onboarding contributors found</p>
        </div>
      ) : (
        <div 
          className="case-table-scroll-wrapper" 
          ref={scrollContainerRef}
        >
          <table className="case-table">
            <thead>
              <tr>
                {selectedColumns.map(column => (
                  <th key={column}>
                    {getFieldLabel(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contributors.map((contributor) => (
                <tr key={contributor.Id} className="case-table-row">
                  {selectedColumns.map(column => (
                    <td key={column}>
                      {formatValue(getFieldValue(contributor, column))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {isLoadingMore && <Loader className="spinning" size={16} />}
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {isLoadingMore ? 'Loading more...' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardingContributorsTable;

