import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Save, X, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../../pages/UpdateObjectFields/components/SearchableDropdown';
import apiClient from '../../config/api';

const CaseDetailView = ({ caseData, availableFields, onUpdate, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(caseData);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    caseDetails: true,
    contributorInfo: true,
    descriptionInfo: true,
    submittedInfo: true,
    systemInfo: true,
    admin: true
  });
  const [searchingFields, setSearchingFields] = useState({});
  const [searchResults, setSearchResults] = useState({});
  const [showDropdowns, setShowDropdowns] = useState({});
  const [searchTerms, setSearchTerms] = useState({});

  useEffect(() => {
    setEditedData(caseData);
    // Initialize search terms with display names for reference fields when data loads
    if (caseData && availableFields) {
      const initialSearchTerms = {};
      availableFields.forEach(field => {
        if (field.type === 'reference') {
          // Use a helper to get display value
          let displayName = '';
          if (field.name === 'ContactId') {
            displayName = caseData['Contact.Name'] || caseData[field.name] || '';
          } else if (field.name === 'OwnerId') {
            displayName = caseData['Owner.Name'] || caseData[field.name] || '';
          } else if (field.name === 'CreatedById') {
            displayName = caseData['CreatedBy.Name'] || caseData[field.name] || '';
          } else if (field.name === 'LastModifiedById') {
            displayName = caseData['LastModifiedBy.Name'] || caseData[field.name] || '';
          } else if (field.relationshipName) {
            const relName = field.relationshipName.endsWith('__r') 
              ? field.relationshipName 
              : `${field.relationshipName}__r`;
            displayName = caseData[`${relName}.Name`] || caseData[`${relName}.CaseNumber`] || caseData[field.name] || '';
          }
          if (displayName && !displayName.match(/^[a-zA-Z0-9]{15,18}$/)) {
            // Only set if it's not an ID (Salesforce IDs are 15 or 18 characters)
            initialSearchTerms[field.name] = displayName;
          }
        }
      });
      setSearchTerms(prev => ({ ...prev, ...initialSearchTerms }));
    }
  }, [caseData, availableFields]);

  const handleFieldChange = (fieldName, value) => {
    setEditedData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(caseData.Id, editedData);
    setSaving(false);
    setIsEditing(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function to get field value, handling relationship fields
  const getFieldValue = (field) => {
    // Handle relationship fields - show name instead of ID
    if (field.type === 'reference' || (field.referenceTo && field.referenceTo.length > 0)) {
      // Check for flattened relationship fields (e.g., Contact.Name, Owner.Name)
      if (field.name === 'ContactId') {
        return editedData['Contact.Name'] || editedData[field.name] || '';
      } else if (field.name === 'OwnerId') {
        return editedData['Owner.Name'] || editedData[field.name] || '';
      } else if (field.name === 'CreatedById') {
        return editedData['CreatedBy.Name'] || editedData[field.name] || '';
      } else if (field.name === 'LastModifiedById') {
        return editedData['LastModifiedBy.Name'] || editedData[field.name] || '';
      } else if (field.relationshipName) {
        // For custom relationships, try to get the Name field
        const relName = field.relationshipName.endsWith('__r') 
          ? field.relationshipName 
          : `${field.relationshipName}__r`;
        const nameField = `${relName}.Name`;
        // Check for CaseNumber if it's a Case relationship
        const caseNumberField = `${relName}.CaseNumber`;
        return editedData[nameField] || editedData[caseNumberField] || editedData[field.name] || '';
      } else if (field.name.endsWith('__c')) {
        // Try to infer relationship name for custom fields
        const baseName = field.name.replace('__c', '');
        const relName = `${baseName}__r`;
        const nameField = `${relName}.Name`;
        const caseNumberField = `${relName}.CaseNumber`;
        return editedData[nameField] || editedData[caseNumberField] || editedData[field.name] || '';
      }
    }
    
    // Handle special fields like Contact.Email
    if (field.name === 'Contact.Email') {
      return editedData['Contact.Email'] || editedData.Contact?.Email || '';
    }
    
    const value = editedData[field.name];
    
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    // Format dates
    if (field.type === 'date' || field.type === 'datetime') {
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
    }
    
    return String(value);
  };

  const renderFieldInput = (field) => {
    const displayValue = getFieldValue(field);
    
    if (!isEditing) {
      return <span className="detail-field-text">{displayValue || ''}</span>;
    }

    switch (field.type) {
      case 'picklist':
        return (
          <select
            value={editedData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="detail-field-input"
          >
            <option value="">--None--</option>
            {field.picklistValues?.map(pv => (
              <option key={pv} value={pv}>{pv}</option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!editedData[field.name]}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            className="detail-field-checkbox"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={editedData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="detail-field-textarea"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={editedData[field.name] ? new Date(editedData[field.name]).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="detail-field-input"
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={editedData[field.name] ? new Date(editedData[field.name]).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="detail-field-input"
          />
        );
      case 'int':
      case 'double':
      case 'currency':
      case 'percent':
        return (
          <input
            type="number"
            value={editedData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="detail-field-input"
          />
        );
      case 'reference':
        if (!isEditing) {
          return <span className="detail-field-text">{displayValue || ''}</span>;
        }
        
        // Get the referenced object type
        const referencedObject = field.referenceTo || (availableFields.find(f => f.name === field.name)?.referenceTo);
        
        // For Owner, Created By, Last Modified By - show name but allow searching
        const displayName = getFieldValue(field);
        // const fieldId = editedData[field.name] || ''; // Unused
        
        // Determine the object name for search
        let searchObjectName = '';
        if (field.name === 'OwnerId') {
          searchObjectName = 'User';
        } else if (field.name === 'CreatedById' || field.name === 'LastModifiedById') {
          searchObjectName = 'User';
        } else if (field.name === 'ContactId') {
          searchObjectName = 'Contact';
        } else if (referencedObject) {
          // Handle array of referenceTo
          if (Array.isArray(referencedObject) && referencedObject.length > 0) {
            searchObjectName = referencedObject[0];
          } else if (typeof referencedObject === 'string') {
            searchObjectName = referencedObject;
          }
        } else if (field.name.endsWith('__c')) {
          // Try to infer from field name (e.g., Project__c -> Project__c)
          // For custom fields, we need the actual object name
          const baseName = field.name.replace('__c', '');
          // Common mappings
          const objectMap = {
            'Project': 'Project__c',
            'Project_Objective': 'Project_Objective__c',
            'Contributor_Project': 'Contributor_Project__c',
            'Project_Team': 'Project_Team__c'
          };
          searchObjectName = objectMap[baseName] || baseName;
        }
        
        // If still no object name, try to get it from availableFields
        if (!searchObjectName) {
          const fieldInfo = availableFields.find(f => f.name === field.name);
          if (fieldInfo && fieldInfo.referenceTo) {
            if (Array.isArray(fieldInfo.referenceTo) && fieldInfo.referenceTo.length > 0) {
              searchObjectName = fieldInfo.referenceTo[0];
            } else if (typeof fieldInfo.referenceTo === 'string') {
              searchObjectName = fieldInfo.referenceTo;
            }
          }
        }
        
        const searchFieldKey = field.name;
        const isSearching = searchingFields[searchFieldKey] || false;
        const searchOptions = searchResults[searchFieldKey] || [];
        const showDropdown = showDropdowns[searchFieldKey] || false;
        const currentSearchTerm = searchTerms[searchFieldKey] !== undefined ? searchTerms[searchFieldKey] : displayName;
        
        const handleSearch = async (searchTerm) => {
          if (!searchObjectName || !searchTerm || searchTerm.trim() === '') {
            setSearchResults(prev => ({ ...prev, [searchFieldKey]: [] }));
            setShowDropdowns(prev => ({ ...prev, [searchFieldKey]: false }));
            return;
          }
          
          setSearchingFields(prev => ({ ...prev, [searchFieldKey]: true }));
          setShowDropdowns(prev => ({ ...prev, [searchFieldKey]: true }));
          try {
            const response = await apiClient.get(`/case-management/search-reference/${encodeURIComponent(searchObjectName)}?search=${encodeURIComponent(searchTerm)}`);
            if (response.data.success) {
              const records = (response.data.records || []).map(r => ({ 
                id: r.id,
                value: r.id, 
                label: r.name,
                name: r.name
              }));
              setSearchResults(prev => ({ ...prev, [searchFieldKey]: records }));
            }
          } catch (error) {
            console.error('Error searching reference:', error);
            setSearchResults(prev => ({ ...prev, [searchFieldKey]: [] }));
          } finally {
            setSearchingFields(prev => ({ ...prev, [searchFieldKey]: false }));
          }
        };
        
        const handleSelect = (option) => {
          // Store the ID in the field
          handleFieldChange(field.name, option.id || option.value);
          // Also update the display name if available
          if (option.name || option.label) {
            const relName = field.relationshipName || 
              (field.name === 'OwnerId' ? 'Owner' : 
               field.name === 'CreatedById' ? 'CreatedBy' :
               field.name === 'LastModifiedById' ? 'LastModifiedBy' :
               field.name.replace('__c', '__r'));
            if (relName) {
              setEditedData(prev => ({
                ...prev,
                [`${relName}.Name`]: option.name || option.label
              }));
            }
            // Update search term to show the selected name
            setSearchTerms(prev => ({ ...prev, [searchFieldKey]: option.name || option.label }));
          }
          setShowDropdowns(prev => ({ ...prev, [searchFieldKey]: false }));
        };
        
        return (
          <div style={{ width: '100%', position: 'relative' }}>
            <SearchableDropdown
              value={currentSearchTerm || ''}
              onChange={(e) => {
                const searchTerm = e.target.value;
                setSearchTerms(prev => ({ ...prev, [searchFieldKey]: searchTerm }));
                if (searchTerm && searchTerm.length > 1) {
                  handleSearch(searchTerm);
                } else {
                  setShowDropdowns(prev => ({ ...prev, [searchFieldKey]: false }));
                  setSearchResults(prev => ({ ...prev, [searchFieldKey]: [] }));
                }
              }}
              onFocus={() => {
                const term = currentSearchTerm || displayName || '';
                if (term && term.length > 1) {
                  handleSearch(term);
                }
              }}
              onBlur={() => {
                // Delay closing to allow selection
                setTimeout(() => {
                  setShowDropdowns(prev => ({ ...prev, [searchFieldKey]: false }));
                }, 200);
              }}
              placeholder={`Search ${field.label}...`}
              options={searchOptions}
              loading={false}
              searching={isSearching}
              showDropdown={showDropdown && (searchOptions.length > 0 || isSearching)}
              onSelect={handleSelect}
              onClose={() => setShowDropdowns(prev => ({ ...prev, [searchFieldKey]: false }))}
              style={{ width: '100%' }}
              zIndex={10002}
            />
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={editedData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="detail-field-input"
          />
        );
    }
  };

  // Helper to get field metadata or create a default one
  const getFieldMetadata = (fieldName) => {
    const field = availableFields.find(f => f.name === fieldName);
    if (field) return field;
    
    // Create default metadata for fields that exist in data but not in availableFields
    const labelMap = {
      'OwnerId': 'Case Owner',
      'ContactId': 'Contributor Name',
      'Contact.Name': 'Contributor Name',
      'Contact.Email': 'Contributor Email',
      'Owner.Name': 'Case Owner',
      'Group': 'Group',
      'Origin': 'Case Origin',
      'Priority': 'Priority',
      'Status': 'Status',
      'CaseNumber': 'Case Number',
      'Subject': 'Subject',
      'Type': 'Case Type',
      'Description': 'Description',
      'CreatedDate': 'Date/Time Opened',
      'LastModifiedDate': 'Last Modified Date',
      'CreatedById': 'Created By',
      'LastModifiedById': 'Last Modified By',
      'CreatedBy.Name': 'Created By',
      'LastModifiedBy.Name': 'Last Modified By'
    };
    
    // Get label from availableFields first, then from labelMap, then generate from fieldName
    const availableField = availableFields.find(f => f.name === fieldName);
    if (availableField && availableField.label) {
      return {
        name: fieldName,
        label: availableField.label,
        type: availableField.type || 'string'
      };
    }
    
    if (labelMap[fieldName]) {
      return {
        name: fieldName,
        label: labelMap[fieldName],
        type: 'string'
      };
    }
    
    // Generate label from fieldName - remove __c but keep the rest
    let label = fieldName;
    // Remove __c suffix
    if (label.endsWith('__c')) {
      label = label.slice(0, -3);
    }
    // Replace underscores with spaces and capitalize words
    label = label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return {
      name: fieldName,
      label: label,
      type: 'string'
    };
  };

  // Define field sections matching the screenshot layout
  const getFieldSections = () => {
    // Case Details Section - exact order from screenshot
    const caseDetailsFieldNames = [
      'OwnerId', 'Group', 'Origin', 'Priority',
      'Contributor_Project__c', 'Project__c', 'Project_Support_Lead__c',
      'Contributor_Status__c', 'Target_SLA__c', 'External_SLA__c',
      'SLA_Status__c', 'Project_Team__c', 'CaseNumber',
      'Total_Case_Duration__c', 'Active_Case_Duration__c', 'Status',
      'Case_Action_Taken__c', 'AutoCase_Flow__c', 'AutoCase_Date_Time__c',
      'CreatedDate', 'Related_Case__c'
    ];
    
    const caseDetailsFields = caseDetailsFieldNames.map(fieldName => {
      const field = getFieldMetadata(fieldName);
      // Get relationshipName from availableFields if it exists
      const availableField = availableFields.find(f => f.name === fieldName);
      if (availableField && availableField.relationshipName) {
        field.relationshipName = availableField.relationshipName;
      }
      if (availableField && availableField.referenceTo) {
        field.referenceTo = availableField.referenceTo;
      }
      return field;
    });

    // Contributor Information Section - all fields from screenshot
    const contributorFieldNames = [
      'ContactId', 'Contact.Email', 'AC_ID__c', 'AC_Account_Created_Date__c',
      'Contributor_Status__c', 'Primary_Language_Spoken__c',
      'Currently_Residing_Country__c', 'Currently_Residing_US_State__c'
    ];
    
    const contributorFields = contributorFieldNames.map(fieldName => {
      if (fieldName === 'Contact.Email') {
        return { name: 'Contact.Email', label: 'Contributor Email', type: 'email' };
      }
      const field = getFieldMetadata(fieldName);
      // Get relationshipName from availableFields if it exists
      const availableField = availableFields.find(f => f.name === fieldName);
      if (availableField && availableField.relationshipName) {
        field.relationshipName = availableField.relationshipName;
      }
      if (availableField && availableField.referenceTo) {
        field.referenceTo = availableField.referenceTo;
      }
      return field;
    });

    // Description Information Section
    const descriptionFieldNames = [
      'Subject', 'Type', 'Case_Reason__c', 'Description'
    ];
    
    const descriptionFields = descriptionFieldNames.map(fieldName => {
      const field = getFieldMetadata(fieldName);
      const availableField = availableFields.find(f => f.name === fieldName);
      if (availableField && availableField.relationshipName) {
        field.relationshipName = availableField.relationshipName;
      }
      return field;
    });

    // Submitted Information Section
    const submittedFieldNames = [
      'Web_Form_Name__c', 'Web_AC_ID__c', 'Web_Form_Email__c', 'Web_Form_Project__c'
    ];
    
    const submittedFields = submittedFieldNames.map(fieldName => {
      const field = getFieldMetadata(fieldName);
      const availableField = availableFields.find(f => f.name === fieldName);
      if (availableField && availableField.relationshipName) {
        field.relationshipName = availableField.relationshipName;
      }
      return field;
    });

    // System Information Section
    const systemFieldNames = [
      'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate'
    ];
    
    const systemFields = systemFieldNames.map(fieldName => {
      const field = getFieldMetadata(fieldName);
      const availableField = availableFields.find(f => f.name === fieldName);
      if (availableField && availableField.relationshipName) {
        field.relationshipName = availableField.relationshipName;
      }
      // For CreatedById and LastModifiedById, update label to show "Created By" and "Last Modified By"
      if (fieldName === 'CreatedById') {
        field.label = 'Created By';
      } else if (fieldName === 'LastModifiedById') {
        field.label = 'Last Modified By';
      }
      return field;
    });

    // Admin Section
    const adminFieldNames = [
      'CSAT_URL__c'
    ];
    
    const adminFields = adminFieldNames.map(fieldName => {
      const field = getFieldMetadata(fieldName);
      const availableField = availableFields.find(f => f.name === fieldName);
      if (availableField && availableField.relationshipName) {
        field.relationshipName = availableField.relationshipName;
      }
      return field;
    });

    return {
      caseDetails: caseDetailsFields,
      contributor: contributorFields,
      description: descriptionFields,
      submitted: submittedFields,
      system: systemFields,
      admin: adminFields
    };
  };

  const sections = getFieldSections();

  const renderSection = (title, sectionKey, fields) => {
    if (!fields || fields.length === 0) return null;

    return (
      <div className="case-detail-section">
        <div 
          className="case-detail-section-header"
          onClick={() => toggleSection(sectionKey)}
        >
          <h3>{title}</h3>
          {expandedSections[sectionKey] ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>
        {expandedSections[sectionKey] && (
          <div className="case-detail-section-content">
            <div className="case-detail-grid">
              {fields.map((field, index) => {
                if (field.name === 'Contact.Email') {
                  const emailValue = editedData['Contact.Email'] || editedData.Contact?.Email || '';
                  return (
                    <div key="Contact.Email" className="detail-field-group">
                      <label className="detail-field-label">Contributor Email:</label>
                      <div className="detail-field-value">
                        {!isEditing ? (
                          <span className="detail-field-text">{emailValue || ''}</span>
                        ) : (
                          <input
                            type="email"
                            value={editedData['Contact.Email'] || ''}
                            onChange={(e) => handleFieldChange('Contact.Email', e.target.value)}
                            className="detail-field-input"
                          />
                        )}
                      </div>
                    </div>
                  );
                }
                const fieldMetadata = availableFields.find(f => f.name === field.name) || field;
                return (
                  <div key={field.name || index} className="detail-field-group">
                    <label className="detail-field-label">{field.label}:</label>
                    <div className="detail-field-value">
                      {renderFieldInput(fieldMetadata)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="case-detail-view">
      <div className="case-detail-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={18} />
          <span>Back to List</span>
        </button>
        <div className="case-detail-title">
          <h2>Case: {caseData.Subject || caseData.CaseNumber || caseData.Id}</h2>
        </div>
        <div className="case-detail-actions">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-edit">
              <Edit size={16} />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving} className="btn-save">
                {saving ? <Loader size={16} className="spinner" /> : <Save size={16} />}
                <span>Save</span>
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-cancel">
                <X size={16} />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="case-detail-layout">
        <div className="case-detail-main">
          <div className="case-detail-content">
            {renderSection('Case Details', 'caseDetails', sections.caseDetails)}
            {renderSection('Contributor Information', 'contributorInfo', sections.contributor)}
            {renderSection('Description Information', 'descriptionInfo', sections.description)}
            {renderSection('Submitted Information', 'submittedInfo', sections.submitted)}
            {renderSection('System Information', 'systemInfo', sections.system)}
            {renderSection('Admin', 'admin', sections.admin)}
          </div>
        </div>

        <div className="case-detail-sidebar">
          <div className="case-summary-section">
            <div className="case-summary-header">
              <h3>Case Summary</h3>
            </div>
            <div className="case-summary-content">
              <div className="case-summary-field">
                <label>Contributor Name:</label>
                <span>{getFieldValue({ name: 'ContactId', type: 'reference' }) || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Web Form Email:</label>
                <span>{editedData.Web_Form_Email__c || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Case Owner:</label>
                <span>{getFieldValue({ name: 'OwnerId', type: 'reference' }) || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Status:</label>
                <span>{editedData.Status || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Group:</label>
                <span>{editedData.Group || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Web Form Project:</label>
                <span>{editedData.Web_Form_Project__c || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Project Support Lead:</label>
                <span>{editedData.Project_Support_Lead__c || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Case Number:</label>
                <span>{editedData.CaseNumber || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>On Hold Reason:</label>
                <span>{editedData.On_Hold_Reason__c || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Case Type:</label>
                <span>{editedData.Type || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>On Hold Responsible:</label>
                <span>{editedData.On_Hold_Responsible__c || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Case Reason:</label>
                <span>{editedData.Case_Reason__c || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Case Tag:</label>
                <span>{editedData.Case_Tag__c || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Subject:</label>
                <span>{editedData.Subject || ''}</span>
              </div>
              <div className="case-summary-field">
                <label>Description:</label>
                <span>{editedData.Description || ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailView;
