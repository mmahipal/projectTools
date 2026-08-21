// Route handler for GET /picklist-values/:objectType/:fieldName

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getSalesforceConnection, asyncHandler, objectNameMap } = require('./utils');

router.get('/picklist-values/:objectType/:fieldName', authenticate, asyncHandler(async (req, res) => {
  try {
    const { objectType, fieldName } = req.params;
    const objectName = objectNameMap[objectType.toLowerCase()];
    
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: `Invalid object type: ${objectType}`
      });
    }

    const conn = await getSalesforceConnection(req.user.id);
    const describeResult = await conn.sobject(objectName).describe();
    const field = describeResult.fields.find(f => f.name === fieldName);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: `Field ${fieldName} not found in ${objectName}`
      });
    }

    if (field.type !== 'picklist' && field.type !== 'multipicklist') {
      return res.status(400).json({
        success: false,
        error: `Field ${fieldName} is not a picklist field`
      });
    }

    let picklistValues = field.picklistValues
      ? field.picklistValues
          .filter(pv => pv.active !== false)
          .map(pv => pv.value)
      : [];

    // Check if field has a defaultValue that represents "None"
    // Salesforce picklists often have "--None--" or empty string as default
    const hasNoneValue = picklistValues.some(v => {
      const strValue = String(v || '').trim();
      return strValue === '' || 
             strValue === '--None--' || 
             strValue === 'None' || 
             v === null || 
             v === undefined ||
             strValue.toLowerCase() === 'none';
    });

    // For Queue_Status__c field, always include "--None--" if not present
    // For other fields, include "--None--" if nullable and not present
    if (!hasNoneValue) {
      if (fieldName === 'Queue_Status__c') {
        picklistValues.unshift('--None--');
      } else if (field.nullable) {
        picklistValues.unshift('--None--');
      }
    }

    res.json({
      success: true,
      values: picklistValues
    });
  } catch (error) {
    console.error('Error fetching picklist values:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch picklist values'
    });
  }
}));

module.exports = router;

