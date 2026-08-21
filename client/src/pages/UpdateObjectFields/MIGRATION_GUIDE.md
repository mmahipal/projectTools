# Migration Guide - UpdateObjectFields.js Refactoring

## Status

✅ **All Components Created**: 29 components ready for use
✅ **All Hooks Created**: 4 custom hooks for state management  
✅ **All Services Extracted**: API service functions ready
✅ **All Utilities Extracted**: Helper functions ready
✅ **Backup Created**: `UpdateObjectFields.js.backup`

## Migration Strategy

Due to the complexity of the original file (8,712 lines), the migration should be done incrementally:

### Phase 1: Test Components (Recommended First Step)
1. Test each extracted component independently
2. Verify hooks work correctly
3. Test services with actual API calls

### Phase 2: Incremental Integration
1. Start by replacing the FilterSection UI with the extracted component
2. Replace UpdateConfiguration section
3. Replace SingleFieldUpdate section
4. Replace MultipleFieldsUpdate section
5. Replace FieldMappingView section
6. Replace all modals

### Phase 3: Final Cleanup
1. Remove unused code
2. Update imports
3. Test all functionality end-to-end

## Key Integration Points

### 1. FilterSection Integration
The FilterSection component uses the `useFilters` hook internally, so you need to:
- Pass `selectedObject` and `setSelectedObject`
- Pass `objectOptions`
- The component manages its own filter state

### 2. Handler Functions
Keep these in the main component (they're orchestration logic):
- `handlePreview` - Complex preview logic for all modes
- `handleUpdate` - Complex update logic for all modes
- These can use the extracted services but need to stay in main component

### 3. State Management
- Use `useFieldMappings` hook for field mapping state
- Use `useFilters` hook for filter state (or let FilterSection manage it)
- Use `useReferenceSearch` for reference field searches
- Keep other component-specific state in main component

### 4. Component Props
Each component needs specific props - see component files for details.

## Testing Checklist

- [ ] FilterSection renders and filters work
- [ ] UpdateConfiguration mode switching works
- [ ] SingleFieldUpdate form works
- [ ] MultipleFieldsUpdate form works
- [ ] FieldMappingView renders
- [ ] HybridView and CardView work
- [ ] MappingEditor works with all transformation types
- [ ] All modals open and close correctly
- [ ] Preview functionality works for all modes
- [ ] Execute functionality works for all modes
- [ ] All transformation types work correctly
- [ ] Reference field searches work
- [ ] Picklist values load correctly
- [ ] Filter dropdowns work correctly

## Rollback Plan

If issues arise:
1. Restore from backup: `cp UpdateObjectFields.js.backup UpdateObjectFields.js`
2. Components are independent, so they won't break other parts
3. Can revert incrementally if needed

## Next Steps

1. **Test the refactored demonstration version** (`UpdateObjectFields.refactored.js`)
2. **Fix any integration issues** found during testing
3. **Gradually replace sections** in the original file
4. **Test after each section replacement**
5. **Complete full replacement** once all sections are verified

