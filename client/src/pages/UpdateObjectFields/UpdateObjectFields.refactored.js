// REFACTORED VERSION - UpdateObjectFields.js using all extracted components
// This demonstrates how the main component should be refactored to use all extracted pieces

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { Menu, LogOut, Send, RefreshCw, Loader, Eye, Undo, Redo } from 'lucide-react';
import toast from 'react-hot-toast';

// Import extracted constants, utilities, services, and hooks
import {
  OBJECT_OPTIONS,
  UPDATE_MODE_TYPES,
  TRANSFORMATION_TYPES,
  DEFAULT_FIELD_MAPPING,
  DEFAULT_MULTIPLE_FIELD_UPDATE
} from './constants';
import {
  createNewMapping,
  duplicateMapping
} from './utils/mappingUtils';
import {
  useFieldMappings,
  useFilters,
  useReferenceSearch,
  useTransformationHistory
} from './hooks';
import {
  fetchFields,
  fetchPicklistValues,
  searchReference,
  fetchFilterOptions,
  getMatchingRecordsCount,
  previewUpdates,
  executeUpdates
} from './services/apiService';

// Import all components
import {
  FilterSection,
  UpdateConfiguration,
  SingleFieldUpdate,
  MultipleFieldsUpdate,
  FieldMappingView,
  HybridView,
  CardView,
  MappingEditor,
  ConfirmModal,
  PreviewModal,
  TemplateModal,
  SaveSetModal,
  LoadSetModal,
  TransformationHelpModal,
  FieldMappingHelpModal
} from './components';

// Import transformation components
import {
  FormulaField,
  ConditionalField,
  ConcatenateField,
  ValueMapField,
  DateFormatField,
  NumberFormatField,
  TextReplaceField,
  DefaultValueField,
  TypeConversionField,
  ValidateFormatField,
  RemoveSpecialCharsField,
  SwitchCaseField
} from './components/TransformationFields';

// Import transformation templates
import { transformationTemplates, saveTransformationSet as saveSetToStorage, loadTransformationSet as loadSetFromStorage, getAllTransformationSets, deleteTransformationSet as deleteSetFromStorage } from '../../utils/transformationTemplates';
import '../../styles/UpdateObjectFields.css';
import '../../styles/Sidebar.css';
import '../../styles/GlobalHeader.css';

const UpdateObjectFields = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState('');
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [selectedFieldInfo, setSelectedFieldInfo] = useState(null);
  const [updateMode, setUpdateMode] = useState('all');
  const [currentValue, setCurrentValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [updateModeType, setUpdateModeType] = useState(UPDATE_MODE_TYPES.SINGLE);
  const [loadingFields, setLoadingFields] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [picklistValues, setPicklistValues] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({ message: '', onConfirm: null, onCancel: null });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveSetModal, setShowSaveSetModal] = useState(false);
  const [showLoadSetModal, setShowLoadSetModal] = useState(false);
  const [showTransformationHelpModal, setShowTransformationHelpModal] = useState(false);
  const [showFieldMappingHelpModal, setShowFieldMappingHelpModal] = useState(false);
  const [savedSetName, setSavedSetName] = useState('');
  const [savedTransformationSets, setSavedTransformationSets] = useState([]);
  const [batchSize, setBatchSize] = useState(200);
  const [errorHandlingMode, setErrorHandlingMode] = useState('default');
  const [showMappingModeHelp, setShowMappingModeHelp] = useState(false);

  // Use custom hooks
  const fieldMappingsHook = useFieldMappings(fields, []);
  const referenceSearchHook = useReferenceSearch();
  const currentValueReferenceSearchHook = useReferenceSearch();
  const transformationHistoryHook = useTransformationHistory(fieldMappingsHook.fieldMappings);

  // Extract history functions
  const { undo: undoTransformation, redo: redoTransformation, canUndo, canRedo } = transformationHistoryHook;

  // Extract hook values
  const {
    fieldMappings,
    setFieldMappings,
    selectedMappingId,
    setSelectedMappingId,
    useHybridView,
    setUseHybridView,
    addMapping,
    removeMapping,
    updateMapping,
    getStatus,
    getSummary
  } = fieldMappingsHook;

  // Filter state - FilterSection manages its own filters via useFilters hook internally
  // We need to track filters and count for preview/execute operations
  const [filters, setFilters] = useState({
    projectId: '',
    projectName: '',
    projectObjectiveId: '',
    projectObjectiveName: '',
    status: '',
    type: ''
  });
  const [matchingRecordsCount, setMatchingRecordsCount] = useState(null);

  const {
    referenceSearchTerm,
    setReferenceSearchTerm,
    referenceSearchResults,
    searchingReference,
    showReferenceDropdown,
    setShowReferenceDropdown,
    handleSearch: handleReferenceSearch
  } = referenceSearchHook;

  const {
    referenceSearchTerm: currentValueReferenceSearchTerm,
    setReferenceSearchTerm: setCurrentValueReferenceSearchTerm,
    referenceSearchResults: currentValueReferenceSearchResults,
    searchingReference: searchingCurrentValueReference,
    showReferenceDropdown: showCurrentValueReferenceDropdown,
    setShowReferenceDropdown: setShowCurrentValueReferenceDropdown,
    handleSearch: handleCurrentValueReferenceSearch
  } = currentValueReferenceSearchHook;

  // State for multiple field updates
  const [multipleFieldUpdates, setMultipleFieldUpdates] = useState([DEFAULT_MULTIPLE_FIELD_UPDATE]);
  const [sourceObject, setSourceObject] = useState('');
  const [sourceFields, setSourceFields] = useState([]);
  const [conditionPicklistValues, setConditionPicklistValues] = useState({});
  const [targetPicklistValues, setTargetPicklistValues] = useState({});

  // Fetch fields when object is selected
  useEffect(() => {
    if (selectedObject) {
      setLoadingFields(true);
      fetchFields(selectedObject, false).then(fetchedFields => {
        setFields(fetchedFields);
        setSourceFields(fetchedFields);
        setLoadingFields(false);
      }).catch(() => {
        setLoadingFields(false);
      });
      // FilterSection will fetch filter options internally
    } else {
      setFields([]);
      setSelectedField('');
      setSelectedFieldInfo(null);
      setPicklistValues([]);
    }
  }, [selectedObject]);

  // Handle field selection
  useEffect(() => {
    if (selectedField && selectedObject) {
      const fieldInfo = fields.find(f => f.name === selectedField);
      setSelectedFieldInfo(fieldInfo);
      
      if (fieldInfo && (fieldInfo.type === 'picklist' || fieldInfo.type === 'multipicklist')) {
        if (fieldInfo.picklistValues && fieldInfo.picklistValues.length > 0) {
          setPicklistValues(fieldInfo.picklistValues);
        } else {
          fetchPicklistValues(selectedObject, selectedField).then(values => {
            setPicklistValues(values);
          });
        }
      } else {
        setPicklistValues([]);
      }
    } else {
      setSelectedFieldInfo(null);
      setPicklistValues([]);
    }
  }, [selectedField, selectedObject, fields]);

  // Handle reference search
  useEffect(() => {
    if (selectedFieldInfo && selectedFieldInfo.type === 'reference' && selectedFieldInfo.referenceTo) {
      if (referenceSearchTerm && referenceSearchTerm.trim() !== '') {
        handleReferenceSearch(selectedFieldInfo.referenceTo, referenceSearchTerm);
      }
      if (currentValueReferenceSearchTerm && currentValueReferenceSearchTerm.trim() !== '') {
        handleCurrentValueReferenceSearch(selectedFieldInfo.referenceTo, currentValueReferenceSearchTerm);
      }
    }
  }, [referenceSearchTerm, currentValueReferenceSearchTerm, selectedFieldInfo]);

  // Transformation components mapping
  const transformationComponents = {
    [TRANSFORMATION_TYPES.FORMULA]: FormulaField,
    [TRANSFORMATION_TYPES.CONDITIONAL]: ConditionalField,
    [TRANSFORMATION_TYPES.CONCATENATE]: ConcatenateField,
    [TRANSFORMATION_TYPES.VALUE_MAP]: ValueMapField,
    [TRANSFORMATION_TYPES.DATE_FORMAT]: DateFormatField,
    [TRANSFORMATION_TYPES.NUMBER_FORMAT]: NumberFormatField,
    [TRANSFORMATION_TYPES.TEXT_REPLACE]: TextReplaceField,
    [TRANSFORMATION_TYPES.DEFAULT_VALUE]: DefaultValueField,
    [TRANSFORMATION_TYPES.TYPE_CONVERSION]: TypeConversionField,
    [TRANSFORMATION_TYPES.VALIDATE_FORMAT]: ValidateFormatField,
    [TRANSFORMATION_TYPES.REMOVE_SPECIAL_CHARS]: RemoveSpecialCharsField,
    [TRANSFORMATION_TYPES.SWITCH]: SwitchCaseField
  };

  // Handler functions
  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const updateConfig = {
        mode: updateModeType,
        fieldMappings: updateModeType === UPDATE_MODE_TYPES.MAPPING ? fieldMappings : null,
        multipleFieldUpdates: updateModeType === UPDATE_MODE_TYPES.MULTIPLE ? multipleFieldUpdates : null,
        singleFieldUpdate: updateModeType === UPDATE_MODE_TYPES.SINGLE ? {
          field: selectedField,
          updateMode: updateMode,
          currentValue: currentValue,
          newValue: newValue
        } : null
      };
      const data = await previewUpdates(selectedObject, updateConfig, filters);
      if (data) {
        setPreviewData(data);
        setShowPreviewModal(true);
      }
      setLoadingPreview(false);
    } catch (error) {
      console.error('Preview error:', error);
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    setShowConfirmModal(true);
    setConfirmModalData({
      message: `Are you sure you want to update ${matchingRecordsCount || 0} record(s)? This action cannot be undone.`,
      onConfirm: async () => {
        setShowConfirmModal(false);
        setUpdating(true);
        try {
          const updateConfig = {
            mode: updateModeType,
            fieldMappings: updateModeType === UPDATE_MODE_TYPES.MAPPING ? fieldMappings : null,
            multipleFieldUpdates: updateModeType === UPDATE_MODE_TYPES.MULTIPLE ? multipleFieldUpdates : null,
            singleFieldUpdate: updateModeType === UPDATE_MODE_TYPES.SINGLE ? {
              field: selectedField,
              updateMode: updateMode,
              currentValue: currentValue,
              newValue: newValue
            } : null,
            batchSize: batchSize,
            errorHandlingMode: errorHandlingMode
          };
          await executeUpdates(selectedObject, updateConfig, filters);
          setUpdating(false);
        } catch (error) {
          console.error('Execute error:', error);
          setUpdating(false);
        }
      },
      onCancel: () => setShowConfirmModal(false)
    });
  };

  const handleTemplateApply = (template) => {
    if (template.mappings && template.mappings.length > 0) {
      setFieldMappings(template.mappings.map(m => ({ ...m, id: Date.now() })));
      toast.success(`Template "${template.name}" applied successfully`);
    }
  };

  const handleSaveSet = () => {
    if (!savedSetName.trim()) {
      toast.error('Please enter a name for the transformation set');
      return;
    }
    const setData = {
      name: savedSetName,
      fieldMappings: fieldMappings,
      createdAt: new Date().toISOString()
    };
    saveSetToStorage(savedSetName, setData);
    setSavedTransformationSets(getAllTransformationSets());
    setSavedSetName('');
    setShowSaveSetModal(false);
    toast.success('Transformation set saved successfully');
  };

  const handleLoadSet = (set) => {
    const loadedSet = loadSetFromStorage(set.name);
    if (loadedSet && loadedSet.fieldMappings) {
      setFieldMappings(loadedSet.fieldMappings.map(m => ({ ...m, id: Date.now() })));
      toast.success(`Transformation set "${set.name}" loaded successfully`);
    }
  };

  const handleDeleteSet = (setId) => {
    const set = savedTransformationSets.find(s => s.id === setId);
    if (set) {
      deleteSetFromStorage(set.name);
      setSavedTransformationSets(getAllTransformationSets());
      toast.success('Transformation set deleted');
    }
  };

  // Load saved sets on mount
  useEffect(() => {
    setSavedTransformationSets(getAllTransformationSets());
  }, []);

  return (
    <div className="update-object-fields-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="update-object-fields-content" style={{ marginLeft: sidebarOpen ? '320px' : '80px' }}>
        <div className="update-object-fields-container">
          {/* Header */}
          <div className="update-object-fields-header">
            <div className="header-content">
              <div className="header-left">
                <button 
                  className="header-menu-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="page-title">Update Object Fields</h1>
                  <p className="page-subtitle">Bulk update fields for Project, Project Objective, or Contributor Project</p>
                </div>
              </div>
              <div className="header-user-profile">
                <div className="user-profile">
                  <div className="user-avatar">
                    {(user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{user?.email || 'User'}</span>
                  <button className="logout-btn" onClick={logout} title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="update-object-fields-main">
            {/* Filter Section - Using extracted component */}
            <FilterSection
              selectedObject={selectedObject}
              setSelectedObject={setSelectedObject}
              objectOptions={OBJECT_OPTIONS}
              onFiltersChange={(newFilters, count) => {
                // Update filters state for preview/execute operations
                setFilters(newFilters);
                // Update matching count from FilterSection
                if (count !== undefined) {
                  setMatchingRecordsCount(count);
                }
              }}
              setFields={setFields}
              setSelectedField={setSelectedField}
              setNewValue={setNewValue}
              setCurrentValue={setCurrentValue}
            />

            {selectedObject && (
              <>
                {/* Update Configuration - Using extracted component */}
                <UpdateConfiguration
                  updateModeType={updateModeType}
                  setUpdateModeType={setUpdateModeType}
                  setMultipleFieldUpdates={setMultipleFieldUpdates}
                  setSelectedField={setSelectedField}
                  setNewValue={setNewValue}
                  setCurrentValue={setCurrentValue}
                  setSourceObject={setSourceObject}
                  setSourceFields={setSourceFields}
                  setFieldMappings={setFieldMappings}
                >
                  {/* Single Field Update */}
                  {updateModeType === UPDATE_MODE_TYPES.SINGLE && (
                    <SingleFieldUpdate
                      selectedObject={selectedObject}
                      fields={fields}
                      loadingFields={loadingFields}
                      selectedField={selectedField}
                      setSelectedField={setSelectedField}
                      updateMode={updateMode}
                      setUpdateMode={setUpdateMode}
                      currentValue={currentValue}
                      setCurrentValue={setCurrentValue}
                      newValue={newValue}
                      setNewValue={setNewValue}
                      selectedFieldInfo={selectedFieldInfo}
                      picklistValues={picklistValues}
                      referenceSearchTerm={referenceSearchTerm}
                      setReferenceSearchTerm={setReferenceSearchTerm}
                      referenceSearchResults={referenceSearchResults}
                      searchingReference={searchingReference}
                      showReferenceDropdown={showReferenceDropdown}
                      setShowReferenceDropdown={setShowReferenceDropdown}
                      currentValueReferenceSearchTerm={currentValueReferenceSearchTerm}
                      setCurrentValueReferenceSearchTerm={setCurrentValueReferenceSearchTerm}
                      currentValueReferenceSearchResults={currentValueReferenceSearchResults}
                      searchingCurrentValueReference={searchingCurrentValueReference}
                      showCurrentValueReferenceDropdown={showCurrentValueReferenceDropdown}
                      setShowCurrentValueReferenceDropdown={setShowCurrentValueReferenceDropdown}
                    />
                  )}

                  {/* Multiple Fields Update */}
                  {updateModeType === UPDATE_MODE_TYPES.MULTIPLE && (
                    <MultipleFieldsUpdate
                      selectedObject={selectedObject}
                      fields={fields}
                      loadingFields={loadingFields}
                      multipleFieldUpdates={multipleFieldUpdates}
                      setMultipleFieldUpdates={setMultipleFieldUpdates}
                      fetchPicklistValues={async (objectType, fieldName) => {
                        return await fetchPicklistValues(objectType, fieldName);
                      }}
                      searchReference={async (referenceObject, searchTerm) => {
                        return await searchReference(referenceObject, searchTerm);
                      }}
                    />
                  )}

                  {/* Field Mapping View */}
                  {updateModeType === UPDATE_MODE_TYPES.MAPPING && (
                    <FieldMappingView
                      selectedObject={selectedObject}
                      sourceObject={sourceObject}
                      setSourceObject={setSourceObject}
                      sourceFields={sourceFields}
                      setSourceFields={setSourceFields}
                      fetchFields={async (obj, isSource) => {
                        setLoadingFields(true);
                        const fetchedFields = await fetchFields(obj, isSource);
                        if (isSource) {
                          setSourceFields(fetchedFields);
                        } else {
                          setFields(fetchedFields);
                        }
                        setLoadingFields(false);
                        return fetchedFields;
                      }}
                      objectOptions={OBJECT_OPTIONS}
                      fieldMappings={fieldMappings}
                      useHybridView={useHybridView}
                      setUseHybridView={setUseHybridView}
                      selectedMappingId={selectedMappingId}
                      setSelectedMappingId={setSelectedMappingId}
                      showMappingModeHelp={showMappingModeHelp}
                      setShowMappingModeHelp={setShowMappingModeHelp}
                      showFieldMappingHelpModal={showFieldMappingHelpModal}
                      setShowFieldMappingHelpModal={setShowFieldMappingHelpModal}
                    >
                      {useHybridView ? (
                        <HybridView
                          fieldMappings={fieldMappings}
                          fields={fields}
                          sourceFields={sourceFields}
                          selectedMappingId={selectedMappingId}
                          setSelectedMappingId={setSelectedMappingId}
                          addMapping={addMapping}
                          removeMapping={removeMapping}
                          duplicateMapping={(id) => {
                        const mapping = fieldMappings.find(m => m.id === id);
                        if (mapping) {
                          const duplicated = duplicateMapping(mapping);
                          setFieldMappings([...fieldMappings, duplicated]);
                          setSelectedMappingId(duplicated.id);
                        }
                      }}
                          getStatus={getStatus}
                          getSummary={getSummary}
                          onTemplateClick={() => setShowTemplateModal(true)}
                        >
                          {selectedMappingId && fieldMappings.find(m => m.id === selectedMappingId) && (
                            <MappingEditor
                              mapping={fieldMappings.find(m => m.id === selectedMappingId)}
                              fields={fields}
                              sourceFields={sourceFields}
                              loadingFields={loadingFields}
                              updateMapping={updateMapping}
                              targetPicklistValues={targetPicklistValues}
                              showTransformationHelpModal={showTransformationHelpModal}
                              setShowTransformationHelpModal={setShowTransformationHelpModal}
                              transformationComponents={transformationComponents}
                            />
                          )}
                        </HybridView>
                      ) : (
                        <CardView
                          fieldMappings={fieldMappings}
                          fields={fields}
                          sourceFields={sourceFields}
                          removeMapping={removeMapping}
                          duplicateMapping={(id) => {
                        const mapping = fieldMappings.find(m => m.id === id);
                        if (mapping) {
                          const duplicated = duplicateMapping(mapping);
                          setFieldMappings([...fieldMappings, duplicated]);
                          setSelectedMappingId(duplicated.id);
                        }
                      }}
                          getStatus={getStatus}
                          getSummary={getSummary}
                        >
                          <MappingEditor
                            fields={fields}
                            sourceFields={sourceFields}
                            loadingFields={loadingFields}
                            updateMapping={updateMapping}
                            targetPicklistValues={targetPicklistValues}
                            showTransformationHelpModal={showTransformationHelpModal}
                            setShowTransformationHelpModal={setShowTransformationHelpModal}
                            transformationComponents={transformationComponents}
                          />
                        </CardView>
                      )}
                    </FieldMappingView>
                  )}
                </UpdateConfiguration>

                {/* Action Buttons */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Undo/Redo buttons (only show in mapping mode) */}
                  {updateModeType === UPDATE_MODE_TYPES.MAPPING && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => undoTransformation(setFieldMappings)}
                        disabled={!canUndo || updating || loadingPreview}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: canUndo ? '#f9fafb' : '#f3f4f6',
                          color: canUndo ? '#374151' : '#9ca3af',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: canUndo && !updating && !loadingPreview ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Undo"
                      >
                        <Undo size={16} />
                        Undo
                      </button>
                      <button
                        onClick={() => redoTransformation(setFieldMappings)}
                        disabled={!canRedo || updating || loadingPreview}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          backgroundColor: canRedo ? '#f9fafb' : '#f3f4f6',
                          color: canRedo ? '#374151' : '#9ca3af',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: canRedo && !updating && !loadingPreview ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Redo"
                      >
                        <Redo size={16} />
                        Redo
                      </button>
                    </div>
                  )}
                  
                  {/* Preview and Execute buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                    <button
                      onClick={handlePreview}
                      disabled={loadingPreview || updating}
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        backgroundColor: '#f0f9ff',
                        color: '#0284c7',
                        border: '1px solid #bae6fd',
                        borderRadius: '6px',
                        cursor: loadingPreview || updating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {loadingPreview ? <Loader size={16} className="spinner" /> : <Eye size={16} />}
                      Preview
                    </button>
                    <button
                      onClick={handleExecute}
                      disabled={updating || loadingPreview}
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        backgroundColor: '#08979C',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: updating || loadingPreview ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {updating ? <Loader size={16} className="spinner" /> : <Send size={16} />}
                      {updating ? 'Updating...' : 'Execute Updates'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals - Using extracted components */}
      <ConfirmModal
        show={showConfirmModal}
        message={confirmModalData.message}
        onConfirm={confirmModalData.onConfirm}
        onCancel={confirmModalData.onCancel}
      />
      <PreviewModal
        show={showPreviewModal}
        previewData={previewData}
        loadingPreview={loadingPreview}
        onClose={() => setShowPreviewModal(false)}
      />
      <TemplateModal
        show={showTemplateModal}
        templates={transformationTemplates}
        onApply={handleTemplateApply}
        onClose={() => setShowTemplateModal(false)}
      />
      <SaveSetModal
        show={showSaveSetModal}
        setName={savedSetName}
        setNameValue={setSavedSetName}
        onSave={handleSaveSet}
        onClose={() => setShowSaveSetModal(false)}
      />
      <LoadSetModal
        show={showLoadSetModal}
        savedSets={savedTransformationSets}
        onLoad={handleLoadSet}
        onDelete={handleDeleteSet}
        onClose={() => setShowLoadSetModal(false)}
      />
      <TransformationHelpModal
        show={showTransformationHelpModal}
        onClose={() => setShowTransformationHelpModal(false)}
      />
      <FieldMappingHelpModal
        show={showFieldMappingHelpModal}
        onClose={() => setShowFieldMappingHelpModal(false)}
      />
    </div>
  );
};

export default UpdateObjectFields;

