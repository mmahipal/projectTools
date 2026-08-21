import React, { useState, useEffect } from 'react';
import { X, Search, Info, Loader, Send } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import './NewPaymentAdjustmentModal.css';

const NewPaymentAdjustmentModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    Name: '',
    Contributor__c: '',
    Contributor_Project__c: '',
    Adjustment_Type__c: '',
    Payment_ID__c: '',
    Contributor_Facing_Project_Name__c: '',
    Status__c: '',
    Payment_Adjustment_Date__c: '',
    Payment_Adjustment_Date_Text__c: '',
    Payment_Adjustment_Amount__c: '',
    Adjustment_Notes__c: ''
  });

  const [contributorSearchTerm, setContributorSearchTerm] = useState('');
  const [contributorSearchResults, setContributorSearchResults] = useState([]);
  const [showContributorDropdown, setShowContributorDropdown] = useState(false);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState(null);

  const [contributorProjectSearchTerm, setContributorProjectSearchTerm] = useState('');
  const [contributorProjectSearchResults, setContributorProjectSearchResults] = useState([]);
  const [showContributorProjectDropdown, setShowContributorProjectDropdown] = useState(false);
  const [loadingContributorProjects, setLoadingContributorProjects] = useState(false);
  const [selectedContributorProject, setSelectedContributorProject] = useState(null);

  const [publishing, setPublishing] = useState(false);

  // Dropdown options
  const adjustmentTypeOptions = ['--None--', 'Bonus', 'Referral', 'Adjustment', 'Appen China', 'PreCrowdGen', 'Garnishment', 'Quick Tasks', 'Incentives'];
  const statusOptions = ['--None--', 'In Review', 'Approved', 'Rejected', 'Payment Created', 'Unpaid', 'Paid'];

  // Search contributors
  useEffect(() => {
    if (contributorSearchTerm && contributorSearchTerm.length > 2) {
      const timeoutId = setTimeout(() => {
        searchContributors(contributorSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setContributorSearchResults([]);
      setShowContributorDropdown(false);
    }
  }, [contributorSearchTerm]);

  const searchContributors = async (searchTerm) => {
    setLoadingContributors(true);
    try {
      const response = await apiClient.get(`/payment-adjustments/search-contributors?q=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        setContributorSearchResults(response.data.contributors || []);
        setShowContributorDropdown(true);
      }
    } catch (error) {
      console.error('Error searching contributors:', error);
    } finally {
      setLoadingContributors(false);
    }
  };

  // Search contributor projects
  useEffect(() => {
    if (contributorProjectSearchTerm && contributorProjectSearchTerm.length > 2) {
      const timeoutId = setTimeout(() => {
        searchContributorProjects(contributorProjectSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setContributorProjectSearchResults([]);
      setShowContributorProjectDropdown(false);
    }
  }, [contributorProjectSearchTerm]);

  const searchContributorProjects = async (searchTerm) => {
    setLoadingContributorProjects(true);
    try {
      const response = await apiClient.get(`/payment-adjustments/search-contributor-projects?q=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        setContributorProjectSearchResults(response.data.projects || []);
        setShowContributorProjectDropdown(true);
      }
    } catch (error) {
      console.error('Error searching contributor projects:', error);
    } finally {
      setLoadingContributorProjects(false);
    }
  };

  const handleContributorSelect = (contributor) => {
    setSelectedContributor(contributor);
    setFormData({ ...formData, Contributor__c: contributor.Id });
    setContributorSearchTerm(contributor.Name);
    setShowContributorDropdown(false);
    setContributorSearchResults([]);
  };

  const handleContributorProjectSelect = (project) => {
    setSelectedContributorProject(project);
    setFormData({ ...formData, Contributor_Project__c: project.Id });
    setContributorProjectSearchTerm(project.Name);
    setShowContributorProjectDropdown(false);
    setContributorProjectSearchResults([]);
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePublish = async () => {
    // Validate required fields
    if (!formData.Name || formData.Name.trim() === '') {
      toast.error('Payment Adjustment Name is required');
      return;
    }

    setPublishing(true);
    try {
      const response = await apiClient.post('/payment-adjustments', formData);
      if (response.data.success) {
        toast.success('Payment Adjustment published successfully');
        if (onSave) {
          onSave(response.data.record);
        }
        onClose();
      } else {
        toast.error(response.data.error || 'Failed to publish Payment Adjustment');
      }
    } catch (error) {
      console.error('Error publishing payment adjustment:', error);
      toast.error(error.response?.data?.error || 'Failed to publish Payment Adjustment');
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-adjustment-modal-overlay" onClick={onClose}>
      <div className="payment-adjustment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-adjustment-modal-header">
          <h2>New Payment Adjustment</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>* = Required Information</span>
            <button className="payment-adjustment-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="payment-adjustment-modal-body">
          {/* Information Section */}
          <div className="payment-adjustment-section">
            <h3 className="payment-adjustment-section-title">Information</h3>
            <div className="payment-adjustment-form-grid">
              {/* Left Column */}
              <div className="payment-adjustment-form-column">
                <div className="payment-adjustment-form-group">
                  <label>
                    Payment Adjustment Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.Name}
                    onChange={(e) => handleFieldChange('Name', e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="payment-adjustment-form-group">
                  <label>Contributor</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} className="payment-adjustment-search-icon" />
                    <input
                      type="text"
                      value={contributorSearchTerm}
                      onChange={(e) => {
                        setContributorSearchTerm(e.target.value);
                        setShowContributorDropdown(true);
                        if (!e.target.value) {
                          setFormData({ ...formData, Contributor__c: '' });
                          setSelectedContributor(null);
                        }
                      }}
                      onFocus={() => {
                        if (contributorSearchResults.length > 0) {
                          setShowContributorDropdown(true);
                        }
                      }}
                      placeholder="Search Contributors..."
                      className="payment-adjustment-search-input"
                    />
                    {loadingContributors && (
                      <Loader size={16} className="spinning" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#08979C' }} />
                    )}
                    {showContributorDropdown && contributorSearchResults.length > 0 && (
                      <div className="payment-adjustment-dropdown">
                        {contributorSearchResults.map((contributor) => (
                          <div
                            key={contributor.Id}
                            className="payment-adjustment-dropdown-item"
                            onClick={() => handleContributorSelect(contributor)}
                          >
                            {contributor.Name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="payment-adjustment-form-group">
                  <label>Contributor Project</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} className="payment-adjustment-search-icon" />
                    <input
                      type="text"
                      value={contributorProjectSearchTerm}
                      onChange={(e) => {
                        setContributorProjectSearchTerm(e.target.value);
                        setShowContributorProjectDropdown(true);
                        if (!e.target.value) {
                          setFormData({ ...formData, Contributor_Project__c: '' });
                          setSelectedContributorProject(null);
                        }
                      }}
                      onFocus={() => {
                        if (contributorProjectSearchResults.length > 0) {
                          setShowContributorProjectDropdown(true);
                        }
                      }}
                      placeholder="Search Contributor Projects..."
                      className="payment-adjustment-search-input"
                    />
                    {loadingContributorProjects && (
                      <Loader size={16} className="spinning" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#08979C' }} />
                    )}
                    {showContributorProjectDropdown && contributorProjectSearchResults.length > 0 && (
                      <div className="payment-adjustment-dropdown">
                        {contributorProjectSearchResults.map((project) => (
                          <div
                            key={project.Id}
                            className="payment-adjustment-dropdown-item"
                            onClick={() => handleContributorProjectSelect(project)}
                          >
                            {project.Name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="payment-adjustment-form-group">
                  <label>Adjustment Type</label>
                  <select
                    value={formData.Adjustment_Type__c}
                    onChange={(e) => handleFieldChange('Adjustment_Type__c', e.target.value)}
                  >
                    {adjustmentTypeOptions.map(option => (
                      <option key={option} value={option === '--None--' ? '' : option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="payment-adjustment-form-group">
                  <label>Payment ID</label>
                  <input
                    type="text"
                    value={formData.Payment_ID__c}
                    onChange={(e) => handleFieldChange('Payment_ID__c', e.target.value)}
                    placeholder=""
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="payment-adjustment-form-column">
                <div className="payment-adjustment-form-group">
                  <label>Contributor Facing Project Name</label>
                  <input
                    type="text"
                    value={formData.Contributor_Facing_Project_Name__c}
                    onChange={(e) => handleFieldChange('Contributor_Facing_Project_Name__c', e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="payment-adjustment-form-group">
                  <label>Status</label>
                  <select
                    value={formData.Status__c}
                    onChange={(e) => handleFieldChange('Status__c', e.target.value)}
                  >
                    {statusOptions.map(option => (
                      <option key={option} value={option === '--None--' ? '' : option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="payment-adjustment-form-group">
                  <label>
                    Payment Adjustment Date
                    <Info size={14} style={{ marginLeft: '4px', color: '#666', cursor: 'help' }} title="Select the date for this payment adjustment" />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      value={formData.Payment_Adjustment_Date__c}
                      onChange={(e) => handleFieldChange('Payment_Adjustment_Date__c', e.target.value)}
                      style={{ paddingRight: '32px' }}
                    />
                  </div>
                </div>

                <div className="payment-adjustment-form-group">
                  <label>Payment Adjustment Date Text</label>
                  <input
                    type="text"
                    value={formData.Payment_Adjustment_Date_Text__c}
                    onChange={(e) => handleFieldChange('Payment_Adjustment_Date_Text__c', e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="payment-adjustment-form-group">
                  <label>Payment Adjustment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.Payment_Adjustment_Amount__c}
                    onChange={(e) => handleFieldChange('Payment_Adjustment_Amount__c', e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="payment-adjustment-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Adjustment Notes</label>
                  <textarea
                    value={formData.Adjustment_Notes__c}
                    onChange={(e) => handleFieldChange('Adjustment_Notes__c', e.target.value)}
                    placeholder=""
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="payment-adjustment-modal-footer">
          <button
            className="payment-adjustment-btn-cancel"
            onClick={onClose}
            disabled={publishing}
          >
            Cancel
          </button>
          <button
            className="payment-adjustment-btn-publish"
            onClick={handlePublish}
            disabled={publishing}
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
    </div>
  );
};

export default NewPaymentAdjustmentModal;

