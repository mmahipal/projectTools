// Salesforce accounts routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const { getCachedQuery } = require('../../services/salesforce/queryCache');

/**
 * Get available Accounts from Salesforce
 * GET /api/salesforce/accounts
 */
router.get('/accounts', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);

    // Query for Accounts
    const query = `SELECT Id, Name FROM Account ORDER BY Name LIMIT 500`;
    
    // Use cached query result (5 second TTL for read operations)
    const result = await getCachedQuery(conn, query, req.user.id);

    const accounts = result.records.map(account => ({
      id: account.Id,
      name: account.Name
    }));

    res.json({
      success: true,
      accounts: accounts
    });
  } catch (error) {
    console.error('Error fetching accounts from Salesforce:', error);
    
    // Handle missing Salesforce settings with a more appropriate status code
    if (error.message?.includes('Salesforce settings not configured') || 
        error.message?.includes('User ID is required')) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Salesforce settings not configured. Please configure your Salesforce settings first.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts from Salesforce'
    });
  }
}));

module.exports = router;

