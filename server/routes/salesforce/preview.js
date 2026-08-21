// Salesforce preview routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');

/**
 * Preview object in Salesforce
 * POST /api/salesforce/preview-object
 */
router.post('/preview-object', authenticate, authorize('view_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const { objectType, formData } = req.body;

    if (!objectType) {
      return res.status(400).json({
        success: false,
        error: 'Object type is required'
      });
    }

    // Map object types to Salesforce object names
    const objectNameMap = {
      'project': 'Project__c',
      'project-objective': 'Project_Objective__c',
      'projectobjective': 'Project_Objective__c',
      'contributor-review': 'Contributor_Review__c',
      'contributorreview': 'Contributor_Review__c',
      'contributor review': 'Contributor_Review__c'
    };

    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Determine the actual Salesforce object name to use
    let actualObjectName = objectNameMap[objectType.toLowerCase()];
    
    // If not found in map, try to use objectType directly if it looks like a Salesforce object name
    if (!actualObjectName) {
      if (objectType.endsWith('__c') || objectType === 'Contact' || objectType === 'Account' || objectType === 'User') {
        // Try to verify the object exists
        try {
          await conn.sobject(objectType).describe();
          actualObjectName = objectType;
        } catch (describeError) {
          return res.status(400).json({
            success: false,
            error: `Invalid object type: ${objectType}. Valid types are: project, project-objective, contributor-review, or a valid Salesforce object name`
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid object type: ${objectType}. Valid types are: project, project-objective, contributor-review, or a valid Salesforce object name`
        });
      }
    }

    // Get object describe
    const describeResult = await conn.sobject(actualObjectName).describe();

    // Get layout information (if available)
    let layoutInfo = null;
    try {
      const layouts = await conn.sobject(actualObjectName).layouts();
      if (layouts && layouts.length > 0) {
        layoutInfo = layouts[0];
      }
    } catch (layoutError) {
      console.log('Could not fetch layout, using describe fields:', layoutError.message);
    }

    // Build field information with form data values
    const fields = describeResult.fields
      .filter(field => field.createable || field.updateable)
      .map(field => {
        // Get value from form data if available
        let value = null;
        if (formData) {
          // Try exact match
          if (formData[field.name] !== undefined && formData[field.name] !== null && formData[field.name] !== '') {
            value = formData[field.name];
          } else {
            // Try camelCase version
            const camelCaseName = field.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (formData[camelCaseName] !== undefined && formData[camelCaseName] !== null && formData[camelCaseName] !== '') {
              value = formData[camelCaseName];
            } else {
              // Try without __c suffix
              const nameWithoutSuffix = field.name.replace(/__c$/, '');
              if (formData[nameWithoutSuffix] !== undefined && formData[nameWithoutSuffix] !== null && formData[nameWithoutSuffix] !== '') {
                value = formData[nameWithoutSuffix];
              } else {
                // Try camelCase without suffix
                const camelCaseWithoutSuffix = nameWithoutSuffix.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                if (formData[camelCaseWithoutSuffix] !== undefined && formData[camelCaseWithoutSuffix] !== null && formData[camelCaseWithoutSuffix] !== '') {
                  value = formData[camelCaseWithoutSuffix];
                } else {
                  // Try label-based matching
                  const labelVariations = [
                    field.label.toLowerCase().replace(/\s+/g, ''),
                    field.label.toLowerCase().replace(/\s+/g, '_'),
                    field.label.toLowerCase().replace(/\s+/g, '')
                  ];
                  
                  for (const variation of labelVariations) {
                    const matchingKey = Object.keys(formData).find(key => {
                      const keyLower = key.toLowerCase().replace(/_/g, '').replace(/\s+/g, '');
                      return keyLower === variation || keyLower.includes(variation) || variation.includes(keyLower);
                    });
                    if (matchingKey && formData[matchingKey] !== undefined && formData[matchingKey] !== null && formData[matchingKey] !== '') {
                      value = formData[matchingKey];
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        // Determine if field is truly required (not calculated, not formula, not auto-number, not defaulted)
        const isCalculated = field.calculated || field.type === 'calculated' || field.type === 'formula';
        const isAutoNumber = field.type === 'autonumber' || field.autoNumber;
        const isDefaulted = field.defaultedOnCreate;
        const isReadOnly = !field.createable && !field.updateable;
        
        // Field is required only if:
        // - Not nullable AND
        // - Not calculated/formula AND
        // - Not auto-number AND
        // - Not defaulted on create AND
        // - Is createable/updateable (not read-only)
        const isRequired = !field.nullable && 
                          !isCalculated && 
                          !isAutoNumber && 
                          !isDefaulted && 
                          (field.createable || field.updateable);

        return {
          name: field.name,
          label: field.label,
          type: field.type,
          value: value,
          required: isRequired,
          readOnly: isReadOnly,
          calculated: isCalculated,
          autoNumber: isAutoNumber,
          length: field.length,
          picklistValues: field.picklistValues ? field.picklistValues
            .filter(pv => pv.active !== false)
            .map(pv => ({
              value: pv.value,
              label: pv.label || pv.value,
              active: pv.active
            })) : null,
          referenceTo: field.referenceTo || null,
          relationshipName: field.relationshipName || null
        };
      })
      .sort((a, b) => {
        // Sort: required fields first, then by label
        if (a.required && !b.required) return -1;
        if (!a.required && b.required) return 1;
        return a.label.localeCompare(b.label);
      });

    res.json({
      success: true,
      objectType: actualObjectName,
      objectLabel: describeResult.label,
      fields: fields,
      layout: layoutInfo
    });
  } catch (error) {
    console.error('Error fetching object preview from Salesforce:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch object preview from Salesforce'
    });
  }
}));

module.exports = router;

