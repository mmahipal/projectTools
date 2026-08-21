import React, { useState, useEffect } from 'react';
import { X, Edit, Loader, Save, Plus, Info, FileText, Link2, Activity, TrendingUp } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import FunnelChart from '../../pages/Dashboard/components/FunnelChart';
import ProjectRosterFunnelChart from './ProjectRosterFunnelChart';
import './ObjectViewModal.css';

const ObjectViewModal = ({ isOpen, onClose, objectType, objectId, objectName, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [objectData, setObjectData] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [fieldLabels, setFieldLabels] = useState({});
  const [fieldMetadata, setFieldMetadata] = useState({});
  const [fieldSections, setFieldSections] = useState({});
  const [childRelationships, setChildRelationships] = useState([]);
  const [relatedRecords, setRelatedRecords] = useState({});
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'related', 'funnel'
  const [funnelData, setFunnelData] = useState(null);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [funnelError, setFunnelError] = useState(null);
  
  // Workstream form state
  const [showWorkstreamForm, setShowWorkstreamForm] = useState(false);
  const [creatingWorkstream, setCreatingWorkstream] = useState(false);
  const [workstreamData, setWorkstreamData] = useState({
    projectWorkstreamName: '',
    projectObjective: '',
    projectObjectiveId: '',
    refresh: false,
    deliveryToolName: '',
    clientWorkstreamIdentifier: '',
    functionality: ''
  });
  
  // Picklist options
  const deliveryToolNameOptions = [
    '--None--',
    'A9',
    'ADAP',
    'Ampersand',
    'Appen Collect',
    'AppenLex',
    'Baseline',
    'EWOQ',
    'Exotel',
    'Other',
    'Polyglot',
    'SRT',
    'TryRating',
    'UHRS',
    'Test',
    'Test Tool'
  ];
  
  const functionalityOptions = [
    '--None--',
    'System Access',
    'System Access & Productivity',
    'Productivity'
  ];

  useEffect(() => {
    if (isOpen && objectId) {
      fetchObjectDetails();
      setActiveTab('details'); // Reset tab when opening modal
    } else {
      // Reset state when modal closes
      setObjectData(null);
      setEditedData({});
      setEditing(false);
      setShowWorkstreamForm(false);
      setActiveTab('details');
      setChildRelationships([]);
      setRelatedRecords({});
      setFunnelData(null);
      setFunnelError(null);
      setWorkstreamData({
        projectWorkstreamName: '',
        projectObjective: '',
        projectObjectiveId: '',
        refresh: false,
        deliveryToolName: '',
        clientWorkstreamIdentifier: '',
        functionality: ''
      });
    }
  }, [isOpen, objectId, objectType]);
  
  // Auto-fill project objective when objectData is loaded and it's a Project Objective
  useEffect(() => {
    if (objectData && objectType === 'Project_Objective__c' && objectId) {
      const poName = objectData.Name || objectData.Project_Objective_Name__c || objectName || 'Project Objective';
      setWorkstreamData(prev => ({
        ...prev,
        projectObjective: poName,
        projectObjectiveId: objectId
      }));
    }
  }, [objectData, objectType, objectId, objectName]);
  
  // Debug: Log childRelationships whenever it changes
  useEffect(() => {
  }, [childRelationships]);

  // Fetch funnel data when funnel tab is active and object is a Project
  useEffect(() => {
    if (activeTab === 'funnel' && objectType === 'Project' && objectId && !funnelData && !funnelLoading) {
      fetchFunnelData();
    }
  }, [activeTab, objectType, objectId]);

  const fetchFunnelData = async () => {
    if (!objectId || objectType !== 'Project') return;
    
    setFunnelLoading(true);
    setFunnelError(null);
    try {
      const response = await apiClient.get(`/client-tool-account/object/${objectType}/${objectId}/funnel`);
      if (response.data.success) {
        setFunnelData(response.data.data);
      } else {
        setFunnelError('Failed to fetch funnel data');
      }
    } catch (error) {
      setFunnelError(error.response?.data?.error || error.message || 'Failed to fetch funnel data');
      toast.error('Failed to load funnel data');
    } finally {
      setFunnelLoading(false);
    }
  };

  const fetchObjectDetails = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/client-tool-account/object/${objectType}/${objectId}`);
      if (response.data.success) {
        setObjectData(response.data.object);
        setFieldLabels(response.data.fieldLabels || {});
        setFieldMetadata(response.data.fieldMetadata || {});
        setFieldSections(response.data.fieldSections || {});
        const childRels = response.data.childRelationships || [];
        const relatedRecs = response.data.relatedRecords || {};
        
        // Ensure we're setting arrays/objects correctly
        if (Array.isArray(childRels)) {
          setChildRelationships(childRels);
        } else {
          setChildRelationships([]);
        }
        
        if (relatedRecs && typeof relatedRecs === 'object') {
          setRelatedRecords(relatedRecs);
        } else {
          setRelatedRecords({});
        }
        setEditedData({});
        setActiveTab('details'); // Reset to details tab when loading new object
      } else {
        toast.error('Failed to fetch object details');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching object details:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch object details';
      console.error('Full error response:', error.response?.data);
      toast.error(errorMessage);
      // Don't close modal on error - let user see the error
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (objectData) {
      setEditedData({ ...objectData });
      setEditing(true);
    }
  };

  const handleCancel = () => {
    setEditedData({});
    setEditing(false);
  };

  const handleAddWorkstream = () => {
    if (objectType === 'Project_Objective__c' && objectId) {
      // Get the project objective name from objectData or objectName
      const poName = (objectData && (objectData.Name || objectData.Project_Objective_Name__c)) || objectName || 'Project Objective';
      // Auto-fill project objective and show form
      setWorkstreamData(prev => ({
        ...prev,
        projectObjective: poName,
        projectObjectiveId: objectId
      }));
      setShowWorkstreamForm(true);
      
      // Scroll to form after a brief delay to ensure it's rendered
      setTimeout(() => {
        const formElement = document.querySelector('.object-view-workstream-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };
  
  const handleWorkstreamInputChange = (field, value) => {
    setWorkstreamData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleCreateWorkstream = async () => {
    // Validate required fields
    if (!workstreamData.deliveryToolName || workstreamData.deliveryToolName === '--None--' || workstreamData.deliveryToolName.trim() === '') {
      toast.error('Delivery Tool Name is required');
      return;
    }
    if (!workstreamData.clientWorkstreamIdentifier || workstreamData.clientWorkstreamIdentifier.trim() === '') {
      toast.error('Client Workstream Identifier is required');
      return;
    }
    if (!workstreamData.functionality || workstreamData.functionality === '--None--' || workstreamData.functionality.trim() === '') {
      toast.error('Functionality is required');
      return;
    }
    if (!workstreamData.projectObjectiveId) {
      toast.error('Project Objective is required');
      return;
    }
    
    setCreatingWorkstream(true);
    try {
      const response = await apiClient.post('/workstream/create', {
        projectWorkstreamName: workstreamData.projectWorkstreamName,
        projectObjective: workstreamData.projectObjective,
        projectObjectiveId: workstreamData.projectObjectiveId,
        refresh: workstreamData.refresh,
        deliveryToolName: workstreamData.deliveryToolName,
        clientWorkstreamIdentifier: workstreamData.clientWorkstreamIdentifier,
        functionality: workstreamData.functionality
      });
      
      if (response.data.success) {
        toast.success('Workstream created successfully');
        // Reset form
        setWorkstreamData({
          projectWorkstreamName: '',
          projectObjective: objectData?.Name || objectData?.Project_Objective_Name__c || objectName || 'Project Objective',
          projectObjectiveId: objectId,
          refresh: false,
          deliveryToolName: '',
          clientWorkstreamIdentifier: '',
          functionality: ''
        });
        setShowWorkstreamForm(false);
        // Optionally refresh object data to show updated workstream count
        if (objectId) {
          fetchObjectDetails();
        }
      } else {
        toast.error(response.data.error || 'Failed to create workstream');
      }
    } catch (error) {
      console.error('Error creating workstream:', error);
      toast.error(error.response?.data?.error || 'Failed to create workstream');
    } finally {
      setCreatingWorkstream(false);
    }
  };
  
  const handleCancelWorkstream = () => {
    setShowWorkstreamForm(false);
    // Reset form but keep project objective pre-filled
    setWorkstreamData({
      projectWorkstreamName: '',
      projectObjective: objectData?.Name || objectData?.Project_Objective_Name__c || objectName || 'Project Objective',
      projectObjectiveId: objectId,
      refresh: false,
      deliveryToolName: '',
      clientWorkstreamIdentifier: '',
      functionality: ''
    });
  };

  const handleFieldChange = (fieldName, value) => {
    setEditedData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put(`/client-tool-account/object/${objectType}/${objectId}`, editedData);
      if (response.data.success) {
        toast.success('Object updated successfully');
        // Fetch updated data
        await fetchObjectDetails();
        setEditing(false);
        setEditedData({});
      } else {
        toast.error(response.data.error || 'Failed to update object');
      }
    } catch (error) {
      console.error('Error updating object:', error);
      toast.error(error.response?.data?.error || 'Failed to update object');
    } finally {
      setSaving(false);
    }
  };

  const formatFieldValue = (value, fieldName) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object' && value !== null) {
      // Handle relationship fields (e.g., Account__r.Name)
      if (value.Name) return value.Name;
      if (value.Id) return value.Id;
      return JSON.stringify(value);
    }
    
    // Check if there's a relationship name field (e.g., Account__c_Name for Account__c)
    const relationshipNameField = `${fieldName}_Name`;
    if (objectData && objectData[relationshipNameField]) {
      return objectData[relationshipNameField];
    }
    
    // Format dates - use shorter format for date-only fields
    if (fieldName && (fieldName.includes('Date') || fieldName.includes('Time') || fieldName.includes('At'))) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // For date-only fields (not datetime), use shorter format
          if (fieldName.includes('Date') && !fieldName.includes('Time') && !fieldName.includes('At')) {
            return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
          }
          // For datetime fields, use full format
          return date.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
        }
      } catch (e) {
        // Ignore date parsing errors
      }
    }
    return String(value);
  };
  
  // Check if a field is a relationship field that should be clickable
  const isRelationshipField = (fieldName) => {
    const metadata = fieldMetadata[fieldName] || {};
    if (metadata.type === 'reference' && metadata.relationshipName) {
      return true;
    }
    // Check for _Name suffix indicating a relationship
    if (fieldName.endsWith('_Name') && objectData && objectData[fieldName]) {
      const baseField = fieldName.replace('_Name', '');
      const baseMetadata = fieldMetadata[baseField] || {};
      if (baseMetadata.type === 'reference') {
        return true;
      }
    }
    return false;
  };
  
  // Get relationship ID for a field
  const getRelationshipId = (fieldName) => {
    const relationshipIdField = `${fieldName}_Id`;
    if (objectData && objectData[relationshipIdField]) {
      return objectData[relationshipIdField];
    }
    // Try base field ID
    const baseField = fieldName.replace('_Name', '');
    const baseIdField = `${baseField}_Id`;
    if (objectData && objectData[baseIdField]) {
      return objectData[baseIdField];
    }
    // Try the field value itself if it's an ID
    const value = objectData && objectData[fieldName];
    if (value && typeof value === 'string' && value.length === 18) {
      return value;
    }
    return null;
  };
  
  // Format Created By / Last Modified By with timestamp
  const formatUserField = (fieldName) => {
    if (fieldName === 'CreatedById' || fieldName === 'CreatedBy') {
      const userName = objectData && (objectData['CreatedBy_Name'] || objectData['CreatedBy']?.Name);
      const userId = objectData && (objectData['CreatedBy_Id'] || objectData['CreatedBy']?.Id || objectData['CreatedById']);
      const createdDate = objectData && objectData['CreatedDate'];
      
      if (userName || userId) {
        const dateStr = createdDate ? new Date(createdDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
        return { userName: userName || 'Unknown User', userId, dateStr, isCreatedBy: true };
      }
    }
    if (fieldName === 'LastModifiedById' || fieldName === 'LastModifiedBy') {
      const userName = objectData && (objectData['LastModifiedBy_Name'] || objectData['LastModifiedBy']?.Name);
      const userId = objectData && (objectData['LastModifiedBy_Id'] || objectData['LastModifiedBy']?.Id || objectData['LastModifiedById']);
      const modifiedDate = objectData && objectData['LastModifiedDate'];
      
      if (userName || userId) {
        const dateStr = modifiedDate ? new Date(modifiedDate).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
        return { userName: userName || 'Unknown User', userId, dateStr, isCreatedBy: false };
      }
    }
    return null;
  };

  const getFieldLabel = (fieldName) => {
    return fieldLabels[fieldName] || fieldName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  };

  if (!isOpen) return null;

  const dataToDisplay = editing ? editedData : objectData;
  const fields = dataToDisplay ? Object.keys(dataToDisplay).filter(key => 
    key !== 'id' && 
    key !== 'objectType' && 
    !key.startsWith('_') &&
    !key.endsWith('__r') &&
    !key.includes('.') &&
    key !== 'attributes' &&
    !key.endsWith('_Name') && // Exclude relationship name fields from main list (they're displayed with their parent field)
    !key.endsWith('_Id') && // Exclude relationship ID fields
    key !== 'CreatedById' && // Exclude CreatedById (we show CreatedBy with timestamp)
    key !== 'LastModifiedById' && // Exclude LastModifiedById (we show LastModifiedBy with timestamp)
    key !== 'CreatedDate' && // Exclude CreatedDate (shown with CreatedBy)
    key !== 'LastModifiedDate' // Exclude LastModifiedDate (shown with LastModifiedBy)
  ) : [];
  
  // Add CreatedBy and LastModifiedBy fields if we have the data
  if (objectData && !editing) {
    if (objectData['CreatedBy_Name'] || objectData['CreatedById']) {
      if (!fields.includes('CreatedBy')) {
        fields.push('CreatedBy');
      }
    }
    if (objectData['LastModifiedBy_Name'] || objectData['LastModifiedById']) {
      if (!fields.includes('LastModifiedBy')) {
        fields.push('LastModifiedBy');
      }
    }
  }

  // Group fields by sections
  const fieldsBySection = {};
  fields.forEach(fieldName => {
    const section = fieldSections[fieldName] || 'General Information';
    if (!fieldsBySection[section]) {
      fieldsBySection[section] = [];
    }
    fieldsBySection[section].push(fieldName);
  });

  // Sort sections in a logical order
  const sectionOrder = [
    'Information',
    'General Information',
    'Project',
    'Project Objective',
    'Contributor',
    'Account',
    'Client Tool',
    'Contact Information',
    'Status',
    'Dates',
    'Payment',
    'Security & Verification',
    'Custom Fields',
    'Additional Information',
    'System Information'
  ];

  const sortedSections = Object.keys(fieldsBySection).sort((a, b) => {
    const indexA = sectionOrder.indexOf(a);
    const indexB = sectionOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="object-view-modal-overlay" onClick={onClose}>
      <div className="object-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="object-view-modal-header">
          <div className="object-view-modal-title">
            <h2>{objectName || `${objectType} Details`}</h2>
          </div>
          <button className="object-view-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="object-view-modal-content">
          {loading ? (
            <div className="object-view-modal-loading">
              <Loader size={24} className="spinning" />
              <p>Loading object details...</p>
            </div>
          ) : objectData ? (
            <>
              {!editing && !readOnly && (
                <div className="object-view-modal-actions">
                  <button className="btn-primary" onClick={handleEdit}>
                    <Edit size={16} />
                    Edit
                  </button>
                  {objectType === 'Project_Objective__c' && (
                    <button 
                      className="btn-secondary" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddWorkstream();
                      }} 
                      style={{ marginLeft: '8px' }}
                      type="button"
                    >
                      <Plus size={16} />
                      Add Workstream
                    </button>
                  )}
                </div>
              )}

              {editing && (
                <div className="object-view-modal-actions">
                  <button className="btn-secondary" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleUpdate} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader size={16} className="spinning" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Update
                      </>
                    )}
                  </button>
                  {objectType === 'Project_Objective__c' && (
                    <button 
                      className="btn-secondary" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddWorkstream();
                      }} 
                      disabled={saving} 
                      style={{ marginLeft: '8px' }}
                      type="button"
                    >
                      <Plus size={16} />
                      Add Workstream
                    </button>
                  )}
                </div>
              )}

              {/* Tab Navigation - Always show tabs in view mode */}
              {!editing && (
                <div className="object-view-modal-tabs">
                  <button
                    className={`object-view-tab ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    <FileText size={16} />
                    Details
                  </button>
                  <button
                    className={`object-view-tab ${activeTab === 'related' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('related');
                    }}
                    disabled={!Array.isArray(childRelationships) || childRelationships.length === 0}
                    title={(!Array.isArray(childRelationships) || childRelationships.length === 0) ? 'No related records found' : `View ${childRelationships.length} related record types`}
                  >
                    <Link2 size={16} />
                    Related Records {Array.isArray(childRelationships) && childRelationships.length > 0 && `(${childRelationships.length})`}
                  </button>
                  {objectType === 'Project' && (
                    <button
                      className={`object-view-tab ${activeTab === 'funnel' ? 'active' : ''}`}
                      onClick={() => setActiveTab('funnel')}
                      title="View Funnel Report"
                    >
                      <TrendingUp size={16} />
                      Funnel Report
                    </button>
                  )}
                </div>
              )}

              {/* Tab Content */}
              {activeTab === 'details' && (
                <div className="object-view-modal-fields">
                {sortedSections.map((sectionName) => {
                  const sectionFields = fieldsBySection[sectionName];
                  if (!sectionFields || sectionFields.length === 0) return null;
                  
                  // Group fields in this section into rows of 2 columns (4 fields per row)
                  const fieldRows = [];
                  for (let i = 0; i < sectionFields.length; i += 4) {
                    fieldRows.push(sectionFields.slice(i, i + 4));
                  }
                  
                  return (
                    <div key={sectionName} className="object-view-section">
                      <h3 className="object-view-section-title">{sectionName}</h3>
                      {fieldRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="object-view-field-row">
                          {row.map((fieldName) => {
                            const metadata = fieldMetadata[fieldName] || {};
                            // Field is updateable if metadata.updateable is explicitly true
                            // In view mode, all fields are displayable (not disabled)
                            const isUpdateable = editing ? (metadata.updateable === true) : true;
                            
                            // Check if this is a Created By / Last Modified By field
                            const userFieldInfo = formatUserField(fieldName);
                            const isRelationship = !userFieldInfo && isRelationshipField(fieldName);
                            const relationshipId = isRelationship ? getRelationshipId(fieldName) : null;
                            
                            return (
                              <div key={fieldName} className="object-view-field">
                                <div className="object-view-field-label">
                                  {getFieldLabel(fieldName)}:
                                </div>
                                <div className="object-view-field-value">
                                  {editing ? (
                                    // Check if field is a picklist
                                    metadata.picklistValues && metadata.picklistValues.length > 0 ? (
                                      <select
                                        value={editedData[fieldName] !== null && editedData[fieldName] !== undefined ? String(editedData[fieldName]) : ''}
                                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                        className={`object-view-field-select ${!isUpdateable ? 'disabled' : ''}`}
                                        disabled={!isUpdateable}
                                      >
                                        <option value="">--None--</option>
                                        {metadata.picklistValues.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={editedData[fieldName] !== null && editedData[fieldName] !== undefined ? String(editedData[fieldName]) : ''}
                                        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                        className={`object-view-field-input ${!isUpdateable ? 'disabled' : ''}`}
                                        disabled={!isUpdateable}
                                        readOnly={!isUpdateable}
                                      />
                                    )
                                  ) : userFieldInfo ? (
                                    // Display Created By / Last Modified By with icon and timestamp
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%', 
                                        background: '#0176d3', 
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        flexShrink: 0
                                      }}>
                                        {userFieldInfo.userName ? userFieldInfo.userName.charAt(0).toUpperCase() : 'U'}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {relationshipId ? (
                                          <a
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              // Could open user modal here if needed
                                            }}
                                            style={{ 
                                              color: '#0176d3', 
                                              textDecoration: 'underline',
                                              cursor: 'pointer',
                                              fontSize: '14px'
                                            }}
                                          >
                                            {userFieldInfo.userName}
                                          </a>
                                        ) : (
                                          <span style={{ fontSize: '14px', color: '#0176d3' }}>{userFieldInfo.userName}</span>
                                        )}
                                        {userFieldInfo.dateStr && (
                                          <span style={{ fontSize: '12px', color: '#666' }}>{userFieldInfo.dateStr}</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : isRelationship && relationshipId ? (
                                    // Display relationship field as clickable link
                                    <a
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        // Could open related record modal here if needed
                                      }}
                                      style={{ 
                                        color: '#0176d3', 
                                        textDecoration: 'underline',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {formatFieldValue(dataToDisplay[fieldName], fieldName)}
                                    </a>
                                  ) : (
                                    <span>{formatFieldValue(dataToDisplay[fieldName], fieldName)}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              )}

              {/* Related Records Tab */}
              {activeTab === 'related' && (
                <div className="object-view-related-records">
                  {childRelationships.length > 0 ? (
                    childRelationships.map((rel) => {
                      const records = relatedRecords[rel.relationshipName] || [];
                      
                      // Get field names from first record if available
                      let recordFields = [];
                      if (records.length > 0 && records[0]) {
                        recordFields = Object.keys(records[0]).filter(key => 
                          key !== 'attributes' && 
                          key !== 'Id' &&
                          !key.includes('__r')
                        );
                      }
                      
                      return (
                        <div key={rel.relationshipName} className="object-view-related-section">
                          <h3 className="object-view-section-title">
                            {rel.label || rel.childSObject} ({records.length} {records.length === 1 ? 'record' : 'records'})
                          </h3>
                          {records.length > 0 ? (
                            <div className="object-view-related-table-container">
                              <table className="object-view-related-table">
                                <thead>
                                  <tr>
                                    {recordFields.slice(0, 12).map(field => (
                                      <th key={field}>
                                        {field.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/__c/g, '').trim()}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {records.map((record, idx) => (
                                    <tr key={record.Id || idx}>
                                      {recordFields.slice(0, 12).map(field => (
                                        <td key={field}>
                                          {formatFieldValue(record[field], field)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="object-view-no-related">
                              <p>No records found for {rel.label || rel.childSObject}.</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="object-view-no-related">
                      <p>No related records found for this object.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Funnel Report Tab */}
              {activeTab === 'funnel' && objectType === 'Project' && (
                <div className="object-view-funnel-tab">
                  {funnelLoading ? (
                    <div className="object-view-modal-loading">
                      <Loader size={24} className="spinning" />
                      <p>Loading funnel data...</p>
                    </div>
                  ) : funnelData ? (
                    <>
                      {/* Project Roster Funnel Chart - First Chart */}
                      <div className="chart-card" style={{ marginBottom: '24px' }}>
                        <ProjectRosterFunnelChart data={funnelData.rosterFunnel || []} />
                      </div>
                      
                      {/* Existing Funnel Charts */}
                      <FunnelChart
                        data={funnelData}
                        error={funnelError}
                        onRefresh={fetchFunnelData}
                        refreshing={funnelLoading}
                      />
                    </>
                  ) : (
                    <div className="no-data-message" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                      <p>No funnel data available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Workstream Form Section */}
              {showWorkstreamForm && objectType === 'Project_Objective__c' && (
                <div 
                  className="object-view-workstream-form" 
                  style={{ 
                    marginTop: '32px', 
                    paddingTop: '32px', 
                    borderTop: '2px solid #e5e7eb',
                    display: 'block',
                    visibility: 'visible'
                  }}
                >
                  <h3 className="object-view-section-title" style={{ marginBottom: '20px' }}>Add New Workstream</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#002329' }}>
                          Project Workstream Name
                        </label>
                        <input
                          type="text"
                          value={workstreamData.projectWorkstreamName}
                          onChange={(e) => handleWorkstreamInputChange('projectWorkstreamName', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'Poppins'
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#002329' }}>
                          Project Objective <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={workstreamData.projectObjective}
                          readOnly
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'Poppins',
                            backgroundColor: '#f5f5f5',
                            color: '#6b7280',
                            cursor: 'not-allowed'
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: '#002329', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={workstreamData.refresh}
                            onChange={(e) => handleWorkstreamInputChange('refresh', e.target.checked)}
                            style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span>Refresh</span>
                          <Info size={12} style={{ marginLeft: '6px', color: '#6b7280' }} />
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#002329' }}>
                          Delivery Tool Name <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <select
                          value={workstreamData.deliveryToolName}
                          onChange={(e) => handleWorkstreamInputChange('deliveryToolName', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'Poppins',
                            backgroundColor: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">--None--</option>
                          {deliveryToolNameOptions.filter(opt => opt !== '--None--').map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#002329' }}>
                          Client Workstream Identifier <span style={{ color: '#dc2626' }}>*</span>
                          <Info size={12} style={{ marginLeft: '6px', color: '#6b7280', verticalAlign: 'middle' }} />
                        </label>
                        <input
                          type="text"
                          value={workstreamData.clientWorkstreamIdentifier}
                          onChange={(e) => handleWorkstreamInputChange('clientWorkstreamIdentifier', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'Poppins'
                          }}
                        />
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#002329' }}>
                          Functionality <span style={{ color: '#dc2626' }}>*</span>
                          <Info size={12} style={{ marginLeft: '6px', color: '#6b7280', verticalAlign: 'middle' }} />
                        </label>
                        <select
                          value={workstreamData.functionality}
                          onChange={(e) => handleWorkstreamInputChange('functionality', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'Poppins',
                            backgroundColor: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">--None--</option>
                          {functionalityOptions.filter(opt => opt !== '--None--').map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      className="btn-secondary"
                      onClick={handleCancelWorkstream}
                      disabled={creatingWorkstream}
                      style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600' }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleCreateWorkstream}
                      disabled={creatingWorkstream}
                      style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600' }}
                    >
                      {creatingWorkstream ? (
                        <>
                          <Loader size={16} className="spinning" style={{ marginRight: '8px', display: 'inline-block' }} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save size={16} style={{ marginRight: '8px', display: 'inline-block' }} />
                          Create Workstream
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="object-view-modal-error">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectViewModal;

