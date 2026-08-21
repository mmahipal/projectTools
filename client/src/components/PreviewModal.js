import React, { useState, useEffect } from 'react';
import { Loader, ChevronDown } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import '../styles/PreviewModal.css';

const PreviewModal = ({ isOpen, onClose, objectType, formData, objectLabel: propObjectLabel, onClone, onEdit }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('Details');
  // const [showCloneMenu, setShowCloneMenu] = useState(false); // Unused - kept for potential future use
  const setShowCloneMenu = () => {}; // Placeholder to prevent errors

  useEffect(() => {
    if (isOpen && formData) {
      fetchPreview();
      // Will expand all sections when preview data is loaded
      setExpandedSections({});
    } else {
      setPreviewData(null);
      setError(null);
      setExpandedSections({});
      setShowCloneMenu(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData, objectType]); // fetchPreview is stable and doesn't need to be in deps

  // Expand all sections when preview data is loaded
  useEffect(() => {
    if (previewData && previewData.fields) {
      const tabsData = groupFieldsByTabs();
      const allSectionNames = new Set();
      Object.values(tabsData).forEach(tabSections => {
        Object.keys(tabSections).forEach(sectionName => {
          allSectionNames.add(sectionName);
        });
      });
      
      // Set all sections to expanded by default
      const newExpandedSections = {};
      allSectionNames.forEach(sectionName => {
        newExpandedSections[sectionName] = true;
      });
      setExpandedSections(newExpandedSections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewData]); // groupFieldsByTabs is stable and doesn't need to be in deps

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/salesforce/preview-object', {
        objectType: objectType,
        formData: formData
      });

      if (response.data.success) {
        setPreviewData(response.data);
      } else {
        setError(response.data.error || 'Failed to fetch preview');
        toast.error(response.data.error || 'Failed to fetch preview');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch preview';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // const handleClone = () => { // Unused - kept for potential future use
  //   if (onClone && formData) {
  //     // Create a copy of form data with cleared ID fields
  //     const clonedData = { ...formData };
  //     // Remove ID fields that shouldn't be cloned
  //     delete clonedData.id;
  //     delete clonedData.salesforceId;
  //     delete clonedData.createdDate;
  //     delete clonedData.lastModifiedDate;
  //     
  //     // Clear name fields to allow new names
  //     if (clonedData.name) clonedData.name = '';
  //     if (clonedData.projectName) clonedData.projectName = '';
  //     if (clonedData.Name) clonedData.Name = '';
  //     
  //     onClone(clonedData);
  //     toast.success('Form data cloned. You can now edit and save as a new record.');
  //     onClose();
  //   } else {
  //     // Fallback: copy to clipboard
  //     navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
  //     toast.success('Form data copied to clipboard');
  //   }
  //   setShowCloneMenu(false);
  // };

  // Define actual required fields per object type (matching form validation)
  const getRequiredFieldsForObject = (objType) => {
    const objTypeLower = (objType || '').toLowerCase();
    
    if (objTypeLower === 'project') {
      // Required fields from ProjectSetup form validation
      return new Set([
        'Project_Name__c', 'projectName',
        'Short_Project_Name__c', 'shortProjectName',
        'Contributor_Project_Name__c', 'contributorProjectName',
        'Appen_Partner__c', 'appenPartner',
        'Project_Type__c', 'projectType',
        'Project_Priority__c', 'projectPriority',
        'Account__c', 'account',
        'Hire_Start_Date__c', 'hireStartDate',
        'Predicted_Close_Date__c', 'predictedCloseDate',
        'Project_Status__c', 'projectStatus',
        'Project_Manager__c', 'projectManager',
        'Project_Payment_Method__c', 'projectPaymentMethod'
      ]);
    }
    
    // Add other object types as needed
    return new Set();
  };

  const isFieldActuallyRequired = (field) => {
    if (!field.required || field.calculated || field.readOnly) {
      return false;
    }
    
    const requiredFields = getRequiredFieldsForObject(objectType);
    if (requiredFields.size === 0) {
      // If no specific requirements defined, use backend determination
      return field.required;
    }
    
    // Check if field name or label matches required fields
    const fieldNameLower = field.name.toLowerCase();
    const fieldLabelLower = (field.label || '').toLowerCase();
    
    return Array.from(requiredFields).some(reqField => {
      const reqFieldLower = reqField.toLowerCase();
      return fieldNameLower === reqFieldLower || 
             fieldNameLower.includes(reqFieldLower) ||
             fieldLabelLower.includes(reqFieldLower.replace(/_/g, ' '));
    });
  };

  const formatFieldValue = (field, value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="sf-field-empty">--</span>;
    }

    switch (field.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      case 'datetime':
        return new Date(value).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
      case 'currency':
      case 'double':
      case 'percent':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'picklist':
        return value;
      case 'multipicklist':
        return Array.isArray(value) ? value.join('; ') : value;
      case 'reference':
        return <span className="sf-link">{value}</span>;
      case 'textarea':
      case 'longtextarea':
        return <div className="sf-textarea-value">{value}</div>;
      case 'url':
        return <a href={value} className="sf-link" target="_blank" rel="noopener noreferrer">{value}</a>;
      default:
        return String(value);
    }
  };

  const getObjectName = () => {
    if (!previewData || !formData) return 'New Record';
    
    // Try to get Name field
    const nameField = previewData.fields?.find(f => (f.name === 'Name' || f.name === 'Project_Name__c') && f.value);
    if (nameField && nameField.value) {
      return nameField.value;
    }
    
    // Try common name fields from formData
    const nameFields = ['projectName', 'name', 'shortProjectName', 'contributorProjectName'];
    for (const fieldName of nameFields) {
      if (formData[fieldName]) {
        return formData[fieldName];
      }
    }
    
    return previewData.objectLabel || 'New Record';
  };

  const getStatus = () => {
    if (!previewData) return null;
    const statusField = previewData.fields?.find(f => 
      (f.name === 'Status__c' || f.name === 'Project_Status__c' || f.name === 'Status') && f.value
    );
    if (statusField) return statusField.value;
    
    // Try formData
    if (formData?.projectStatus) return formData.projectStatus;
    if (formData?.status) return formData.status;
    
    return null;
  };

  // Group fields by tabs and sections
  const groupFieldsByTabs = () => {
    if (!previewData || !previewData.fields) return {};

    const tabs = {
      'Details': {
        'Information': [],
        'Project Metadata': []
      },
      'Data Collection': {
        'Requirements': [],
        'Languages': [],
        'Data Collection Info': []
      },
      'Lever': {
        'Lever Requisition Fields': [],
        'Lever Admin': []
      },
      'Payments': {
        'Payment Configurations': []
      },
      'Communication': {
        'Communication': [],
        'Activation': []
      },
      'Related': {},
      'Funnel Report': {
        'Funnel Totals': [],
        'Funnel Stages': []
      }
    };

    previewData.fields.forEach(field => {
      const fieldName = field.name.toLowerCase();
      const fieldLabel = field.label.toLowerCase();

      // Details Tab - Information
      if (fieldName.includes('name') || 
          fieldName.includes('description') || 
          fieldName.includes('short') ||
          fieldName.includes('contributor') ||
          fieldName.includes('partner') ||
          fieldName.includes('category') ||
          fieldName.includes('auditor') ||
          fieldLabel.includes('name') ||
          fieldLabel.includes('description') ||
          fieldLabel.includes('short')) {
        tabs['Details']['Information'].push(field);
      }
      // Details Tab - Project Metadata
      else if (fieldName.includes('id') || 
               fieldName.includes('date') || 
               fieldName.includes('status') ||
               fieldName.includes('account') ||
               fieldName.includes('client') ||
               fieldName.includes('program') ||
               fieldName.includes('delivery') ||
               fieldName.includes('tool') ||
               fieldName.includes('page') ||
               fieldName.includes('url') ||
               fieldName.includes('location')) {
        tabs['Details']['Project Metadata'].push(field);
      }
      // Data Collection Tab
      else if (fieldName.includes('requirement') ||
               fieldName.includes('language') ||
               fieldName.includes('budget') ||
               fieldName.includes('data') ||
               fieldName.includes('hours') ||
               fieldName.includes('milestone') ||
               fieldLabel.includes('requirement') ||
               fieldLabel.includes('language') ||
               fieldLabel.includes('budget')) {
        if (fieldName.includes('requirement') || fieldLabel.includes('requirement')) {
          tabs['Data Collection']['Requirements'].push(field);
        } else if (fieldName.includes('language') || fieldLabel.includes('language')) {
          tabs['Data Collection']['Languages'].push(field);
        } else {
          tabs['Data Collection']['Data Collection Info'].push(field);
        }
      }
      // Lever Tab
      else if (fieldName.includes('lever') || fieldLabel.includes('lever')) {
        if (fieldName.includes('admin') || fieldName.includes('requisitionid') || fieldName.includes('createdate')) {
          tabs['Lever']['Lever Admin'].push(field);
        } else {
          tabs['Lever']['Lever Requisition Fields'].push(field);
        }
      }
      // Payments Tab
      else if (fieldName.includes('payment') ||
               fieldName.includes('rate') ||
               fieldName.includes('incentive') ||
               fieldName.includes('approval') ||
               fieldLabel.includes('payment') ||
               fieldLabel.includes('rate')) {
        tabs['Payments']['Payment Configurations'].push(field);
      }
      // Communication Tab
      else if (fieldName.includes('communication') ||
               fieldName.includes('comm') ||
               fieldName.includes('activate') ||
               fieldName.includes('email') ||
               fieldName.includes('template') ||
               fieldLabel.includes('communication') ||
               fieldLabel.includes('activate')) {
        if (fieldName.includes('activate') || fieldLabel.includes('activate')) {
          tabs['Communication']['Activation'].push(field);
        } else {
          tabs['Communication']['Communication'].push(field);
        }
      }
      // Funnel Report Tab - More comprehensive matching
      else if (fieldName.includes('funnel') ||
               fieldName.includes('total') ||
               fieldName.includes('stage') ||
               (fieldName.includes('contributor') && (fieldName.includes('count') || fieldName.includes('number') || fieldName.includes('target'))) ||
               fieldLabel.includes('funnel') ||
               fieldLabel.includes('total') ||
               fieldLabel.includes('stage') ||
               (fieldName.includes('contributor') && (fieldName.includes('count') || fieldName.includes('number') || fieldName.includes('target')))) {
        if (fieldName.includes('total') || fieldLabel.includes('total') || fieldName.includes('funneltotal') || fieldLabel.includes('funnel total')) {
          tabs['Funnel Report']['Funnel Totals'].push(field);
        } else if (fieldName.includes('stage') || fieldLabel.includes('stage') || fieldName.includes('funnelstage') || fieldLabel.includes('funnel stage')) {
          tabs['Funnel Report']['Funnel Stages'].push(field);
        } else {
          // Default to Funnel Totals if it's funnel-related but unclear
          tabs['Funnel Report']['Funnel Totals'].push(field);
        }
      }
      // Default to Project Metadata if not categorized
      else {
        tabs['Details']['Project Metadata'].push(field);
      }
    });

    return tabs;
  };

  const renderSection = (sectionName, fields) => {
    if (!fields || fields.length === 0) return null;

    // Ensure section is expanded by default (true if not explicitly set to false)
    const isExpanded = expandedSections[sectionName] !== false;

    return (
      <div className="sf-section">
        <div 
          className="sf-section-header"
          onClick={() => toggleSection(sectionName)}
          style={{ paddingLeft: '16px', paddingRight: '16px', overflow: 'visible', position: 'relative' }}
        >
          <div className="sf-section-title" style={{ overflow: 'visible', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChevronDown 
              size={16} 
              className="sf-chevron"
              style={{ 
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
                flexShrink: 0,
                minWidth: '16px',
                display: 'block',
                visibility: 'visible'
              }} 
            />
            <span style={{ overflow: 'visible', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{sectionName}</span>
          </div>
        </div>
        {isExpanded && (
          <div className="sf-section-content">
            <div className="sf-field-list">
              {fields.map((field, index) => (
                <div key={field.name} className="sf-field-item">
                  <div className="sf-field-label-cell">
                    <label className="sf-field-label">
                      {field.label}
                      {isFieldActuallyRequired(field) && <span className="sf-required">*</span>}
                    </label>
                  </div>
                  <div className="sf-field-value-cell">
                    {formatFieldValue(field, field.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = (tabName, tabSections) => {
    if (!tabSections || Object.keys(tabSections).length === 0) {
      return (
        <div className="sf-tab-content">
          <p className="sf-tab-placeholder">No data available for {tabName} tab.</p>
        </div>
      );
    }

    return (
      <div className="sf-tab-content">
        <div className="sf-main-content">
          {Object.entries(tabSections).map(([sectionName, fields]) => 
            renderSection(sectionName, fields)
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const tabsData = previewData ? groupFieldsByTabs() : {};
  const objectName = getObjectName();
  const status = getStatus();
  const displayObjectLabel = previewData?.objectLabel || propObjectLabel || 'Project';
  
  // Check if this is a Contributor Review preview
  const isContributorReview = objectType && (
    objectType.toLowerCase() === 'contributor-review' || 
    objectType.toLowerCase() === 'contributorreview' ||
    objectType.toLowerCase() === 'contributor review' ||
    displayObjectLabel?.toLowerCase() === 'contributor review'
  );

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content sf-preview" onClick={(e) => e.stopPropagation()}>
        {/* Salesforce Header - Exact Match */}
        <div className="sf-header">
          <div className="sf-header-left">
            <div className="sf-object-icon">
              <div className="sf-icon-square">{displayObjectLabel?.charAt(0)?.toUpperCase() || 'P'}</div>
            </div>
            <div className="sf-object-info">
              <div className="sf-object-name-row">
                <span className="sf-object-type-label">{displayObjectLabel}</span>
                <h1 className="sf-object-name" title={objectName}>{objectName || 'New Record'}</h1>
              </div>
              {status && (
                <div className="sf-status-display">
                  <span className="sf-status-badge">{status}</span>
                </div>
              )}
            </div>
          </div>
          <div className="sf-header-right">
            {(onEdit || formData) && (
              <button 
                className="sf-action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onEdit) {
                    onEdit();
                  } else if (formData) {
                    // Default behavior: close preview to return to form
                    onClose();
                  }
                }}
              >
                Edit
              </button>
            )}
            <button 
              className="sf-action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs - Only show for non-Contributor Review objects */}
        {!isContributorReview && (
        <div className="sf-tabs">
          <button 
            className={`sf-tab ${activeTab === 'Details' ? 'active' : ''}`}
            onClick={() => setActiveTab('Details')}
          >
            Details
          </button>
          <button 
            className={`sf-tab ${activeTab === 'Data Collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('Data Collection')}
          >
            Data Collection
          </button>
          <button 
            className={`sf-tab ${activeTab === 'Lever' ? 'active' : ''}`}
            onClick={() => setActiveTab('Lever')}
          >
            Lever
          </button>
          <button 
            className={`sf-tab ${activeTab === 'Payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('Payments')}
          >
            Payments
          </button>
          <button 
            className={`sf-tab ${activeTab === 'Communication' ? 'active' : ''}`}
            onClick={() => setActiveTab('Communication')}
          >
            Communication
          </button>
          <button 
            className={`sf-tab ${activeTab === 'Related' ? 'active' : ''}`}
            onClick={() => setActiveTab('Related')}
          >
            Related
          </button>
          <button 
            className={`sf-tab ${activeTab === 'Funnel Report' ? 'active' : ''}`}
            onClick={() => setActiveTab('Funnel Report')}
          >
            Funnel Report
          </button>
        </div>
        )}

        {/* Content Area */}
        <div className="preview-modal-body">
          {loading && (
            <div className="loading-container">
              <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
              <p>Loading Salesforce preview...</p>
            </div>
          )}

          {error && (
            <div className="preview-error">
              <p>{error}</p>
            </div>
          )}

          {previewData && !loading && (
            <>
              {isContributorReview ? (
                // Contributor Review: Single page view without tabs, no Project-specific sections
                <div className="sf-tab-content">
                  <div className="sf-main-content" style={{ width: '100%' }}>
                    {previewData.fields && previewData.fields.length > 0 ? (
                      // Group fields by logical sections for Contributor Review
                      (() => {
                        const sections = {
                          'Basic Information': [],
                          'Contributor Resume Review': [],
                          'Contributor LinkedIn Review': [],
                          'Contributor Mercury Profile Review': [],
                          'Contributor Interview': [],
                          'Other Information': []
                        };
                        
                        previewData.fields.forEach(field => {
                          const fieldName = field.name.toLowerCase();
                          const fieldLabel = field.label.toLowerCase();
                          
                          if (fieldName.includes('contributor') && (fieldName.includes('resume') || fieldLabel.includes('resume'))) {
                            sections['Contributor Resume Review'].push(field);
                          } else if (fieldName.includes('linkedin') || fieldLabel.includes('linkedin')) {
                            sections['Contributor LinkedIn Review'].push(field);
                          } else if (fieldName.includes('mercury') || fieldName.includes('profile') || (fieldLabel.includes('mercury') || fieldLabel.includes('profile'))) {
                            sections['Contributor Mercury Profile Review'].push(field);
                          } else if (fieldName.includes('interview') || fieldLabel.includes('interview')) {
                            sections['Contributor Interview'].push(field);
                          } else if (fieldName.includes('name') || fieldName.includes('number') || fieldName.includes('date') || fieldName.includes('status') || fieldName.includes('reviewer')) {
                            sections['Basic Information'].push(field);
                          } else {
                            sections['Other Information'].push(field);
                          }
                        });
                        
                        return Object.entries(sections).map(([sectionName, fields]) => 
                          fields.length > 0 ? renderSection(sectionName, fields) : null
                        );
                      })()
                    ) : (
                      <p className="sf-tab-placeholder">No data available.</p>
                    )}
                  </div>
                </div>
              ) : (
                // Regular preview with tabs (for Project, etc.)
                <>
                  {activeTab === 'Details' && (
                    <div className="sf-details-content">
                      <div className="sf-main-content">
                        {renderSection('Information', tabsData['Details']?.['Information'])}
                        {renderSection('Project Metadata', tabsData['Details']?.['Project Metadata'])}
                      </div>
                      <div className="sf-sidebar">
                        <div className="sf-related-section">
                          <div className="sf-related-header">
                            <ChevronDown size={14} />
                            <span>Project Teams (0)</span>
                          </div>
                        </div>
                        <div className="sf-related-section">
                          <div className="sf-related-header">
                            <ChevronDown size={14} />
                            <span>Project Qualification Steps (0)</span>
                          </div>
                        </div>
                        <div className="sf-related-section">
                          <div className="sf-related-header">
                            <ChevronDown size={14} />
                            <span>Project Pages (0)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Data Collection' && renderTabContent('Data Collection', tabsData['Data Collection'])}
                  {activeTab === 'Lever' && renderTabContent('Lever', tabsData['Lever'])}
                  {activeTab === 'Payments' && renderTabContent('Payments', tabsData['Payments'])}
                  {activeTab === 'Communication' && renderTabContent('Communication', tabsData['Communication'])}
                  {activeTab === 'Funnel Report' && renderTabContent('Funnel Report', tabsData['Funnel Report'])}

                  {activeTab === 'Related' && (
                    <div className="sf-tab-content">
                      <div className="sf-main-content">
                        <div className="sf-section">
                          <div className="sf-section-header">
                            <div className="sf-section-title">
                              <ChevronDown size={16} />
                              <span>Related Records</span>
                            </div>
                          </div>
                          <div className="sf-section-content">
                            <div className="sf-field-list">
                              <div className="sf-field-row">
                                <div className="sf-field-label-cell">
                                  <label className="sf-field-label">Project Teams</label>
                                </div>
                                <div className="sf-field-value-cell">
                                  <span className="sf-field-empty">No related records</span>
                                </div>
                              </div>
                              <div className="sf-field-row">
                                <div className="sf-field-label-cell">
                                  <label className="sf-field-label">Project Qualification Steps</label>
                                </div>
                                <div className="sf-field-value-cell">
                                  <span className="sf-field-empty">No related records</span>
                                </div>
                              </div>
                              <div className="sf-field-row">
                                <div className="sf-field-label-cell">
                                  <label className="sf-field-label">Project Pages</label>
                                </div>
                                <div className="sf-field-value-cell">
                                  <span className="sf-field-empty">No related records</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="preview-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
