# UpdateObjectFields.js Decomposition Plan

## Current State
- **File Size**: 8,712 lines
- **Primary Issues**: 
  - Single Responsibility Principle violation
  - Difficult to maintain and test
  - Hard to reuse components
  - Complex state management

## Decomposition Strategy

### 1. Constants (✅ Completed)
**File**: `constants.js`
- All constant values
- Default configurations
- Option arrays

### 2. Utilities (✅ Completed)
**File**: `utils/mappingUtils.js`
- `getMappingStatus()` - Validation logic
- `getMappingSummary()` - Display text generation
- `requiresSourceField()` - Transformation checks
- `duplicateMapping()` - Mapping duplication
- `createNewMapping()` - Mapping initialization

### 3. Services (✅ Completed)
**File**: `services/apiService.js`
- `fetchFields()` - Get object fields
- `fetchPicklistValues()` - Get picklist options
- `searchReference()` - Search reference fields
- `fetchFilterOptions()` - Get filter options
- `fetchAllProjects()` - Get projects
- `fetchAllProjectObjectives()` - Get project objectives
- `getMatchingRecordsCount()` - Count matching records
- `previewUpdates()` - Preview changes
- `executeUpdates()` - Execute updates

### 4. Custom Hooks (Pending)
**Files**: `hooks/`
- `useFieldMappings.js` - Field mapping state management
- `useFilters.js` - Filter state and logic
- `useTransformationHistory.js` - Undo/redo functionality
- `useReferenceSearch.js` - Reference field search logic
- `useProjectSearch.js` - Project search logic

### 5. Components (Pending)

#### 5.1 Main Sections
- **FilterSection** (`components/FilterSection.js`)
  - Project/Project Objective filters
  - Status/Type filters
  - Search functionality

- **UpdateConfiguration** (`components/UpdateConfiguration.js`)
  - Mode selection (Single/Multiple/Mapping)
  - Container for update modes

#### 5.2 Update Mode Components
- **SingleFieldUpdate** (`components/SingleFieldUpdate.js`)
  - Single field update form
  - Update mode selection
  - Value inputs

- **MultipleFieldsUpdate** (`components/MultipleFieldsUpdate.js`)
  - Multiple fields update form
  - Dynamic field list
  - Add/remove fields

- **FieldMappingView** (`components/FieldMappingView.js`)
  - Main container for field mapping
  - Hybrid/Card view toggle
  - Mapping list management

#### 5.3 Field Mapping Sub-Components
- **HybridView** (`components/HybridView.js`)
  - Left panel: Mapping summary list
  - Right panel: Selected mapping editor
  - Add/Template buttons

- **CardView** (`components/CardView.js`)
  - Card-based mapping display
  - Individual mapping cards

- **MappingEditor** (`components/MappingEditor.js`)
  - Target field selection
  - Transformation selection
  - Source field selection
  - Transformation-specific fields

#### 5.4 Transformation Components
- **TransformationFields** (`components/TransformationFields/`)
  - `FormulaField.js`
  - `ConcatenateField.js`
  - `ValueMapField.js`
  - `ConditionalField.js`
  - `TextReplaceField.js`
  - `DefaultValueField.js`
  - `TypeConversionField.js`
  - `ValidateFormatField.js`
  - `RemoveSpecialCharsField.js`
  - `SwitchCaseField.js`
  - `DateFormatField.js`
  - `NumberFormatField.js`

#### 5.5 Modal Components
- **ConfirmModal** (`components/Modals/ConfirmModal.js`)
- **PreviewModal** (`components/Modals/PreviewModal.js`)
- **TemplateModal** (`components/Modals/TemplateModal.js`)
- **SaveSetModal** (`components/Modals/SaveSetModal.js`)
- **LoadSetModal** (`components/Modals/LoadSetModal.js`)
- **TransformationHelpModal** (`components/Modals/TransformationHelpModal.js`)
- **FieldMappingHelpModal** (`components/Modals/FieldMappingHelpModal.js`)

#### 5.6 Shared Components
- **SearchableDropdown** (`components/SearchableDropdown.js`)
  - Reusable searchable dropdown
  - Used for projects, project objectives, references

- **ReferenceFieldSearch** (`components/ReferenceFieldSearch.js`)
  - Reference field search functionality

## Implementation Order

1. ✅ Constants
2. ✅ Utilities
3. ✅ Services
4. Create custom hooks
5. Create FilterSection component
6. Create UpdateConfiguration component
7. Create SingleFieldUpdate component
8. Create MultipleFieldsUpdate component
9. Create FieldMappingView component
10. Create HybridView and CardView components
11. Create MappingEditor component
12. Create TransformationFields components
13. Create Modal components
14. Refactor main UpdateObjectFields component
15. Test all functionality

## Testing Strategy

1. Unit tests for utilities
2. Integration tests for services
3. Component tests for each sub-component
4. End-to-end tests for complete workflows
5. Manual testing of all existing functionality

## Migration Notes

- All state management will be preserved
- All API calls will maintain same behavior
- All UI interactions will remain identical
- Backward compatibility maintained
- No breaking changes to external APIs

