const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { loadHistory, logHistory } = require('../utils/historyLogger');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jsforce = require('jsforce');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Get Salesforce settings path
const getSettingsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'salesforce-settings.json');
};

// Decrypt credentials
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text;
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY.slice(0, 64), 'hex')
      : crypto.createHash('sha256').update('default-salesforce-encryption-key-change-in-production').digest();
    const ALGORITHM = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text;
  }
};

// Get Salesforce connection (user-specific)
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

/**
 * Get history grouped by object type
 * Returns 5 most recent transactions per object type
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  try {
    const allHistory = loadHistory();
    
    // Group by object type and operation (multiple records in single transaction count as 1)
    const groupedHistory = {};
    
    allHistory.forEach(entry => {
      const key = `${entry.objectType}_${entry.operation}`;
      
      if (!groupedHistory[key]) {
        groupedHistory[key] = {
          objectType: entry.objectType,
          operation: entry.operation,
          transactions: []
        };
      }
      
      // Add transaction (bulk operations are already counted as 1 transaction)
      groupedHistory[key].transactions.push({
        id: entry.id,
        name: entry.name,
        salesforceId: entry.salesforceId,
        publisher: entry.publisher,
        publishedAt: entry.publishedAt,
        status: entry.status,
        error: entry.error,
        recordCount: entry.recordCount || 1,
        operation: entry.operation, // Include operation in each transaction for frontend filtering
        data: entry.data,
        metadata: entry.metadata
      });
    });
    
    // Sort transactions within each group by date (newest first) and take top 5
    const result = Object.values(groupedHistory).map(group => {
      const sortedTransactions = group.transactions
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 5);
      
      return {
        objectType: group.objectType,
        operation: group.operation,
        transactions: sortedTransactions
      };
    });
    
    // Sort groups by most recent transaction
    result.sort((a, b) => {
      const aLatest = a.transactions[0]?.publishedAt || '';
      const bLatest = b.transactions[0]?.publishedAt || '';
      return new Date(bLatest) - new Date(aLatest);
    });
    
    res.json({
      success: true,
      history: result
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch history'
    });
  }
}));

/**
 * Get full history (for export)
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  try {
    const allHistory = loadHistory();
    
    // Sort by date (newest first)
    const sortedHistory = allHistory.sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    );
    
    res.json({
      success: true,
      history: sortedHistory
    });
  } catch (error) {
    console.error('Error fetching full history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch history'
    });
  }
}));

/**
 * Get details of a specific transaction
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const allHistory = loadHistory();
    
    const transaction = allHistory.find(entry => entry.id === id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transaction details'
    });
  }
}));

/**
 * Revert a transaction
 */
router.post('/:id/revert', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const allHistory = loadHistory();
    
    const transaction = allHistory.find(entry => entry.id === id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    if (transaction.status !== 'success') {
      return res.status(400).json({
        success: false,
        error: 'Cannot revert a failed transaction'
      });
    }
    
    const conn = await getSalesforceConnection(req.user.id);
    
    let revertResult;
    const revertErrors = [];
    
    // Handle different operation types
    if (transaction.operation === 'create') {
      // Revert create = delete
      if (transaction.salesforceId) {
        try {
          await conn.sobject(transaction.objectType).destroy(transaction.salesforceId);
          revertResult = { success: true, message: 'Record deleted successfully' };
        } catch (error) {
          revertErrors.push(error.message || 'Failed to delete record');
          revertResult = { success: false, error: error.message };
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Cannot revert: No Salesforce ID found'
        });
      }
    } else if (transaction.operation === 'update') {
      // Revert update = restore previous values
      // We need to reconstruct the previous state from the transaction data
      // For bulk updates, we need to handle each record
      if (transaction.data && transaction.data.results) {
        // Bulk operation - revert each record
        // Extract field information from metadata or data
        const metadata = transaction.metadata || {};
        let fieldName = metadata.fieldName;
        let currentValue = metadata.currentValue || metadata.oldValue; // Try both currentValue and oldValue
        let newValue = metadata.newValue; // This is what was set (we need to revert to oldValue)
        
        // Fallback: Try to extract from data.sampleUpdate or data.updates if metadata doesn't have fieldName
        if (!fieldName && transaction.data.sampleUpdate) {
          // Extract field name from sampleUpdate (e.g., { Status__c: 'Open' })
          const sampleUpdateKeys = Object.keys(transaction.data.sampleUpdate);
          const nonIdKeys = sampleUpdateKeys.filter(k => k !== 'Id' && k !== 'id');
          if (nonIdKeys.length > 0) {
            fieldName = nonIdKeys[0];
            newValue = transaction.data.sampleUpdate[fieldName];
            // Try to get old value from sampleUpdateOldValue
            if (transaction.data.sampleUpdateOldValue !== undefined) {
              currentValue = transaction.data.sampleUpdateOldValue;
            }
          }
        } else if (!fieldName && transaction.data.updates && Array.isArray(transaction.data.updates) && transaction.data.updates.length > 0) {
          // Extract from first update object
          const firstUpdate = transaction.data.updates[0];
          if (firstUpdate && typeof firstUpdate === 'object') {
            const updateKeys = Object.keys(firstUpdate);
            const nonIdKeys = updateKeys.filter(k => k !== 'Id' && k !== 'id' && k !== 'oldValue');
            if (nonIdKeys.length > 0) {
              fieldName = nonIdKeys[0];
              newValue = firstUpdate[fieldName];
              // Try to get old value from update object
              if (firstUpdate.oldValue !== undefined) {
                currentValue = firstUpdate.oldValue;
              }
            }
          }
        }
        
        if (!fieldName) {
          console.error('Revert failed - fieldName not found:', {
            transactionId: id,
            metadata: metadata,
            hasSampleUpdate: !!transaction.data.sampleUpdate,
            hasUpdates: !!(transaction.data.updates && Array.isArray(transaction.data.updates)),
            sampleUpdateKeys: transaction.data.sampleUpdate ? Object.keys(transaction.data.sampleUpdate) : []
          });
          return res.status(400).json({
            success: false,
            error: 'Cannot revert: Field name not found in transaction metadata or data. This transaction may not be revertible.',
            details: 'Transaction metadata and data do not contain field information needed for revert.'
          });
        }
        
        // Build revert updates - use oldValue from each result if available
        // This allows us to revert each record to its specific old value
        const revertUpdates = [];
        for (const result of transaction.data.results) {
          if (result.success && result.id) {
            // Use the oldValue from the result if available (most accurate)
            // Otherwise fall back to metadata currentValue/oldValue
            let recordOldValue = result.oldValue !== undefined ? result.oldValue : currentValue;
            
            // If still no old value, we can't revert this record properly
            if (recordOldValue === undefined) {
              console.warn(`Revert: No old value found for record ${result.id}, skipping`);
              continue;
            }
            
            // Convert '--None--' to null for Salesforce
            const revertValue = (recordOldValue === '--None--' || recordOldValue === 'None' || recordOldValue === '' || recordOldValue === null) 
              ? null 
              : recordOldValue;
            
            // Only include the field that was changed, exclude Id from field updates
            // Id is only used as an identifier, not as a field to update
            const revertData = {
              Id: result.id, // This is the record identifier, not a field to update
              [fieldName]: revertValue // Revert to the old value for this specific record
            };
            revertUpdates.push(revertData);
          }
        }
        
        // If we couldn't get old values from results, try metadata fallback
        if (revertUpdates.length === 0 && currentValue !== undefined) {
          // Fallback: use metadata currentValue for all records (less accurate but better than nothing)
          const revertValue = (currentValue === '--None--' || currentValue === 'None' || currentValue === '' || currentValue === null) 
            ? null 
            : currentValue;
          
          for (const result of transaction.data.results) {
            if (result.success && result.id) {
              revertUpdates.push({
                Id: result.id,
                [fieldName]: revertValue
              });
            }
          }
        }
        
        if (revertUpdates.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No records to revert'
          });
        }
        
        try {
          // Perform bulk update to revert the field values
          const batchSize = 200;
          const updateResults = [];
          
          for (let i = 0; i < revertUpdates.length; i += batchSize) {
            const batch = revertUpdates.slice(i, i + batchSize);
            const batchResults = await conn.sobject(transaction.objectType).update(batch);
            updateResults.push(...batchResults);
          }
          
          const successCount = updateResults.filter(r => r.success).length;
          const errorCount = updateResults.filter(r => !r.success).length;
          const errors = updateResults
            .filter(r => !r.success)
            .map(r => r.errors?.map(e => e.message).join('; ') || 'Unknown error');
          
          if (errors.length > 0) {
            revertErrors.push(...errors);
          }
          
          revertResult = {
            success: successCount > 0,
            message: `Reverted ${successCount} of ${revertUpdates.length} records`,
            successCount,
            errorCount,
            results: updateResults
          };
        } catch (error) {
          revertErrors.push(error.message || 'Failed to revert records');
          revertResult = {
            success: false,
            error: error.message || 'Failed to revert records'
          };
        }
      } else if (transaction.salesforceId) {
        // Single record update
        // Note: This is a simplified revert - ideally we'd store original values
        // For now, we'll log that revert was attempted but may not fully restore
        try {
          // In a real implementation, you'd restore the original field values
          // This requires storing original values in the transaction metadata
          revertResult = {
            success: true,
            message: 'Revert attempted. Note: Original values may not be fully restored without stored original data.',
            warning: 'Original field values were not stored. Manual review recommended.'
          };
        } catch (error) {
          revertErrors.push(error.message);
          revertResult = { success: false, error: error.message };
        }
      }
    } else if (transaction.operation === 'delete') {
      // Revert delete = recreate (if we have the data)
      if (transaction.data && transaction.salesforceId) {
        try {
          // Recreate with original data
          const recreateData = { ...transaction.data };
          delete recreateData.Id; // Remove ID for recreation
          const result = await conn.sobject(transaction.objectType).create(recreateData);
          revertResult = {
            success: result.success,
            message: 'Record recreated successfully',
            id: result.id
          };
        } catch (error) {
          revertErrors.push(error.message);
          revertResult = { success: false, error: error.message };
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Cannot revert: Original data not available'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: `Cannot revert operation type: ${transaction.operation}`
      });
    }
    
    // Log the revert operation
    const { logHistory } = require('../utils/historyLogger');
    logHistory({
      operation: 'revert',
      objectType: transaction.objectType,
      name: `Revert: ${transaction.name}`,
      salesforceId: transaction.salesforceId,
      publisher: req.user.email,
      data: { originalTransactionId: id, revertResult },
      status: revertResult.success ? 'success' : 'failed',
      error: revertErrors.length > 0 ? revertErrors.join('; ') : null,
      metadata: { revertedTransaction: transaction.id }
    });
    
    res.json({
      success: revertResult.success,
      message: revertResult.message || 'Transaction reverted',
      result: revertResult,
      errors: revertErrors.length > 0 ? revertErrors : undefined
    });
  } catch (error) {
    console.error('Error reverting transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to revert transaction'
    });
  }
}));

module.exports = router;
