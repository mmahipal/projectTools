/**
 * Salesforce Field Discovery and Validation Utility
 * 
 * This utility helps discover and validate fields on Salesforce objects,
 * handling cases where fields may not exist or may not be accessible due to
 * Field-Level Security (FLS) or schema differences between environments.
 */

/**
 * Discover contributor field on Contributor_Project__c object
 * Tries multiple possible field names and validates accessibility
 * 
 * @param {jsforce.Connection} conn - Salesforce connection
 * @param {Object} options - Options for field discovery
 * @param {boolean} options.requireField - If true, throws error if field not found (default: false)
 * @param {Array<string>} options.preferredFields - Ordered list of preferred field names (default: ['Contributor__c', 'Contact__c', 'Contributor_Id__c'])
 * @returns {Promise<Object>} Object with fieldName, relationshipName, and accessible status
 */
const discoverContributorField = async (conn, options = {}) => {
  const {
    requireField = false,
    preferredFields = ['Contributor__c', 'Contact__c', 'Contributor_Id__c']
  } = options;

  let discoveredField = null;
  let relationshipName = null;
  let isAccessible = false;
  const errors = [];

  try {
    // First, get object description to see what fields exist
    const describeResult = await conn.sobject('Contributor_Project__c').describe();
    const fieldNames = describeResult.fields.map(f => f.name);
    
    console.log(`[Field Discovery] Checking Contributor_Project__c for contributor field. Available fields: ${fieldNames.length} total`);

    // Try preferred fields in order
    for (const fieldName of preferredFields) {
      if (fieldNames.includes(fieldName)) {
        const field = describeResult.fields.find(f => f.name === fieldName);
        
        // Check if field is accessible (FLS check)
        try {
          const testQuery = `SELECT ${fieldName} FROM Contributor_Project__c WHERE ${fieldName} != null LIMIT 1`;
          await conn.query(testQuery);
          
          // Field exists and is accessible
          discoveredField = fieldName;
          relationshipName = field.relationshipName || (fieldName === 'Contact__c' ? 'Contact' : 'Contributor');
          isAccessible = true;
          
          console.log(`[Field Discovery] ✓ Found accessible contributor field: ${fieldName} (relationship: ${relationshipName})`);
          break;
        } catch (queryError) {
          // Field exists but may not be accessible (FLS issue)
          const errorCode = queryError.errorCode || queryError.code;
          const errorMessage = queryError.message || String(queryError);
          
          if (errorCode === 'INVALID_FIELD' || errorMessage.includes('INVALID_FIELD')) {
            errors.push({
              field: fieldName,
              error: 'Field does not exist or is not accessible',
              code: errorCode
            });
            console.warn(`[Field Discovery] ✗ Field ${fieldName} exists in schema but is not accessible (FLS or missing field)`);
          } else {
            // Other error (might be no records, which is OK)
            console.log(`[Field Discovery] Field ${fieldName} exists but test query failed: ${errorMessage}`);
            // Still try to use it if it's in the schema
            discoveredField = fieldName;
            relationshipName = field.relationshipName || (fieldName === 'Contact__c' ? 'Contact' : 'Contributor');
            isAccessible = false; // Mark as not verified accessible
            break;
          }
        }
      } else {
        errors.push({
          field: fieldName,
          error: 'Field does not exist in schema'
        });
        console.log(`[Field Discovery] Field ${fieldName} not found in schema`);
      }
    }

    // If no preferred field found, try to discover any reference field that might be the contributor
    if (!discoveredField) {
      console.log(`[Field Discovery] No preferred field found, searching for any contributor-related reference field...`);
      
      const referenceFields = describeResult.fields.filter(f => 
        f.type === 'reference' && 
        (f.name.includes('Contributor') || f.name.includes('Contact'))
      );
      
      if (referenceFields.length > 0) {
        console.log(`[Field Discovery] Found ${referenceFields.length} potential contributor reference field(s)`);
        
        // Try each reference field
        for (const field of referenceFields) {
          try {
            const testQuery = `SELECT ${field.name} FROM Contributor_Project__c WHERE ${field.name} != null LIMIT 1`;
            await conn.query(testQuery);
            
            discoveredField = field.name;
            relationshipName = field.relationshipName || 'Contributor';
            isAccessible = true;
            
            console.log(`[Field Discovery] ✓ Discovered accessible contributor field: ${field.name} (relationship: ${relationshipName})`);
            break;
          } catch (queryError) {
            console.warn(`[Field Discovery] Field ${field.name} not accessible: ${queryError.message}`);
            errors.push({
              field: field.name,
              error: 'Field not accessible',
              code: queryError.errorCode
            });
          }
        }
      }
    }

    // If still no field found and it's required, throw error
    if (!discoveredField && requireField) {
      const errorMessage = `Could not find accessible contributor field on Contributor_Project__c. ` +
        `Tried: ${preferredFields.join(', ')}. ` +
        `Errors: ${errors.map(e => `${e.field} (${e.error})`).join('; ')}. ` +
        `Please verify Field-Level Security (FLS) settings and ensure the field exists in this Salesforce environment.`;
      
      throw new Error(errorMessage);
    }

    return {
      fieldName: discoveredField,
      relationshipName: relationshipName,
      isAccessible: isAccessible,
      errors: errors,
      found: !!discoveredField
    };

  } catch (error) {
    console.error('[Field Discovery] Error discovering contributor field:', error);
    
    if (requireField) {
      throw new Error(`Failed to discover contributor field: ${error.message}`);
    }
    
    return {
      fieldName: null,
      relationshipName: null,
      isAccessible: false,
      errors: [{ error: error.message }],
      found: false
    };
  }
};

/**
 * Validate that a field exists and is accessible on an object
 * 
 * @param {jsforce.Connection} conn - Salesforce connection
 * @param {string} objectName - Salesforce object name
 * @param {string} fieldName - Field name to validate
 * @returns {Promise<Object>} Validation result with exists, accessible, and error details
 */
const validateField = async (conn, objectName, fieldName) => {
  try {
    // First check if field exists in schema
    const describeResult = await conn.sobject(objectName).describe();
    const field = describeResult.fields.find(f => f.name === fieldName);
    
    if (!field) {
      return {
        exists: false,
        accessible: false,
        error: `Field ${fieldName} does not exist on ${objectName}`,
        fieldInfo: null
      };
    }

    // Try to query the field to check FLS
    try {
      const testQuery = `SELECT ${fieldName} FROM ${objectName} WHERE ${fieldName} != null LIMIT 1`;
      await conn.query(testQuery);
      
      return {
        exists: true,
        accessible: true,
        error: null,
        fieldInfo: {
          name: field.name,
          type: field.type,
          label: field.label,
          relationshipName: field.relationshipName,
          referenceTo: field.referenceTo
        }
      };
    } catch (queryError) {
      const errorCode = queryError.errorCode || queryError.code;
      const errorMessage = queryError.message || String(queryError);
      
      // Check if it's an INVALID_FIELD error (FLS issue)
      if (errorCode === 'INVALID_FIELD' || errorMessage.includes('INVALID_FIELD')) {
        return {
          exists: true,
          accessible: false,
          error: `Field ${fieldName} exists but is not accessible (Field-Level Security or missing field)`,
          errorCode: errorCode,
          fieldInfo: {
            name: field.name,
            type: field.type,
            label: field.label
          }
        };
      }
      
      // Other error (might be no records, which is OK for validation)
      return {
        exists: true,
        accessible: true, // Assume accessible if error is not INVALID_FIELD
        error: null,
        fieldInfo: {
          name: field.name,
          type: field.type,
          label: field.label,
          relationshipName: field.relationshipName,
          referenceTo: field.referenceTo
        }
      };
    }
  } catch (error) {
    return {
      exists: false,
      accessible: false,
      error: `Error validating field: ${error.message}`,
      fieldInfo: null
    };
  }
};

/**
 * Get field relationship name for a reference field
 * 
 * @param {string} fieldName - Field name (e.g., 'Contact__c')
 * @returns {string} Relationship name (e.g., 'Contact__r')
 */
const getRelationshipName = (fieldName) => {
  if (!fieldName || !fieldName.endsWith('__c')) {
    return null;
  }
  
  // Convert Contact__c -> Contact__r, Contributor__c -> Contributor__r
  return fieldName.replace('__c', '__r');
};

module.exports = {
  discoverContributorField,
  validateField,
  getRelationshipName
};
