import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { getErrorMessage, handleError } from '../utils/errorHandler';
import { sanitizeObject } from '../utils/security';
import { Search, Info, Menu, Send, LogOut, Eye, Loader, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import PreviewModal from '../components/PreviewModal';
import ConfirmModal from '../components/ConfirmModal';
import useSidebarWidth from '../hooks/useSidebarWidth';
import BookmarkButton from '../components/BookmarkButton';
import '../styles/ProjectSetup.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';
import './AddContributorReview.css';

const AddContributorReview = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);

  // Lookup states
  const [contributors, setContributors] = useState([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [contributorSearchTerm, setContributorSearchTerm] = useState('');
  const [showContributorDropdown, setShowContributorDropdown] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState(null);
  
  const [reviewers, setReviewers] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [reviewerSearchTerm, setReviewerSearchTerm] = useState('');
  const [showReviewerDropdown, setShowReviewerDropdown] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [interviewRecordingFile, setInterviewRecordingFile] = useState(null);
  const interviewRecordingFileInputRef = useRef(null);
  

  // Yes/No/--None-- options
  const yesNoOptions = ['--None--', 'Yes', 'No'];

  // Resume Review Result options
  const resumeReviewResultOptions = [
    '--None--',
    'Excellent - Very well-structured, complete, and polished. Strong content and formatting.',
    'Good - Solid resume with all major sections. Minor formatting or content issues.',
    'Fair - Has key sections but lacks depth, polish, or clarity in places.',
    'Poor - Sparse, missing sections, or weak content. Possibly unpolished or unclear.',
    'Invalid - Not a resume (e.g., blank, spam, or missing key sections)'
  ];

  // LinkedIn Review Result options (from screenshot 2025-12-03 at 19.20.44)
  const linkedInReviewResultOptions = [
    '--None--',
    'Excellent - Fully filled-out profile with rich content, keywords, and clear career story.',
    'Good - Mostly complete and readable, with some minor missing pieces or polish needed.',
    'Fair - Basic profile present, but light on detail, weak descriptions, or outdated info.',
    'Poor - Sparse, generic, or missing key sections like Experience or Education',
    'Invalid - Not a real or usable profile (e.g., private, almost empty, or non-human)'
  ];

  // Profile Review Result options (from screenshot 2025-12-03 at 19.20.59)
  const profileReviewResultOptions = [
    '--None--',
    'Excellent - Fully completed profile with rich, valuable content. Clean, consistent, and free from data discrepancies.',
    'Good - Mostly complete profile with minor inconsistencies or small data gaps. Any issues appear to be simple oversights or input errors.',
    'Fair - Basic profile with several missing sections or mismatched information. Issues seem more circumstantial than accidental.',
    'Poor - Significant sections of data are missing. Multiple inconsistencies suggest the profile is likely incomplete or unreliable.'
  ];

  // Interview Result options
  const interviewResultOptions = [
    '--None--',
    'Excellent - Fully completed profile with rich, valuable content. Clean, consistent, and free from data discrepancies.',
    'Good - Mostly complete profile with minor inconsistencies or small data gaps. Any issues appear to be simple oversights or input errors.',
    'Fair - Basic profile with several missing sections or mismatched information. Issues seem more circumstantial than accidental.',
    'Poor - Significant sections of data are missing. Multiple inconsistencies suggest the profile is likely incomplete or unreliable.'
  ];


  // Search Contributors
  useEffect(() => {
    const searchContributors = async () => {
      if (!contributorSearchTerm || contributorSearchTerm.trim() === '') {
        setContributors([]);
        setShowContributorDropdown(false);
        setLoadingContributors(false);
        return;
      }

      setLoadingContributors(true);
      setShowContributorDropdown(true); // Show dropdown immediately when searching starts
      try {
        const response = await apiClient.get(`/salesforce/search-people?search=${encodeURIComponent(contributorSearchTerm)}`);
        if (response.data.success) {
          // Filter to only Contacts for contributors
          const contacts = (response.data.people || []).filter(p => p.type === 'Contact');
          setContributors(contacts.map(c => ({ Id: c.id, Name: c.name })));
        } else {
          setContributors([]);
        }
      } catch (error) {
        handleError(error, 'AddContributorReview - searchContributors');
        setContributors([]);
      } finally {
        setLoadingContributors(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchContributors();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [contributorSearchTerm]);

  // Search Reviewers (Users)
  useEffect(() => {
    const searchReviewers = async () => {
      if (!reviewerSearchTerm || reviewerSearchTerm.trim() === '') {
        setReviewers([]);
        return;
      }

      setLoadingReviewers(true);
      try {
        const response = await apiClient.get(`/salesforce/search-people?search=${encodeURIComponent(reviewerSearchTerm)}`);
        if (response.data.success) {
          // Filter to only Users for reviewers
          const users = (response.data.people || []).filter(p => p.type === 'User');
          setReviewers(users.map(u => ({ Id: u.id, Name: u.name })));
          setShowReviewerDropdown(true);
        }
      } catch (error) {
        handleError(error, 'AddContributorReview - searchReviewers');
        setReviewers([]);
      } finally {
        setLoadingReviewers(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchReviewers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [reviewerSearchTerm]);

  const handleContributorSelect = (contributor) => {
    setSelectedContributor(contributor);
    setValue('contributorId', contributor.Id);
    setValue('contributorName', contributor.Name);
    setContributorSearchTerm(contributor.Name);
    setShowContributorDropdown(false);
  };

  const handleReviewerSelect = (reviewer) => {
    setSelectedReviewer(reviewer);
    setValue('reviewerId', reviewer.Id);
    setValue('reviewerName', reviewer.Name);
    setReviewerSearchTerm(reviewer.Name);
    setShowReviewerDropdown(false);
  };

  const handlePreview = () => {
    // Get current form data
    const currentFormData = watch();
    console.log('Preview form data:', currentFormData);
    setShowPreviewModal(true);
  };

  const handlePublish = async () => {
    setShowPublishConfirm(false);
    setPublishing(true);
    
    try {
      const formData = watch();
      const sanitizedData = sanitizeObject(formData);
      
      // Create FormData if there's a file to upload
      let requestData;
      let config = {};
      
      if (interviewRecordingFile) {
        const formDataToSend = new FormData();
        Object.keys(sanitizedData).forEach(key => {
          if (sanitizedData[key] !== null && sanitizedData[key] !== undefined && sanitizedData[key] !== '') {
            formDataToSend.append(key, sanitizedData[key]);
          }
        });
        formDataToSend.append('interviewRecordingFile', interviewRecordingFile);
        requestData = formDataToSend;
        config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
      } else {
        requestData = sanitizedData;
      }
      
      const response = await apiClient.post('/salesforce/create-contributor-review', requestData, config);
      
      if (response.data.success) {
        toast.success('Contributor Review created successfully in Salesforce');
        // Reset form
        reset();
        setSelectedContributor(null);
        setContributorSearchTerm('');
        setSelectedReviewer(null);
        setReviewerSearchTerm('');
        setInterviewRecordingFile(null);
        if (interviewRecordingFileInputRef.current) {
          interviewRecordingFileInputRef.current.value = '';
        }
      } else {
        toast.error(response.data.error || 'Failed to create Contributor Review');
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || 'Failed to create Contributor Review');
      handleError(error, 'AddContributorReview - handlePublish');
    } finally {
      setPublishing(false);
    }
  };

  const formData = watch();

  return (
    <div className="dashboard-layout add-contributor-review-page">
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
                  <h1 className="page-title">Add Contributor Review</h1>
                  <p className="page-subtitle">Create a new contributor review record in Salesforce</p>
                </div>
              </div>
              <div className="header-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookmarkButton pageName="Add Contributor Review" pageType="page" />
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

          <form onSubmit={handleSubmit(() => setShowPublishConfirm(true))} className="setup-form">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr 1fr', 
              gap: '20px 24px',
              padding: '24px',
              maxWidth: '100%'
            }}>
              {/* Contributor Field */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>
                  Contributor <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div className="contributor-search-wrapper" style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className={`contributor-search-input ${loadingContributors ? 'loading' : ''}`}
                      placeholder="Search for contributor..."
                      value={contributorSearchTerm}
                      onChange={(e) => {
                        setContributorSearchTerm(e.target.value);
                        setShowContributorDropdown(true);
                      }}
                      onFocus={() => setShowContributorDropdown(true)}
                      style={{
                        width: '100%',
                        border: errors.contributorId ? '1px solid #dc2626' : '1px solid #d8dde6',
                        borderRadius: '6px',
                        boxSizing: 'border-box',
                        textIndent: 0,
                        lineHeight: 'normal'
                      }}
                    />
                    {loadingContributors && (
                      <div style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        zIndex: 2,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px'
                      }}>
                        <Loader size={16} className="spinning" style={{ color: '#08979C' }} />
                      </div>
                    )}
                  </div>
                  {(showContributorDropdown || loadingContributors) && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #d8dde6',
                      borderRadius: '6px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {loadingContributors ? (
                        <div style={{ padding: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <Loader size={16} className="spinning" style={{ color: '#08979C' }} />
                          <span style={{ fontSize: '13px', color: '#666' }}>Searching...</span>
                        </div>
                      ) : contributors.length > 0 ? (
                        contributors.map((contributor) => (
                          <div
                            key={contributor.Id}
                            onClick={() => handleContributorSelect(contributor)}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                          >
                            {contributor.Name}
                          </div>
                        ))
                      ) : contributorSearchTerm.trim() !== '' ? (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                          No contributors found
                        </div>
                      ) : null}
                    </div>
                  )}
                  <input type="hidden" {...register('contributorId', { required: 'Contributor is required' })} />
                  <input type="hidden" {...register('contributorName')} />
                </div>
                {errors.contributorId && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {errors.contributorId.message}
                  </span>
                )}
              </div>

              {/* Contributor Resume Review Section */}
              <div style={{ gridColumn: 'span 4', marginTop: '16px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#002329', margin: 0, paddingBottom: '8px', borderBottom: '1px solid #d8dde6' }}>Contributor Resume Review</h3>
              </div>

              {/* Contributor Resume Reviewed */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Contributor Resume Reviewed</label>
                <select
                  {...register('contributorResumeReviewed')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {yesNoOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Resume Review Date */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Resume Review Date</label>
                <input
                  type="date"
                  {...register('resumeReviewDate')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Resume Review Result */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Resume Review Result</label>
                <select
                  {...register('resumeReviewResult')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {resumeReviewResultOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Contributor LinkedIn Review Section */}
              <div style={{ gridColumn: 'span 4', marginTop: '16px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#002329', margin: 0, paddingBottom: '8px', borderBottom: '1px solid #d8dde6' }}>Contributor LinkedIn Review</h3>
              </div>

              {/* Contributor LinkedIn Reviewed */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Contributor LinkedIn Reviewed</label>
                <select
                  {...register('contributorLinkedInReviewed')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {yesNoOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* LinkedIn Review Date */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>LinkedIn Review Date</label>
                <input
                  type="date"
                  {...register('linkedInReviewDate')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* LinkedIn Review Result */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>LinkedIn Review Result</label>
                <select
                  {...register('linkedInReviewResult')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {linkedInReviewResultOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Contributor Mercury Profile Review Section */}
              <div style={{ gridColumn: 'span 4', marginTop: '16px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#002329', margin: 0, paddingBottom: '8px', borderBottom: '1px solid #d8dde6' }}>Contributor Mercury Profile Review</h3>
              </div>

              {/* Contributor Mercury Profile Reviewed */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Contributor Mercury Profile Reviewed</label>
                <select
                  {...register('contributorMercuryProfileReviewed')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {yesNoOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Profile Review Date */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Profile Review Date</label>
                <input
                  type="date"
                  {...register('profileReviewDate')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Profile Review Result */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Profile Review Result</label>
                <select
                  {...register('profileReviewResult')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {profileReviewResultOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Contributor Interview Section */}
              <div style={{ gridColumn: 'span 4', marginTop: '16px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#002329', margin: 0, paddingBottom: '8px', borderBottom: '1px solid #d8dde6' }}>Contributor Interview</h3>
              </div>

              {/* Interview Scheduled Date */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Interview Scheduled Date</label>
                <input
                  type="date"
                  {...register('interviewScheduledDate')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Interview Completed Date */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Interview Completed Date</label>
                <input
                  type="date"
                  {...register('interviewCompletedDate')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Interview Result */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Interview Result</label>
                <select
                  {...register('interviewResult')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  {interviewResultOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Interview Recording */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#002329' }}>Interview Recording</label>
                <input
                  ref={interviewRecordingFileInputRef}
                  type="file"
                  accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.webm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setInterviewRecordingFile(file);
                    setValue('interviewRecording', file ? file.name : '');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d8dde6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                />
                {interviewRecordingFile && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ fontWeight: '500', color: '#002329', marginBottom: '2px' }}>{interviewRecordingFile.name}</div>
                      <div>{(interviewRecordingFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInterviewRecordingFile(null);
                        setValue('interviewRecording', '');
                        if (interviewRecordingFileInputRef.current) {
                          interviewRecordingFileInputRef.current.value = '';
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Remove file"
                    >
                      <X size={14} />
                      Remove
                    </button>
                  </div>
                )}
                <input type="hidden" {...register('interviewRecording')} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #d8dde6', padding: '24px', display: 'flex', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handlePreview}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye size={16} />
                  Preview
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={publishing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {publishing ? (
                    <>
                      <Loader size={16} className="spinning" style={{ color: '#08979C' }} />
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
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        formData={formData}
        objectType="contributor-review"
        objectLabel="Contributor Review"
      />

      {/* Publish Confirmation Modal */}
      <ConfirmModal
        show={showPublishConfirm}
        message="Are you sure you want to publish this Contributor Review to Salesforce? This will create a new record."
        onConfirm={handlePublish}
        onCancel={() => setShowPublishConfirm(false)}
        confirmText="Publish"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default AddContributorReview;

