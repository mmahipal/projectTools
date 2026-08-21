# Changelog

All notable changes to this project will be documented in this file.

## [3.1.0] - December 2024

### Added
- **GlobalHeader.css**: New centralized stylesheet for consistent header styling across all pages
- **Standardized Header Structure**: Unified header layout matching WorkStream Reporting page
- **Consistent User Profile Section**: Simplified user profile display with standardized logout button

### Fixed
- **Header Alignment**: Fixed Project Team Setup page header to match other pages
- **Header Alignment**: Fixed Project Qualification Step Setup page header to match other pages
- **Header Styling Inconsistencies**: Resolved header padding, font sizes, and layout differences across pages

### Changed
- **Sidebar Menu Order**: Moved History page to appear below User Management
- **Header Styling**: Standardized all page headers to use:
  - Padding: `4px 16px`
  - Title font size: `20px`
  - Subtitle font size: `13px`
  - Menu toggle: `32px x 32px`
  - User avatar: `40px x 40px`
- **User Profile Structure**: Simplified from nested `user-info` wrapper to direct `user-name` span
- **Logout Button**: Standardized to use `logout-btn` class with consistent styling

### Enhanced
- **UI Consistency**: All pages now have identical header appearance and behavior
- **Code Maintainability**: Centralized header styles reduce duplication
- **User Experience**: Consistent navigation and header experience across all pages

## [3.0] - December 2024

### Added
- **Enhanced Dashboard Analytics**: 
  - Removed manual refresh button (auto-refresh only)
  - Refined summary metrics (Total Publishes, Today, Last 7 Days, Success Rate)
  - Publishing Activity Over Time area chart (last 30 days)
  - By Object Type pie chart with user-friendly names
  - By Operation bar chart (creates vs updates)
  - Top Publishers list with progress bars
  - Responsive 3-column analytics grid
- **Centralized History Management**:
  - New `historyLogger.js` utility for centralized logging
  - All Salesforce operations logged to `history.json`
  - Enhanced History page with table view
  - Operation and status badges
  - Comprehensive tracking of all publishes
- **Client Tool Account Management**:
  - New Client Tool Account page
  - Create, update, and map Client Tool Accounts
  - Searchable Client Tool Account lookup with debouncing
  - Bulk mapping to Contributor Projects
  - Server-side pagination (1000 records per page)
  - Table refresh functionality
- **Queue Status Management**:
  - New Queue Status Management page
  - View and update Queue Status for Contributor Projects
  - Individual and bulk updates (2+ items)
  - Filter by Status and Queue Status
  - Server-side pagination and filtering
  - Publish button with selected count
- **Create WorkStream**:
  - New Create WorkStream page
  - Single or multiple WorkStream creation
  - Collapsible/expandable workstream forms
  - Searchable Project Objective field
  - Specific picklist values for Delivery Tool Name and Functionality
  - Independent sidebar menu item
- **Update Object Fields**:
  - New Update Object Fields page
  - Bulk field updates for Projects, Project Objectives, Contributor Projects
  - Dynamic field selection from Salesforce
  - Filter options based on object type
  - Searchable Project and Project Objective filters
  - Support for picklist fields with "--None--" handling
- **File Upload Enhancements**:
  - Merged "Upload File" and "Attach Document" into single "Attach File" option
  - Support for CSV, XLS, XLSX formats
  - Inline input method display
  - Excel file parsing with `xlsx` library

### Fixed
- **Dashboard Refresh**: Removed manual refresh button, auto-refresh only
- **Analytics Display**: Fixed pie chart to show user-friendly object names instead of API names
- **Picklist Values**: Fixed "--None--" not appearing in Queue Status and other picklist fields
- **None Value Updates**: Fixed issue where "--None--" was not properly converted to null for Salesforce
- **History Blank**: Fixed History page showing blank by implementing centralized logging
- **Filter Z-Index**: Fixed filter dropdowns appearing behind other sections
- **Project Objective Filter**: Added Project Objective as filter option for Contributor Project

### Changed
- **Dashboard Metrics**: Changed from project-focused to publish-focused metrics
- **Analytics Layout**: Changed from 2-column to 3-column responsive grid
- **History Page**: Changed from card grid to table/list view
- **Form Layouts**: Changed to compact 2-column layout across all pages
- **Header Styling**: Reduced padding (4px 16px) across all pages
- **Field Sizing**: Standardized to 12px font, 32px height across all forms
- **Input Method Display**: Changed to inline single-line display
- **File Upload**: Merged upload and attach document functionality

### Enhanced
- **UI/UX Consistency**: 
  - Compact 2-column form layout
  - Consistent field sizing (12px font, 32px height)
  - Reduced header padding (4px 16px)
  - Compact page titles (20px) and subtitles (13px)
  - Smaller menu toggle buttons (32px x 32px)
- **Search Functionality**: 
  - Improved search icon positioning
  - Better debouncing
  - Server-side filtering integration
- **Loading States**: Fixed center positioning for loading animations
- **Picklist Handling**: 
  - Always include "--None--" for Queue Status
  - Proper null conversion for Salesforce updates
  - User-friendly object names in analytics
- **Analytics Calculations**: 
  - All metrics now reflect all publishes to Salesforce
  - Includes Projects, Project Objectives, Client Tool Accounts, Queue Status updates, WorkStreams, etc.

## [2.8.0] - 2025-11-11

### Added
- **Real-Time Dashboard Analytics**: Automatic refresh every 30 seconds
- **Manual Refresh Button**: Added refresh button in Dashboard header with visual feedback
- **Visibility API Integration**: Dashboard refreshes when user returns to tab/window
- **Window Focus Detection**: Dashboard refreshes when window gains focus
- **Automatic Data Persistence**: Projects published through Salesforce endpoints are automatically saved to local database
- **Project Objectives Persistence**: Project objectives published through Salesforce are saved to local database
- **Enhanced Logging**: Comprehensive logging for project save operations and stats calculations
- **Refresh Animations**: Spinning animation for refresh button during loading

### Fixed
- **Dashboard Not Updating**: Fixed issue where Dashboard statistics were not reflecting newly published projects
- **Data Persistence**: Fixed issue where projects published through Quick Setup Wizard were not saved to local database
- **Stats Accuracy**: Fixed stats endpoint to always return latest data by reloading from disk on each request
- **Real-Time Updates**: Implemented automatic refresh mechanism for real-time data updates

### Changed
- **Stats Endpoint**: Updated to reload projects from disk on each request instead of using cached data
- **Salesforce Endpoints**: Updated to automatically save published objects to local database
- **Dashboard Component**: Added automatic refresh mechanism with 30-second interval
- **Refresh Logic**: Implemented silent refresh mode for automatic updates and manual refresh mode with notifications

### Enhanced
- **User Experience**: Dashboard now automatically updates without user intervention
- **Data Accuracy**: All statistics and analytics reflect latest data from database
- **Error Handling**: Better error handling for save operations with graceful fallback
- **Performance**: Optimized refresh mechanism with memoization and smart polling
- **Debugging**: Enhanced logging for troubleshooting and monitoring

## [2.5.0] - 2025-11-09

### Added
- **Create Project Team Page**: New dedicated page for managing project team members
- **Team Member Field Mapping Documentation**: Comprehensive documentation in `TEAM_MEMBER_MAPPING.md`
- **Enhanced Logging**: Added detailed logging for field mapping decisions
- **Quick Setup Wizard**: Comprehensive wizard for quick project setup with team member support

### Fixed
- **Credential Decryption**: Fixed issue where `/create-project-team` route was not decrypting Salesforce credentials
- **Name Field Errors**: Fixed errors when Name field is read-only or auto-generated
- **Field Mapping Consistency**: Ensured consistent field mapping (`Team_Member__c` and `Team_Member_Role__c`) across all routes
- **Server Connection**: Fixed server connection issues and improved error handling

### Changed
- **Field Mapping Priority**: Updated to prioritize `Team_Member__c` and `Team_Member_Role__c` fields
- **Unified Logic**: Unified team member publishing logic between `createProjectInSalesforce` and `/create-project-team` route
- **Error Messages**: Improved error messages for field-level security issues

### Enhanced
- **Team Member Publishing**: Enhanced team member publishing with consistent field mapping
- **Error Handling**: Better error handling for missing fields and read-only fields
- **Documentation**: Added comprehensive documentation for team member field mapping

## [2.0.0] - 2024-12-19

### Added
- **Project Page Setup**: Complete implementation of Project Page creation with Salesforce integration
- **Multiple Pages Support**: Ability to create multiple project pages in a single form
- **Search Functionality**: 
  - Project search with debounced input
  - Project Objective search filtered by selected Project
  - Qualification Step search with proper object type detection
- **Project Page Type Picklist**: All required values including:
  - Project Splash Page (Preapply)
  - Project Pre-Qualification
  - Project Qualifying Page
  - Project Active Page
  - Default Qualification Page
- **Active Checkbox**: Toggle to mark pages as active/inactive
- **Draft Storage**: Server-side draft storage for project pages
- **Validation**: 
  - Project Qualifying Page requires Qualification Step
  - Project/Project Objective must match Qualification Step
  - Duplicate record validation
- **Error Handling**: Comprehensive error handling for all Salesforce API errors
- **Warning Notifications**: User notifications when Project/Project Objective are automatically changed

### Fixed
- **Layout Issues**: Fixed Project Page layout to fit within viewport
- **Search Infinite Loops**: Fixed Project and Project Objective search showing results continuously
- **Qualification Step Object Type**: Fixed detection of correct Salesforce object type (Project_Qualification_Step__c vs Qualification_Step__c)
- **Default Qualification Page**: Fixed field handling to omit Project/Project Objective/Qualification Step fields
- **Duplicate Records**: Fixed error handling for duplicate record validation errors
- **Network Errors**: Improved network error handling and user feedback
- **Rate Limiting**: Fixed rate limiting warnings and configuration
- **CORS Issues**: Fixed CORS configuration for proper cross-origin requests
- **Authentication**: Improved authentication error handling

### Changed
- **Project/Project Objective Matching**: Changed logic to use selected Project/Project Objective instead of automatically syncing from Qualification Step
- **Error Messages**: Improved error messages to be more user-friendly
- **Toast Notifications**: Enhanced toast notifications with proper durations and types
- **Server Configuration**: Improved server configuration for better stability

### Enhanced
- **Error Logging**: Enhanced logging for better debugging
- **User Feedback**: Improved user feedback with clear success and error messages
- **Validation Messages**: More descriptive validation error messages
- **UI/UX**: Improved overall user experience with better layout and feedback

## [1.0.0] - Initial Release

Initial version with basic project setup functionality.
