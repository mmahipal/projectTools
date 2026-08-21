import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { saveDraftProject, loadDraftProject, deleteDraftProject } from '../utils/draftStorage';
import { getErrorMessage, handleError } from '../utils/errorHandler';
import { sanitizeObject } from '../utils/security';
import { Upload, FileText, FileJson, FileSpreadsheet, Loader, Search, Info, Menu, LogOut, Send, Plus, X as XIcon, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import PreviewModal from '../components/PreviewModal';
import BookmarkButton from '../components/BookmarkButton';
import '../styles/ProjectSetup.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';
import InformationSection from './ProjectSetup/components/InformationSection';
import PeopleSection from './ProjectSetup/components/PeopleSection';

const ProjectSetup = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger, setError, clearErrors, reset } = useForm();
  const [inputMethod, setInputMethod] = useState('direct');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishResultsModal, setShowPublishResultsModal] = useState(false);
  const [publishResults, setPublishResults] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loadingProjectManagers, setLoadingProjectManagers] = useState(false);
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
  const dataLoadedRef = useRef(false);
  const toastShownRef = useRef(false);

  // State for all People section search fields
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

  const populateForm = (data) => {
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        setValue(key, data[key]);
      }
    });
  };

  useEffect(() => {
    // Load existing project data from server storage (for editing)
    const loadExistingData = async () => {
      // Prevent duplicate loading in React StrictMode
      if (dataLoadedRef.current) return;
      
      try {
        const projectData = await loadDraftProject();
        if (projectData) {
          dataLoadedRef.current = true;
          // Populate form with existing project data
          populateForm(projectData);
          // Load team members if they exist
          if (projectData.teamMembers && Array.isArray(projectData.teamMembers) && projectData.teamMembers.length > 0) {
            setTeamMembers(projectData.teamMembers);
          }
          
          // Load project manager name if it exists
          if (projectData.projectManagerName) {
            setProjectManagerSearchTerm(projectData.projectManagerName);
            setValue('projectManagerName', projectData.projectManagerName);
          }
          
          // Prevent duplicate toast notifications
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.success('Project data loaded for editing');
          }
        } else {
          // Clear form and set default values for new project
          reset();
          setDefaultValues();
        }
      } catch (error) {
        const errorMessage = handleError(error, 'ProjectSetup - loadProjectData');
        toast.error(errorMessage);
        // Reset form to defaults
        reset();
        setDefaultValues();
      }
    };
    
    loadExistingData();
  }, [setValue, reset]);

  // Fetch project managers from Salesforce
  useEffect(() => {
    const fetchProjectManagers = async () => {
      setLoadingProjectManagers(true);
      try {
        const response = await apiClient.get('/salesforce/project-managers');
        if (response.data.success) {
          const managers = response.data.projectManagers || [];
          console.log('Fetched project managers:', managers.length);
          setProjectManagers(managers);
        } else {
          console.warn('Project managers fetch returned success=false:', response.data);
        }
      } catch (error) {
        handleError(error, 'ProjectSetup - fetchProjectManagers');
        // Don't show error toast - just log it, as this is optional
      } finally {
        setLoadingProjectManagers(false);
      }
    };
    fetchProjectManagers();
  }, []);

  // Fetch accounts from Salesforce
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const response = await apiClient.get('/salesforce/accounts');
        if (response.data.success) {
          setAccounts(response.data.accounts || []);
        }
      } catch (error) {
        handleError(error, 'ProjectSetup - fetchAccounts');
        // Don't show error toast - just log it, as this is optional
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const setDefaultValues = () => {
    // Set default values for dropdowns and other fields
    setValue('paymentSetupRequired', true);
    setValue('projectIncentive', '0.000');
    setValue('totalApplied', '0');
    setValue('totalQualified', '0');
    // Set default values for dropdowns (empty strings for most, specific defaults for some)
    setValue('projectStatus', 'Draft');
    setValue('projectType', '');
    setValue('projectPriority', 50.0);
  };

  const handleFileUpload = async (file, type) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = type === 'json' ? '/upload/json' : '/upload/csv';
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setParsedData(response.data.data);
      populateForm(response.data.data);
      toast.success(`${type.toUpperCase()} file parsed successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error parsing file');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/parse/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setParsedData(response.data.extractedData);
      populateForm(response.data.extractedData);
      toast.success(`Document parsed with ${(response.data.confidence * 100).toFixed(0)}% confidence!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error parsing document');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    // Get all form values including unregistered fields
    const allFormData = watch();
    
    // Load existing project data from server storage (for editing)
    let existingId = null;
    try {
      const existingProjectData = await loadDraftProject();
      if (existingProjectData && existingProjectData.id) {
        existingId = existingProjectData.id;
      }
    } catch (error) {
      handleError(error, 'ProjectSetup - loadExistingProjectData');
    }
    
    // Merge form data with submitted data to ensure all fields are captured
    const completeData = {
      ...allFormData,
      ...data
    };
    
    // Include ALL form data - only skip undefined values
    // This ensures all fields are captured, including empty strings, null, etc.
    const cleanedData = {};
    Object.keys(completeData).forEach(key => {
      const value = completeData[key];
      // Only skip undefined - include everything else
      if (value !== undefined) {
        // For strings, trim whitespace but keep even empty strings
        if (typeof value === 'string') {
          cleanedData[key] = value.trim();
        }
        // For all other types, keep as is
        else {
          cleanedData[key] = value;
        }
      }
    });
    
    // Preserve the project ID if this is an edit
    if (existingId) {
      cleanedData.id = existingId;
    }
    
    // Include team members in the data (all of them) - ensure they have both name and ID
    cleanedData.teamMembers = teamMembers.map(tm => ({
      member: tm.member || '', // Name
      memberId: tm.memberId || '', // ID
      role: tm.role || '--None--'
    }));
    
    // Ensure projectManager ID is included from form data
    if (allFormData.projectManager !== undefined) {
      cleanedData.projectManager = allFormData.projectManager;
    }
    
    // Ensure projectManagerName is included for reference
    if (allFormData.projectManagerName !== undefined) {
      cleanedData.projectManagerName = allFormData.projectManagerName;
    } else if (projectManagerSearchTerm) {
      // If name wasn't stored but we have the search term, use it
      cleanedData.projectManagerName = projectManagerSearchTerm;
    }
    
    // Include all People section fields explicitly to ensure they're captured
    const peopleFields = [
      'programManager', 'qualityLead', 'productivityLead', 'reportingLead',
      'invoicingLead', 'projectSupportLead', 'recruitmentLead', 
      'qualificationLead', 'onboardingLead'
    ];
    
    peopleFields.forEach(field => {
      if (allFormData[field] !== undefined) {
        cleanedData[field] = allFormData[field];
      }
    });
    
    // Log the data being saved (for debugging)
    console.log('Saving project data:', {
      isEdit: !!existingId,
      projectId: existingId,
      totalFields: Object.keys(cleanedData).length,
      fields: Object.keys(cleanedData),
      projectManager: cleanedData.projectManager,
      teamMembersCount: cleanedData.teamMembers ? cleanedData.teamMembers.length : 0,
      teamMembers: cleanedData.teamMembers
    });
    
    // Store in server-side persistent storage
    try {
      await saveDraftProject(cleanedData);
      navigate('/confirmation');
    } catch (error) {
      const errorMessage = handleError(error, 'ProjectSetup - saveProjectData');
      toast.error(errorMessage);
    }
  };

  // Simple Save handler - completely reimplemented from scratch
  const handleSaveProject = async () => {
    // Validate current section first
    const isValid = await validateCurrentSection();
    if (!isValid) {
      return;
    }

    setSaving(true);
    try {
      // Get all form data
      const allFormData = watch();
      
      // Check for existing project
      let existingId = null;
      try {
        const existingDraft = await loadDraftProject();
        if (existingDraft?.id) {
          existingId = existingDraft.id;
        }
      } catch (err) {
        // No existing draft - that's fine
      }
      
      // Prepare project data - simple and clean
      // Only include defined values to avoid sending undefined
      const projectData = {};
      Object.keys(allFormData).forEach(key => {
        if (allFormData[key] !== undefined) {
          projectData[key] = allFormData[key];
        }
      });
      
      // Include team members with name and ID
      projectData.teamMembers = teamMembers
        .map(tm => ({
          member: tm.member || '',
          memberId: tm.memberId || '',
          role: tm.role || '--None--'
        }))
        .filter(tm => tm.member && tm.memberId);
      
      // Include project manager name
      if (allFormData.projectManagerName) {
        projectData.projectManagerName = allFormData.projectManagerName;
      } else if (projectManagerSearchTerm) {
        projectData.projectManagerName = projectManagerSearchTerm;
      }
      
      // Sanitize data before sending to server
      const sanitizedProjectData = sanitizeObject(projectData);
      
      // Save to server - simple POST or PUT
      let response;
      if (existingId) {
        response = await apiClient.put(`/projects/${existingId}`, sanitizedProjectData);
      } else {
        response = await apiClient.post('/projects', sanitizedProjectData);
      }
      
      // Save to drafts for editing
      const projectId = response.data?.id || existingId;
      if (projectId) {
        await saveDraftProject({ ...projectData, id: projectId });
      }
      
      toast.success('Project saved successfully!');
    } catch (error) {
      const errorMessage = handleError(error, 'ProjectSetup - saveDraft');
      toast.error(errorMessage);
      
      if (error.response) {
        // Server responded with an error - already handled by handleError
      } else {
        // Network error - server not reachable
        toast.error('Cannot connect to server. Please ensure the server is running on port 5000.');
      }
    } finally {
      setSaving(false);
    }
  };

  const validateCurrentSection = async () => {
    const fields = getRequiredFieldsForSection(currentSection);
    const values = watch();
    const newFieldErrors = {};
    let hasErrors = false;
    
    // Special validation for Project Team section
    if (currentSection === 3) {
      // Validate team members
      const validTeamMembers = teamMembers.filter(tm => tm.member && tm.member.trim() !== '' && tm.role && tm.role !== '--None--');
      if (validTeamMembers.length === 0) {
        newFieldErrors.teamMembers = 'At least one team member with a role is required';
        hasErrors = true;
      } else {
        // Validate each team member
        teamMembers.forEach((tm, index) => {
          if (tm.member && tm.member.trim() !== '') {
            if (!tm.role || tm.role === '--None--') {
              newFieldErrors[`teamMemberRole_${index}`] = 'Team Member Role is required';
              hasErrors = true;
            }
          }
        });
      }
    }
    
    // Validate all required fields and highlight errors
    for (const field of fields) {
      if (!values[field] || (typeof values[field] === 'string' && values[field].trim() === '')) {
        newFieldErrors[field] = 'This field is required';
        hasErrors = true;
      } else if (field.toLowerCase().includes('email')) {
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values[field])) {
          newFieldErrors[field] = 'Invalid email format';
          hasErrors = true;
        }
      }
    }
    
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      toast.error(`Please fill in all required fields in ${sections[currentSection]}`);
      return false;
    }
    
    setFieldErrors({});
    return true;
  };

  const getRequiredFieldsForSection = (sectionIndex) => {
    const requiredFields = {
      0: ['projectName', 'shortProjectName', 'contributorProjectName', 'appenPartner', 'projectType', 'projectPriority', 'account', 'hireStartDate', 'predictedCloseDate', 'projectStatus'],
      1: [], // Requirements - no required fields
      2: ['projectManager'], // People - Project Manager is required
      3: [], // Project Team - validate team members array
      4: [], // Rates - read-only
      5: [], // Funnel Totals - read-only
      6: [], // Funnel Stages - read-only
      7: [], // Lever Requisition Actions - optional
      8: [], // Lever Requisition Fields - read-only
      9: [], // Lever Admin - optional
      10: ['projectPaymentMethod'], // Payment Configurations
      11: [] // Activation - optional
    };
    return requiredFields[sectionIndex] || [];
  };

  const nextSection = async () => {
    const isValid = await validateCurrentSection();
    if (!isValid) {
      return;
    }
    
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="project-setup" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.3s ease, width 0.3s ease' }}>
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
                  <h1 className="page-title">New Project</h1>
                  <p className="page-subtitle">Create a new project by entering information directly or attaching a file</p>
                </div>
              </div>
              <div className="header-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookmarkButton pageName="New Project" pageType="page" />
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

        {inputMethod === 'direct' && currentSection === 0 && (
          <div className="method-selection fade-in">
            <div className="method-selection-inline">
              <label className="method-label">Select Input Method:</label>
              <div className="method-options-inline">
                <button
                  className="method-card-inline active"
                  onClick={() => setInputMethod('direct')}
                >
                  <FileText size={16} />
                  <span>Direct Input</span>
                </button>
                <label className="method-card-inline">
                  <Upload size={16} />
                  <span>Attach File</span>
                  <input
                    type="file"
                    accept=".doc,.docx,.csv,.xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleDocumentUpload(file);
                        setInputMethod('direct');
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <Loader className="spinner" size={48} />
            <p>Processing...</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="setup-form">
          <div className="section-progress">
            {sections.map((section, index) => (
              <div
                key={index}
                className={`progress-item ${index === currentSection ? 'active' : ''} ${index < currentSection ? 'completed' : ''}`}
                onClick={async () => {
                  // If clicking on a section ahead of current, validate current section first
                  if (index > currentSection) {
                    const isValid = await validateCurrentSection();
                    if (!isValid) {
                      toast.error('Please fill in all required fields in the current section before proceeding');
                      return;
                    }
                  }
                  setCurrentSection(index);
                  window.scrollTo(0, 0);
                }}
              >
                <span className="progress-number">{index + 1}</span>
                <span className="progress-label">{section}</span>
              </div>
            ))}
          </div>

          <div className="form-section fade-in">
            {currentSection === 0 && (
              <InformationSection 
                register={register} 
                errors={errors} 
                fieldErrors={fieldErrors} 
                watch={watch}
                accounts={accounts}
                loadingAccounts={loadingAccounts}
              />
            )}
            {currentSection === 1 && (
              <RequirementsSection register={register} errors={errors} />
            )}
            {currentSection === 2 && (
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
            )}
            {currentSection === 3 && (
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
            )}
            {currentSection === 4 && (
              <RatesSection register={register} />
            )}
            {currentSection === 5 && (
              <FunnelTotalsSection register={register} />
            )}
            {currentSection === 6 && (
              <FunnelStagesSection register={register} />
            )}
            {currentSection === 7 && (
              <LeverRequisitionActionsSection register={register} errors={errors} />
            )}
            {currentSection === 8 && (
              <LeverRequisitionFieldsSection register={register} />
            )}
            {currentSection === 9 && (
              <LeverAdminSection register={register} errors={errors} />
            )}
            {currentSection === 10 && (
              <PaymentConfigurationsSection register={register} errors={errors} watch={watch} setValue={setValue} />
            )}
            {currentSection === 11 && (
              <ActivationSection register={register} errors={errors} />
            )}
          </div>

          <div className="form-actions">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
              <button
                type="button"
                onClick={prevSection}
                disabled={currentSection === 0}
                className="btn-secondary"
              >
                Previous
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleSaveProject}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              {currentSection === sections.length - 1 ? (
                <>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      const allFormData = watch();
                      setShowPreviewModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                </>
              ) : null}
              {currentSection === sections.length - 1 ? (
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={async (e) => {
                    e.preventDefault();
                    const isValid = await validateCurrentSection();
                    if (!isValid) {
                      return;
                    }

                    setPublishing(true);
                    try {
                      const allFormData = watch();
                      // Include ALL form data - only skip undefined values
                      const cleanedProjectData = {};
                      Object.keys(allFormData).forEach(key => {
                        const value = allFormData[key];
                        // Include all values except undefined
                        if (value !== undefined) {
                          if (typeof value === 'string') {
                            cleanedProjectData[key] = value.trim();
                          } else {
                            cleanedProjectData[key] = value;
                          }
                        }
                      });
                      
                      // Include team members - filter out empty ones and ensure they have memberId
                      // CRITICAL: Only include valid team members with both name and ID
                      cleanedProjectData.teamMembers = teamMembers
                        .filter(tm => 
                          tm && 
                          tm.member && tm.member.trim() !== '' && 
                          tm.memberId && tm.memberId.trim() !== '' &&
                          tm.role && tm.role !== '--None--'
                        )
                        .map(tm => ({
                          member: tm.member.trim(),
                          memberId: tm.memberId.trim(),
                          role: tm.role
                        }));
                      
                      console.log('Team Members being sent to Salesforce:', {
                        total: teamMembers.length,
                        valid: cleanedProjectData.teamMembers.length,
                        validMembers: cleanedProjectData.teamMembers.map(tm => ({
                          member: tm.member,
                          memberId: tm.memberId ? `${tm.memberId.substring(0, 10)}...` : 'MISSING',
                          role: tm.role
                        }))
                      });
                      
                      // Include projectManager explicitly
                      if (allFormData.projectManager) {
                        cleanedProjectData.projectManager = allFormData.projectManager;
                      }
                      
                      // Include all People section fields
                      const peopleFields = [
                        'programManager', 'qualityLead', 'productivityLead', 'reportingLead',
                        'invoicingLead', 'projectSupportLead', 'recruitmentLead', 
                        'qualificationLead', 'onboardingLead'
                      ];
                      peopleFields.forEach(field => {
                        if (allFormData[field] !== undefined) {
                          cleanedProjectData[field] = allFormData[field];
                        }
                      });
                      
                      // Ensure required fields have defaults if missing
                      if (!cleanedProjectData.contributorProjectName || cleanedProjectData.contributorProjectName.trim() === '') {
                        cleanedProjectData.contributorProjectName = cleanedProjectData.projectName || 'New Project';
                      }
                      
                      console.log('Publishing from ProjectSetup - All fields:', {
                        totalFields: Object.keys(cleanedProjectData).length,
                        fields: Object.keys(cleanedProjectData),
                        projectManager: cleanedProjectData.projectManager,
                        teamMembersCount: cleanedProjectData.teamMembers ? cleanedProjectData.teamMembers.length : 0
                      });
                      
                      // Call Salesforce API
                      const response = await apiClient.post('/salesforce/create-project', cleanedProjectData, {
                        timeout: 300000
                      });
                      
                      if (response.data.success) {
                        const projectName = response.data.objectName || cleanedProjectData.projectName || cleanedProjectData.name || 'Project';
                        const teamMembers = response.data.teamMembers || [];
                        
                        // Collect team member results
                        const created = teamMembers.filter(tm => tm.status === 'created').length;
                        const errors = teamMembers.filter(tm => tm.status === 'error').length;
                        const skipped = teamMembers.filter(tm => tm.status === 'skipped').length;
                        
                        // Show success modal
                        setPublishResults({
                          published: [{
                            type: 'Project',
                            name: projectName,
                            id: response.data.salesforceId,
                            teamMembers: teamMembers.length > 0 ? {
                              created,
                              errors,
                              skipped,
                              details: teamMembers
                            } : null
                          }],
                          failed: []
                        });
                        setShowPublishResultsModal(true);
                        
                        await deleteDraftProject();
                      } else {
                        // Show error modal
                        setPublishResults({
                          published: [],
                          failed: [{
                            type: 'Project',
                            name: cleanedProjectData.projectName || cleanedProjectData.name || 'Project',
                            error: getErrorMessage(response.data)
                          }]
                        });
                        setShowPublishResultsModal(true);
                      }
                    } catch (error) {
                      const errorMessage = handleError(error, 'ProjectSetup - publishProject');
                      toast.error(errorMessage);
                    } finally {
                      setPublishing(false);
                    }
                  }}
                  disabled={publishing}
                  style={{ marginLeft: 'auto' }}
                >
                  <Send size={16} style={{ marginRight: '8px' }} />
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={nextSection} 
                  className="btn-primary"
                  style={{ marginLeft: 'auto' }}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </form>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        objectType="project"
        formData={watch()}
        objectLabel="Project"
        onEdit={() => {
          setShowPreviewModal(false);
          // Form is already in edit mode, just close preview to return to form
        }}
        onClone={(clonedData) => {
          // Populate form with cloned data
          Object.keys(clonedData).forEach(key => {
            if (clonedData[key] !== undefined && clonedData[key] !== null) {
              setValue(key, clonedData[key]);
            }
          });
        }}
      />

      {/* Publish Results Modal */}
      {showPublishResultsModal && publishResults && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '12px',
            boxSizing: 'border-box'
          }}
          onClick={() => setShowPublishResultsModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              boxSizing: 'border-box',
              color: '#002329',
              fontFamily: 'Poppins',
              fontSize: '14px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              borderBottom: '1px solid #e2e8f0',
              flexShrink: 0
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {publishResults.failed.length > 0 ? (
                  <XCircle size={24} color="#ef4444" />
                ) : (
                  <CheckCircle size={24} color="#10b981" />
                )}
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#002329',
                  fontFamily: 'Poppins'
                }}>
                  Publish Results
                </h2>
              </div>
              <button
                onClick={() => setShowPublishResultsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <XIcon size={20} color="#64748b" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Published Objects */}
              {publishResults.published.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={18} />
                    Published Successfully ({publishResults.published.length})
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {publishResults.published.map((obj, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          fontWeight: 600,
                          color: '#002329',
                          marginBottom: '8px'
                        }}>
                          {obj.type}: "{obj.name}"
                        </div>
                        {obj.teamMembers && (
                          <div style={{
                            marginTop: '8px',
                            fontSize: '13px',
                            color: '#64748b'
                          }}>
                            {obj.teamMembers.created > 0 && (
                              <div style={{ marginBottom: '4px' }}>
                                ✓ {obj.teamMembers.created} team member(s) created
                              </div>
                            )}
                            {obj.teamMembers.errors > 0 && (
                              <div style={{ marginBottom: '4px', color: '#ef4444' }}>
                                ✗ {obj.teamMembers.errors} team member(s) failed
                              </div>
                            )}
                            {obj.teamMembers.skipped > 0 && (
                              <div style={{ marginBottom: '4px', color: '#f59e0b' }}>
                                ⚠ {obj.teamMembers.skipped} team member(s) skipped
                              </div>
                            )}
                            {obj.teamMembers.warning && (
                              <div style={{ marginBottom: '4px', color: '#f59e0b' }}>
                                ⚠ {obj.teamMembers.warning}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Objects */}
              {publishResults.failed.length > 0 && (
                <div>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <XCircle size={18} />
                    Failed to Publish ({publishResults.failed.length})
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {publishResults.failed.map((obj, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          fontWeight: 600,
                          color: '#002329',
                          marginBottom: '8px'
                        }}>
                          {obj.type}: "{obj.name}"
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#ef4444',
                          marginTop: '8px'
                        }}>
                          Error: {obj.error}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0
            }}>
              <button
                onClick={() => {
                  setShowPublishResultsModal(false);
                  if (publishResults.failed.length === 0) {
                    setTimeout(() => {
                      navigate('/dashboard');
                    }, 500);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#08979C',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#067a7f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#08979C'}
              >
                {publishResults.failed.length === 0 ? 'Continue' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Section components
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
      handleError(error, 'ProjectSetup - searchTeamMember');
      setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
      
      // Show user-friendly error message for different types of 401 errors
      if (error.response?.status === 401 && error.response?.data) {
        const errorMessage = error.response.data.error || error.response.data.message || '';
        // Check if it's a JWT authentication error
        if (errorMessage.includes('No token provided') || 
            errorMessage.includes('Invalid token') || 
            errorMessage.includes('session has expired') ||
            errorMessage.includes('Authentication required')) {
          toast.error('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } 
        // Check if it's a Salesforce credential error
        else if (errorMessage.includes('Invalid Salesforce credentials') || 
                 errorMessage.includes('Salesforce settings') ||
                 errorMessage.includes('Failed to connect to Salesforce')) {
          toast.error('Invalid Salesforce credentials. Please check your Salesforce settings.');
        }
        // Generic 401 error
        else {
          toast.error('Authentication failed. Please log in again.');
        }
      }
    } finally {
      setLoadingTeamMemberSearch(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleTeamMemberChange = (index, value) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], member: value, memberId: '' };
    setTeamMembers(updated);
    
    // Clear errors for this field
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
    
    // Clear errors for this field
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
                    
                    // Clear previous timeout for this index
                    if (teamMemberSearchTimeoutRefs.current[index]) {
                      clearTimeout(teamMemberSearchTimeoutRefs.current[index]);
                    }
                    
                    // Clear results if search term is too short
                    if (!value || value.trim().length < 3) {
                      setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
                      return;
                    }
                    
                    // Debounce search - wait 800ms after user stops typing
                    teamMemberSearchTimeoutRefs.current[index] = setTimeout(() => {
                      searchTeamMember(value.trim(), index);
                    }, 800);
                  }}
                  onFocus={() => {
                    // Show dropdown if there are existing results
                    if (teamMemberSearchResults[index] && teamMemberSearchResults[index].length > 0) {
                      // Dropdown will show automatically
                    } else if (tm.member && tm.member.trim().length >= 3) {
                      // If there's a search term but no results, search again
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
            <Plus size={16} />
            Add Team Member
          </button>
        </div>
      </div>
      <div className="section-content" style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#002329' }}>System Information</h3>
        <div className="form-grid compact-grid">
          <div className="form-group">
            <label>Created By</label>
            <input type="text" readOnly value="" style={{ fontSize: '12px', padding: '6px 10px', height: '32px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div className="form-group">
            <label>Last Modified By</label>
            <input type="text" readOnly value="" style={{ fontSize: '12px', padding: '6px 10px', height: '32px', backgroundColor: '#f0f0f0' }} />
          </div>
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
        <div className="form-group">
          <label>
            Release System Tracked Data
            <Info size={14} className="info-icon" />
          </label>
          <select {...register('releaseSystemTrackedData')}>
            <option value="Hold">Hold</option>
            <option value="Release">Release</option>
          </select>
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
          <input type="checkbox" {...register('activateCommsInvited')} />
          <span>Activate Comms Invited</span>
          <Info size={14} className="info-icon" />
        </label>
      </div>
      <div className="form-group">
        <label>
          <input type="checkbox" {...register('activateCommsApplied')} />
          Activate Comms Applied
        </label>
      </div>
      <div className="form-group">
        <label>
          <input type="checkbox" {...register('activateCommsOnboarding')} />
          Activate Comms Onboarding
        </label>
      </div>
      <div className="form-group">
        <label>
          <input type="checkbox" {...register('activateCommsFailed')} />
          Activate Comms Failed
        </label>
      </div>
    </div>
  </div>
);

export default ProjectSetup;
