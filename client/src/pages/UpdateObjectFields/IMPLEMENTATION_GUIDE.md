# Implementation Guide - Completing the Decomposition

## Current Status

✅ **Foundation Complete** (17 files created):
- Constants, utilities, services extracted
- Custom hooks created
- FilterSection and UpdateConfiguration components created
- SearchableDropdown reusable component created

## Remaining Work

### Critical Components Needed

1. **SingleFieldUpdate.js** (~400 lines)
   - Extract lines 3520-3879 from UpdateObjectFields.js
   - Handles single field update form
   - Uses SearchableDropdown for reference fields

2. **MultipleFieldsUpdate.js** (~500 lines)
   - Extract lines 3881-4021 + helper functions
   - Handles multiple fields update
   - Uses renderMultipleFieldValueInput and renderMultipleFieldCurrentValueInput

3. **FieldMappingView.js** (~300 lines)
   - Container for field mapping functionality
   - Handles hybrid/card view toggle
   - Routes to HybridView or CardView

4. **HybridView.js** (~800 lines)
   - Left panel: Mapping summary list
   - Right panel: Selected mapping editor
   - Extract lines ~4200-4850

5. **CardView.js** (~600 lines)
   - Card-based mapping display
   - Extract lines ~4848-6400

6. **MappingEditor.js** (~400 lines)
   - Target field, transformation, source field selection
   - Transformation-specific fields rendering
   - Extract from both hybrid and card views

### Transformation Components (13 files)

Each transformation type needs its own component:
- FormulaField.js
- ConcatenateField.js
- ValueMapField.js
- ConditionalField.js
- TextReplaceField.js
- DefaultValueField.js
- TypeConversionField.js
- ValidateFormatField.js
- RemoveSpecialCharsField.js
- SwitchCaseField.js
- DateFormatField.js
- NumberFormatField.js
- CopyField.js (may be inline)

### Modal Components (7 files)

- ConfirmModal.js
- PreviewModal.js
- TemplateModal.js
- SaveSetModal.js
- LoadSetModal.js
- TransformationHelpModal.js
- FieldMappingHelpModal.js

## How to Extract Components

### Pattern for Extraction

1. **Identify the section** in UpdateObjectFields.js
2. **Create new component file** with proper imports
3. **Extract JSX and logic** to the component
4. **Define props interface** - what data/functions does it need?
5. **Update main component** to import and use the new component
6. **Test** that functionality is preserved

### Example: Extracting SingleFieldUpdate

```javascript
// Before (in UpdateObjectFields.js, lines 3520-3879)
{updateModeType === 'single' && (
  <div>
    {/* 350+ lines of JSX */}
  </div>
)}

// After (in components/SingleFieldUpdate.js)
const SingleFieldUpdate = ({
  selectedObject,
  fields,
  loadingFields,
  selectedField,
  setSelectedField,
  updateMode,
  setUpdateMode,
  currentValue,
  setCurrentValue,
  newValue,
  setNewValue,
  selectedFieldInfo,
  picklistValues,
  // ... reference search props
}) => {
  return (
    <div>
      {/* Extracted JSX */}
    </div>
  );
};

// In UpdateObjectFields.js
import SingleFieldUpdate from './components/SingleFieldUpdate';

{updateModeType === 'single' && (
  <SingleFieldUpdate
    selectedObject={selectedObject}
    fields={fields}
    // ... pass all required props
  />
)}
```

## Testing Strategy

After each extraction:
1. Build the project (`npm run build`)
2. Check for linting errors
3. Manually test the extracted functionality
4. Verify no regressions in other areas

## File Size Targets

- **Main UpdateObjectFields.js**: Target ~500-800 lines (orchestration)
- **Component files**: 100-800 lines each
- **Hook files**: 50-200 lines each
- **Utility files**: 50-300 lines each

## Benefits Achieved

✅ **Separation of Concerns**: Each file has a single responsibility
✅ **Reusability**: Components can be used independently
✅ **Testability**: Isolated units are easier to test
✅ **Maintainability**: Smaller files are easier to understand
✅ **Scalability**: Easy to add new features without bloating main file

## Next Immediate Steps

1. Create SingleFieldUpdate component
2. Create MultipleFieldsUpdate component  
3. Create FieldMappingView component
4. Create HybridView and CardView components
5. Create MappingEditor component
6. Extract transformation components
7. Extract modal components
8. Refactor main component
9. Comprehensive testing

