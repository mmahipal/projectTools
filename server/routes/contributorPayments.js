const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper function to get settings path
const getSettingsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'salesforce-settings.json');
};

// Helper function to decrypt credentials
const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted, return as is
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
    return text; // Return original if decryption fails
  }
};

// Helper function to get Salesforce connection (user-specific)
const { createSalesforceConnection } = require('../services/salesforce/connectionService');
const getSalesforceConnection = async (userId = null) => {
  return await createSalesforceConnection(null, userId);
};

// Helper function to format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 0;
  return parseFloat(amount) || 0;
};

// Helper function to format number
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 0;
  return parseInt(num) || 0;
};

// Helper function to discover payment fields on Contact
const discoverPaymentFields = async (conn) => {
  try {
    const describe = await conn.sobject('Contact').describe();
    const fieldNames = describe.fields.map(f => f.name);
    
    // Helper to find field with multiple strategies
    const findField = (exactNames, patterns, description) => {
      // Strategy 1: Try exact matches first
      for (const exactName of exactNames) {
        if (fieldNames.includes(exactName)) {
          console.log(`Found ${description}: ${exactName} (exact match)`);
          return exactName;
        }
      }
      
      // Strategy 2: Try pattern matching
      for (const pattern of patterns) {
        const found = fieldNames.find(f => {
          if (typeof pattern === 'string') {
            return f.toLowerCase().includes(pattern.toLowerCase());
          } else if (pattern instanceof RegExp) {
            return pattern.test(f);
          } else if (typeof pattern === 'function') {
            return pattern(f);
          }
          return false;
        });
        if (found) {
          console.log(`Found ${description}: ${found} (pattern match)`);
          return found;
        }
      }
      
      console.warn(`Field not found for ${description}. Tried: ${exactNames.join(', ')}`);
      return null;
    };
    
    // Look for payment-related fields with improved discovery
    const paymentFields = {
      totalPaymentAmount: findField(
        ['Total_Payment_Amount__c', 'TotalPaymentAmount__c', 'Payment_Amount__c', 'PaymentAmount__c'],
        [
          f => f.includes('Payment') && (f.includes('Amount') || f.includes('Total')) && f.endsWith('__c'),
          f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('amount'),
          f => f.toLowerCase().includes('total') && f.toLowerCase().includes('payment')
        ],
        'Total Payment Amount'
      ),
      outstandingBalance: findField(
        ['Outstanding_Balance__c', 'OutstandingBalance__c', 'Balance__c'],
        [
          f => (f.includes('Outstanding') || f.includes('Balance')) && f.endsWith('__c'),
          f => f.toLowerCase().includes('outstanding') || f.toLowerCase().includes('balance'),
          f => (f.includes('Due') || f.includes('Owed')) && f.endsWith('__c')
        ],
        'Outstanding Balance'
      ),
      pendingPayoutAmount: findField(
        ['Pending_Payout_Amount__c', 'PendingPayoutAmount__c', 'Pending_Amount__c'],
        [
          f => f.includes('Pending') && f.includes('Payout') && f.endsWith('__c'),
          f => f.toLowerCase().includes('pending') && f.toLowerCase().includes('payout'),
          f => f.includes('Pending') && f.includes('Amount') && f.endsWith('__c')
        ],
        'Pending Payout Amount'
      ),
      paymentStatus: findField(
        ['Payment_Status__c', 'PaymentStatus__c', 'Status__c'],
        [
          f => f.includes('Payment') && f.includes('Status') && f.endsWith('__c'),
          f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('status')
        ],
        'Payment Status'
      ),
      failedPaymentStatus: findField(
        ['Failed_Payment_Status__c', 'FailedPaymentStatus__c', 'Payment_Status__c', 'PaymentStatus__c'],
        [
          f => f.includes('Failed') && f.includes('Payment') && f.includes('Status') && f.endsWith('__c'),
          f => f.toLowerCase().includes('failed') && f.toLowerCase().includes('payment') && f.toLowerCase().includes('status'),
          f => f.includes('Payment') && f.includes('Status') && f.endsWith('__c') // Fallback to general payment status
        ],
        'Failed Payment Status'
      ),
      defaultRail: findField(
        ['Default_Rail__c', 'DefaultRail__c', 'Rail__c', 'Payment_Rail__c', 'PaymentRail__c'],
        [
          f => f.includes('Default') && f.includes('Rail') && f.endsWith('__c'),
          f => f.toLowerCase().includes('default') && f.toLowerCase().includes('rail'),
          f => f.includes('Rail') && f.endsWith('__c'),
          f => f.toLowerCase().includes('rail') && f.toLowerCase().includes('payment')
        ],
        'Default Rail'
      ),
      paymentMethod: findField(
        ['Payment_Method__c', 'PaymentMethod__c', 'Method__c'],
        [
          f => f.includes('Payment') && f.includes('Method') && f.endsWith('__c'),
          f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('method')
        ],
        'Payment Method'
      ),
      lastPaymentDate: findField(
        ['Last_Payment_Date__c', 'LastPaymentDate__c', 'Payment_Date__c'],
        [
          f => f.includes('Payment') && f.includes('Date') && f.endsWith('__c'),
          f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('date')
        ],
        'Last Payment Date'
      ),
      paymentCompletedDate: findField(
        ['Payment_Completed_Date__c', 'PaymentCompletedDate__c', 'Completed_Date__c', 'Last_Payment_Date__c'],
        [
          f => f.includes('Payment') && f.includes('Completed') && f.includes('Date') && f.endsWith('__c'),
          f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('completed') && f.toLowerCase().includes('date'),
          f => f.includes('Payment') && f.includes('Date') && f.endsWith('__c') // Fallback
        ],
        'Payment Completed Date'
      ),
      paymentFrequency: findField(
        ['Payment_Frequency__c', 'PaymentFrequency__c'],
        [
          f => f.includes('Payment') && f.includes('Frequency') && f.endsWith('__c')
        ],
        'Payment Frequency'
      )
    };
    
    console.log('=== DISCOVERED PAYMENT FIELDS ON CONTACT ===');
    console.log(JSON.stringify(paymentFields, null, 2));
    console.log('All Contact fields containing "Payment":', fieldNames.filter(f => f.toLowerCase().includes('payment')));
    console.log('All Contact fields containing "Rail":', fieldNames.filter(f => f.toLowerCase().includes('rail')));
    console.log('All Contact fields containing "Status":', fieldNames.filter(f => f.toLowerCase().includes('status')));
    console.log('===========================================');
    
    return paymentFields;
  } catch (error) {
    console.error('Error discovering payment fields:', error);
    // Return defaults as fallback
    return {
      totalPaymentAmount: 'Total_Payment_Amount__c',
      outstandingBalance: 'Outstanding_Balance__c',
      paymentStatus: 'Payment_Status__c',
      paymentMethod: 'Payment_Method__c',
      lastPaymentDate: 'Last_Payment_Date__c',
      paymentFrequency: 'Payment_Frequency__c'
    };
  }
};

// Comprehensive diagnostic endpoint
router.get('/diagnostics', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const diagnostics = {
      connection: 'OK',
      contactObjectExists: false,
      totalContacts: 0,
      fields: {},
      sampleContact: null,
      testQueries: {}
    };
    
    // Test 1: Check if Contact object exists
    try {
      const describe = await conn.sobject('Contact').describe();
      diagnostics.contactObjectExists = true;
      diagnostics.totalFields = describe.fields.length;
      
      // Test 2: Count total contacts
      try {
        const countQuery = 'SELECT COUNT(Id) total FROM Contact';
        const countResult = await conn.query(countQuery);
        diagnostics.totalContacts = countResult.records?.[0]?.total || 0;
      } catch (err) {
        diagnostics.countError = err.message;
      }
      
      // Test 3: Discover payment fields
      diagnostics.fields = await discoverPaymentFields(conn);
      
      // Test 4: Get sample contact
      try {
        const sampleQuery = 'SELECT Id, Name, Email, MailingCountry FROM Contact LIMIT 1';
        const sampleResult = await conn.query(sampleQuery);
        if (sampleResult.records && sampleResult.records.length > 0) {
          diagnostics.sampleContact = sampleResult.records[0];
        }
      } catch (err) {
        diagnostics.sampleError = err.message;
      }
      
      // Test 5: Test each payment field query
      const fieldTests = ['totalPaymentAmount', 'outstandingBalance', 'paymentStatus', 'paymentMethod', 'lastPaymentDate'];
      for (const fieldKey of fieldTests) {
        const fieldName = diagnostics.fields[fieldKey];
        if (fieldName) {
          try {
            const testQuery = `SELECT COUNT(Id) cnt FROM Contact WHERE ${fieldName} != null LIMIT 1`;
            const testResult = await conn.query(testQuery);
            diagnostics.testQueries[fieldKey] = {
              fieldName: fieldName,
              query: testQuery,
              success: true,
              count: testResult.records?.[0]?.cnt || 0
            };
          } catch (err) {
            diagnostics.testQueries[fieldKey] = {
              fieldName: fieldName,
              success: false,
              error: err.message
            };
          }
        } else {
          diagnostics.testQueries[fieldKey] = {
            fieldName: null,
            success: false,
            error: 'Field not found'
          };
        }
      }
      
    } catch (err) {
      diagnostics.contactObjectError = err.message;
    }
    
    res.json(diagnostics);
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({ 
      error: error.message,
      connection: 'FAILED'
    });
  }
});

// Individual widget endpoints - each widget has its own API

// Widget 1: Total Contributors - Always works, counts all contacts
router.get('/total-contributors', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    
    const query = `SELECT COUNT(Id) totalContributors FROM Contact`;

    console.log('=== TOTAL CONTRIBUTORS WIDGET ===');
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Total contributors query error:', queryError.message);
      console.error('Query was:', query);
      return res.status(500).json({ 
        error: queryError.message,
        query: query,
        lastRefreshed: new Date().toISOString()
      });
    }

    const data = result.records?.[0] || {};
    const totalContributors = formatNumber(data.totalContributors);
    console.log('Total Contributors Result:', totalContributors);
    console.log('================================');
    
    res.json({
      totalContributors: totalContributors,
      lastRefreshed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching total contributors:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 2: Total Payments
router.get('/total-payments', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.totalPaymentAmount) {
      console.warn('Total payment amount field not found on Contact');
      return res.json({ 
        totalPayments: 0, 
        lastRefreshed: new Date().toISOString(),
        warning: 'Payment amount field not found'
      });
    }
    
    const query = `SELECT SUM(${fields.totalPaymentAmount}) totalPayments FROM Contact`;

    console.log('=== TOTAL PAYMENTS WIDGET ===');
    console.log('Field used:', fields.totalPaymentAmount);
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Total payments query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        totalPayments: 0, 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = result.records?.[0] || {};
    const totalPayments = formatCurrency(data.totalPayments);
    console.log('Total Payments Result:', totalPayments);
    console.log('==============================');
    
    res.json({
      totalPayments: totalPayments,
      lastRefreshed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching total payments:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 3: Average Payment
router.get('/average-payment', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.totalPaymentAmount) {
      console.warn('Total payment amount field not found on Contact');
      return res.json({ 
        avgPaymentAmount: 0, 
        lastRefreshed: new Date().toISOString(),
        warning: 'Payment amount field not found'
      });
    }
    
    const query = `
      SELECT AVG(${fields.totalPaymentAmount}) avgPaymentAmount
      FROM Contact
      WHERE ${fields.totalPaymentAmount} != null AND ${fields.totalPaymentAmount} > 0
    `;

    console.log('=== AVERAGE PAYMENT WIDGET ===');
    console.log('Field used:', fields.totalPaymentAmount);
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Average payment query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        avgPaymentAmount: 0, 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = result.records?.[0] || {};
    const avgPaymentAmount = formatCurrency(data.avgPaymentAmount);
    console.log('Average Payment Result:', avgPaymentAmount);
    console.log('==============================');
    
    res.json({
      avgPaymentAmount: avgPaymentAmount,
      lastRefreshed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching average payment:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 5: Pending Amount
router.get('/pending-count', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.pendingPayoutAmount) {
      console.warn('Pending Payout Amount field not found on Contact');
      return res.json({ 
        pendingAmount: 0, 
        lastRefreshed: new Date().toISOString(),
        warning: 'Pending Payout Amount field not found'
      });
    }
    
    // Query to get SUM of pending payout amount from ALL contributors
    // SUM automatically treats null values as 0, so we don't need WHERE clause
    const query = `SELECT SUM(${fields.pendingPayoutAmount}) pendingAmount FROM Contact`;

    console.log('=== PENDING AMOUNT WIDGET ===');
    console.log('Field used:', fields.pendingPayoutAmount);
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Pending amount query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        pendingAmount: 0, 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = result.records?.[0] || {};
    const pendingAmount = parseFloat(data.pendingAmount) || 0;
    console.log('Pending Amount Result (raw):', pendingAmount);
    console.log('=============================');
    
    res.json({
      pendingAmount: pendingAmount,
      lastRefreshed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pending amount:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 6: Overdue Amount
router.get('/overdue-count', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.paymentStatus) {
      console.warn('Payment status field not found on Contact');
      return res.json({ 
        overdueAmount: 0, 
        lastRefreshed: new Date().toISOString(),
        warning: 'Payment status field not found'
      });
    }
    
    if (!fields.outstandingBalance) {
      console.warn('Outstanding balance field not found on Contact');
      return res.json({ 
        overdueAmount: 0, 
        lastRefreshed: new Date().toISOString(),
        warning: 'Outstanding balance field not found'
      });
    }
    
    // Get all unique status values to find the correct overdue value
    let statusQuery = `SELECT ${fields.paymentStatus} FROM Contact WHERE ${fields.paymentStatus} != null LIMIT 1000`;
    let statusValues = new Set();
    try {
      const statusResult = await conn.query(statusQuery);
      statusResult.records.forEach(record => {
        if (record[fields.paymentStatus]) {
          statusValues.add(String(record[fields.paymentStatus]).trim());
        }
      });
      console.log('Found payment status values:', Array.from(statusValues));
    } catch (err) {
      console.warn('Could not fetch status values:', err.message);
    }
    
    // Try to find matching status (case-insensitive) - check for "overdue", "over due", "past due", etc.
    let overdueStatusValue = null;
    for (const val of statusValues) {
      const lowerVal = val.toLowerCase();
      if (lowerVal === 'overdue' || lowerVal === 'over due' || lowerVal === 'past due' || lowerVal.includes('overdue')) {
        overdueStatusValue = val;
        break;
      }
    }
    
    // If not found, try exact match
    if (!overdueStatusValue) {
      overdueStatusValue = 'Overdue';
    }
    
    // Try multiple field options for overdue amount
    let overdueAmount = 0;
    let query;
    let result;
    
    // Strategy 1: Try outstandingBalance first
    if (fields.outstandingBalance) {
      query = `SELECT SUM(${fields.outstandingBalance}) overdueAmount FROM Contact WHERE ${fields.paymentStatus} = '${overdueStatusValue}' AND ${fields.outstandingBalance} != null`;
      console.log('=== OVERDUE AMOUNT WIDGET ===');
      console.log('Field used:', fields.paymentStatus, fields.outstandingBalance);
      console.log('Status value used:', overdueStatusValue);
      console.log('Query (outstandingBalance):', query);
      try {
        result = await conn.query(query);
        console.log('Query result:', result);
        const data = result.records?.[0] || {};
        overdueAmount = parseFloat(data.overdueAmount) || 0;
        console.log('Overdue Amount Result (from outstandingBalance):', overdueAmount);
        console.log('============================');
        return res.json({
          overdueAmount: overdueAmount,
          lastRefreshed: new Date().toISOString()
        });
      } catch (queryError) {
        console.warn('Outstanding balance query failed, trying alternatives:', queryError.message);
        // Try without null check
        try {
          query = `SELECT SUM(${fields.outstandingBalance}) overdueAmount FROM Contact WHERE ${fields.paymentStatus} = '${overdueStatusValue}'`;
          result = await conn.query(query);
          const data = result.records?.[0] || {};
          overdueAmount = parseFloat(data.overdueAmount) || 0;
          console.log('Overdue Amount Result (from outstandingBalance, no null check):', overdueAmount);
          console.log('============================');
          return res.json({
            overdueAmount: overdueAmount,
            lastRefreshed: new Date().toISOString()
          });
        } catch (fallbackError) {
          console.warn('Outstanding balance fallback also failed:', fallbackError.message);
        }
      }
    }
    
    // Strategy 2: Try totalPaymentAmount as fallback (only if outstandingBalance query failed)
    if (fields.totalPaymentAmount && !result) {
      query = `SELECT SUM(${fields.totalPaymentAmount}) overdueAmount FROM Contact WHERE ${fields.paymentStatus} = '${overdueStatusValue}' AND ${fields.totalPaymentAmount} != null`;
      console.log('Trying totalPaymentAmount as fallback');
      console.log('Query (totalPaymentAmount):', query);
      try {
        result = await conn.query(query);
        console.log('Query result:', result);
        const data = result.records?.[0] || {};
        overdueAmount = parseFloat(data.overdueAmount) || 0;
        console.log('Overdue Amount Result (from totalPaymentAmount):', overdueAmount);
        console.log('============================');
        return res.json({
          overdueAmount: overdueAmount,
          lastRefreshed: new Date().toISOString()
        });
      } catch (queryError) {
        console.warn('Total payment amount query also failed:', queryError.message);
      }
    }
    
    // If both failed, return 0
    console.log('Overdue Amount Result (no data found):', overdueAmount);
    console.log('============================');
    res.json({
      overdueAmount: overdueAmount,
      lastRefreshed: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching overdue amount:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 8: Payments by Status
router.get('/payments-by-status', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.failedPaymentStatus) {
      console.warn('Failed Payment Status field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Failed Payment Status field not found'
      });
    }
    
    // Query all contacts and group by status (nulls will be grouped together)
    // Remove WHERE clause to include all records, even those with null status
    // First, let's verify the field exists and has data
    let testQuery = `SELECT COUNT() total FROM Contact WHERE ${fields.failedPaymentStatus} != null LIMIT 1`;
    try {
      const testResult = await conn.query(testQuery);
      const recordsWithStatus = testResult.totalSize || 0;
      console.log(`Records with non-null ${fields.failedPaymentStatus}: ${recordsWithStatus}`);
      if (recordsWithStatus === 0) {
        console.warn(`WARNING: No Contact records have a value for ${fields.failedPaymentStatus}. All values are null.`);
      }
    } catch (testErr) {
      console.warn(`Could not test field ${fields.failedPaymentStatus}:`, testErr.message);
    }
    
    // Fix SOQL GROUP BY syntax - use proper aggregate function aliases
    const query = `
      SELECT ${fields.failedPaymentStatus} status, COUNT(Id) cnt
      ${fields.totalPaymentAmount ? `, SUM(${fields.totalPaymentAmount}) totalAmount` : ''}
      FROM Contact
      GROUP BY ${fields.failedPaymentStatus}
      ORDER BY COUNT(Id) DESC
    `;

    console.log('=== PAYMENTS BY STATUS WIDGET ===');
    console.log('Field used:', fields.failedPaymentStatus);
    console.log('All discovered fields:', JSON.stringify(fields, null, 2));
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
      console.log('Number of records returned:', result.records?.length || 0);
      if (result.records && result.records.length === 0) {
        console.warn('WARNING: Query returned 0 records. This might indicate:');
        console.warn('1. The field does not exist on Contact object');
        console.warn('2. All Contact records have null values for this field');
        console.warn('3. There are no Contact records in Salesforce');
      }
    } catch (queryError) {
      console.error('Payments by status query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = (result.records || []).map(record => ({
      status: record.status || 'No Status',
      count: formatNumber(record.cnt || record.count || 0),
      totalAmount: formatCurrency(record.totalAmount || 0)
    }));

    console.log('Payments by Status Result:', data);
    console.log('==================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching payments by status:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 9: Payments by Method
router.get('/payments-by-method', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.defaultRail) {
      console.warn('Default Rail field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Default Rail field not found'
      });
    }
    
    // Remove WHERE clause to include all records, grouping nulls as "No Method" or "Unknown"
    // First, verify the field exists and has data
    let testQuery = `SELECT COUNT() total FROM Contact WHERE ${fields.defaultRail} != null LIMIT 1`;
    try {
      const testResult = await conn.query(testQuery);
      const recordsWithRail = testResult.totalSize || 0;
      console.log(`Records with non-null ${fields.defaultRail}: ${recordsWithRail}`);
      if (recordsWithRail === 0) {
        console.warn(`WARNING: No Contact records have a value for ${fields.defaultRail}. All values are null.`);
      }
    } catch (testErr) {
      console.warn(`Could not test field ${fields.defaultRail}:`, testErr.message);
    }
    
    // Fix SOQL GROUP BY syntax - use proper aggregate function aliases
    const query = `
      SELECT ${fields.defaultRail} method, COUNT(Id) cnt
      ${fields.totalPaymentAmount ? `, SUM(${fields.totalPaymentAmount}) totalAmount` : ''}
      FROM Contact
      GROUP BY ${fields.defaultRail}
      ORDER BY COUNT(Id) DESC
    `;

    console.log('=== PAYMENTS BY METHOD WIDGET ===');
    console.log('Field used:', fields.defaultRail);
    console.log('All discovered fields:', JSON.stringify(fields, null, 2));
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
      console.log('Number of records returned:', result.records?.length || 0);
      if (result.records && result.records.length === 0) {
        console.warn('WARNING: Query returned 0 records. This might indicate:');
        console.warn('1. The field does not exist on Contact object');
        console.warn('2. All Contact records have null values for this field');
        console.warn('3. There are no Contact records in Salesforce');
      }
    } catch (queryError) {
      console.error('Payments by method query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = (result.records || []).map(record => ({
      method: record.method || 'No Method',
      count: formatNumber(record.cnt || record.count || 0),
      totalAmount: formatCurrency(record.totalAmount || 0)
    }));

    console.log('Payments by Method Result:', data);
    console.log('=================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching payments by method:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 10: Payments Over Time
router.get('/payments-over-time', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.paymentCompletedDate || !fields.totalPaymentAmount) {
      console.warn('Payment Completed Date or amount field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Payment Completed Date or amount field not found'
      });
    }
    
    // Include all records - those without paymentCompletedDate will be grouped separately
    // First, verify the fields exist and have data
    let testQuery = `SELECT COUNT() total FROM Contact WHERE ${fields.paymentCompletedDate} != null AND ${fields.totalPaymentAmount} != null LIMIT 1`;
    try {
      const testResult = await conn.query(testQuery);
      const recordsWithDate = testResult.totalSize || 0;
      console.log(`Records with non-null ${fields.paymentCompletedDate} and ${fields.totalPaymentAmount}: ${recordsWithDate}`);
      if (recordsWithDate === 0) {
        console.warn(`WARNING: No Contact records have both ${fields.paymentCompletedDate} and ${fields.totalPaymentAmount} populated.`);
      }
    } catch (testErr) {
      console.warn(`Could not test fields:`, testErr.message);
    }
    
    // Fix SOQL GROUP BY syntax - use proper aggregate function aliases
    const query = `
      SELECT 
        CALENDAR_MONTH(${fields.paymentCompletedDate}) month,
        CALENDAR_YEAR(${fields.paymentCompletedDate}) year,
        COUNT(Id) cnt,
        SUM(${fields.totalPaymentAmount}) totalAmount
      FROM Contact
      WHERE ${fields.paymentCompletedDate} != null AND ${fields.totalPaymentAmount} != null
      GROUP BY CALENDAR_MONTH(${fields.paymentCompletedDate}), CALENDAR_YEAR(${fields.paymentCompletedDate})
      ORDER BY CALENDAR_YEAR(${fields.paymentCompletedDate}), CALENDAR_MONTH(${fields.paymentCompletedDate})
    `;

    console.log('=== PAYMENTS OVER TIME WIDGET ===');
    console.log('Fields used:', { paymentCompletedDate: fields.paymentCompletedDate, totalPaymentAmount: fields.totalPaymentAmount });
    console.log('All discovered fields:', JSON.stringify(fields, null, 2));
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
      console.log('Number of records returned:', result.records?.length || 0);
      if (result.records && result.records.length === 0) {
        console.warn('WARNING: Query returned 0 records. This might indicate:');
        console.warn('1. The fields do not exist on Contact object');
        console.warn('2. All Contact records have null values for paymentCompletedDate or totalPaymentAmount');
        console.warn('3. There are no Contact records in Salesforce');
      }
    } catch (queryError) {
      console.error('Payments over time query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = (result.records || []).map(record => ({
      month: record.month || 0,
      year: record.year || 0,
      monthName: new Date(record.year || 2000, (record.month || 1) - 1).toLocaleString('default', { month: 'short' }),
      period: `${new Date(record.year || 2000, (record.month || 1) - 1).toLocaleString('default', { month: 'short' })} ${record.year || 0}`,
      count: formatNumber(record.cnt || record.count || 0),
      totalAmount: formatCurrency(record.totalAmount || 0)
    }));

    console.log('Payments Over Time Result:', data);
    console.log('==================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching payments over time:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 11: Top Contributors
router.get('/top-contributors', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    const limit = parseInt(req.query.limit) || 10;
    
    if (!fields.totalPaymentAmount) {
      console.warn('Total payment amount field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Payment amount field not found'
      });
    }
    
    let selectFields = ['Id', 'Name', 'Email'];
    if (fields.totalPaymentAmount) selectFields.push(fields.totalPaymentAmount);
    if (fields.outstandingBalance) selectFields.push(fields.outstandingBalance);
    if (fields.paymentStatus) selectFields.push(fields.paymentStatus);
    if (fields.lastPaymentDate) selectFields.push(fields.lastPaymentDate);
    if (fields.paymentMethod) selectFields.push(fields.paymentMethod);
    
    const query = `
      SELECT ${selectFields.join(', ')}
      FROM Contact
      WHERE ${fields.totalPaymentAmount} != null
      ORDER BY ${fields.totalPaymentAmount} DESC
      LIMIT ${limit}
    `;

    console.log('=== TOP CONTRIBUTORS WIDGET ===');
    console.log('Fields used:', fields);
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Top contributors query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = (result.records || []).map(record => ({
      id: record.Id,
      name: record.Name || 'Unknown',
      email: record.Email || '',
      totalPaymentAmount: formatCurrency(record[fields.totalPaymentAmount]),
      outstandingBalance: formatCurrency(record[fields.outstandingBalance] || 0),
      paymentStatus: record[fields.paymentStatus] || 'Unknown',
      lastPaymentDate: record[fields.lastPaymentDate] || null,
      paymentMethod: record[fields.paymentMethod] || 'Unknown'
    }));

    console.log('Top Contributors Result:', data);
    console.log('===============================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 12: Payments by Country
router.get('/payments-by-country', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.totalPaymentAmount) {
      console.warn('Total Payment Amount field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Total Payment Amount field not found'
      });
    }
    
    // Group by country and sum payments made to contributors in each country
    // Include all records - those without country will be grouped as "Unknown"
    // First, verify the field exists and has data
    let testQuery = `SELECT COUNT() total FROM Contact WHERE ${fields.totalPaymentAmount} != null LIMIT 1`;
    try {
      const testResult = await conn.query(testQuery);
      const recordsWithAmount = testResult.totalSize || 0;
      console.log(`Records with non-null ${fields.totalPaymentAmount}: ${recordsWithAmount}`);
      if (recordsWithAmount === 0) {
        console.warn(`WARNING: No Contact records have a value for ${fields.totalPaymentAmount}. All values are null.`);
      }
    } catch (testErr) {
      console.warn(`Could not test field ${fields.totalPaymentAmount}:`, testErr.message);
    }
    
    // Fix SOQL GROUP BY syntax - use proper aggregate function aliases
    // Try query with non-zero payment amounts first
    let query = `
      SELECT MailingCountry country, COUNT(Id) cnt, SUM(${fields.totalPaymentAmount}) totalAmount
      FROM Contact
      WHERE ${fields.totalPaymentAmount} != null AND ${fields.totalPaymentAmount} > 0
      GROUP BY MailingCountry
      ORDER BY SUM(${fields.totalPaymentAmount}) DESC
      LIMIT 100
    `;

    console.log('=== PAYMENTS BY COUNTRY WIDGET ===');
    console.log('Fields used:', { totalPaymentAmount: fields.totalPaymentAmount, countryField: 'MailingCountry' });
    console.log('All discovered fields:', JSON.stringify(fields, null, 2));
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
      console.log('Number of records returned:', result.records?.length || 0);
      
      // If no results with > 0 filter, try without the > 0 filter to include all non-null values
      if (result.records && result.records.length === 0) {
        console.log('No results with > 0 filter, trying without amount filter...');
        query = `
          SELECT MailingCountry country, COUNT(Id) cnt, SUM(${fields.totalPaymentAmount}) totalAmount
          FROM Contact
          WHERE ${fields.totalPaymentAmount} != null
          GROUP BY MailingCountry
          ORDER BY SUM(${fields.totalPaymentAmount}) DESC
          LIMIT 100
        `;
        try {
          result = await conn.query(query);
          console.log('Fallback query result:', result);
          console.log('Number of records returned:', result.records?.length || 0);
        } catch (fallbackError) {
          console.warn('Fallback query also failed:', fallbackError.message);
        }
      }
      
      if (result.records && result.records.length === 0) {
        console.warn('WARNING: Query returned 0 records. This might indicate:');
        console.warn('1. The totalPaymentAmount field does not exist on Contact object');
        console.warn('2. All Contact records have null values for totalPaymentAmount');
        console.warn('3. There are no Contact records in Salesforce');
        console.warn('4. All Contact records have null MailingCountry values');
      }
    } catch (queryError) {
      console.error('Payments by country query error:', queryError.message);
      console.error('Query was:', query);
      console.error('Error code:', queryError.errorCode);
      console.error('Error fields:', queryError.fields);
      
      // Return helpful error message
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message,
        errorCode: queryError.errorCode,
        suggestion: queryError.errorCode === 'INVALID_FIELD' 
          ? `The field ${fields.totalPaymentAmount} may not exist or may not be accessible. Please check field-level security.`
          : 'Please check server logs for more details.'
      });
    }

    const data = (result.records || []).map(record => ({
      country: record.country || record.MailingCountry || 'Unknown Country',
      count: parseInt(record.cnt || record.count || 0),
      countFormatted: formatNumber(record.cnt || record.count || 0),
      totalAmount: parseFloat(record.totalAmount || 0),
      totalAmountFormatted: formatCurrency(record.totalAmount || 0)
    }));

    console.log('Payments by Country Result:', data);
    console.log('Number of countries:', data.length);
    console.log('Total records processed:', result.totalSize || 0);
    console.log('==================================');
    
    // If no data but query succeeded, return empty array with a helpful message
    if (data.length === 0) {
      console.warn('No payment by country data found. Possible reasons:');
      console.warn('1. No Contact records have non-null, non-zero values for totalPaymentAmount');
      console.warn('2. All Contact records have null MailingCountry values');
      console.warn('3. The totalPaymentAmount field may not be populated');
    }
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString(),
      totalRecords: result.totalSize || 0,
      message: data.length === 0 ? 'No payment data found by country. Please ensure Contact records have payment amounts and country information.' : undefined
    });
  } catch (error) {
    console.error('Error fetching payments by country:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Enhanced diagnostic endpoint to check field discovery and test queries
router.get('/test-fields', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    // Test queries for each widget
    const testResults = {
      fields: fields,
      contactCount: 0,
      sampleContact: null,
      testQueries: {}
    };
    
    // Get total contact count
    try {
      const countQuery = 'SELECT COUNT(Id) total FROM Contact';
      const countResult = await conn.query(countQuery);
      testResults.contactCount = countResult.records?.[0]?.total || 0;
    } catch (err) {
      testResults.contactCountError = err.message;
    }
    
    // Get a sample Contact with all payment fields to see what exists
    try {
      const allFields = Object.values(fields).filter(f => f).join(', ');
      const sampleQuery = `SELECT Id, Name, Email, ${allFields} FROM Contact LIMIT 1`;
      const sampleResult = await conn.query(sampleQuery);
      if (sampleResult.records && sampleResult.records.length > 0) {
        testResults.sampleContact = sampleResult.records[0];
      }
    } catch (err) {
      console.error('Error fetching sample contact:', err);
      testResults.sampleContactError = err.message;
    }
    
    // Test each widget query
    // 1. Payments by Status
    if (fields.failedPaymentStatus) {
      try {
        const testQuery = `SELECT ${fields.failedPaymentStatus} status, COUNT(Id) count FROM Contact GROUP BY ${fields.failedPaymentStatus} LIMIT 10`;
        const testResult = await conn.query(testQuery);
        testResults.testQueries.paymentsByStatus = {
          success: true,
          recordCount: testResult.records?.length || 0,
          records: testResult.records || []
        };
      } catch (err) {
        testResults.testQueries.paymentsByStatus = {
          success: false,
          error: err.message
        };
      }
    } else {
      testResults.testQueries.paymentsByStatus = {
        success: false,
        error: 'failedPaymentStatus field not found'
      };
    }
    
    // 2. Payments by Method
    if (fields.defaultRail) {
      try {
        const testQuery = `SELECT ${fields.defaultRail} method, COUNT(Id) count FROM Contact GROUP BY ${fields.defaultRail} LIMIT 10`;
        const testResult = await conn.query(testQuery);
        testResults.testQueries.paymentsByMethod = {
          success: true,
          recordCount: testResult.records?.length || 0,
          records: testResult.records || []
        };
      } catch (err) {
        testResults.testQueries.paymentsByMethod = {
          success: false,
          error: err.message
        };
      }
    } else {
      testResults.testQueries.paymentsByMethod = {
        success: false,
        error: 'defaultRail field not found'
      };
    }
    
    // 3. Payments Over Time
    if (fields.paymentCompletedDate && fields.totalPaymentAmount) {
      try {
        const testQuery = `SELECT CALENDAR_MONTH(${fields.paymentCompletedDate}) month, CALENDAR_YEAR(${fields.paymentCompletedDate}) year, COUNT(Id) count FROM Contact WHERE ${fields.paymentCompletedDate} != null GROUP BY CALENDAR_MONTH(${fields.paymentCompletedDate}), CALENDAR_YEAR(${fields.paymentCompletedDate}) LIMIT 10`;
        const testResult = await conn.query(testQuery);
        testResults.testQueries.paymentsOverTime = {
          success: true,
          recordCount: testResult.records?.length || 0,
          records: testResult.records || []
        };
      } catch (err) {
        testResults.testQueries.paymentsOverTime = {
          success: false,
          error: err.message
        };
      }
    } else {
      testResults.testQueries.paymentsOverTime = {
        success: false,
        error: `paymentCompletedDate: ${!!fields.paymentCompletedDate}, totalPaymentAmount: ${!!fields.totalPaymentAmount}`
      };
    }
    
    // 4. Payments by Country
    if (fields.totalPaymentAmount) {
      try {
        const testQuery = `SELECT MailingCountry country, COUNT(Id) count FROM Contact WHERE ${fields.totalPaymentAmount} != null GROUP BY MailingCountry LIMIT 10`;
        const testResult = await conn.query(testQuery);
        testResults.testQueries.paymentsByCountry = {
          success: true,
          recordCount: testResult.records?.length || 0,
          records: testResult.records || []
        };
      } catch (err) {
        testResults.testQueries.paymentsByCountry = {
          success: false,
          error: err.message
        };
      }
    } else {
      testResults.testQueries.paymentsByCountry = {
        success: false,
        error: 'totalPaymentAmount field not found'
      };
    }
    
    res.json({
      success: true,
      ...testResults,
      message: 'Field discovery and query tests completed. Check testQueries to see results.'
    });
  } catch (error) {
    console.error('Error in test-fields endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Widget 13: Outstanding vs Paid Comparison
router.get('/outstanding-vs-paid', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.totalPaymentAmount || !fields.outstandingBalance) {
      console.warn('Total Payment Amount or Outstanding Balance field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Required fields not found'
      });
    }
    
    // Calculate total paid (totalPaymentAmount - outstandingBalance) and total outstanding
    const query = `
      SELECT 
        SUM(${fields.totalPaymentAmount}) totalPaid,
        SUM(${fields.outstandingBalance}) totalOutstanding,
        COUNT(Id) cnt
      FROM Contact
      WHERE ${fields.totalPaymentAmount} != null
    `;

    console.log('=== OUTSTANDING VS PAID WIDGET ===');
    console.log('Fields used:', { totalPaymentAmount: fields.totalPaymentAmount, outstandingBalance: fields.outstandingBalance });
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Outstanding vs Paid query error:', queryError.message);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const record = result.records?.[0];
    const totalPaid = formatCurrency(record?.totalPaid || 0);
    const totalOutstanding = formatCurrency(record?.outstandingBalance || 0);
    const totalAmount = formatCurrency((record?.totalPaid || 0) + (record?.outstandingBalance || 0));

    const data = [
      {
        name: 'Paid',
        value: parseFloat(record?.totalPaid || 0),
        amount: totalPaid,
        count: formatNumber(record?.cnt || 0)
      },
      {
        name: 'Outstanding',
        value: parseFloat(record?.outstandingBalance || 0),
        amount: totalOutstanding,
        count: formatNumber(record?.cnt || 0)
      }
    ];

    console.log('Outstanding vs Paid Result:', data);
    console.log('==================================');
    
    res.json({ 
      data, 
      totalAmount: formatCurrency(totalAmount),
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching outstanding vs paid:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 14: Payment Distribution (by amount ranges)
router.get('/payment-distribution', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.totalPaymentAmount) {
      console.warn('Total Payment Amount field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Total Payment Amount field not found'
      });
    }
    
    // Group payments into ranges: 0-100, 100-500, 500-1000, 1000-5000, 5000-10000, 10000+
    // Note: SOQL doesn't support CASE WHEN, so we'll fetch all and group in code
    const query = `
      SELECT ${fields.totalPaymentAmount} amount
      FROM Contact
      WHERE ${fields.totalPaymentAmount} != null AND ${fields.totalPaymentAmount} > 0
      ORDER BY ${fields.totalPaymentAmount} ASC
      LIMIT 50000
    `;

    console.log('=== PAYMENT DISTRIBUTION WIDGET ===');
    console.log('Field used:', fields.totalPaymentAmount);
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result records:', result.records?.length || 0);
    } catch (queryError) {
      console.error('Payment distribution query error:', queryError.message);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    // Group into ranges
    const ranges = [
      { min: 0, max: 100, label: '$0 - $100' },
      { min: 100, max: 500, label: '$100 - $500' },
      { min: 500, max: 1000, label: '$500 - $1,000' },
      { min: 1000, max: 5000, label: '$1,000 - $5,000' },
      { min: 5000, max: 10000, label: '$5,000 - $10,000' },
      { min: 10000, max: Infinity, label: '$10,000+' }
    ];

    const distribution = ranges.map(range => ({
      range: range.label,
      min: range.min,
      max: range.max === Infinity ? null : range.max,
      count: 0,
      totalAmount: 0
    }));

    (result.records || []).forEach(record => {
      const amount = parseFloat(record[fields.totalPaymentAmount] || 0);
      const range = ranges.find(r => amount >= r.min && (r.max === Infinity || amount < r.max));
      if (range) {
        const dist = distribution.find(d => d.min === range.min);
        if (dist) {
          dist.count++;
          dist.totalAmount += amount;
        }
      }
    });

    const data = distribution.map(d => ({
      range: d.range,
      count: parseInt(d.count) || 0,
      countFormatted: formatNumber(d.count),
      totalAmount: d.totalAmount,
      totalAmountFormatted: formatCurrency(d.totalAmount),
      avgAmount: d.count > 0 ? d.totalAmount / d.count : 0,
      avgAmountFormatted: formatCurrency(d.count > 0 ? d.totalAmount / d.count : 0)
    }));

    console.log('Payment Distribution Result:', data);
    console.log('==================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching payment distribution:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 15: Average Payment by Country
router.get('/average-payment-by-country', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.totalPaymentAmount) {
      console.warn('Total Payment Amount field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Total Payment Amount field not found'
      });
    }
    
    const query = `
      SELECT 
        MailingCountry country,
        COUNT(Id) cnt,
        AVG(${fields.totalPaymentAmount}) avgAmount,
        SUM(${fields.totalPaymentAmount}) totalAmount
      FROM Contact
      WHERE MailingCountry != null AND ${fields.totalPaymentAmount} != null AND ${fields.totalPaymentAmount} > 0
      GROUP BY MailingCountry
      ORDER BY AVG(${fields.totalPaymentAmount}) DESC
      LIMIT 20
    `;

    console.log('=== AVERAGE PAYMENT BY COUNTRY WIDGET ===');
    console.log('Field used:', fields.totalPaymentAmount);
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Average payment by country query error:', queryError.message);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    const data = (result.records || []).map(record => ({
      country: record.country || 'Unknown Country',
      count: parseInt(record.cnt || 0),
      countFormatted: formatNumber(record.cnt || 0),
      averageAmount: parseFloat(record.avgAmount || 0),
      averageAmountFormatted: formatCurrency(record.avgAmount || 0),
      totalAmount: parseFloat(record.totalAmount || 0),
      totalAmountFormatted: formatCurrency(record.totalAmount || 0)
    }));

    console.log('Average Payment by Country Result:', data);
    console.log('==================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching average payment by country:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 16: Payment Status Trends Over Time
router.get('/payment-status-trends', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentFields(conn);
    
    if (!fields.failedPaymentStatus || !fields.paymentCompletedDate) {
      console.warn('Failed Payment Status or Payment Completed Date field not found on Contact');
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Required fields not found'
      });
    }
    
    const query = `
      SELECT 
        CALENDAR_MONTH(${fields.paymentCompletedDate}) month,
        CALENDAR_YEAR(${fields.paymentCompletedDate}) year,
        ${fields.failedPaymentStatus} status,
        COUNT(Id) cnt
      FROM Contact
      WHERE ${fields.paymentCompletedDate} != null AND ${fields.failedPaymentStatus} != null
      GROUP BY CALENDAR_MONTH(${fields.paymentCompletedDate}), CALENDAR_YEAR(${fields.paymentCompletedDate}), ${fields.failedPaymentStatus}
      ORDER BY CALENDAR_YEAR(${fields.paymentCompletedDate}), CALENDAR_MONTH(${fields.paymentCompletedDate}), ${fields.failedPaymentStatus}
    `;

    console.log('=== PAYMENT STATUS TRENDS WIDGET ===');
    console.log('Fields used:', { failedPaymentStatus: fields.failedPaymentStatus, paymentCompletedDate: fields.paymentCompletedDate });
    console.log('Query:', query);
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result:', result);
    } catch (queryError) {
      console.error('Payment status trends query error:', queryError.message);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }

    // Group by period and status
    const periodMap = new Map();
    (result.records || []).forEach(record => {
      const year = record.year || 2000;
      const month = record.month || 1;
      const period = `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      const status = record.status || 'No Status';
      const count = record.cnt || 0;

      if (!periodMap.has(period)) {
        periodMap.set(period, { period, month, year });
      }
      periodMap.get(period)[status] = count;
    });

    const data = Array.from(periodMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    console.log('Payment Status Trends Result:', data);
    console.log('==================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching payment status trends:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Helper function to discover payment configuration fields on Contributor_Project__c
const discoverPaymentConfigFields = async (conn) => {
  try {
    const describe = await conn.sobject('Contributor_Project__c').describe();
    const fieldNames = describe.fields.map(f => f.name);
    
    const findField = (exactNames, patterns, description) => {
      // Try exact matches first
      for (const exactName of exactNames) {
        if (fieldNames.includes(exactName)) {
          console.log(`Found ${description}: ${exactName}`);
          return exactName;
        }
      }
      
      // Try pattern matching
      for (const pattern of patterns) {
        const found = fieldNames.find(f => {
          if (typeof pattern === 'string') {
            return f.toLowerCase().includes(pattern.toLowerCase());
          } else if (pattern instanceof RegExp) {
            return pattern.test(f);
          } else if (typeof pattern === 'function') {
            return pattern(f);
          }
          return false;
        });
        if (found) {
          console.log(`Found ${description}: ${found} (pattern match)`);
          return found;
        }
      }
      
      console.warn(`Field not found for ${description}. Tried: ${exactNames.join(', ')}`);
      return null;
    };
    
    const configFields = {
      projectPaymentMethod: findField(
        ['Project_Payment_Method__c', 'ProjectPaymentMethod__c', 'Payment_Method__c'],
        [
          f => f.includes('Payment') && f.includes('Method') && f.endsWith('__c'),
          f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('method')
        ],
        'Project Payment Method'
      ),
      requirePMApproval: findField(
        ['Require_PM_Approval_for_Productivity__c', 'RequirePMApprovalForProductivity__c', 'PM_Approval_Required__c'],
        [
          f => f.includes('PM') && f.includes('Approval') && f.endsWith('__c'),
          f => f.toLowerCase().includes('pm') && f.toLowerCase().includes('approval')
        ],
        'Require PM Approval for Productivity'
      ),
      releaseSystemTrackedData: findField(
        ['Release_System_Tracked_Data__c', 'ReleaseSystemTrackedData__c', 'System_Tracked_Data__c'],
        [
          f => f.includes('Release') && f.includes('System') && f.endsWith('__c'),
          f => f.toLowerCase().includes('release') && f.toLowerCase().includes('system')
        ],
        'Release System Tracked Data'
      ),
      paymentSetupRequired: findField(
        ['Payment_Setup_Required__c', 'PaymentSetupRequired__c', 'Setup_Required__c'],
        [
          f => f.includes('Payment') && f.includes('Setup') && f.endsWith('__c'),
          f => f.toLowerCase().includes('payment') && f.toLowerCase().includes('setup')
        ],
        'Payment Setup Required'
      )
    };
    
    console.log('=== DISCOVERED PAYMENT CONFIG FIELDS ON CONTRIBUTOR_PROJECT__C ===');
    console.log(JSON.stringify(configFields, null, 2));
    console.log('===================================================================');
    
    return configFields;
  } catch (error) {
    console.error('Error discovering payment config fields:', error);
    return {
      projectPaymentMethod: 'Project_Payment_Method__c',
      requirePMApproval: 'Require_PM_Approval_for_Productivity__c',
      releaseSystemTrackedData: 'Release_System_Tracked_Data__c',
      paymentSetupRequired: 'Payment_Setup_Required__c'
    };
  }
};

// Widget 17: Payment Method Distribution (Self-Reported vs Productivity)
router.get('/payment-method-distribution', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentConfigFields(conn);
    
    if (!fields.projectPaymentMethod) {
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Project Payment Method field not found'
      });
    }
    
    // First, test if the field exists and has data
    try {
      const testQuery = `SELECT COUNT() FROM Contributor_Project__c WHERE ${fields.projectPaymentMethod} != null LIMIT 1`;
      const testResult = await conn.query(testQuery);
      console.log(`Payment Method Distribution: Found ${testResult.totalSize} records with non-null ${fields.projectPaymentMethod}`);
    } catch (testError) {
      console.error('Payment Method Distribution test query error:', testError.message);
      console.error('Test query was:', `SELECT COUNT() FROM Contributor_Project__c WHERE ${fields.projectPaymentMethod} != null`);
    }
    
    // Query all records, including nulls (group nulls as "No Method")
    const query = `
      SELECT ${fields.projectPaymentMethod} method, COUNT(Id) cnt
      FROM Contributor_Project__c
      GROUP BY ${fields.projectPaymentMethod}
      ORDER BY COUNT(Id) DESC
    `;
    
    console.log('=== PAYMENT METHOD DISTRIBUTION WIDGET ===');
    console.log('Field used:', fields.projectPaymentMethod);
    console.log('Query:', query);
    
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result records:', result.records?.length || 0);
      if (result.records && result.records.length > 0) {
        console.log('Sample records:', result.records.slice(0, 3).map(r => ({
          method: r[fields.projectPaymentMethod],
          methodAlias: r.method,
          count: r.cnt || r.count
        })));
      }
    } catch (queryError) {
      console.error('Payment method distribution query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }
    
    const data = (result.records || []).map(record => {
      const methodValue = record[fields.projectPaymentMethod] || record.method;
      return {
        method: methodValue !== null && methodValue !== undefined ? String(methodValue) : 'No Method',
        count: parseInt(record.cnt || record.count || 0),
        countFormatted: formatNumber(record.cnt || record.count || 0)
      };
    });
    
    console.log('Payment Method Distribution Result:', data);
    console.log('==========================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching payment method distribution:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 18: PM Approval Required Status
router.get('/pm-approval-status', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentConfigFields(conn);
    
    if (!fields.requirePMApproval) {
      return res.json({ 
        required: 0,
        notRequired: 0,
        total: 0,
        lastRefreshed: new Date().toISOString(),
        warning: 'Require PM Approval field not found'
      });
    }
    
    // First, test if the field exists and has data
    try {
      const testQuery = `SELECT COUNT() FROM Contributor_Project__c WHERE ${fields.requirePMApproval} != null LIMIT 1`;
      const testResult = await conn.query(testQuery);
      console.log(`PM Approval Status: Found ${testResult.totalSize} records with non-null ${fields.requirePMApproval}`);
    } catch (testError) {
      console.error('PM Approval Status test query error:', testError.message);
      console.error('Test query was:', `SELECT COUNT() FROM Contributor_Project__c WHERE ${fields.requirePMApproval} != null`);
    }
    
    // Query all records, including nulls
    const query = `
      SELECT ${fields.requirePMApproval} required, COUNT(Id) cnt
      FROM Contributor_Project__c
      GROUP BY ${fields.requirePMApproval}
    `;
    
    console.log('=== PM APPROVAL STATUS WIDGET ===');
    console.log('Field used:', fields.requirePMApproval);
    console.log('Query:', query);
    
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result records:', result.records?.length || 0);
      if (result.records && result.records.length > 0) {
        console.log('Sample records:', result.records.map(r => ({
          required: r[fields.requirePMApproval],
          requiredAlias: r.required,
          count: r.cnt || r.count
        })));
      }
    } catch (queryError) {
      console.error('PM approval status query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        required: 0,
        notRequired: 0,
        total: 0,
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }
    
    let required = 0;
    let notRequired = 0;
    
    (result.records || []).forEach(record => {
      const count = parseInt(record.cnt || record.count || 0);
      const fieldValue = record[fields.requirePMApproval] !== undefined ? record[fields.requirePMApproval] : record.required;
      
      // Handle boolean values: true, 'true', 1, '1', 'Yes', etc.
      if (fieldValue === true || fieldValue === 'true' || fieldValue === 1 || fieldValue === '1' || 
          String(fieldValue).toLowerCase() === 'yes' || String(fieldValue).toLowerCase() === 'required') {
        required += count;
      } else {
        // false, null, 'false', 'No', 'Not Required', etc.
        notRequired += count;
      }
    });
    
    const total = required + notRequired;
    
    console.log('PM Approval Status Result:', { required, notRequired, total });
    console.log('==================================');
    
    res.json({ 
      required,
      notRequired,
      total,
      requiredPercentage: total > 0 ? ((required / total) * 100).toFixed(1) : '0.0',
      notRequiredPercentage: total > 0 ? ((notRequired / total) * 100).toFixed(1) : '0.0',
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching PM approval status:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 19: Release System Tracked Data Status
router.get('/release-system-tracked-data', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentConfigFields(conn);
    
    if (!fields.releaseSystemTrackedData) {
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        warning: 'Release System Tracked Data field not found'
      });
    }
    
    // First, test if the field exists and has data
    try {
      const testQuery = `SELECT COUNT() FROM Contributor_Project__c WHERE ${fields.releaseSystemTrackedData} != null LIMIT 1`;
      const testResult = await conn.query(testQuery);
      console.log(`Release System Tracked Data: Found ${testResult.totalSize} records with non-null ${fields.releaseSystemTrackedData}`);
    } catch (testError) {
      console.error('Release System Tracked Data test query error:', testError.message);
      console.error('Test query was:', `SELECT COUNT() FROM Contributor_Project__c WHERE ${fields.releaseSystemTrackedData} != null`);
    }
    
    // Query all records, including nulls (group nulls as "No Status")
    const query = `
      SELECT ${fields.releaseSystemTrackedData} status, COUNT(Id) cnt
      FROM Contributor_Project__c
      GROUP BY ${fields.releaseSystemTrackedData}
      ORDER BY COUNT(Id) DESC
    `;
    
    console.log('=== RELEASE SYSTEM TRACKED DATA WIDGET ===');
    console.log('Field used:', fields.releaseSystemTrackedData);
    console.log('Query:', query);
    
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result records:', result.records?.length || 0);
      if (result.records && result.records.length > 0) {
        console.log('Sample records:', result.records.slice(0, 3).map(r => ({
          status: r[fields.releaseSystemTrackedData],
          statusAlias: r.status,
          count: r.cnt || r.count
        })));
      }
    } catch (queryError) {
      console.error('Release system tracked data query error:', queryError.message);
      console.error('Query was:', query);
      return res.json({ 
        data: [], 
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }
    
    const data = (result.records || []).map(record => {
      const statusValue = record[fields.releaseSystemTrackedData] || record.status;
      return {
        status: statusValue !== null && statusValue !== undefined ? String(statusValue) : 'No Status',
        count: parseInt(record.cnt || record.count || 0),
        countFormatted: formatNumber(record.cnt || record.count || 0)
      };
    });
    
    console.log('Release System Tracked Data Result:', data);
    console.log('==========================================');
    
    res.json({ 
      data, 
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching release system tracked data:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

// Widget 20: Payment Setup Required Status
router.get('/payment-setup-required', authenticate, async (req, res) => {
  try {
    const conn = await getSalesforceConnection(req.user.id);
    const fields = await discoverPaymentConfigFields(conn);
    
    if (!fields.paymentSetupRequired) {
      return res.json({ 
        required: 0,
        notRequired: 0,
        total: 0,
        lastRefreshed: new Date().toISOString(),
        warning: 'Payment Setup Required field not found'
      });
    }
    
    const query = `
      SELECT ${fields.paymentSetupRequired} required, COUNT(Id) cnt
      FROM Contributor_Project__c
      WHERE ${fields.paymentSetupRequired} != null
      GROUP BY ${fields.paymentSetupRequired}
    `;
    
    console.log('=== PAYMENT SETUP REQUIRED WIDGET ===');
    console.log('Field used:', fields.paymentSetupRequired);
    console.log('Query:', query);
    
    let result;
    try {
      result = await conn.query(query);
      console.log('Query result records:', result.records?.length || 0);
    } catch (queryError) {
      console.error('Payment setup required query error:', queryError.message);
      return res.json({ 
        required: 0,
        notRequired: 0,
        total: 0,
        lastRefreshed: new Date().toISOString(),
        error: queryError.message
      });
    }
    
    let required = 0;
    let notRequired = 0;
    
    (result.records || []).forEach(record => {
      const count = parseInt(record.cnt || record.count || 0);
      if (record.required === true || record.required === 'true' || record[fields.paymentSetupRequired] === true) {
        required += count;
      } else {
        notRequired += count;
      }
    });
    
    const total = required + notRequired;
    
    console.log('Payment Setup Required Result:', { required, notRequired, total });
    console.log('=====================================');
    
    res.json({ 
      required,
      notRequired,
      total,
      requiredPercentage: total > 0 ? ((required / total) * 100).toFixed(1) : '0.0',
      notRequiredPercentage: total > 0 ? ((notRequired / total) * 100).toFixed(1) : '0.0',
      lastRefreshed: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error fetching payment setup required:', error);
    res.status(500).json({ 
      error: error.message,
      lastRefreshed: new Date().toISOString()
    });
  }
});

module.exports = router;
