# Version 2.5.0 - Enhanced Team Member Publishing

**Release Date:** November 9, 2025

## Overview

Version 2.5.0 focuses on enhancing team member publishing functionality with consistent field mapping across all routes, improved error handling, and better credential management.

## Key Features

### 1. Consistent Team Member Field Mapping
- **Team Member Field**: Maps to `Team_Member__c` (first priority)
- **Role Field**: Maps to `Team_Member_Role__c` (first priority)
- Unified field mapping logic across all routes:
  - Create Project page
  - Quick Setup Wizard
  - Create Project Team page

### 2. Enhanced Team Member Publishing
- **Create Project Team Page**: New dedicated page for managing project team members
- **Unified Logic**: Same team member publishing logic used in all pages
- **Field Discovery**: Automatic field discovery with fallback options
- **Error Handling**: Comprehensive error handling for team member creation

### 3. Credential Management
- **Decryption Fix**: Fixed credential decryption in `/create-project-team` route
- **Consistent Pattern**: All routes now use the same credential decryption pattern
- **Security**: Proper handling of encrypted Salesforce credentials

### 4. Name Field Handling
- **Smart Detection**: Automatically detects if Name field is writable
- **Skip Read-Only**: Skips Name field if it's read-only or auto-generated
- **Error Prevention**: Prevents errors when Name field cannot be written

## Technical Improvements

### Server-Side Changes

1. **Field Mapping Priority**
   - Member Field: `Team_Member__c` → `Member__c` → `User__c` → `Contact__c` → `Person__c`
   - Role Field: `Team_Member_Role__c` → `Role__c` → `Member_Role__c` → `Role`

2. **Enhanced Logging**
   - Added logging for field mapping decisions
   - Better error messages with field names
   - Detailed team member creation logs

3. **Error Handling**
   - Graceful handling of missing fields
   - Clear error messages for field-level security issues
   - Proper handling of read-only fields

### Client-Side Changes

1. **New Pages**
   - `ProjectTeamSetup.js`: Dedicated page for creating project teams
   - `QuickSetupWizard.js`: Comprehensive wizard for quick project setup

2. **UI/UX Improvements**
   - Consistent layout across all pages
   - Better error messages
   - Improved user feedback

## Files Added

- `client/src/pages/ProjectTeamSetup.js` - New page for project team management
- `client/src/pages/QuickSetupWizard.js` - Quick setup wizard
- `TEAM_MEMBER_MAPPING.md` - Documentation for team member field mapping

## Files Modified

- `server/routes/salesforce.js` - Enhanced team member publishing logic
- `client/src/pages/ProjectSetup.js` - Updated to use consistent field mapping
- `client/src/components/Sidebar.js` - Added new menu items
- `client/src/App.js` - Added new routes
- `package.json` - Updated version to 2.5.0

## Bug Fixes

1. **Credential Decryption**: Fixed issue where `/create-project-team` route was not decrypting credentials
2. **Name Field Errors**: Fixed errors when Name field is read-only
3. **Field Mapping**: Ensured consistent field mapping across all routes
4. **Server Connection**: Fixed server connection issues

## Breaking Changes

None - This is a backward-compatible release.

## Migration Notes

No migration required. All existing functionality remains intact.

## Known Issues

None at this time.

## Future Enhancements

- Enhanced team member role management
- Bulk team member operations
- Team member templates
- Advanced field mapping configuration

## Dependencies

No new dependencies added in this version.

## Testing

- Tested team member creation from Create Project page
- Tested team member creation from Quick Setup Wizard
- Tested team member creation from Create Project Team page
- Verified field mapping consistency across all routes
- Tested error handling for various scenarios

## Contributors

- Development Team

## Support

For issues or questions, please refer to the documentation or contact support.

