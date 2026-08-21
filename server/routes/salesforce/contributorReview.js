// Salesforce Contributor Review creation routes

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const asyncHandler = require('../../utils/salesforce/asyncHandler');
const { createSalesforceConnection } = require('../../services/salesforce/connectionService');
const { logCreate } = require('../../utils/historyLogger');
const { getObjectDescribe } = require('../../services/salesforce/metadataCache');

/**
 * Create Contributor Review in Salesforce
 * POST /api/salesforce/create-contributor-review
 */
router.post('/create-contributor-review', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const reviewData = req.body;
    
    console.log('=== CREATE CONTRIBUTOR REVIEW API REQUEST ===');
    console.log('Request body:', JSON.stringify(reviewData, null, 2));
    
    // Contributor, Project, and Project Objective are now optional

    const conn = await createSalesforceConnection(null, req.user.id);
    
    // First, check if Contributor_Review__c object exists
    let objectExists = false;
    let objectName = 'Contributor_Review__c';
    
    // Try alternative object names in parallel for better performance
    const alternativeNames = ['Contributor_Review__c', 'ContributorReview__c', 'Review__c'];
    
    const objectChecks = await Promise.allSettled(
      alternativeNames.map(name => 
        getObjectDescribe(conn, name, req.user.id).then(desc => ({ name, desc }))
      )
    );
    
    for (let i = 0; i < objectChecks.length; i++) {
      const result = objectChecks[i];
      if (result.status === 'fulfilled' && result.value) {
        objectName = result.value.name;
        objectExists = true;
        console.log(`Found ${objectName} object with ${result.value.desc.fields.length} fields`);
        break;
      }
    }
    
    if (!objectExists) {
      return res.status(400).json({
        success: false,
        error: `Contributor Review object (${objectName}) does not exist in your Salesforce instance. Please create the Contributor_Review__c custom object in Salesforce with the required fields.`
      });
    }

    // Get object describe to map fields dynamically (using cached version)
    const describeResult = await getObjectDescribe(conn, objectName, req.user.id);
    const fieldMap = {};
    describeResult.fields.forEach(field => {
      fieldMap[field.name.toLowerCase()] = field.name;
    });

    // Helper function to format dates for Salesforce (YYYY-MM-DD format)
    const formatDateForSalesforce = (dateValue) => {
      if (!dateValue) return null;
      
      // If it's already in YYYY-MM-DD format, return as-is
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      
      // If it's a Date object or date string, convert to YYYY-MM-DD
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date value: ${dateValue}`);
          return null;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.warn(`Error formatting date ${dateValue}:`, error);
        return null;
      }
    };

    // Helper function to map picklist values
    const mapPicklistValue = (fieldDef, formValue) => {
      // If it's a picklist, try to match the value
      if (fieldDef.type === 'picklist' && fieldDef.picklistValues) {
        // Try to find exact match first
        const exactMatch = fieldDef.picklistValues.find(pv => 
          pv.value === formValue || 
          pv.label === formValue ||
          (pv.active !== false && (pv.value === formValue || pv.label === formValue))
        );
        
        if (exactMatch) {
          return exactMatch.value;
        }
        
        // Extract first word (e.g., "Excellent" from "Excellent - Fully completed...")
        const firstWord = formValue.split(' - ')[0].trim();
        const wordMatch = fieldDef.picklistValues.find(pv => 
          pv.active !== false && (
            pv.value === firstWord || 
            pv.label === firstWord ||
            pv.value.toLowerCase() === firstWord.toLowerCase() ||
            pv.label.toLowerCase() === firstWord.toLowerCase()
          )
        );
        
        if (wordMatch) {
          return wordMatch.value;
        }
        
        // If no match found, try to use first word (might work if Salesforce accepts it)
        console.warn(`No exact picklist match found for "${formValue}", using first word: "${firstWord}"`);
        return firstWord;
      }
      
      // Not a picklist, use value as-is
      return formValue;
    };

    // Build the record data
    const recordData = {};
    
    // Map Contributor (lookup to Contact)
    if (reviewData.contributorId) {
      const contributorField = fieldMap['contributor__c'] || fieldMap['contact__c'] || 'Contributor__c';
      if (describeResult.fields.find(f => f.name === contributorField)) {
        recordData[contributorField] = reviewData.contributorId;
      }
    }
    
    // Contributor Review Number is auto-filled by Salesforce, so we don't set it here
    
    // Map Contributor Resume Review fields
    if (reviewData.contributorResumeReviewed && reviewData.contributorResumeReviewed !== '--None--') {
      const field = fieldMap['contributor_resume_reviewed__c'] || 'Contributor_Resume_Reviewed__c';
      if (describeResult.fields.find(f => f.name === field)) {
        const fieldDef = describeResult.fields.find(f => f.name === field);
        if (fieldDef && fieldDef.type === 'boolean') {
          recordData[field] = reviewData.contributorResumeReviewed === 'Yes';
        } else {
          recordData[field] = reviewData.contributorResumeReviewed;
        }
      }
    }
    
    if (reviewData.resumeReviewDate) {
      const field = fieldMap['resume_review_date__c'] || 'Resume_Review_Date__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        const formattedDate = formatDateForSalesforce(reviewData.resumeReviewDate);
        if (formattedDate) {
          recordData[field] = formattedDate;
        }
      }
    }
    
    if (reviewData.resumeReviewResult && reviewData.resumeReviewResult !== '--None--') {
      const field = fieldMap['resume_review_result__c'] || 'Resume_Review_Result__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        recordData[field] = mapPicklistValue(fieldDef, reviewData.resumeReviewResult);
      }
    }
    
    // Map Contributor LinkedIn Review fields
    if (reviewData.contributorLinkedInReviewed && reviewData.contributorLinkedInReviewed !== '--None--') {
      const field = fieldMap['contributor_linkedin_reviewed__c'] || 'Contributor_LinkedIn_Reviewed__c';
      if (describeResult.fields.find(f => f.name === field)) {
        const fieldDef = describeResult.fields.find(f => f.name === field);
        if (fieldDef && fieldDef.type === 'boolean') {
          recordData[field] = reviewData.contributorLinkedInReviewed === 'Yes';
        } else {
          recordData[field] = reviewData.contributorLinkedInReviewed;
        }
      }
    }
    
    if (reviewData.linkedInReviewDate) {
      const field = fieldMap['linkedin_review_date__c'] || 'LinkedIn_Review_Date__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        const formattedDate = formatDateForSalesforce(reviewData.linkedInReviewDate);
        if (formattedDate) {
          recordData[field] = formattedDate;
        }
      }
    }
    
    if (reviewData.linkedInReviewResult && reviewData.linkedInReviewResult !== '--None--') {
      const field = fieldMap['linkedin_review_result__c'] || 'LinkedIn_Review_Result__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        recordData[field] = mapPicklistValue(fieldDef, reviewData.linkedInReviewResult);
      }
    }
    
    // Map Contributor Mercury Profile Review fields
    if (reviewData.contributorMercuryProfileReviewed && reviewData.contributorMercuryProfileReviewed !== '--None--') {
      const field = fieldMap['contributor_mercury_profile_reviewed__c'] || 'Contributor_Mercury_Profile_Reviewed__c';
      if (describeResult.fields.find(f => f.name === field)) {
        const fieldDef = describeResult.fields.find(f => f.name === field);
        if (fieldDef && fieldDef.type === 'boolean') {
          recordData[field] = reviewData.contributorMercuryProfileReviewed === 'Yes';
        } else {
          recordData[field] = reviewData.contributorMercuryProfileReviewed;
        }
      }
    }
    
    if (reviewData.profileReviewDate) {
      const field = fieldMap['profile_review_date__c'] || 'Profile_Review_Date__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        const formattedDate = formatDateForSalesforce(reviewData.profileReviewDate);
        if (formattedDate) {
          recordData[field] = formattedDate;
        }
      }
    }
    
    if (reviewData.profileReviewResult && reviewData.profileReviewResult !== '--None--') {
      const field = fieldMap['profile_review_result__c'] || 'Profile_Review_Result__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        recordData[field] = mapPicklistValue(fieldDef, reviewData.profileReviewResult);
      }
    }
    
    // Map Contributor Interview fields
    if (reviewData.interviewScheduledDate) {
      const field = fieldMap['interview_scheduled_date__c'] || 'Interview_Scheduled_Date__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        const formattedDate = formatDateForSalesforce(reviewData.interviewScheduledDate);
        if (formattedDate) {
          recordData[field] = formattedDate;
        }
      }
    }
    
    if (reviewData.interviewCompletedDate) {
      const field = fieldMap['interview_completed_date__c'] || 'Interview_Completed_Date__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        const formattedDate = formatDateForSalesforce(reviewData.interviewCompletedDate);
        if (formattedDate) {
          recordData[field] = formattedDate;
        }
      }
    }
    
    if (reviewData.interviewResult && reviewData.interviewResult !== '--None--') {
      const field = fieldMap['interview_result__c'] || 'Interview_Result__c';
      const fieldDef = describeResult.fields.find(f => f.name === field);
      if (fieldDef) {
        // If it's a picklist, try to match the value or extract just the first word
        if (fieldDef.type === 'picklist' && fieldDef.picklistValues) {
          // Try to find exact match first
          const exactMatch = fieldDef.picklistValues.find(pv => 
            pv.value === reviewData.interviewResult || 
            pv.label === reviewData.interviewResult
          );
          
          if (exactMatch) {
            recordData[field] = exactMatch.value;
          } else {
            // Extract first word (e.g., "Excellent" from "Excellent - Fully completed...")
            const firstWord = reviewData.interviewResult.split(' - ')[0].trim();
            const wordMatch = fieldDef.picklistValues.find(pv => 
              pv.value === firstWord || 
              pv.label === firstWord ||
              pv.value.toLowerCase() === firstWord.toLowerCase() ||
              pv.label.toLowerCase() === firstWord.toLowerCase()
            );
            
            if (wordMatch) {
              recordData[field] = wordMatch.value;
            } else {
              // Fallback: use the first word as-is (might work if Salesforce accepts it)
              recordData[field] = firstWord;
            }
          }
        } else {
          // Not a picklist, use value as-is
          recordData[field] = reviewData.interviewResult;
        }
      }
    }
    
    if (reviewData.interviewRecording && reviewData.interviewRecording !== '--None--') {
      const field = fieldMap['interview_recording__c'] || 'Interview_Recording__c';
      if (describeResult.fields.find(f => f.name === field)) {
        const fieldDef = describeResult.fields.find(f => f.name === field);
        if (fieldDef && fieldDef.type === 'boolean') {
          recordData[field] = reviewData.interviewRecording === 'Yes';
        } else {
          recordData[field] = reviewData.interviewRecording;
        }
      }
    }
    
    console.log('Creating Contributor Review record with data:', JSON.stringify(recordData, null, 2));
    
    // Create the record
    const createResult = await conn.sobject(objectName).create(recordData);
    
    if (createResult.success) {
      console.log(`Successfully created Contributor Review with ID: ${createResult.id}`);
      
      // Log to history
      try {
        logCreate(
          'Contributor Review',
          reviewData.contributorName || 'Contributor Review',
          createResult.id,
          req.user?.email || 'Unknown',
          reviewData,
          { objectType: objectName }
        );
      } catch (historyError) {
        console.error('Error logging contributor review history:', historyError);
      }
      
      // Log to audit logs
      try {
        const auditLogger = require('../../utils/auditLogger');
        auditLogger.logAuditEvent({
          user: req.user?.email || 'Unknown',
          action: 'Added',
          objectType: 'Contributor Review',
          objectId: createResult.id,
          objectName: reviewData.contributorName || 'Contributor Review',
          salesforceId: createResult.id,
          status: 'success',
          details: { objectType: objectName }
        });
      } catch (auditError) {
        console.error('Error logging audit:', auditError);
      }
      
      res.json({
        success: true,
        salesforceId: createResult.id,
        objectType: objectName,
        message: 'Contributor Review created successfully in Salesforce'
      });
    } else {
      const errors = createResult.errors || [];
      const errorMessage = errors.length > 0 
        ? errors.map(e => e.message).join('; ')
        : 'Failed to create Contributor Review in Salesforce';
      
      console.error('Error creating Contributor Review:', errorMessage);
      res.status(400).json({
        success: false,
        error: errorMessage,
        details: errors
      });
    }
  } catch (error) {
    console.error('Error creating Contributor Review in Salesforce:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Contributor Review in Salesforce'
    });
  }
}));

/**
 * Get Last Contributor Review Number
 * GET /api/salesforce/get-last-contributor-review-number
 */
router.get('/get-last-contributor-review-number', authenticate, asyncHandler(async (req, res) => {
  try {
    const conn = await createSalesforceConnection(null, req.user.id);
    
    // Try to find the Contributor_Review__c object
    let objectName = 'Contributor_Review__c';
    let reviewNumberField = null;
    
    try {
      const describeResult = await conn.sobject(objectName).describe();
      
      // Try to find the review number field (could be Contributor_Review_Number__c, Review_Number__c, etc.)
      const possibleFields = [
        'Contributor_Review_Number__c',
        'Review_Number__c',
        'ContributorReviewNumber__c',
        'ReviewNumber__c',
        'Number__c'
      ];
      
      console.log('Available fields in Contributor_Review__c:', describeResult.fields.map(f => f.name).filter(n => n.includes('Review') || n.includes('Number') || n.includes('CRN')));
      
      for (const fieldName of possibleFields) {
        const field = describeResult.fields.find(f => f.name === fieldName);
        if (field) {
          reviewNumberField = fieldName;
          console.log(`Found review number field: ${fieldName}`);
          break;
        }
      }
      
      // Also try to find any field that contains "Review" and "Number" in its name
      if (!reviewNumberField) {
        const reviewNumberFields = describeResult.fields.filter(f => 
          (f.name.toLowerCase().includes('review') && f.name.toLowerCase().includes('number')) ||
          f.name.toLowerCase().includes('crn')
        );
        if (reviewNumberFields.length > 0) {
          reviewNumberField = reviewNumberFields[0].name;
          console.log(`Found review number field by search: ${reviewNumberField}`);
        }
      }
      
      if (!reviewNumberField) {
        // If no field found, return default
        console.warn('Review number field not found in Contributor_Review__c object');
        return res.json({
          success: true,
          nextNumber: 'CRN-0001',
          message: 'Review number field not found, using default'
        });
      }
      
      // Query for the last review number
      // Since the field might be text, we'll fetch all records and sort in JavaScript
      // or use a more flexible query approach
      console.log(`Querying ${objectName} for last review number using field: ${reviewNumberField}`);
      
      // Get field definition to understand its type
      const fieldDef = describeResult.fields.find(f => f.name === reviewNumberField);
      if (fieldDef) {
        console.log(`Field type: ${fieldDef.type}, Label: ${fieldDef.label}, Length: ${fieldDef.length || 'N/A'}`);
      }
      
      // Try multiple query approaches to handle different field types
      let result = null;
      let queryError = null;
      
      // Query 1: Simple query to get all records (most reliable)
      const query1 = `SELECT Id, ${reviewNumberField}, CreatedDate FROM ${objectName} ORDER BY CreatedDate DESC LIMIT 100`;
      console.log(`Attempting query 1: ${query1}`);
      
      try {
        result = await conn.query(query1);
        console.log(`Query 1 successful. Found ${result.records?.length || 0} total records`);
        
        // Filter out null/empty values and log what we found
        if (result.records) {
          const beforeFilter = result.records.length;
          result.records = result.records.filter(r => {
            const value = r[reviewNumberField];
            const hasValue = value != null && value !== '' && value !== undefined;
            if (hasValue) {
              console.log(`  Record ${r.Id}: ${reviewNumberField} = "${value}"`);
            }
            return hasValue;
          });
          console.log(`After filtering: ${beforeFilter} -> ${result.records.length} records with review numbers`);
        }
      } catch (err) {
        queryError = err;
        console.error(`Query 1 failed: ${err.message}`);
        console.error(`Query error details:`, err);
      }
      
      // Query 2: With WHERE clause for non-null (if Query 1 found nothing)
      if ((!result || !result.records || result.records.length === 0) && !queryError) {
        const query2 = `SELECT Id, ${reviewNumberField}, CreatedDate FROM ${objectName} WHERE ${reviewNumberField} != null ORDER BY CreatedDate DESC LIMIT 100`;
        console.log(`Attempting query 2: ${query2}`);
        
        try {
          result = await conn.query(query2);
          console.log(`Query 2 successful. Found ${result.records?.length || 0} records with non-null review numbers`);
        } catch (err) {
          console.warn(`Query 2 failed: ${err.message}`);
        }
      }
      
      // Query 3: Try with LIKE pattern if still no results
      if ((!result || !result.records || result.records.length === 0) && !queryError) {
        const query3 = `SELECT Id, ${reviewNumberField}, CreatedDate FROM ${objectName} WHERE ${reviewNumberField} LIKE 'CRN-%' ORDER BY CreatedDate DESC LIMIT 100`;
        console.log(`Attempting query 3: ${query3}`);
        
        try {
          result = await conn.query(query3);
          console.log(`Query 3 successful. Found ${result.records?.length || 0} records matching CRN- pattern`);
        } catch (err) {
          console.warn(`Query 3 failed: ${err.message}`);
        }
      }
      
      if (queryError && (!result || !result.records || result.records.length === 0)) {
        throw queryError;
      }
      
      if (result.records && result.records.length > 0) {
        console.log(`Processing ${result.records.length} records to find maximum review number`);
        
        // Extract all numbers and find the maximum
        let maxNumber = 0;
        let lastNumber = null;
        const allNumbers = [];
        
        for (const record of result.records) {
          const reviewNum = record[reviewNumberField];
          if (reviewNum) {
            console.log(`Found review number value: "${reviewNum}" (type: ${typeof reviewNum})`);
            allNumbers.push(reviewNum);
            
            // Extract number from format like "CRN-0001" or "CRN-001" or just "1" or "0001"
            // Try multiple patterns
            let num = null;
            
            // Pattern 1: CRN-XXXX or CRN-XXX
            let match = reviewNum.toString().match(/CRN-?(\d+)/i);
            if (match) {
              num = parseInt(match[1], 10);
            } else {
              // Pattern 2: Just digits at the end
              match = reviewNum.toString().match(/(\d+)$/);
              if (match) {
                num = parseInt(match[1], 10);
              } else {
                // Pattern 3: All digits
                match = reviewNum.toString().match(/^(\d+)$/);
                if (match) {
                  num = parseInt(match[1], 10);
                }
              }
            }
            
            if (num !== null && !isNaN(num)) {
              console.log(`  Extracted number: ${num} from "${reviewNum}"`);
              if (num > maxNumber) {
                maxNumber = num;
                lastNumber = reviewNum;
              }
            } else {
              console.warn(`  Could not extract number from "${reviewNum}"`);
            }
          }
        }
        
        console.log(`All review numbers found: ${JSON.stringify(allNumbers)}`);
        console.log(`Maximum number found: ${maxNumber}, Last number: ${lastNumber}`);
        
        if (maxNumber > 0) {
          const nextNum = maxNumber + 1; // Increment by 1 to avoid duplicates
          // Format as CRN-XXXX (4 digits)
          const nextNumber = `CRN-${String(nextNum).padStart(4, '0')}`;
          
          console.log(`Last review number: ${lastNumber}, Next review number: ${nextNumber}`);
          
          return res.json({
            success: true,
            nextNumber: nextNumber,
            lastNumber: lastNumber,
            maxNumber: maxNumber,
            allNumbers: allNumbers
          });
        } else {
          console.warn('Found records but could not extract valid numbers from any of them');
        }
      } else {
        console.log('No records found in query result');
      }
      
      // If no records found or parsing failed, return default
      console.log('No previous reviews found, using default CRN-0001');
      return res.json({
        success: true,
        nextNumber: 'CRN-0001',
        message: 'No previous reviews found, using default'
      });
      
    } catch (describeError) {
      console.error(`Error describing ${objectName}:`, describeError.message);
      // Return default if object doesn't exist
      return res.json({
        success: true,
        nextNumber: 'CRN-0001',
        message: 'Contributor Review object not found, using default'
      });
    }
  } catch (error) {
    console.error('Error fetching last contributor review number:', error);
    res.json({
      success: true,
      nextNumber: 'CRN-0001',
      message: 'Error fetching review number, using default',
      error: error.message
    });
  }
}));

module.exports = router;

