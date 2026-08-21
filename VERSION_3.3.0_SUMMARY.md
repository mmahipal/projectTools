# Version 3.3.0 Summary

## Release Date
2025-11-20

## Overview
Version 3.3.0 includes significant enhancements to the Update Object Fields functionality, improved filtering capabilities, reference field search functionality, and various UI/UX improvements.

## Key Features & Enhancements

### 1. Update Object Fields - Enhanced Filtering
- **Project Filter**: Added ability to filter by specific Project when "Project" is selected as the object
- **Project Objective Filter**: Added ability to filter by specific Project Objective when "Project Objective" is selected as the object
- **Removed Queue Status Filter**: Removed "Filter by Queue Status" from the Update Object Fields page
- **Filter Validation**: All filters are now properly applied to ensure updates only affect filtered records
- **Record Count Display**: Added real-time display of matching record count based on active filters
- **Filter Dependencies**: Project Objective filter now dynamically updates based on selected Project filter

### 2. Reference Field Search Functionality
- **Searchable Reference Fields**: When a field type is "reference" (lookup), users can now search Salesforce records
- **Debounced Search**: Search triggers 300ms after user stops typing to reduce API calls
- **Dropdown Results**: Search results displayed in a dropdown with hover effects
- **New Value Search**: Search functionality for "New Value" field when updating reference fields
- **Current Value Search**: Search functionality for "Current Value" field in "specific" update mode
- **Backend Endpoint**: New `/update-object-fields/search-reference/:objectName` endpoint for searching any Salesforce object

### 3. Boolean Field Handling
- **Fixed Boolean Updates**: Corrected handling of boolean field updates to prevent SOQL errors
- **No Quotes for Booleans**: Boolean values in WHERE clauses are no longer enclosed in quotes
- **Type Conversion**: Proper conversion of string boolean values ('true', 'false', '1', '0') to actual boolean types

### 4. UI/UX Improvements

#### Welcome Page
- **Permission-Based Features**: Features are now filtered based on user permissions
- **Removed Quick Actions**: Removed the "Quick Actions" section
- **Compact Layout**: Reduced sizing and padding to make the page more compact
- **No Scrolling Required**: All features now fit on the page without scrolling

#### Sidebar
- **Logo Visibility**: Fixed Appen logo display in both collapsed and expanded states
- **Removed Gray Padding**: Removed unwanted gray background/padding next to logo and application name
- **Proper Sizing**: Logo now fully visible when sidebar is collapsed and properly sized when expanded

#### Charts
- **All Countries Display**: "Payments by Country" and "Average Payment by Country" charts now display all countries
- **Horizontal Scrolling**: Added horizontal scrolling capability to view all country data
- **Dynamic Width**: Chart width dynamically adjusts based on number of countries

### 5. Table Refresh Functionality
- **Client Tool Account**: Refresh button now only refreshes the table, not the entire page
- **Queue Status Management**: Refresh button updates table entries without full page reload
- **Workstream Management**: Refresh functionality improved for better user experience
- **Auto-Refresh**: Tables automatically refresh after successful publish operations

### 6. Default Landing Page
- **Welcome Page as Default**: Application now defaults to Welcome page after login instead of Crowd Dashboard
- **Navigation Updates**: Updated login redirects to point to Welcome page

### 7. Search Improvements
- **Project Search**: Enhanced search functionality for "Filter by Project" with debounced API calls
- **Project Objective Search**: Enhanced search functionality for "Filter by Project Objective" with debounced API calls
- **Searching Indicators**: Added "Searching..." messages during search operations
- **API Integration**: Search now uses Salesforce API endpoints for better results

### 8. Filter Application
- **Strict Filter Application**: All filters are now correctly applied to WHERE clauses in SOQL queries
- **Filter Validation**: Added confirmation dialogs showing which filters are active before updates
- **Warning for No Filters**: Users are warned when no filters are applied (will update all records)

## Technical Improvements

### Backend
- **Reference Field Metadata**: Added `referenceTo` information to field metadata
- **Generic Search Endpoint**: Created reusable search endpoint for any Salesforce object
- **Enhanced Logging**: Improved logging for bulk update operations with detailed filter information
- **Query Building**: Enhanced SOQL query building with proper filter application

### Frontend
- **State Management**: Improved state management for filters and search operations
- **Debouncing**: Implemented debouncing for search inputs to reduce API calls
- **Error Handling**: Enhanced error handling and user feedback
- **Code Organization**: Better code organization and separation of concerns

## Bug Fixes
- Fixed refresh button not working in Client Tool Account page
- Fixed boolean field update errors (quotes in WHERE clauses)
- Fixed filter application for Project Objective updates
- Fixed search functionality for Project and Project Objective filters
- Fixed logo visibility issues in sidebar
- Fixed chart display to show all countries instead of top 10

## Files Modified

### Frontend
- `client/src/pages/UpdateObjectFields.js` - Major enhancements for filtering and reference field search
- `client/src/pages/Welcome.js` - Permission-based feature filtering and layout improvements
- `client/src/styles/Welcome.css` - Compact layout styling
- `client/src/components/Sidebar.js` - Logo display fixes
- `client/src/styles/Sidebar.css` - Logo and padding fixes
- `client/src/pages/ClientToolAccount.js` - Refresh functionality improvements
- `client/src/pages/QueueStatusManagement.js` - Refresh functionality improvements
- `client/src/pages/WorkStreamReporting.js` - Refresh functionality improvements
- `client/src/pages/ContributorPaymentsDashboard.js` - Chart improvements for all countries
- `client/src/pages/Login.js` - Default landing page updates
- `client/src/context/AuthContext.js` - Permission check improvements

### Backend
- `server/routes/updateObjectFields.js` - Filter application, reference search endpoint, boolean handling
- `server/routes/salesforce.js` - Project Objective search with project filter support

## Migration Notes
- No database migrations required
- No breaking changes to existing APIs
- All changes are backward compatible

## Testing Recommendations
1. Test reference field search for various object types
2. Verify filter application for all object types (Project, Project Objective, Contributor Project)
3. Test boolean field updates with various values
4. Verify chart scrolling for countries
5. Test refresh functionality on all table pages
6. Verify permission-based feature display on Welcome page

## Next Steps
- Consider adding more reference field types support
- Enhance search with additional filters
- Add bulk reference field updates
- Improve chart performance for large datasets

