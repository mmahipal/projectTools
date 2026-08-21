import React, { useState, useEffect, useRef } from 'react';
import { X, BarChart3, RefreshCw } from 'lucide-react';

const PreviewModal = ({ show, data, fieldLabels, onClose, onLoadMore, hasMore, totalCount }) => {
  const [displayedData, setDisplayedData] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);
  const initialLoadSize = 100;

  useEffect(() => {
    if (data && data.length > 0) {
      // Filter out attributes column and show all data
      const filteredData = data.map(record => {
        const cleaned = { ...record };
        delete cleaned.attributes;
        return cleaned;
      });
      setDisplayedData(filteredData); // Show all records, not just first 100
    } else {
      setDisplayedData([]);
    }
  }, [data]);

  const handleScroll = () => {
    if (!scrollContainerRef.current || loadingMore || !hasMore) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Load more when user scrolls to within 200px of bottom
    // Only needed if we have more data from server (hasMore) and onLoadMore callback
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      if (onLoadMore && hasMore && displayedData.length >= data.length) {
        // Fetch more data from server
        setLoadingMore(true);
        onLoadMore(displayedData.length).finally(() => {
          setLoadingMore(false);
        });
      }
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [displayedData.length, hasMore, loadingMore]);

  if (!show || !data) return null;

  const getFieldLabel = (fieldName) => {
    // Special handling for common fields
    if (fieldName === 'Id') return 'Record ID';
    if (fieldName === 'Name') return 'Name';
    
    // Try exact match first
    if (fieldLabels && fieldLabels[fieldName]) {
      return fieldLabels[fieldName];
    }
    // Try alternative naming convention (__c vs _c__c)
    // Check if field ends with _c__c first (more specific)
    let altName = null;
    if (fieldName.endsWith('_c__c')) {
      // Convert _c__c to __c (e.g., Active_Contributors_c__c -> Active_Contributors__c)
      altName = fieldName.replace(/_c__c$/, '__c');
    } else if (fieldName.endsWith('__c')) {
      // Convert __c to _c__c (e.g., Active_Contributors__c -> Active_Contributors_c__c)
      altName = fieldName.replace(/__c$/, '_c__c');
    }
    if (altName && fieldLabels && fieldLabels[altName]) {
      return fieldLabels[altName];
    }
    // Fallback: try to create a readable label from the field name
    if (fieldName.includes('Active_Contributors')) return 'Active Contributors';
    if (fieldName.includes('Applied_Contributors')) return 'Applied Contributors';
    if (fieldName.includes('Qualified_Contributors')) return 'Qualified Contributors';
    if (fieldName.includes('Removed')) return 'Removed';
    // Default: return the field name
    return fieldName;
  };

  // Filter out attributes and internal metadata from column headers
  const getColumns = () => {
    if (displayedData.length === 0) return [];
    // Get columns from first non-header row
    const firstDataRow = displayedData.find(row => !row._isGroupHeader);
    if (!firstDataRow) return [];
    const allKeys = Object.keys(firstDataRow);
    return allKeys.filter(key => {
      // Exclude internal metadata fields
      if (key === 'attributes' || key.startsWith('_')) return false;
      
      // Exclude nested relationship objects (e.g., Account__r) - always exclude these as they are objects
      // Relationship objects end with __r and don't contain a dot
      if (key.endsWith('__r') && !key.includes('.')) {
        const value = firstDataRow[key];
        // Always exclude relationship objects (they are nested objects, not displayable values)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return false;
        }
        // Also exclude if it's null/undefined or any other type - we want the base field instead
        return false;
      }
      
      // Exclude relationship fields (e.g., Account__r.Name) if the base lookup field (e.g., Account__c) exists
      // This prevents showing both "Account" (from Account__c) and "Account__r.Name" columns
      if (key.includes('__r.') || key.includes('__r.Name') || key.includes('__r.name')) {
        // Extract the base field name (e.g., Account__r.Name -> Account__c)
        const baseFieldMatch = key.match(/^(.+?)__r\./);
        if (baseFieldMatch) {
          const baseField = `${baseFieldMatch[1]}__c`;
          // If the base lookup field exists, exclude the relationship field
          if (allKeys.includes(baseField)) {
            return false;
          }
        }
      }
      
      return true;
    });
  };

  const columns = getColumns();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
              Report Preview
            </h3>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Showing {displayedData.length} of {totalCount || data.length} {totalCount || data.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>
        {displayedData.length > 0 ? (
          <div 
            ref={scrollContainerRef}
            style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px', 
              overflow: 'auto', 
              maxHeight: '70vh',
              flex: 1
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                <tr>
                  {columns.map(key => (
                    <th key={key} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                      {getFieldLabel(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedData.map((row, idx) => {
                  // Check if this is a group header row
                  if (row._isGroupHeader) {
                    const labelMap = fieldLabels || {};
                    const groupLabel = labelMap[row._groupByField] || row._groupByField || 'Group';
                    // Prioritize _groupKey which should have the display value (name), not the ID
                    let groupValue = row._groupKey || '(No Value)';
                    
                    // If _groupKey is an ID (18 characters), try to find the relationship field
                    if (typeof groupValue === 'string' && groupValue.length === 18 && row._groupByField && row._groupByField.endsWith('__c')) {
                      const baseField = row._groupByField.replace('__c', '');
                      const possibleRelFields = [
                        `${baseField}__r.Name`,
                        `${baseField}.Name`,
                        `${baseField}__r.name`,
                        `${baseField}.name`
                      ];
                      for (const relField of possibleRelFields) {
                        if (row[relField]) {
                          groupValue = row[relField];
                          break;
                        }
                      }
                      // Also check for nested relationship object
                      if (groupValue.length === 18 && row[`${baseField}__r`] && row[`${baseField}__r`].Name) {
                        groupValue = row[`${baseField}__r`].Name;
                      }
                    }
                    
                    return (
                      <tr key={`group-${idx}`} style={{ background: '#f0f9ff', borderTop: '2px solid #08979C', borderBottom: '2px solid #08979C' }}>
                        <td colSpan={columns.length} style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: '#08979C' }}>
                          {groupLabel}: {groupValue}
                        </td>
                      </tr>
                    );
                  }
                  
                  // Regular data row
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {columns.map((key, vIdx) => {
                        const value = row[key];
                        // Handle relationship fields (e.g., Account__r.Name)
                        if (value && typeof value === 'object' && value.Name) {
                          return (
                            <td key={vIdx} style={{ padding: '8px 12px' }}>
                              {value.Name}
                            </td>
                          );
                        }
                        // Handle lookup fields - check for relationship Name fields
                        // The relationship field could be Account__r.Name or Account.Name depending on metadata
                        if (key.endsWith('__c') && !key.includes('__r')) {
                          // First check if value is an ID (18 character Salesforce ID)
                          const isId = typeof value === 'string' && value.length === 18;
                          
                          // Try different relationship field patterns
                          const baseField = key.replace('__c', '');
                          const possibleRelationshipFields = [
                            `${baseField}__r.Name`,  // Standard pattern: Account__c -> Account__r.Name
                            `${baseField}.Name`,     // Alternative: Account__c -> Account.Name
                            `${baseField}__r.name`,  // Lowercase variant
                            `${baseField}.name`      // Lowercase variant
                          ];
                          
                          // Find the first matching relationship field
                          for (const relField of possibleRelationshipFields) {
                            if (row[relField] !== undefined && row[relField] !== null && row[relField] !== '') {
                              return (
                                <td key={vIdx} style={{ padding: '8px 12px' }}>
                                  {row[relField]}
                                </td>
                              );
                            }
                          }
                          
                          // Check if there's a nested relationship object (e.g., Account__r: { Name: "Meta" })
                          const relObjKey = `${baseField}__r`;
                          if (row[relObjKey] && typeof row[relObjKey] === 'object' && row[relObjKey].Name) {
                            return (
                              <td key={vIdx} style={{ padding: '8px 12px' }}>
                                {row[relObjKey].Name}
                              </td>
                            );
                          }
                          
                          // Also try without __r suffix
                          const relObjKey2 = baseField;
                          if (row[relObjKey2] && typeof row[relObjKey2] === 'object' && row[relObjKey2].Name) {
                            return (
                              <td key={vIdx} style={{ padding: '8px 12px' }}>
                                {row[relObjKey2].Name}
                              </td>
                            );
                          }
                          
                          // Also check all keys for any relationship field that might match
                          const matchingRelField = Object.keys(row).find(k => {
                            if (k === key || k.startsWith('_')) return false;
                            const lowerK = k.toLowerCase();
                            const lowerBase = baseField.toLowerCase();
                            return (lowerK.includes(lowerBase) || lowerK.includes(lowerBase.replace('_', ''))) && 
                                   (k.endsWith('.Name') || k.endsWith('.name') || k.endsWith('__r.Name') || k.endsWith('__r.name'));
                          });
                          if (matchingRelField && row[matchingRelField] !== undefined && row[matchingRelField] !== null && row[matchingRelField] !== '') {
                            return (
                              <td key={vIdx} style={{ padding: '8px 12px' }}>
                                {row[matchingRelField]}
                              </td>
                            );
                          }
                          
                          // If it's an ID and we couldn't find the relationship field, show the ID
                          if (isId) {
                            const anyRelField = Object.keys(row).find(k => {
                              if (k === key || k.startsWith('_')) return false;
                              const lowerK = k.toLowerCase();
                              const lowerBase = baseField.toLowerCase();
                              return (lowerK.includes(lowerBase) || lowerK.includes(lowerBase.replace('_', ''))) && 
                                     (k.includes('Name') || k.includes('name'));
                            });
                            if (anyRelField && row[anyRelField] !== undefined && row[anyRelField] !== null && row[anyRelField] !== '') {
                              return (
                                <td key={vIdx} style={{ padding: '8px 12px' }}>
                                  {row[anyRelField]}
                                </td>
                              );
                            }
                          }
                        }
                        // Handle count fields - ensure they display as numbers
                        if (key.includes('Contributors') && (typeof value === 'number' || value === 0)) {
                          return (
                            <td key={vIdx} style={{ padding: '8px 12px', fontWeight: '500' }}>
                              {value}
                            </td>
                          );
                        }
                        return (
                          <td key={vIdx} style={{ padding: '8px 12px' }}>
                            {value !== null && value !== undefined ? String(value) : '--'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loadingMore && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                <RefreshCw size={16} className="spinning" style={{ display: 'inline-block', marginRight: '8px' }} />
                Loading more records...
              </div>
            )}
            {!hasMore && displayedData.length >= (totalCount || data.length) && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                All {totalCount || data.length} records loaded
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <BarChart3 size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No data to preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
