# Salesforce Schema Conflict Resolution

## Problem
The application was experiencing `INVALID_FIELD` errors for `Contact__c` on the `Contributor_Project__c` entity. This was causing:
- Data-loading states to hang or error out
- Frontend loops due to failed API calls
- Inconsistent behavior across different Salesforce environments

## Root Causes

1. **Hardcoded Field Names:** Code assumed `Contact__c` field always exists
2. **Schema Differences:** Different Salesforce environments (Sandbox vs Production) may have different field names
3. **Field-Level Security (FLS):** Fields may exist but not be accessible to the API user
4. **No Validation:** No checks to verify field existence and accessibility before use

## Solution Implemented

### 1. Field Discovery Utility ✅
**File:** `server/utils/salesforce/fieldDiscovery.js`

Created a comprehensive utility that:
- Discovers contributor fields dynamically
- Validates field existence in schema
- Checks Field-Level Security (FLS) by attempting queries
- Provides detailed error messages
- Handles multiple possible field names gracefully

**Key Features:**
```javascript
const { discoverContributorField } = require('../../utils/salesforce/fieldDiscovery');

const result = await discoverContributorField(conn, {
  requireField: false, // Don't fail if not found
  preferredFields: ['Contributor__c', 'Contact__c', 'Contributor_Id__c']
});

// Returns:
// {
//   fieldName: 'Contributor__c',
//   relationshipName: 'Contributor',
//   isAccessible: true,
//   errors: [],
//   found: true
// }
```

### 2. Updated Routes ✅
**File:** `server/routes/contributorTimeStatus.js`

- Replaced hardcoded field discovery with utility function
- Added proper error handling for FLS issues
- Improved logging for field discovery process
- Gracefully handles missing fields

**Before:**
```javascript
// Hardcoded - assumes Contact__c exists
if (fieldNames.includes('Contact__c')) {
  const testQuery = `SELECT Contact__r.Name FROM Contributor_Project__c...`;
  // ...
}
```

**After:**
```javascript
// Dynamic discovery with validation
const contributorFieldResult = await discoverContributorField(conn, {
  requireField: false,
  preferredFields: ['Contributor__c', 'Contact__c', 'Contributor_Id__c']
});

if (contributorFieldResult.found && contributorFieldResult.isAccessible) {
  // Use the discovered field
  contributorFieldName = contributorFieldResult.fieldName;
}
```

## Field Discovery Process

### Step 1: Schema Check
- Queries object description to see what fields exist
- Checks if preferred fields are in the schema

### Step 2: Accessibility Check (FLS)
- Attempts to query each field
- If query succeeds → field is accessible
- If `INVALID_FIELD` error → field exists but not accessible (FLS issue)
- If field not in schema → field doesn't exist

### Step 3: Fallback Discovery
- If preferred fields not found, searches for any reference field containing "Contributor" or "Contact"
- Tries each discovered field for accessibility

### Step 4: Error Handling
- If field required but not found → throws descriptive error
- If field optional → returns null and continues without it
- Logs detailed information for debugging

## Error Messages

### Field Not Found
```
Could not find accessible contributor field on Contributor_Project__c. 
Tried: Contributor__c, Contact__c, Contributor_Id__c. 
Errors: Contact__c (Field does not exist or is not accessible). 
Please verify Field-Level Security (FLS) settings and ensure the field exists in this Salesforce environment.
```

### FLS Issue
```
Field Contact__c exists but is not accessible (Field-Level Security or missing field)
```

## Validation Checklist

### For Salesforce Administrators

1. **Verify Field Existence:**
   - Go to Setup → Object Manager → Contributor_Project__c → Fields & Relationships
   - Confirm the contributor field exists (may be `Contact__c`, `Contributor__c`, or another name)

2. **Check Field-Level Security:**
   - Go to Setup → Profiles (or Permission Sets)
   - Find the profile/permission set used by the API user
   - Ensure the contributor field has:
     - ✅ **Visible** checkbox checked
     - ✅ **Read** checkbox checked

3. **Verify API User Permissions:**
   - Check the Salesforce user account used in AWS/ECS
   - Ensure it has:
     - Object-level access to `Contributor_Project__c`
     - Field-level access to the contributor field
     - Appropriate profile or permission set assigned

4. **Test in Salesforce:**
   - Run a SOQL query in Developer Console:
     ```sql
     SELECT Contact__c, Contributor__c FROM Contributor_Project__c LIMIT 1
     ```
   - If query fails with `INVALID_FIELD`, the field doesn't exist or isn't accessible

### For Developers

1. **Check Logs:**
   - Look for `[Field Discovery]` log messages
   - Check for `INVALID_FIELD` errors
   - Verify which field was discovered

2. **Test Field Discovery:**
   ```javascript
   const { discoverContributorField } = require('./utils/salesforce/fieldDiscovery');
   const result = await discoverContributorField(conn);
   console.log('Discovered field:', result);
   ```

3. **Validate Specific Field:**
   ```javascript
   const { validateField } = require('./utils/salesforce/fieldDiscovery');
   const validation = await validateField(conn, 'Contributor_Project__c', 'Contact__c');
   console.log('Field validation:', validation);
   ```

## Common Issues and Solutions

### Issue 1: Field Exists but Query Fails
**Symptom:** Field appears in schema but queries fail with `INVALID_FIELD`

**Solution:**
- Check Field-Level Security (FLS) settings
- Ensure API user profile has Read access
- Verify permission sets if used

### Issue 2: Different Field Names in Different Environments
**Symptom:** Works in Sandbox but fails in Production (or vice versa)

**Solution:**
- Field discovery utility handles this automatically
- It tries multiple field names in order
- Logs which field was discovered for debugging

### Issue 3: Field Not Deployed
**Symptom:** Field doesn't exist in schema

**Solution:**
- Deploy the field to the target environment
- Or update `preferredFields` in discovery call to match your schema

## Monitoring

### Log Messages to Watch

**Success:**
```
[Field Discovery] ✓ Found accessible contributor field: Contributor__c (relationship: Contributor)
[Contributor Time Status] ✓ Relationship field accessible: Contributor__r.Name
```

**Warning:**
```
[Field Discovery] ✗ Field Contact__c exists in schema but is not accessible (FLS or missing field)
[Contributor Time Status] Contributor field Contributor__c found but may not be accessible (FLS issue)
```

**Error:**
```
[Field Discovery] Error discovering contributor field: Could not find accessible contributor field...
```

## Testing

### Manual Testing

1. **Test Field Discovery:**
   ```bash
   # In Node.js console or test script
   const conn = await createSalesforceConnection();
   const { discoverContributorField } = require('./utils/salesforce/fieldDiscovery');
   const result = await discoverContributorField(conn);
   console.log(result);
   ```

2. **Test Field Validation:**
   ```bash
   const { validateField } = require('./utils/salesforce/fieldDiscovery');
   const validation = await validateField(conn, 'Contributor_Project__c', 'Contact__c');
   console.log(validation);
   ```

3. **Test in Different Environments:**
   - Test in Sandbox
   - Test in Production
   - Verify field discovery works in both

## Best Practices

1. **Always Use Field Discovery:**
   - Never hardcode field names
   - Use `discoverContributorField()` utility
   - Handle cases where field is not found

2. **Graceful Degradation:**
   - Don't fail entire request if optional field missing
   - Continue with available fields
   - Log warnings for missing fields

3. **Error Messages:**
   - Provide clear, actionable error messages
   - Include field names tried
   - Suggest FLS/permission checks

4. **Logging:**
   - Log field discovery process
   - Log which field was found
   - Log FLS issues clearly

## Conclusion

The field discovery utility provides:
- ✅ **Robust field detection** across different environments
- ✅ **FLS validation** to catch permission issues
- ✅ **Graceful error handling** for missing fields
- ✅ **Detailed logging** for debugging
- ✅ **Reusable utility** for all routes

This eliminates `INVALID_FIELD` errors and makes the application more resilient to schema differences.
