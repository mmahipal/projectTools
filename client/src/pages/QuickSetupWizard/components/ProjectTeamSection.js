// ProjectTeamSection component for QuickSetupWizard

import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import apiClient from '../../../config/api';
import toast from 'react-hot-toast';
import { handleError } from '../../../utils/errorHandler';

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
      handleError(error, 'QuickSetupWizard - searchTeamMember');
      setTeamMemberSearchResults(prev => ({ ...prev, [index]: [] }));
      
      if (error.response?.status === 401 && error.response?.data) {
        const errorMessage = error.response.data.error || error.response.data.message || '';
        if (errorMessage.includes('No token provided') || 
            errorMessage.includes('Invalid token') || 
            errorMessage.includes('session has expired') ||
            errorMessage.includes('Authentication required')) {
          toast.error('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (errorMessage.includes('Invalid Salesforce credentials') || 
                 errorMessage.includes('Salesforce settings') ||
                 errorMessage.includes('Failed to connect to Salesforce')) {
          toast.error('Invalid Salesforce credentials. Please check your Salesforce settings.');
        } else {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {teamMembers.map((tm, index) => (
        <div 
          key={index} 
          style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 120px',
            gap: '24px',
            alignItems: 'end'
          }}
        >
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
                    // Dropdown will show automatically
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
              />
              <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
              {(teamMemberSearchResults[index] && teamMemberSearchResults[index].length > 0) || loadingTeamMemberSearch[index] ? (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  marginTop: '4px'
                }}>
                  {loadingTeamMemberSearch[index] ? (
                    <div style={{ padding: '10px', fontSize: '14px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>Searching...</div>
                  ) : teamMemberSearchResults[index] && teamMemberSearchResults[index].length > 0 ? (
                    teamMemberSearchResults[index].map(person => (
                      <div
                        key={person.id}
                        onClick={() => handleTeamMemberSelect(index, person)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          borderBottom: '1px solid #f3f4f6',
                          color: '#000000',
                          backgroundColor: '#ffffff'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.color = '#000000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.color = '#000000';
                        }}
                      >
                        <div style={{ fontWeight: '500', color: '#000000' }}>{person.name}</div>
                        {person.email && (
                          <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>{person.email}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '10px', fontSize: '14px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>No results found</div>
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
            >
              {TEAM_MEMBER_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {fieldErrors[`teamMemberRole_${index}`] && (
              <span className="error">Complete this field.</span>
            )}
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', gap: '8px', paddingTop: '0' }}>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeTeamMember(index)}
                title={`Remove team member ${index + 1}`}
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
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  height: 'fit-content',
                  marginTop: '0'
                }}
              >
                <X size={16} />
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
      <div style={{ marginTop: '8px' }}>
        <button
          type="button"
          onClick={addTeamMember}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'Poppins',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} />
          Add Team Member
        </button>
      </div>
    </div>
  );
};

export default ProjectTeamSection;

