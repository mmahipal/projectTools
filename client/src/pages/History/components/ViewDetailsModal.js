import React from 'react';
import { X } from 'lucide-react';

const ViewDetailsModal = ({ transaction, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getOperationLabel = (operation) => {
    const labels = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      revert: 'Revert'
    };
    return labels[operation] || operation;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#52c41a';
      case 'failed':
        return '#ff4d4f';
      case 'partial':
        return '#faad14';
      default:
        return '#999';
    }
  };

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
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins' }}>
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={20} style={{ color: '#666' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#002329',
              fontFamily: 'Poppins'
            }}>
              Basic Information
            </h4>
            <div style={{
              background: '#fafafa',
              padding: '16px',
              borderRadius: '4px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Transaction ID</div>
                <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500 }}>{transaction.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Object Type</div>
                <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500 }}>{transaction.objectType}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Operation</div>
                <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500 }}>
                  {getOperationLabel(transaction.operation)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Name</div>
                <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500 }}>{transaction.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>User</div>
                <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500 }}>{transaction.publisher}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</div>
                <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500 }}>
                  {formatDate(transaction.publishedAt)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</div>
                <div style={{ 
                  fontSize: '13px', 
                  color: getStatusColor(transaction.status), 
                  fontWeight: 500 
                }}>
                  {transaction.status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Record Count</div>
                <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500 }}>
                  {transaction.recordCount || 1}
                </div>
              </div>
              {transaction.salesforceId && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Salesforce ID</div>
                  <div style={{ fontSize: '13px', color: '#002329', fontWeight: 500, wordBreak: 'break-all' }}>
                    {transaction.salesforceId}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Information */}
          {transaction.error && (
            <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#002329',
              fontFamily: 'Poppins'
            }}>
              Error Information
            </h4>
              <div style={{
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                padding: '16px',
                borderRadius: '4px',
                color: '#a8071a'
              }}>
                {transaction.error}
              </div>
            </div>
          )}

          {/* Field Changes */}
          {transaction.operation === 'update' && transaction.data && (
            <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#002329',
              fontFamily: 'Poppins'
            }}>
              Field Changes
            </h4>
              <div style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: '30%'
                      }}>
                        Field Name
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: '35%'
                      }}>
                        Old Value
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: '35%'
                      }}>
                        New Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Extract field changes from transaction data
                      // Show ALL fields that were published, only exclude obvious API response metadata
                      const fields = [];
                      const data = transaction.data;
                      
                      // Exclude only API response metadata fields
                      // Note: We'll show 'Id' in the fallback if it's the only data, but prefer to show actual field changes
                      const excludedFields = new Set([
                        '__sf', 'results', 'updates',
                        'success', 'errors', 'error', 'message', 'status', 'statusCode',
                        'metadata', 'count', 'total', 'updatedCount', 'errorCount',
                        'originalData', 'previousData', 'newData', 'changes'
                      ]);
                      
                      // Helper to check if a key should be excluded (more permissive)
                      const isExcludedKey = (key) => {
                        // Exclude obvious API metadata
                        if (excludedFields.has(key) || key.startsWith('_')) {
                          return true;
                        }
                        // Exclude 'Id' and 'id' only if there are other fields to show
                        // This way if Id is the only field, we'll show it in the fallback
                        return false;
                      };
                      
                      const shouldExcludeKey = (key, hasOtherFields = false) => {
                        // Exclude obvious API metadata
                        if (excludedFields.has(key) || key.startsWith('_')) {
                          return true;
                        }
                        // Exclude 'Id' and 'id' only if we have other fields to show
                        // If Id is the only field, we'll show it (handled in fallback)
                        if ((key === 'Id' || key === 'id') && hasOtherFields) {
                          return true;
                        }
                        return false;
                      };
                      
                      // Helper to extract fields from an object
                      // This extracts all field names and values that were published to Salesforce
                      // For update operations, we try to capture both old and new values
                      const extractFields = (obj, sourceName = '', oldValuesObj = null) => {
                        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                          return;
                        }
                        
                        // Get all keys from the object
                        const keys = Object.keys(obj);
                        
                        // If no keys, nothing to extract
                        if (keys.length === 0) {
                          return;
                        }
                        
                        // First pass: count non-excluded fields to decide if we should exclude Id
                        const nonExcludedKeys = keys.filter(k => !isExcludedKey(k) && k !== 'Id' && k !== 'id' && k !== 'oldValue');
                        const hasOtherFields = nonExcludedKeys.length > 0;
                        
                        keys.forEach(key => {
                          // Skip if it's an excluded field (API metadata, not actual field data)
                          if (shouldExcludeKey(key, hasOtherFields) || key === 'oldValue') {
                            return;
                          }
                          
                          const value = obj[key];
                          // Try to get old value from oldValuesObj if provided, or from obj.oldValue
                          const oldValue = oldValuesObj && oldValuesObj[key] !== undefined ? oldValuesObj[key] :
                                         obj.oldValue !== undefined && typeof obj.oldValue === 'object' ? obj.oldValue[key] :
                                         null;
                          
                          // Handle different value types
                          if (value === null || value === undefined) {
                            // Null/undefined values are valid - show them
                            fields.push({
                              name: sourceName + key,
                              oldValue: oldValue !== undefined && oldValue !== null ? oldValue : null,
                              newValue: null
                            });
                          } else if (typeof value === 'object' && !Array.isArray(value)) {
                            // Object value - check if it's an API response wrapper
                            if (value.success !== undefined || value.errors !== undefined) {
                              // It's an API response wrapper, try to extract from nested data
                              if (value.data && typeof value.data === 'object' && !Array.isArray(value.data)) {
                                extractFields(value.data, `${sourceName}${key}.`, oldValuesObj);
                                return;
                              }
                              // If no nested data, skip this wrapper object
                              return;
                            }
                            // Otherwise, it's a complex field value (like a relationship object) - show as JSON
                            fields.push({
                              name: sourceName + key,
                              oldValue: oldValue !== undefined && oldValue !== null ? (typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : oldValue) : null,
                              newValue: JSON.stringify(value, null, 2)
                            });
                          } else if (Array.isArray(value)) {
                            // Array value - show as JSON
                            fields.push({
                              name: sourceName + key,
                              oldValue: oldValue !== undefined && oldValue !== null ? (Array.isArray(oldValue) ? JSON.stringify(oldValue, null, 2) : oldValue) : null,
                              newValue: JSON.stringify(value, null, 2)
                            });
                          } else {
                            // Simple value (string, number, boolean) - show as is
                            fields.push({
                              name: sourceName + key,
                              oldValue: oldValue !== undefined && oldValue !== null ? oldValue : null,
                              newValue: value
                            });
                          }
                        });
                      };
                      
                      // Extract fields from the data
                      // Priority order:
                      // 1. sampleUpdate - contains the actual field changes (e.g., { Status__c: 'Open' })
                      // 2. updates array - contains update objects with field changes (extract from first only)
                      // 3. Other structures
                      // IMPORTANT: Only extract from ONE source to avoid duplicates
                      let extractedFromData = false;
                      
                      if (data && typeof data === 'object') {
                        if (data.sampleUpdate && typeof data.sampleUpdate === 'object') {
                          // Best case: sampleUpdate contains the actual field changes
                          // This is what was actually sent to Salesforce
                          // Also check for sampleUpdateOldValue to get the old value
                          const oldValue = data.sampleUpdateOldValue !== undefined ? data.sampleUpdateOldValue : null;
                          Object.keys(data.sampleUpdate).forEach(key => {
                            if (key !== 'Id' && key !== 'id') {
                              fields.push({
                                name: key,
                                oldValue: oldValue,
                                newValue: data.sampleUpdate[key]
                              });
                            }
                          });
                          extractedFromData = true;
                        } else if (data.updates && Array.isArray(data.updates) && data.updates.length > 0) {
                          // Updates array structure - extract from first update ONLY (they all have the same fields)
                          // This prevents duplication when there are multiple records
                          const firstUpdate = data.updates[0];
                          if (firstUpdate && typeof firstUpdate === 'object') {
                            // Extract fields, excluding Id and oldValue (we'll handle oldValue separately)
                            Object.keys(firstUpdate).forEach(key => {
                              if (key !== 'Id' && key !== 'id' && key !== 'oldValue') {
                                const newValue = firstUpdate[key];
                                const oldValue = firstUpdate.oldValue; // Get old value if available
                                
                                if (newValue === null || newValue === undefined) {
                                  fields.push({ 
                                    name: key, 
                                    oldValue: oldValue !== undefined ? oldValue : null,
                                    newValue: null 
                                  });
                                } else if (typeof newValue === 'object' && !Array.isArray(newValue)) {
                                  fields.push({ 
                                    name: key, 
                                    oldValue: oldValue !== undefined ? oldValue : null,
                                    newValue: JSON.stringify(newValue, null, 2) 
                                  });
                                } else if (Array.isArray(newValue)) {
                                  fields.push({ 
                                    name: key, 
                                    oldValue: oldValue !== undefined ? oldValue : null,
                                    newValue: JSON.stringify(newValue, null, 2) 
                                  });
                                } else {
                                  fields.push({ 
                                    name: key, 
                                    oldValue: oldValue !== undefined ? oldValue : null,
                                    newValue: newValue 
                                  });
                                }
                              }
                            });
                            extractedFromData = true;
                          }
                        } else if (Array.isArray(data)) {
                          // Array of records - extract from first record
                          if (data.length > 0 && typeof data[0] === 'object') {
                            extractFields(data[0]);
                            extractedFromData = true;
                          }
                        } else if (data.results && Array.isArray(data.results)) {
                          // Bulk operation with results array - check if results have data
                          if (data.results.length > 0) {
                            const firstResult = data.results[0];
                            if (firstResult.data && typeof firstResult.data === 'object' && !Array.isArray(firstResult.data)) {
                              extractFields(firstResult.data);
                              extractedFromData = true;
                            } else if (firstResult && typeof firstResult === 'object' && firstResult.id) {
                              // Results only have id and success, not field changes
                              // Field changes should be in sampleUpdate, updates, or metadata
                              // Don't extract from results - will fall back to metadata extraction
                            } else {
                              extractFields(firstResult);
                              extractedFromData = true;
                            }
                          }
                        } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data) &&
                                   (data.success !== undefined || data.errors !== undefined)) {
                          // API response wrapper - extract from nested data
                          extractFields(data.data);
                          extractedFromData = true;
                        } else {
                          // Regular record object - this is the most common case
                          // Plain object like: { Id: "...", Client_Tool_Name__c: "...", ... }
                          extractFields(data);
                          extractedFromData = true;
                        }
                      }
                      
                      // Fallback 1: Check metadata for fieldName and newValue (for bulk update operations)
                      // Only check metadata if we haven't already extracted from data to avoid duplicates
                      if (fields.length === 0 && !extractedFromData && transaction.metadata) {
                        const metadata = transaction.metadata;
                        
                        // Check for fieldName and newValue directly in metadata (for updateObjectFields operations)
                        if (metadata.fieldName && metadata.newValue !== undefined) {
                          // This is a bulk field update - show the field name, old value, and new value
                          const oldValue = metadata.currentValue !== undefined ? metadata.currentValue : 
                                         metadata.oldValue !== undefined ? metadata.oldValue : 
                                         (data.sampleUpdateOldValue !== undefined ? data.sampleUpdateOldValue : null);
                          fields.push({
                            name: metadata.fieldName,
                            oldValue: oldValue,
                            newValue: metadata.newValue
                          });
                        } 
                        // Check if metadata has updates array with field information (for other operations)
                        else if (metadata.updates && Array.isArray(metadata.updates) && metadata.updates.length > 0) {
                          // Extract field changes from the first update object
                          const firstUpdate = metadata.updates[0];
                          if (firstUpdate && typeof firstUpdate === 'object') {
                            // For queue status updates, extract queueStatus field
                            if (firstUpdate.queueStatus !== undefined) {
                              fields.push({
                                name: 'Queue_Status__c',
                                value: firstUpdate.queueStatus
                              });
                            }
                            // Extract all fields that look like Salesforce field changes
                            Object.keys(firstUpdate).forEach(key => {
                              // Skip Id, projectId, and other metadata/identifier fields
                              // But include actual field changes
                              if (key !== 'Id' && key !== 'id' && key !== 'projectId' && 
                                  key !== 'currentStatus' && key !== 'projectObjectiveId' &&
                                  key !== 'currentQueueStatus') {
                                const value = firstUpdate[key];
                                if (value !== undefined && value !== null) {
                                  // Check if this looks like a field name (ends with __c or is a known field)
                                  // Or if it's a status-related field
                                  if (key.endsWith('__c') || 
                                      key === 'Status__c' || key === 'Queue_Status__c' || 
                                      key === 'status' || key === 'queueStatus' || 
                                      key.toLowerCase().includes('status')) {
                                    // Map common field names to Salesforce API names
                                    const fieldName = key === 'queueStatus' ? 'Queue_Status__c' :
                                                     key === 'status' ? 'Status__c' : key;
                                    fields.push({
                                      name: fieldName,
                                      value: value
                                    });
                                  }
                                }
                              }
                            });
                          }
                        }
                        // If operation is bulk_update_fields but no fieldName in metadata, 
                        // this might be an older entry - try to infer from operation name
                        else if (metadata.operation === 'bulk_update_fields' && !metadata.fieldName) {
                          // This is an older entry - we can't extract field changes
                          // But we can show a message
                          console.warn('Bulk update operation found but fieldName not in metadata - this may be an older history entry');
                        }
                      }
                      
                      // Fallback 2: if still no fields, try direct extraction (most permissive)
                      if (fields.length === 0 && data && typeof data === 'object' && !Array.isArray(data)) {
                        // Extract all keys directly, excluding only the most obvious API metadata
                        Object.keys(data).forEach(key => {
                          // Skip only obvious API response fields
                          if (key === 'success' || key === 'errors' || key === 'error' || 
                              key === 'message' || key === 'status' || key === 'statusCode' ||
                              key.startsWith('_') || key === 'results' || key === 'updates' ||
                              key === 'metadata') {
                            return;
                          }
                          
                          const value = data[key];
                          // Skip API response wrapper objects
                          if (typeof value === 'object' && value !== null && !Array.isArray(value) &&
                              (value.success !== undefined || value.errors !== undefined)) {
                            // Try nested data
                            if (value.data && typeof value.data === 'object' && !Array.isArray(value.data)) {
                              extractFields(value.data);
                            }
                            return;
                          }
                          
                          // Add the field (fallback - no old value available)
                          fields.push({
                            name: key,
                            oldValue: null,
                            newValue: value
                          });
                        });
                      }
                      
                      // Deduplicate fields by field name (keep first occurrence)
                      const seenFields = new Set();
                      const uniqueFields = fields.filter(field => {
                        if (seenFields.has(field.name)) {
                          return false; // Skip duplicate
                        }
                        seenFields.add(field.name);
                        return true; // Keep first occurrence
                      });
                      
                      if (uniqueFields.length === 0) {
                        return (
                          <tr>
                            <td colSpan="2" style={{ padding: '16px', textAlign: 'center', color: '#666', fontFamily: 'Poppins' }}>
                              No field changes available
                              {process.env.NODE_ENV === 'development' && (
                                <div style={{ fontSize: '11px', marginTop: '8px', color: '#999', textAlign: 'left' }}>
                                  <div>Debug: data type = {typeof data}, isArray = {Array.isArray(data) ? 'yes' : 'no'}</div>
                                  <div>data keys = {data && typeof data === 'object' ? Object.keys(data).join(', ') : 'N/A'}</div>
                                  <div>metadata keys = {transaction.metadata && typeof transaction.metadata === 'object' ? Object.keys(transaction.metadata).join(', ') : 'N/A'}</div>
                                  {transaction.metadata && transaction.metadata.fieldName && (
                                    <div>metadata.fieldName = {transaction.metadata.fieldName}, metadata.newValue = {String(transaction.metadata.newValue)}</div>
                                  )}
                                  {transaction.metadata && transaction.metadata.operation && (
                                    <div>metadata.operation = {transaction.metadata.operation}</div>
                                  )}
                                  {transaction.metadata && transaction.metadata.updates && Array.isArray(transaction.metadata.updates) && transaction.metadata.updates.length > 0 && (
                                    <div>
                                      metadata.updates[0] keys = {Object.keys(transaction.metadata.updates[0] || {}).join(', ')}
                                      {transaction.metadata.updates[0] && (
                                        <div style={{ marginLeft: '10px', marginTop: '4px' }}>
                                          {Object.entries(transaction.metadata.updates[0]).map(([k, v]) => 
                                            k !== 'Id' && k !== 'id' && k !== 'projectId' ? `${k}: ${String(v)}` : null
                                          ).filter(Boolean).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {data && data.sampleUpdate && (
                                    <div>sampleUpdate keys = {Object.keys(data.sampleUpdate).join(', ')}</div>
                                  )}
                                  {data && data.updates && Array.isArray(data.updates) && (
                                    <div>data.updates array length = {data.updates.length}</div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }
                      
                      return uniqueFields.map((field, index) => {
                        // Format the old value for display
                        let displayOldValue = field.oldValue !== undefined ? field.oldValue : 
                                            (field.value !== undefined ? field.value : null);
                        if (displayOldValue === null || displayOldValue === undefined) {
                          displayOldValue = '(empty)';
                        } else if (typeof displayOldValue === 'boolean') {
                          displayOldValue = String(displayOldValue);
                        } else if (typeof displayOldValue === 'object') {
                          displayOldValue = JSON.stringify(displayOldValue, null, 2);
                        } else {
                          displayOldValue = String(displayOldValue);
                        }
                        
                        // Format the new value for display
                        let displayNewValue = field.newValue !== undefined ? field.newValue : 
                                            (field.value !== undefined ? field.value : null);
                        if (displayNewValue === null || displayNewValue === undefined) {
                          displayNewValue = '(empty)';
                        } else if (typeof displayNewValue === 'boolean') {
                          displayNewValue = String(displayNewValue);
                        } else if (typeof displayNewValue === 'object') {
                          displayNewValue = JSON.stringify(displayNewValue, null, 2);
                        } else {
                          displayNewValue = String(displayNewValue);
                        }
                        
                        // Format field name for better readability
                        const fieldName = field.name;
                        
                        return (
                          <tr key={index} style={{ borderBottom: index < uniqueFields.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#002329', fontWeight: 500, fontFamily: 'Poppins' }}>
                              {fieldName}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666', fontFamily: 'Poppins', wordBreak: 'break-word' }}>
                              {displayOldValue}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#002329', fontFamily: 'Poppins', wordBreak: 'break-word', fontWeight: 500 }}>
                              {displayNewValue}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transaction Data (Full JSON) */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#002329',
              fontFamily: 'Poppins'
            }}>
              Full Transaction Data (JSON)
            </h4>
            <div style={{
              background: '#fafafa',
              padding: '16px',
              borderRadius: '4px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <pre style={{
                margin: 0,
                fontSize: '12px',
                color: '#002329',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(transaction.data, null, 2)}
              </pre>
            </div>
          </div>

          {/* Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#002329',
              fontFamily: 'Poppins'
            }}>
              Metadata
            </h4>
              <div style={{
                background: '#fafafa',
                padding: '16px',
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#002329',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{ 
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              background: '#f5f5f5',
              color: '#002329',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Poppins',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e6e6e6'}
            onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsModal;

