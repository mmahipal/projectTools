import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { Search, Menu, LogOut, Send, Eye, Loader, X, CheckCircle, XCircle, Info, Plus as PlusIcon, X as XIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import PreviewModal from '../components/PreviewModal';
import ConfirmModal from '../components/ConfirmModal';
import InformationSection from './ProjectSetup/components/InformationSection';
import PeopleSection from './ProjectSetup/components/PeopleSection';
import '../styles/ProjectSetup.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const Clone = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset, trigger, setError, clearErrors } = useForm();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [step, setStep] = useState('objectType'); // 'objectType', 'search', 'edit'
  const [objectTypes, setObjectTypes] = useState([]);
  const [selectedObjectType, setSelectedObjectType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [objectData, setObjectData] = useState(null);
  const [loadingObjectData, setLoadingObjectData] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showNoChangesConfirm, setShowNoChangesConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Project-specific states (same as ProjectSetup)
  const [fieldErrors, setFieldErrors] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [teamMembers, setTeamMembers] = useState([{ member: '', memberId: '', role: '' }]);
  const [teamMemberSearchResults, setTeamMemberSearchResults] = useState({});
  const [loadingTeamMemberSearch, setLoadingTeamMemberSearch] = useState({});
  const teamMemberSearchTimeoutRefs = useRef({});
  const [projectManagerSearchTerm, setProjectManagerSearchTerm] = useState('');
  const [projectManagerSearchResults, setProjectManagerSearchResults] = useState([]);
  const [loadingProjectManagerSearch, setLoadingProjectManagerSearch] = useState(false);
  const [showProjectManagerDropdown, setShowProjectManagerDropdown] = useState(false);
  const projectManagerSearchTimeoutRef = useRef(null);
  
  // People section search states
  const peopleSearchFields = [
    'programManager', 'qualityLead', 'productivityLead', 'reportingLead',
    'invoicingLead', 'projectSupportLead', 'recruitmentLead', 'qualificationLead', 'onboardingLead'
  ];
  const [peopleSearchTerms, setPeopleSearchTerms] = useState({});
  const [peopleSearchResults, setPeopleSearchResults] = useState({});
  const [loadingPeopleSearch, setLoadingPeopleSearch] = useState({});
  const [showPeopleDropdowns, setShowPeopleDropdowns] = useState({});
  const peopleSearchTimeoutRefs = useRef({});
  
  const sections = [
    'Information',
    'Contributor Active Status',
    'People',
    'Project Team',
    'Rates',
    'Funnel Totals',
    'Funnel Stages',
    'Lever Requisition Actions',
    'Lever Requisition Fields',
    'Lever Admin',
    'Payment Configurations',
    'Activation'
  ];

  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load object types and accounts
  useEffect(() => {
    loadObjectTypes();
    if (selectedObjectType === 'project') {
      loadAccounts();
    }
  }, [selectedObjectType]);

  // Watch form data for changes
  useEffect(() => {
    if (objectData && originalFormData) {
      const currentData = watch();
      const hasFormChanges = JSON.stringify(currentData) !== JSON.stringify(originalFormData);
      setHasChanges(hasFormChanges);
    }
  }, [watch(), objectData, originalFormData]);

  const loadObjectTypes = async () => {
    try {
      const response = await apiClient.get('/clone/object-types');
      if (response.data.success) {
        setObjectTypes(response.data.objectTypes);
      }
    } catch (error) {
      toast.error('Failed to load object types');
    }
  };

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await apiClient.get('/salesforce/accounts');
      if (response.data.success) {
        setAccounts(response.data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleObjectTypeSelect = (objectType) => {
    setSelectedObjectType(objectType);
    setStep('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedObject(null);
    setObjectData(null);
    setOriginalFormData(null);
    reset();
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    
    if (!term || term.trim() === '') {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoadingSearch(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.post('/clone/search', {
          objectType: selectedObjectType,
          searchTerm: term
        });
        
        if (response.data.success) {
          setSearchResults(response.data.records);
        }
      } catch (error) {
        toast.error('Failed to search objects');
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
  };

  const handleSelectObject = async (object) => {
    setSelectedObject(object);
    setSearchResults([]);
    setLoadingObjectData(true);
    
    try {
      if (!selectedObjectType) {
        toast.error('Please select an object type first');
        setLoadingObjectData(false);
        return;
      }
      
      if (!object || !object.id) {
        toast.error('Invalid object selected');
        setLoadingObjectData(false);
        return;
      }
      
      console.log('Clone - Loading object data:', { objectType: selectedObjectType, objectId: object.id });
      const response = await apiClient.get(`/clone/object/${selectedObjectType}/${object.id}`);
      
      if (response.data.success) {
        setObjectData(response.data);
        const formData = { ...response.data.formData };
        setOriginalFormData(formData);
        
        // Add "Clone of" prefix ONLY to the main object name field
        // Exclude people names, lookup names, and other non-object-name fields
        const excludeFromPrefix = [
          // People section name fields
          'programManagerName', 'projectManagerName', 'qualityLeadName', 
          'productivityLeadName', 'reportingLeadName', 'invoicingLeadName',
          'projectSupportLeadName', 'recruitmentLeadName', 'qualificationLeadName',
          'onboardingLeadName',
          // Lookup name fields
          'accountName', 'projectName', 'projectObjectiveName', 'contributorName',
          // Other name fields that shouldn't be prefixed
          'projectManager', 'programManager', 'qualityLead', 'productivityLead',
          'reportingLead', 'invoicingLead', 'projectSupportLead', 'recruitmentLead',
          'qualificationLead', 'onboardingLead', 'account', 'project', 'projectObjective', 'contributor'
        ];
        
        // Define object-specific name fields that should get "Clone of" prefix
        const objectNameFields = {
          'project': ['projectName', 'name', 'Name', 'Project_Name__c'],
          'project-objective': ['contributorFacingProjectName', 'name', 'Name', 'Contributor_Facing_Project_Name__c'],
          'project-qualification-step': ['qualificationStep', 'name', 'Name'],
          'project-page': ['name', 'Name'],
          'project-team': ['name', 'Name'],
          'contributor-project': ['contributorProjectName', 'name', 'Name']
        };
        
        // Get the name fields for the current object type
        const nameFieldsToPrefix = objectNameFields[selectedObjectType] || ['name', 'Name'];
        
        // Apply "Clone of" prefix only to the main object name fields
        nameFieldsToPrefix.forEach(fieldName => {
          if (formData[fieldName] && typeof formData[fieldName] === 'string') {
            // Skip if it's in the exclude list or already has the prefix
            if (!excludeFromPrefix.includes(fieldName) && !formData[fieldName].startsWith('Clone of ')) {
              formData[fieldName] = `Clone of ${formData[fieldName]}`;
            }
          }
        });
        
        // Also check for exact matches in formData keys (for Salesforce field names)
        Object.keys(formData).forEach(key => {
          // Only process if it's one of the name fields to prefix and not in exclude list
          if (nameFieldsToPrefix.includes(key) && 
              !excludeFromPrefix.includes(key) &&
              typeof formData[key] === 'string' && 
              formData[key] && 
              !formData[key].startsWith('Clone of ')) {
            formData[key] = `Clone of ${formData[key]}`;
          }
        });
        
        console.log('Clone - Received formData:', Object.keys(formData).length, 'keys');
        console.log('Clone - Sample formData (non-empty):', Object.entries(formData).filter(([k, v]) => v && v !== '').slice(0, 30));
        
        // Populate People section search terms with names
        const peopleFieldMappings = {
          'programManager': 'programManagerName',
          'projectManager': 'projectManagerName',
          'qualityLead': 'qualityLeadName',
          'productivityLead': 'productivityLeadName',
          'reportingLead': 'reportingLeadName',
          'invoicingLead': 'invoicingLeadName',
          'projectSupportLead': 'projectSupportLeadName',
          'recruitmentLead': 'recruitmentLeadName',
          'qualificationLead': 'qualificationLeadName',
          'onboardingLead': 'onboardingLeadName'
        };
        
        // Set People section search terms
        Object.keys(peopleFieldMappings).forEach(fieldName => {
          const nameField = peopleFieldMappings[fieldName];
          if (formData[nameField]) {
            // Set the search term to the name
            if (fieldName === 'projectManager') {
              setProjectManagerSearchTerm(formData[nameField]);
            } else {
              setPeopleSearchTerms(prev => ({ ...prev, [fieldName]: formData[nameField] }));
            }
          }
        });
        
        // Populate form with data (including prefixed names)
        // Ensure ALL field values from the existing object are set
        let populatedCount = 0;
        let emptyCount = 0;
        
        // First, set all non-empty values
        Object.keys(formData).forEach(key => {
          const value = formData[key];
          // Skip name fields (they're used for search terms, not form values)
          if (key.endsWith('Name') && key !== 'projectName' && key !== 'accountName') {
            return;
          }
          
          if (value !== undefined && value !== null && value !== '') {
            try {
              setValue(key, value, { shouldValidate: false, shouldDirty: false });
              populatedCount++;
            } catch (err) {
              console.warn('Clone - Error setting value for', key, ':', err);
            }
          } else if (value === '' || value === null) {
            // Also set empty strings/null to clear any default values
            try {
              setValue(key, '', { shouldValidate: false, shouldDirty: false });
              emptyCount++;
            } catch (err) {
              // Ignore errors for fields that don't exist in form
            }
          }
        });
        
        console.log('Clone - Populated', populatedCount, 'fields with values,', emptyCount, 'fields cleared');
        
        // Force form to update by triggering a re-render
        setTimeout(() => {
          const currentValues = watch();
          const nonEmptyValues = Object.entries(currentValues).filter(([k, v]) => v && v !== '');
          console.log('Clone - Current form values after population:', nonEmptyValues.length, 'non-empty values');
          console.log('Clone - Sample current values:', nonEmptyValues.slice(0, 20));
        }, 200);
        
        // Also populate from objectData.fields if available (for any missing fields)
        if (response.data.fields && Array.isArray(response.data.fields)) {
          response.data.fields.forEach(field => {
            const fieldName = field.name;
            
            // Try multiple naming variations
            const variations = [
              fieldName,
              fieldName.toLowerCase(),
              fieldName.replace(/__c$/, ''),
              fieldName.replace(/__c$/, '').replace(/_/g, ''),
              // CamelCase conversion
              fieldName
                .replace(/__c$/, '')
                .split('_')
                .map((part, index) => {
                  if (index === 0) {
                    return part.charAt(0).toLowerCase() + part.slice(1);
                  }
                  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                })
                .join('')
            ];
            
            // Check if any variation has a value in formData
            let foundValue = null;
            for (const variation of variations) {
              if (formData[variation] !== undefined && formData[variation] !== null && formData[variation] !== '') {
                foundValue = formData[variation];
                break;
              }
            }
            
            // If we found a value, set it for all variations
            if (foundValue !== null) {
              variations.forEach(variation => {
                setValue(variation, foundValue);
              });
            }
          });
        }
        
        // Force a re-render to ensure form values are displayed
        setTimeout(() => {
          const currentValues = watch();
          console.log('Clone - Current form values after population:', Object.entries(currentValues).filter(([k, v]) => v && v !== '').slice(0, 20));
        }, 100);
        
        // Update originalFormData to include prefixed names for change detection
        setOriginalFormData(formData);
        
        // Populate related data (team members, etc.)
        if (response.data.relatedData) {
          if (response.data.relatedData.teamMembers && response.data.relatedData.teamMembers.length > 0) {
            setTeamMembers(response.data.relatedData.teamMembers);
          }
        }
        
        setStep('edit');
        setCurrentSection(0);
      } else {
        // Response was not successful
        const errorMessage = response.data?.error || 'Failed to load object data';
        console.error('Clone - API response error:', response.data);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Clone - Error loading object data:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load object data';
      toast.error(errorMessage);
    } finally {
      setLoadingObjectData(false);
    }
  };

  const handlePublish = async () => {
    if (!hasChanges) {
      setShowNoChangesConfirm(true);
      return;
    }

    await doPublish();
  };

  const doPublish = async () => {
    setPublishing(true);
    try {
      const formData = watch();
      
      // Include team members for Project
      if (selectedObjectType === 'project' && teamMembers.length > 0) {
        formData.teamMembers = teamMembers;
      }
      
      const response = await apiClient.post('/clone/clone', {
        objectType: selectedObjectType,
        formData: formData,
        hasChanges: hasChanges
      });
      
      if (response.data.success) {
        toast.success('Object cloned successfully!');
        // Reset to start
        setStep('objectType');
        setSelectedObjectType('');
        setSearchTerm('');
        setSelectedObject(null);
        setObjectData(null);
        setOriginalFormData(null);
        setHasChanges(false);
        setTeamMembers([{ member: '', memberId: '', role: '' }]);
        reset();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to clone object');
    } finally {
      setPublishing(false);
      setShowNoChangesConfirm(false);
    }
  };

  const getObjectTypeLabel = (value) => {
    const obj = objectTypes.find(t => t.value === value);
    return obj ? obj.label : value;
  };

  // Render Project form (same structure as ProjectSetup)
  // Dynamic form renderer for all non-Project object types
  const renderDynamicForm = () => {
    if (!objectData || !objectData.fields) {
      return (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '6px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Loading form fields...</p>
        </div>
      );
    }

    // Organize fields into sections based on field names
    const organizeFieldsIntoSections = (fields) => {
      const sections = {};
      
      fields.forEach(field => {
        // Skip system and read-only fields
        if (field.calculated || field.autoNumber || (!field.createable && !field.updateable)) {
          return;
        }
        
        // Determine section based on field name patterns
        let sectionName = 'General';
        
        if (field.name.includes('Project_Objective') || field.name.includes('ProjectObjective')) {
          sectionName = 'Project Objective';
        } else if (field.name.includes('Project_Qualification') || field.name.includes('Qualification')) {
          sectionName = 'Qualification';
        } else if (field.name.includes('Project_Page') || field.name.includes('Page')) {
          sectionName = 'Page Configuration';
        } else if (field.name.includes('Project_Team') || field.name.includes('Team')) {
          sectionName = 'Team';
        } else if (field.name.includes('Contributor')) {
          sectionName = 'Contributor';
        } else if (field.name.includes('Status') || field.name.includes('Date')) {
          sectionName = 'Status & Dates';
        } else if (field.name === 'Name' || field.name.includes('Name__c')) {
          sectionName = 'Information';
        }
        
        if (!sections[sectionName]) {
          sections[sectionName] = [];
        }
        sections[sectionName].push(field);
      });
      
      return sections;
    };

    const sections = organizeFieldsIntoSections(objectData.fields);
    const sectionNames = Object.keys(sections);

    // Render a single field based on its type
    const renderField = (field) => {
      const fieldName = field.name;
      const camelCaseName = fieldName
        .replace(/__c$/, '')
        .split('_')
        .map((part, index) => {
          if (index === 0) {
            return part.charAt(0).toLowerCase() + part.slice(1);
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('');
      
      const isRequired = field.required;
      const isReadOnly = field.calculated || field.autoNumber || (!field.createable && !field.updateable);
      
      // Check if it's a lookup/reference field
      const isLookup = field.type === 'reference';
      
      if (isLookup) {
        // For lookup fields, render a searchable input
        return (
          <div key={fieldName} className="form-group" style={{ position: 'relative' }}>
            <label>
              {field.label || fieldName} {isRequired && '*'}
            </label>
            <input
              type="text"
              {...register(camelCaseName, { required: isRequired })}
              readOnly={isReadOnly}
              placeholder="Search..."
              style={{ fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%' }}
            />
            {errors[camelCaseName] && <span className="error">Required</span>}
          </div>
        );
      }
      
      switch (field.type) {
        case 'boolean':
        case 'checkbox':
          return (
            <div key={fieldName} className="form-group">
              <label>
                <input type="checkbox" {...register(camelCaseName)} disabled={isReadOnly} />
                <span>{field.label || fieldName} {isRequired && '*'}</span>
              </label>
            </div>
          );
        
        case 'date':
          return (
            <div key={fieldName} className="form-group">
              <label>
                {field.label || fieldName} {isRequired && '*'}
              </label>
              <input
                type="date"
                {...register(camelCaseName, { required: isRequired })}
                readOnly={isReadOnly}
                style={{ fontSize: '12px', padding: '6px 10px', height: '32px' }}
              />
              {errors[camelCaseName] && <span className="error">Required</span>}
            </div>
          );
        
        case 'datetime':
          return (
            <div key={fieldName} className="form-group">
              <label>
                {field.label || fieldName} {isRequired && '*'}
              </label>
              <input
                type="datetime-local"
                {...register(camelCaseName, { required: isRequired })}
                readOnly={isReadOnly}
                style={{ fontSize: '12px', padding: '6px 10px', height: '32px' }}
              />
              {errors[camelCaseName] && <span className="error">Required</span>}
            </div>
          );
        
        case 'double':
        case 'int':
        case 'currency':
        case 'percent':
          return (
            <div key={fieldName} className="form-group">
              <label>
                {field.label || fieldName} {isRequired && '*'}
              </label>
              <input
                type="number"
                step={field.type === 'double' ? '0.01' : '1'}
                {...register(camelCaseName, { required: isRequired, valueAsNumber: true })}
                readOnly={isReadOnly}
                style={{ fontSize: '12px', padding: '6px 10px', height: '32px' }}
              />
              {errors[camelCaseName] && <span className="error">Required</span>}
            </div>
          );
        
        case 'textarea':
        case 'string':
        default:
          // Check if it's a long text area
          if (field.type === 'textarea' || (field.name && field.name.toLowerCase().includes('description'))) {
            return (
              <div key={fieldName} className="form-group full-width">
                <label>
                  {field.label || fieldName} {isRequired && '*'}
                </label>
                <textarea
                  {...register(camelCaseName, { required: isRequired })}
                  readOnly={isReadOnly}
                  rows="4"
                  style={{ fontSize: '12px', padding: '6px 10px', minHeight: '32px' }}
                />
                {errors[camelCaseName] && <span className="error">Required</span>}
              </div>
            );
          }
          
          return (
            <div key={fieldName} className="form-group">
              <label>
                {field.label || fieldName} {isRequired && '*'}
              </label>
              <input
                type="text"
                {...register(camelCaseName, { required: isRequired })}
                readOnly={isReadOnly}
                style={{ fontSize: '12px', padding: '6px 10px', height: '32px' }}
              />
              {errors[camelCaseName] && <span className="error">Required</span>}
            </div>
          );
      }
    };

    return (
      <div>
        {sectionNames.map((sectionName, index) => (
          <div key={sectionName} className="section-content" style={{ marginBottom: '24px' }}>
            <h2>{sectionName}</h2>
            <div className="form-grid compact-grid">
              {sections[sectionName].map(field => renderField(field))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProjectForm = () => {
    if (selectedObjectType !== 'project') return null;

    return (
      <form onSubmit={handleSubmit(handlePublish)} className="setup-form">
        {/* Render sections directly without tabs */}
        <div className="form-section fade-in">
          <InformationSection 
            register={register} 
            errors={errors} 
            fieldErrors={fieldErrors} 
            watch={watch}
            accounts={accounts}
            loadingAccounts={loadingAccounts}
          />
          <RequirementsSection register={register} errors={errors} />
          <PeopleSection 
            register={register} 
            errors={errors} 
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
            projectManagerSearchTerm={projectManagerSearchTerm}
            setProjectManagerSearchTerm={setProjectManagerSearchTerm}
            projectManagerSearchResults={projectManagerSearchResults}
            setProjectManagerSearchResults={setProjectManagerSearchResults}
            loadingProjectManagerSearch={loadingProjectManagerSearch}
            setLoadingProjectManagerSearch={setLoadingProjectManagerSearch}
            showProjectManagerDropdown={showProjectManagerDropdown}
            setShowProjectManagerDropdown={setShowProjectManagerDropdown}
            setValue={setValue}
            projectManagerSearchTimeoutRef={projectManagerSearchTimeoutRef}
            peopleSearchTerms={peopleSearchTerms}
            setPeopleSearchTerms={setPeopleSearchTerms}
            peopleSearchResults={peopleSearchResults}
            setPeopleSearchResults={setPeopleSearchResults}
            loadingPeopleSearch={loadingPeopleSearch}
            setLoadingPeopleSearch={setLoadingPeopleSearch}
            showPeopleDropdowns={showPeopleDropdowns}
            setShowPeopleDropdowns={setShowPeopleDropdowns}
            peopleSearchTimeoutRefs={peopleSearchTimeoutRefs}
          />
          <ProjectTeamSection 
            teamMembers={teamMembers}
            setTeamMembers={setTeamMembers}
            teamMemberSearchResults={teamMemberSearchResults}
            setTeamMemberSearchResults={setTeamMemberSearchResults}
            loadingTeamMemberSearch={loadingTeamMemberSearch}
            setLoadingTeamMemberSearch={setLoadingTeamMemberSearch}
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
            teamMemberSearchTimeoutRefs={teamMemberSearchTimeoutRefs}
          />
          <RatesSection register={register} />
          <FunnelTotalsSection register={register} />
          <FunnelStagesSection register={register} />
          <LeverRequisitionActionsSection register={register} errors={errors} />
          <LeverRequisitionFieldsSection register={register} />
          <LeverAdminSection register={register} errors={errors} />
          <PaymentConfigurationsSection register={register} errors={errors} watch={watch} setValue={setValue} />
          <ActivationSection register={register} errors={errors} />
        </div>

        <div className="form-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #d8dde6' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                const formData = watch();
                setShowPreviewModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="btn-primary"
              disabled={publishing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {publishing ? (
                <>
                  <Loader size={16} className="spinning" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    );
  };

  // Section components (same as ProjectSetup)
  const RequirementsSection = ({ register, errors }) => (
    <div className="section-content">
      <h2>Contributor Active Status</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            <input type="checkbox" {...register('paymentSetupRequired')} defaultChecked />
            <span>Payment Setup Required</span>
            <Info size={14} className="info-icon" />
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" {...register('manualActivationRequired')} />
            <span>Manual Activation Required</span>
            <Info size={14} className="info-icon" />
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" {...register('clientToolAccountRequired')} />
            <span>Client Tool Account Required</span>
            <Info size={14} className="info-icon" />
          </label>
        </div>
      </div>
    </div>
  );

  const ProjectTeamSection = ({ 
    teamMembers, 
    setTeamMembers, 
    teamMemberSearchResults, 
    setTeamMemberSearchResults,
    loadingTeamMemberSearch,
    setLoadingTeamMemberSearch,
    fieldErrors,
    setFieldErrors,
    teamMemberSearchTimeoutRefs
  }) => {
    const TEAM_MEMBER_ROLES = [
      '--None--',
      'Invoicing Lead',
      'Onboarding Lead',
      'Program Manager',
      'Project Manager',
      'Project Support Lead',
      'Recruitment Lead',
      'Reporting Writer',
      'Tech Lead',
      'Project Lead',
      'Project Team',
      'Productivity Lead'
    ];

    const searchTeamMember = async (searchTerm, index) => {
      if (!searchTerm || searchTerm.trim().length < 3) {
        setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
        return;
      }

      setLoadingTeamMemberSearch(prev => ({ ...prev, [index]: true }));
      try {
        const response = await apiClient.get(`/salesforce/search-people?search=${encodeURIComponent(searchTerm)}`);
        if (response.data.success) {
          const people = response.data.people || [];
          setTeamMemberSearchResults(prev => ({ ...prev, [index]: people }));
        } else {
          setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
        }
      } catch (error) {
        console.error('Error searching team member:', error);
        setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
      } finally {
        setLoadingTeamMemberSearch(prev => ({ ...prev, [index]: false }));
      }
    };

    const handleTeamMemberChange = (index, value) => {
      const updated = [...teamMembers];
      updated[index] = { ...updated[index], member: value, memberId: '' };
      setTeamMembers(updated);
      
      if (fieldErrors[`teamMember_${index}`]) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`teamMember_${index}`];
          return newErrors;
        });
      }
    };

    const handleTeamMemberSelect = (index, person) => {
      const updated = [...teamMembers];
      updated[index] = { ...updated[index], member: person.name || person.email, memberId: person.id };
      setTeamMembers(updated);
      setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
    };

    const handleRoleChange = (index, role) => {
      const updated = [...teamMembers];
      updated[index] = { ...updated[index], role };
      setTeamMembers(updated);
      
      if (fieldErrors[`teamMemberRole_${index}`]) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`teamMemberRole_${index}`];
          return newErrors;
        });
      }
    };

    const addTeamMember = () => {
      setTeamMembers([...teamMembers, { member: '', memberId: '', role: '' }]);
    };

    const removeTeamMember = (index) => {
      if (teamMembers.length > 1) {
        const updated = teamMembers.filter((_, i) => i !== index);
        setTeamMembers(updated);
      }
    };

    return (
      <div className="section-content">
        <h2>Project Team</h2>
        <div className="form-grid compact-grid">
          {teamMembers.map((tm, index) => (
            <React.Fragment key={index}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>
                  * Team Member
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={tm.member}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleTeamMemberChange(index, value);
                      
                      if (teamMemberSearchTimeoutRefs.current[index]) {
                        clearTimeout(teamMemberSearchTimeoutRefs.current[index]);
                      }
                      
                      if (!value || value.trim().length < 3) {
                        setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
                        return;
                      }
                      
                      teamMemberSearchTimeoutRefs.current[index] = setTimeout(() => {
                        searchTeamMember(value.trim(), index);
                      }, 800);
                    }}
                    onFocus={() => {
                      if (teamMemberSearchResults[index] && teamMemberSearchResults[index].length > 0) {
                      } else if (tm.member && tm.member.trim().length >= 3) {
                        searchTeamMember(tm.member.trim(), index);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
                      }, 200);
                    }}
                    placeholder="Search People..."
                    className={fieldErrors[`teamMember_${index}`] || fieldErrors.teamMembers ? 'error-field' : ''}
                    style={{ paddingRight: '36px', fontSize: '12px', padding: '6px 10px', width: '100%', height: '32px' }}
                  />
                  <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                  {(teamMemberSearchResults[index] && teamMemberSearchResults[index].length > 0) || loadingTeamMemberSearch[index] ? (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      marginTop: '4px'
                    }}>
                      {loadingTeamMemberSearch[index] ? (
                        <div style={{ padding: '8px', fontSize: '13px', color: '#666', textAlign: 'center' }}>Searching...</div>
                      ) : teamMemberSearchResults[index] && teamMemberSearchResults[index].length > 0 ? (
                        teamMemberSearchResults[index].map(person => (
                          <div
                            key={person.id}
                            onClick={() => handleTeamMemberSelect(index, person)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              borderBottom: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            {person.name} {person.email ? `(${person.email})` : ''}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '8px', fontSize: '13px', color: '#666', textAlign: 'center' }}>No results found</div>
                      )}
                    </div>
                  ) : null}
                </div>
                {(fieldErrors[`teamMember_${index}`] || fieldErrors.teamMembers) && (
                  <span className="error">Complete this field.</span>
                )}
              </div>
              <div className="form-group">
                <label>
                  * Team Member Role
                </label>
                <select
                  value={tm.role || '--None--'}
                  onChange={(e) => handleRoleChange(index, e.target.value)}
                  className={fieldErrors[`teamMemberRole_${index}`] ? 'error-field' : ''}
                  style={{ fontSize: '12px', padding: '6px 10px', width: '100%', height: '32px' }}
                >
                  {TEAM_MEMBER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {fieldErrors[`teamMemberRole_${index}`] && (
                  <span className="error">Complete this field.</span>
                )}
              </div>
              {index > 0 && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => removeTeamMember(index)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#fff',
                      color: '#ff4d4f',
                      border: '1px solid #ff4d4f',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontFamily: 'Poppins',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <XIcon size={16} />
                    Remove
                  </button>
                </div>
              )}
            </React.Fragment>
          ))}
          <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <button
              type="button"
              onClick={addTeamMember}
              style={{
                padding: '10px 20px',
                backgroundColor: '#08979C',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Poppins',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PlusIcon size={16} />
              Add Team Member
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RatesSection = ({ register }) => (
    <div className="section-content">
      <h2>Rates</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>Project Incentive</label>
          <input {...register('projectIncentive')} readOnly defaultValue="$0.000" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
      </div>
    </div>
  );

  const FunnelTotalsSection = ({ register }) => (
    <div className="section-content">
      <h2>Funnel Totals</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            Total Applied
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('totalApplied')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>
            Total Qualified
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('totalQualified')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
      </div>
    </div>
  );

  const FunnelStagesSection = ({ register }) => (
    <div className="section-content">
      <h2>Funnel Stages</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            # Invited/Available Contributors
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('invitedAvailableContributors')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label># Registered Contributors</label>
          <input {...register('registeredContributors')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>
            # App Received
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('appReceived')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label># Qualified Contributors</label>
          <input {...register('qualifiedContributors')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label># Matched Contributors</label>
          <input {...register('matchedContributors')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label># Active Contributors</label>
          <input {...register('activeContributors')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label># AC Account</label>
          <input {...register('acAccount')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>
            # Production Contributors
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('productionContributors')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label># Applied Contributors</label>
          <input {...register('appliedContributors')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>
            # Removed
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('removed')} readOnly defaultValue="0" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
      </div>
    </div>
  );

  const LeverRequisitionActionsSection = ({ register, errors }) => (
    <div className="section-content">
      <h2>Lever Requisition Actions</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            Requisition Action
            <Info size={14} className="info-icon" />
          </label>
          <select {...register('requisitionAction')}>
            <option value="--None--">--None--</option>
          </select>
        </div>
      </div>
    </div>
  );

  const LeverRequisitionFieldsSection = ({ register }) => (
    <div className="section-content">
      <h2>Lever Requisition Fields</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>Lever Req Name</label>
          <input {...register('leverReqName')} readOnly defaultValue="--" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Requisition Status</label>
          <input {...register('requisitionStatus')} readOnly defaultValue="No Requisition" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Req Code</label>
          <input {...register('leverReqCode')} readOnly defaultValue="-" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Time to Fill Start</label>
          <input {...register('leverTimeToFillStart')} readOnly />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>
            Lever Crowd Hiring Manager Email
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('leverCrowdHiringManagerEmail')} readOnly defaultValue="io" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Time to Fill End</label>
          <input {...register('leverTimeToFillEnd')} readOnly />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Crowd Owner Email</label>
          <input {...register('leverCrowdOwnerEmail')} readOnly defaultValue="mmoola@appen.io" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Req Description</label>
          <input {...register('leverReqDescription')} readOnly />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Compensation Band</label>
          <input {...register('leverCompensationBand')} readOnly defaultValue="20-500 USD /hour" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Location</label>
          <input {...register('leverLocation')} readOnly defaultValue="Remote" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Department</label>
          <input {...register('leverDepartment')} readOnly defaultValue="General Interest" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever Work Type</label>
          <input {...register('leverWorkType')} readOnly defaultValue="Independent Contractor - Project Based" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever SVP</label>
          <input {...register('leverSVP')} readOnly defaultValue="Eric de Cavaignac" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
        <div className="form-group">
          <label>Lever SVP</label>
          <input {...register('leverSVP2')} readOnly defaultValue="Eric de Cavaignac" />
          <p className="field-description">This field is calculated upon save</p>
        </div>
      </div>
    </div>
  );

  const LeverAdminSection = ({ register, errors }) => (
    <div className="section-content">
      <h2>Lever Admin</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            Lever Requisition ID
            <Info size={14} className="info-icon" />
          </label>
          <input {...register('leverRequisitionID')} />
        </div>
        <div className="form-group">
          <label>Lever Requisition Create Date</label>
          <input type="date" {...register('leverRequisitionCreateDate')} />
        </div>
      </div>
    </div>
  );

  const PaymentConfigurationsSection = ({ register, errors, watch, setValue }) => {
    const paymentMethod = watch('projectPaymentMethod');
    
    return (
      <div className="section-content">
        <h2>Payment Configurations</h2>
        <div className="form-grid compact-grid">
          <div className="form-group">
            <label>
              Project Payment Method *
              <Info size={14} className="info-icon" />
            </label>
            <select {...register('projectPaymentMethod', { required: true })} className={errors.projectPaymentMethod ? 'error-field' : ''}>
              <option value="">--None--</option>
              <option value="Self-Reported only">Self-Reported only</option>
              <option value="Productivity only">Productivity only</option>
            </select>
            {errors.projectPaymentMethod && <span className="error">Required</span>}
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" {...register('requirePMApprovalForProductivity')} 
                checked={paymentMethod === 'Self-Reported only'} 
                disabled={!paymentMethod || paymentMethod === 'Productivity only'}
              />
              <span>Require PM Approval for Productivity</span>
              <Info size={14} className="info-icon" />
            </label>
          </div>
        </div>
      </div>
    );
  };

  const ActivationSection = ({ register, errors }) => (
    <div className="section-content">
      <h2>Activation</h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            Activation Email Template
            <Info size={14} className="info-icon" />
          </label>
          <select {...register('activationEmailTemplate')}>
            <option value="--None--">--None--</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="project-setup" style={{ marginLeft: `${sidebarWidth}px`, transition: 'margin-left 0.3s ease, width 0.3s ease', width: `calc(100% - ${sidebarWidth}px)` }}>
        <div className="setup-container">
          <div className="setup-header">
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
                  <h1 className="page-title">Clone</h1>
                  <p className="page-subtitle">
                    {step === 'edit' ? 'Edit cloned object and publish to create a new record' : 'Clone Salesforce objects'}
                  </p>
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

          <div>
          {step === 'objectType' && (
            <div>
              <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>Select Object Type to Clone</h2>
              <div style={{ maxWidth: '400px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Object Type *
                </label>
                <select
                  value={selectedObjectType}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleObjectTypeSelect(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select Object Type --</option>
                  {objectTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 'search' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button
                  onClick={() => {
                    setStep('objectType');
                    setSelectedObjectType('');
                    setSearchTerm('');
                    setSearchResults([]);
                    setSelectedObject(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                  Search {getObjectTypeLabel(selectedObjectType)}
                </h2>
              </div>
              
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={`Search ${getObjectTypeLabel(selectedObjectType)} by name...`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: loadingSearch ? '40px' : '16px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {loadingSearch && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader size={16} className="spinning" />
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div style={{
                  border: '1px solid #d8dde6',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleSelectObject(result)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                      {result.name}
                    </div>
                  ))}
                </div>
              )}

              {loadingObjectData && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader size={24} className="spinning" />
                  <p style={{ marginTop: '16px', color: '#666' }}>Loading object data...</p>
                </div>
              )}
            </div>
          )}

          {step === 'edit' && objectData && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button
                  onClick={() => {
                    setStep('search');
                    setSelectedObject(null);
                    setObjectData(null);
                    setOriginalFormData(null);
                    setHasChanges(false);
                    setTeamMembers([{ member: '', memberId: '', role: '' }]);
                    reset();
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                  Create {getObjectTypeLabel(selectedObjectType)}: Clone of {selectedObject?.name}
                </h2>
              </div>

              {selectedObjectType === 'project' && renderProjectForm()}
              
              {selectedObjectType !== 'project' && renderDynamicForm()}
            </div>
          )}
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          objectType={selectedObjectType}
          formData={watch()}
          objectLabel={getObjectTypeLabel(selectedObjectType)}
          onEdit={() => {
            setShowPreviewModal(false);
          }}
        />
      )}

      <ConfirmModal
        show={showNoChangesConfirm}
        message="No changes have been made to the object. The object will be cloned without any modifications. Do you want to proceed?"
        onConfirm={doPublish}
        onCancel={() => setShowNoChangesConfirm(false)}
        confirmText="Yes, Clone"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};

export default Clone;
