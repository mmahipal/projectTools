# Version 3.7.0 Release Notes

## Release Date
December 2024

## Overview
Version 3.7.0 introduces comprehensive enhancements to the Report Builder and Scheduled Reports features, along with significant improvements to field label display, filter management, and schedule configuration.

## Major Features

### 1. Report Builder Enhancements
- **Advanced Filtering System**
  - Multiple conditions with AND/OR logic
  - Date range support
  - Field-specific operators (text, number, date, picklist, boolean)
  - Lookup field search functionality
  - Group-based filter structure

- **Field Selection Improvements**
  - Search functionality for fields
  - Field grouping by category (Standard, Custom, Related Objects)
  - Tooltips for field information
  - Selected fields display as removable chips

- **Report Grouping**
  - Group by field option
  - Visual group headers in report display
  - Grouped data export support

- **Field Label Display**
  - User-friendly labels instead of API names
  - Support for both `__c` and `_c__c` naming conventions
  - Special handling for count fields (Active Contributors, Qualified Contributors, Removed)
  - "Record ID" label for Id field

- **Report View Enhancements**
  - Full-width report display
  - Export options (XLSX, CSV, PDF)
  - Entry count display
  - Category-based report organization
  - Edit functionality from report view

### 2. Scheduled Reports Overhaul
- **Schedule Existing Report**
  - Modal-based report selection
  - Load saved reports from Report Builder
  - Schedule-only view for existing reports

- **Create New Scheduled Report**
  - Full Report Builder integration
  - Field selector and filter builder
  - Schedule configuration

- **Enhanced Schedule Options**
  - **Daily**: Time picker + Timezone selector
  - **Weekly**: Day(s) of week selection + Time + Timezone
  - **Monthly**: Day of month + Time + Timezone
  - Compact, responsive layout
  - Validation for schedule configuration

- **UI Improvements**
  - Standardized button styling across all pages
  - Removed format option (export available from Reports tab)
  - "Schedule" button instead of "Create"
  - Consistent color scheme (#08979C)

### 3. Filter Management
- **Filter Persistence**
  - Advanced filters saved with report configurations
  - Filter state preserved when loading saved reports
  - Support for complex filter structures

- **Filter Builder Component**
  - Reusable filter builder with groups
  - Condition-based filtering
  - Field type-aware value inputs

### 4. Count Fields Support
- **Aggregate Queries**
  - Active_Contributors__c
  - Applied_Contributors__c
  - Qualified_Contributors__c
  - Removed__c

- **Performance Optimization**
  - Batched queries to avoid URI length limits
  - Reduced API calls through batch processing
  - Efficient count aggregation

## Technical Improvements

### Backend
- **Report Generation**
  - Separate `/preview` and `/generate` endpoints
  - Optimized batch queries for count fields
  - Relationship field flattening
  - Field label mapping from Salesforce metadata
  - Support for read-only fields (forReporting parameter)

- **Scheduled Reports**
  - Enhanced schedule configuration storage
  - Support for timezone and time settings
  - Weekly and monthly schedule options

- **Filter Processing**
  - Advanced filter structure support
  - SOQL query generation from filter groups
  - Lookup field ID handling

### Frontend
- **Component Decomposition**
  - ReportBuilder decomposed into smaller components
  - FilterBuilder, FieldSelector, ScheduleModal components
  - EnhancedScheduleOptions component
  - ScheduleReportModal component

- **State Management**
  - Improved filter state synchronization
  - Field label mapping
  - Schedule configuration state

- **UI/UX**
  - Consistent button styling
  - Compact form layouts
  - Responsive grid layouts
  - Improved spacing and typography

## Bug Fixes

1. **Field Label Display**
   - Fixed API names showing instead of labels
   - Fixed `_c__c` naming convention handling
   - Fixed "Id" field showing as "Id" instead of "Record ID"

2. **Filter Management**
   - Fixed filters not showing when loading saved reports
   - Fixed filter state synchronization
   - Fixed "Add Condition" button functionality

3. **Count Fields**
   - Fixed count values showing as 0
   - Fixed 414 URI Too Long errors with batch processing
   - Fixed count field sorting

4. **Report Display**
   - Fixed duplicate Account columns
   - Fixed group header showing IDs instead of names
   - Fixed relationship field flattening

5. **Scheduled Reports**
   - Fixed duplicate function declarations
   - Fixed format option removal
   - Fixed button styling inconsistencies

## New Files

### Components
- `client/src/components/ReportBuilder/SavedReportsPanel.js`
- `client/src/components/ReportBuilder/ReportConfiguration.js`
- `client/src/components/ReportBuilder/ReportsList.js`
- `client/src/components/ReportBuilder/ReportViewPanel.js`
- `client/src/components/ReportBuilder/PreviewModal.js`
- `client/src/components/ReportBuilder/DeleteConfirmModal.js`
- `client/src/components/ReportBuilder/ScheduleModal.js`
- `client/src/components/ReportBuilder/ScheduleReportModal.js`
- `client/src/components/ReportBuilder/EnhancedScheduleOptions.js`
- `client/src/components/ReportBuilder/FilterBuilder/FilterBuilder.js`
- `client/src/components/ReportBuilder/FilterBuilder/FilterGroup.js`
- `client/src/components/ReportBuilder/FilterBuilder/FilterCondition.js`
- `client/src/components/ReportBuilder/FilterBuilder/LookupFieldSearch.js`
- `client/src/components/ReportBuilder/FilterBuilder/filterUtils.js`
- `client/src/components/ReportBuilder/FieldSelector/FieldSelector.js`
- `client/src/components/ReportBuilder/FieldSelector/FieldGroup.js`
- `client/src/components/ReportBuilder/FieldSelector/FieldItem.js`
- `client/src/components/ReportBuilder/EmailConfig/EmailConfig.js`
- `client/src/components/ReportBuilder/ScheduleComponents/TimePicker.js`
- `client/src/components/ReportBuilder/ScheduleComponents/TimezoneSelector.js`

### Routes
- `server/routes/reports.js`
- `server/routes/reports/filterUtils.js`
- `server/routes/reports/groupUtils.js`
- `server/routes/scheduledReports.js`
- `server/routes/updateObjectFields/objects.js`

### Pages
- `client/src/pages/ReportBuilder.js`
- `client/src/pages/ScheduledReports.js`

## Modified Files

### Major Changes
- `client/src/pages/ReportBuilder.js` - Complete refactor with component decomposition
- `client/src/pages/ScheduledReports.js` - Complete overhaul with new features
- `server/routes/reports.js` - Enhanced with preview, generate, and count field support
- `server/routes/updateObjectFields/fields.js` - Added forReporting parameter support

## Breaking Changes
None

## Migration Notes
- Saved report configurations will automatically upgrade to new filter structure
- Existing scheduled reports will continue to work with default schedule settings
- Field labels will be automatically fetched from Salesforce metadata

## Performance Improvements
- Reduced Salesforce API calls through batch processing
- Optimized count field queries (from N+1 to batched queries)
- Improved report generation performance
- Better handling of large datasets

## Known Issues
None

## Next Steps
- Continue enhancing Report Builder with additional features
- Add more export formats
- Implement report templates
- Add report sharing functionality

