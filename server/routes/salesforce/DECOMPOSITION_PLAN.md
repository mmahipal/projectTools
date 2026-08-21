# Salesforce.js Decomposition Plan

## Current Status
- **Original File**: `server/routes/salesforce.js` - 6,566 lines
- **Routes Identified**: 21 route handlers

## Decomposition Strategy

### 1. Utilities Layer ✅
- ✅ `utils/salesforce/dataStorage.js` - File storage operations
- ✅ `utils/salesforce/encryption.js` - Encryption/decryption
- ✅ `utils/salesforce/asyncHandler.js` - Async error wrapper
- ✅ `utils/salesforce/index.js` - Export all utilities

### 2. Services Layer (In Progress)
- ✅ `services/salesforce/connectionService.js` - Connection management
- ⏳ `services/salesforce/projectService.js` - Project operations
- ⏳ `services/salesforce/projectObjectiveService.js` - Project objective operations
- ⏳ `services/salesforce/searchService.js` - Search operations
- ⏳ `services/salesforce/qualificationStepService.js` - Qualification step operations

### 3. Route Handlers (In Progress)
- ✅ `routes/salesforce/settings.js` - Settings routes (POST/GET)
- ✅ `routes/salesforce/test.js` - Connection test route
- ⏳ `routes/salesforce/projects.js` - Project routes
- ⏳ `routes/salesforce/projectObjectives.js` - Project objective routes
- ⏳ `routes/salesforce/search.js` - Search routes
- ⏳ `routes/salesforce/accounts.js` - Account routes
- ⏳ `routes/salesforce/qualificationSteps.js` - Qualification step routes
- ⏳ `routes/salesforce/projectPages.js` - Project page routes
- ⏳ `routes/salesforce/projectTeam.js` - Project team routes
- ⏳ `routes/salesforce/preview.js` - Preview routes

### 4. Main Index File
- ⏳ `routes/salesforce/index.js` - Combine all route handlers

## Route Handlers Breakdown

### Settings Routes
- POST `/settings` - Save settings
- GET `/settings` - Get settings

### Test Routes
- POST `/test` - Test connection

### Project Routes
- POST `/create-project` - Create project
- POST `/test-create-project` - Test project creation
- POST `/test-project-creation` - Test project creation (alternative)
- POST `/create-test-project` - Create test project
- PATCH `/update-project-status/:projectId` - Update project status
- GET `/projects` - Get projects
- GET `/search-projects` - Search projects

### Project Objective Routes
- POST `/create-project-objective` - Create project objective
- GET `/project-objectives` - Get project objectives
- GET `/search-project-objectives` - Search project objectives

### Account Routes
- GET `/accounts` - Get accounts

### Search Routes
- GET `/search-people` - Search people
- GET `/project-managers` - Get project managers

### Qualification Step Routes
- POST `/create-qualification-step` - Create qualification step
- GET `/qualification-steps` - Get qualification steps

### Project Page Routes
- POST `/create-project-page` - Create project page

### Project Team Routes
- POST `/create-project-team` - Create project team

### Preview Routes
- POST `/preview-object` - Preview object

## Large Functions to Extract

1. **createProjectInSalesforce** (~2,500 lines)
   - Extract to `services/salesforce/projectService.js`
   - Break into smaller helper functions

2. **createProjectObjectiveInSalesforce** (~1,000 lines)
   - Extract to `services/salesforce/projectObjectiveService.js`

3. **createQualificationStepInSalesforce** (~600 lines)
   - Extract to `services/salesforce/qualificationStepService.js`

4. **convertPersonFieldToId** (~200 lines)
   - Extract to `utils/salesforce/personFieldConverter.js`

## Next Steps

1. Continue extracting route handlers
2. Extract large service functions
3. Create main index file
4. Update original file to use decomposed structure
5. Test all routes

