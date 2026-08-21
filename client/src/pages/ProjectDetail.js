import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { saveDraftProject, loadDraftProject } from '../utils/draftStorage';
import { CheckCircle, XCircle, Edit, ArrowLeft, Menu, FileJson, X, Copy, Check, Loader } from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import '../styles/ProjectConfirmation.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, hasPermission, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        // If ID is provided, fetch from API
        if (id) {
          const response = await apiClient.get(`/projects/${id}`);
          setProjectData(response.data);
        } else {
          // Try to load from draft storage (if navigated from ViewProjects)
          const draftData = await loadDraftProject();
          if (draftData) {
            setProjectData(draftData);
            setLoading(false);
            return;
          }
          toast.error('No project data found');
          navigate('/projects');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Error loading project details');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, navigate]);

  const handleEdit = async () => {
    if (projectData) {
      await saveDraftProject(projectData);
      navigate('/setup');
    }
  };

  const handleViewJson = () => {
    setShowJsonModal(true);
    setCopied(false);
  };

  const handleCopyJson = () => {
    if (projectData) {
      const jsonString = JSON.stringify(projectData, null, 2);
      navigator.clipboard.writeText(jsonString).then(() => {
        setCopied(true);
        toast.success('JSON copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error('Failed to copy JSON');
      });
    }
  };

  const handleCloseJsonModal = () => {
    setShowJsonModal(false);
    setCopied(false);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="empty">Not provided</span>;
    }
    if (typeof value === 'boolean') {
      return value ? <CheckCircle size={16} className="check-icon" /> : <XCircle size={16} className="x-icon" />;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return JSON.stringify(value, null, 2);
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : <span className="empty">Not provided</span>;
    }
    return String(value);
  };

  const sections = [
    {
      title: 'Information',
      fields: [
        { key: 'auditorProject', label: 'Auditor Project' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'shortProjectName', label: 'Short Project Name' },
        { key: 'contributorProjectName', label: 'Contributor Project Name' },
        { key: 'appenPartner', label: 'Appen Partner' },
        { key: 'jobCategory', label: 'Job Category' },
        { key: 'projectShortDescription', label: 'Project Short Description' },
        { key: 'projectLongDescription', label: 'Project Long Description' },
        { key: 'projectType', label: 'Project Type' },
        { key: 'projectPriority', label: 'Project Priority' },
        { key: 'projectIdForReports', label: 'Project ID for Reports' },
        { key: 'workdayProjectId', label: 'Workday Project ID' },
        { key: 'account', label: 'Account' },
        { key: 'programName', label: 'Program Name' },
        { key: 'hireStartDate', label: 'Hire Start Date' },
        { key: 'predictedCloseDate', label: 'Predicted Close Date' },
        { key: 'deliveryToolOrg', label: 'Delivery Tool Org' },
        { key: 'deliveryToolName', label: 'Delivery Tool Name' },
        { key: 'projectPage', label: 'Project Page' },
        { key: 'projectStatus', label: 'Project Status' }
      ]
    },
    {
      title: 'Contributor Active Status',
      fields: [
        { key: 'paymentSetupRequired', label: 'Payment Setup Required' },
        { key: 'manualActivationRequired', label: 'Manual Activation Required' },
        { key: 'clientToolAccountRequired', label: 'Client Tool Account Required' }
      ]
    },
    {
      title: 'People',
      fields: [
        { key: 'programManager', label: 'Program Manager' },
        { key: 'projectManager', label: 'Project Manager' },
        { key: 'qualityLead', label: 'Quality Lead' },
        { key: 'productivityLead', label: 'Productivity Lead' },
        { key: 'reportingLead', label: 'Reporting Lead' },
        { key: 'invoicingLead', label: 'Invoicing Lead' },
        { key: 'projectSupportLead', label: 'Project Support Lead' },
        { key: 'casesDCSupportTeam', label: 'Cases DC Support Team' },
        { key: 'recruitmentLead', label: 'Recruitment Lead' },
        { key: 'qualificationLead', label: 'Qualification Lead' },
        { key: 'onboardingLead', label: 'Onboarding Lead' }
      ]
    },
    {
      title: 'Rates',
      fields: [
        { key: 'projectIncentive', label: 'Project Incentive' }
      ]
    },
    {
      title: 'Funnel Totals',
      fields: [
        { key: 'totalApplied', label: 'Total Applied' },
        { key: 'totalQualified', label: 'Total Qualified' }
      ]
    },
    {
      title: 'Funnel Stages',
      fields: [
        { key: 'invitedAvailableContributors', label: 'Invited Available Contributors' },
        { key: 'registeredContributors', label: 'Registered Contributors' },
        { key: 'appReceived', label: 'App Received' },
        { key: 'qualifiedContributors', label: 'Qualified Contributors' },
        { key: 'matchedContributors', label: 'Matched Contributors' },
        { key: 'activeContributors', label: 'Active Contributors' },
        { key: 'acAccount', label: 'AC Account' },
        { key: 'productionContributors', label: 'Production Contributors' },
        { key: 'appliedContributors', label: 'Applied Contributors' },
        { key: 'removed', label: 'Removed' }
      ]
    },
    {
      title: 'Lever Requisition Actions',
      fields: [
        { key: 'requisitionAction', label: 'Requisition Action' }
      ]
    },
    {
      title: 'Lever Requisition Fields',
      fields: [
        { key: 'leverReqName', label: 'Lever Req Name' },
        { key: 'requisitionStatus', label: 'Requisition Status' },
        { key: 'leverReqCode', label: 'Lever Req Code' },
        { key: 'leverTimeToFillStart', label: 'Lever Time to Fill Start' },
        { key: 'leverCrowdHiringManagerEmail', label: 'Lever Crowd Hiring Manager Email' },
        { key: 'leverTimeToFillEnd', label: 'Lever Time to Fill End' },
        { key: 'leverCrowdOwnerEmail', label: 'Lever Crowd Owner Email' },
        { key: 'leverReqDescription', label: 'Lever Req Description' },
        { key: 'leverCompensationBand', label: 'Lever Compensation Band' },
        { key: 'leverLocation', label: 'Lever Location' },
        { key: 'leverDepartment', label: 'Lever Department' },
        { key: 'leverWorkType', label: 'Lever Work Type' },
        { key: 'leverSVP', label: 'Lever SVP' },
        { key: 'leverSVP2', label: 'Lever SVP2' }
      ]
    },
    {
      title: 'Lever Admin',
      fields: [
        { key: 'leverRequisitionID', label: 'Lever Requisition ID' },
        { key: 'leverRequisitionCreateDate', label: 'Lever Requisition Create Date' }
      ]
    },
    {
      title: 'Payment Configurations',
      fields: [
        { key: 'projectPaymentMethod', label: 'Project Payment Method' },
        { key: 'requirePMApprovalForProductivity', label: 'Require PM Approval for Productivity' },
        { key: 'releaseSystemTrackedData', label: 'Release System Tracked Data' }
      ]
    },
    {
      title: 'Activation',
      fields: [
        { key: 'activateCommsInvited', label: 'Activate Comms Invited' },
        { key: 'activateCommsApplied', label: 'Activate Comms Applied' },
        { key: 'activateCommsOnboarding', label: 'Activate Comms Onboarding' },
        { key: 'activateCommsFailed', label: 'Activate Comms Failed' }
      ]
    },
    {
      title: 'System Information',
      fields: [
        { key: 'id', label: 'Project ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'createdBy', label: 'Created By' },
        { key: 'updatedAt', label: 'Updated At' },
        { key: 'updatedBy', label: 'Updated By' },
        { key: 'salesforceId', label: 'Salesforce ID' },
        { key: 'salesforceSyncStatus', label: 'Salesforce Sync Status' },
        { key: 'salesforceObjectType', label: 'Salesforce Object Type' },
        { key: 'salesforceSyncedAt', label: 'Salesforce Synced At' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="confirmation-container" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '16px' }}>
          <Loader className="spinner" size={24} style={{ color: '#0176d3' }} />
          <p style={{ color: '#706e6b', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="confirmation-container" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease' }}>
          <div className="confirmation-content">
            <p>Project not found</p>
            <button onClick={() => navigate('/projects')} className="btn-primary">
              <ArrowLeft size={16} />
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="confirmation-container" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.2s ease, width 0.2s ease' }}>
        <div className="confirmation-header">
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
                <h1 className="page-title">Project Details</h1>
                <p className="page-subtitle">View all project information</p>
              </div>
            </div>
            <div className="header-user-profile">
              <UserProfileDropdown />
            </div>
          </div>
        </div>

        <div className="confirmation-content">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="confirmation-section neumorphic fade-in">
              <h2>{section.title}</h2>
              <div className="confirmation-grid">
                {section.fields.map((field) => (
                  <div key={field.key} className="confirmation-field">
                    <label>{field.label}</label>
                    <div className="field-value">
                      {formatValue(projectData[field.key])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="confirmation-actions">
          <button
            onClick={() => navigate('/projects')}
            className="btn-secondary"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>
          <button
            onClick={handleViewJson}
            className="btn-secondary"
          >
            <FileJson size={20} />
            View JSON
          </button>
          <button
            onClick={handleEdit}
            className="btn-primary"
          >
            <Edit size={20} />
            Edit Project
          </button>
        </div>
      </div>

      {/* JSON View Modal */}
      {showJsonModal && projectData && (
        <div className="json-modal-overlay" onClick={handleCloseJsonModal}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <div className="json-modal-header">
              <div className="json-modal-title">
                <FileJson size={20} />
                <h2>Project JSON - {projectData.projectName || projectData.name || 'Untitled'}</h2>
              </div>
              <div className="json-modal-actions">
                <button 
                  onClick={handleCopyJson} 
                  className="btn-icon btn-copy"
                  title={copied ? 'Copied!' : 'Copy JSON'}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button 
                  onClick={handleCloseJsonModal} 
                  className="btn-icon btn-close"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="json-modal-content">
              <pre className="json-content">
                {JSON.stringify(projectData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

