// PeopleSection component for ProjectSetup
// Extracted from ProjectSetup.js

import React from 'react';
import { Info, Search } from 'lucide-react';
import apiClient from '../../../config/api';
import toast from 'react-hot-toast';
import { handleError, getErrorMessage } from '../../../utils/errorHandler';

const PeopleSection = ({ 
  register, 
  errors, 
  fieldErrors, 
  setFieldErrors, 
  projectManagerSearchTerm,
  setProjectManagerSearchTerm,
  projectManagerSearchResults,
  setProjectManagerSearchResults,
  loadingProjectManagerSearch,
  setLoadingProjectManagerSearch,
  showProjectManagerDropdown,
  setShowProjectManagerDropdown,
  setValue,
  projectManagerSearchTimeoutRef,
  // New props for other People section fields
  peopleSearchTerms,
  setPeopleSearchTerms,
  peopleSearchResults,
  setPeopleSearchResults,
  loadingPeopleSearch,
  setLoadingPeopleSearch,
  showPeopleDropdowns,
  setShowPeopleDropdowns,
  peopleSearchTimeoutRefs
}) => {
  // Reusable search function for People section fields
  const searchPeople = async (fieldName, searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 3) {
      setPeopleSearchResults(prev => ({ ...prev, [fieldName]: [] }));
      setShowPeopleDropdowns(prev => ({ ...prev, [fieldName]: false }));
      return;
    }

    setLoadingPeopleSearch(prev => ({ ...prev, [fieldName]: true }));
    try {
      const response = await apiClient.get(`/salesforce/search-people?search=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        const people = response.data.people || [];
        setPeopleSearchResults(prev => ({ ...prev, [fieldName]: people }));
        // Show dropdown if there are results
        if (people.length > 0) {
          setShowPeopleDropdowns(prev => ({ ...prev, [fieldName]: true }));
        }
      } else {
        setPeopleSearchResults(prev => ({ ...prev, [fieldName]: [] }));
      }
    } catch (error) {
      handleError(error, `ProjectSetup - searchPeople(${fieldName})`);
      setPeopleSearchResults(prev => ({ ...prev, [fieldName]: [] }));
      
      // Show user-friendly error message for different types of 401 errors
      if (error.response?.status === 401) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.error || errorData.message || '';
        
        if (errorMessage.includes('No token provided') || 
            errorMessage.includes('Invalid token') || 
            errorMessage.includes('session has expired') ||
            errorMessage.includes('Authentication required') ||
            errorMessage.includes('TokenExpiredError')) {
          toast.error('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (errorMessage.includes('Invalid Salesforce credentials') || 
                   errorMessage.includes('Salesforce settings') ||
                   errorMessage.includes('Failed to connect to Salesforce') ||
                   errorMessage.includes('INVALID_LOGIN')) {
          toast.error('Invalid Salesforce credentials. Please check your Salesforce settings.');
        } else {
          toast.error('Authentication failed. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      }
    } finally {
      setLoadingPeopleSearch(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  // Handler for selecting a person from dropdown
  const handlePersonSelect = (fieldName, person) => {
    setPeopleSearchTerms(prev => ({ ...prev, [fieldName]: person.name || person.email }));
    setValue(fieldName, person.id);
    setShowPeopleDropdowns(prev => ({ ...prev, [fieldName]: false }));
    
    // Clear errors for this field
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Render a searchable People field
  const renderPeopleSearchField = (fieldName, label, placeholder = "Search People...") => {
    const searchTerm = peopleSearchTerms[fieldName] || '';
    const results = peopleSearchResults[fieldName] || [];
    const loading = loadingPeopleSearch[fieldName] || false;
    const showDropdown = showPeopleDropdowns[fieldName] || false;
    const timeoutRef = peopleSearchTimeoutRefs.current[fieldName];

    return (
      <div className="form-group" style={{ position: 'relative' }}>
        <label>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            {...register(fieldName)}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setPeopleSearchTerms(prev => ({ ...prev, [fieldName]: value }));
              setValue(fieldName, '');
              
              // Clear previous timeout
              if (timeoutRef) {
                clearTimeout(timeoutRef);
              }
              
              // Clear results if search term is too short
              if (!value || value.trim().length < 3) {
                setPeopleSearchResults(prev => ({ ...prev, [fieldName]: [] }));
                setShowPeopleDropdowns(prev => ({ ...prev, [fieldName]: false }));
                return;
              }
              
              // Show dropdown immediately when typing
              setShowPeopleDropdowns(prev => ({ ...prev, [fieldName]: true }));
              
              // Debounce search - wait 800ms after user stops typing
              peopleSearchTimeoutRefs.current[fieldName] = setTimeout(() => {
                searchPeople(fieldName, value.trim());
              }, 800);
            }}
            onFocus={() => {
              // Show dropdown if there are existing results
              if (results.length > 0) {
                setShowPeopleDropdowns(prev => ({ ...prev, [fieldName]: true }));
              } else if (searchTerm && searchTerm.trim().length >= 3) {
                // If there's a search term but no results, search again
                searchPeople(fieldName, searchTerm.trim());
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowPeopleDropdowns(prev => ({ ...prev, [fieldName]: false }));
              }, 200);
            }}
            placeholder={placeholder}
            style={{ paddingRight: '36px', fontSize: '12px', padding: '6px 10px', width: '100%', height: '32px' }}
          />
          <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
          {showDropdown && (
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
              {loading ? (
                <div style={{ padding: '8px', fontSize: '13px', color: '#666', textAlign: 'center' }}>Searching...</div>
              ) : results.length > 0 ? (
                results.map(person => (
                  <div
                    key={person.id}
                    onClick={() => handlePersonSelect(fieldName, person)}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
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
          )}
        </div>
      </div>
    );
  };
  
  const searchProjectManager = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 3) {
      setProjectManagerSearchResults([]);
      return;
    }

    setLoadingProjectManagerSearch(true);
    try {
      const response = await apiClient.get(`/salesforce/search-people?search=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        const people = response.data.people || [];
        setProjectManagerSearchResults(people);
        // Show dropdown if there are results (same as Project field)
        if (people.length > 0) {
          setShowProjectManagerDropdown(true);
        }
      } else {
        setProjectManagerSearchResults([]);
      }
    } catch (error) {
      handleError(error, 'ProjectSetup - searchProjectManager');
      setProjectManagerSearchResults([]);
      
      // Show user-friendly error message for different types of 401 errors
      if (error.response?.status === 401) {
        const errorMessage = getErrorMessage(error);
        
        // Check if it's a JWT authentication error
        if (errorMessage.includes('No token provided') || 
            errorMessage.includes('Invalid token') || 
            errorMessage.includes('session has expired') ||
            errorMessage.includes('Authentication required') ||
            errorMessage.includes('TokenExpiredError')) {
          toast.error('Your session has expired. Please log in again.');
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } 
        // Check if it's a Salesforce credential error
        else if (errorMessage.includes('Invalid Salesforce credentials') || 
                 errorMessage.includes('Salesforce settings') ||
                 errorMessage.includes('Failed to connect to Salesforce') ||
                 errorMessage.includes('INVALID_LOGIN')) {
          toast.error('Invalid Salesforce credentials. Please check your Salesforce settings.');
        }
        // Generic 401 error - likely JWT auth issue
        else {
          console.error('Generic 401 error - likely JWT authentication issue');
          toast.error('Authentication failed. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      }
    } finally {
      setLoadingProjectManagerSearch(false);
    }
  };

  const handleProjectManagerSelect = (person) => {
    setProjectManagerSearchTerm(person.name || person.email);
    // Store both ID and name - ID for Salesforce, name for display/reference
    setValue('projectManager', person.id);
    setValue('projectManagerName', person.name || person.email);
    setShowProjectManagerDropdown(false);
    
    // Clear errors for this field
    if (fieldErrors.projectManager) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.projectManager;
        return newErrors;
      });
    }
  };

  return (
    <div className="section-content">
      <h2>People</h2>
      <div className="form-grid compact-grid">
        {renderPeopleSearchField('programManager', 'Program Manager', 'Search People...')}
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            Project Manager *
            <Info size={14} className="info-icon" />
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              {...register('projectManager', { required: true })}
              value={projectManagerSearchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setProjectManagerSearchTerm(value);
                // Don't clear projectManager ID when typing - only clear when user manually deletes everything
                // This preserves the selected ID even if user is searching for a different person
                
                // Clear previous timeout
                if (projectManagerSearchTimeoutRef.current) {
                  clearTimeout(projectManagerSearchTimeoutRef.current);
                }
                
                // Clear results if search term is too short
                if (!value || value.trim().length < 3) {
                  setProjectManagerSearchResults([]);
                  setShowProjectManagerDropdown(false);
                  // Only clear the projectManager ID if the field is completely empty
                  if (!value || value.trim() === '') {
                    setValue('projectManager', '');
                  }
                  return;
                }
                
                // Show dropdown immediately when typing (will be populated when results come back)
                setShowProjectManagerDropdown(true);
                
                // Debounce search - wait 800ms after user stops typing
                projectManagerSearchTimeoutRef.current = setTimeout(() => {
                  searchProjectManager(value.trim());
                }, 800);
              }}
              onFocus={() => {
                // Show dropdown if there are existing results
                if (projectManagerSearchResults.length > 0) {
                  setShowProjectManagerDropdown(true);
                } else if (projectManagerSearchTerm && projectManagerSearchTerm.trim().length >= 3) {
                  // If there's a search term but no results, search again
                  searchProjectManager(projectManagerSearchTerm.trim());
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowProjectManagerDropdown(false);
                }, 200);
              }}
              placeholder="Search People..."
              className={fieldErrors.projectManager ? 'error-field' : ''}
              style={{ paddingRight: '36px', fontSize: '12px', padding: '6px 10px', width: '100%', height: '32px' }}
            />
            <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
            {showProjectManagerDropdown && (
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
                {loadingProjectManagerSearch ? (
                  <div style={{ padding: '8px', fontSize: '13px', color: '#666', textAlign: 'center' }}>Searching...</div>
                ) : projectManagerSearchResults.length > 0 ? (
                  projectManagerSearchResults.map(person => (
                    <div
                      key={person.id}
                      onClick={() => handleProjectManagerSelect(person)}
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
            )}
          </div>
          {errors.projectManager && <span className="error">Required</span>}
        </div>
        {renderPeopleSearchField('qualityLead', 'Quality Lead', 'Search People...')}
        {renderPeopleSearchField('productivityLead', 'Productivity Lead', 'Search People...')}
        {renderPeopleSearchField('reportingLead', 'Reporting Lead', 'Search People...')}
        {renderPeopleSearchField('invoicingLead', 'Invoicing Lead', 'Search People...')}
        {renderPeopleSearchField('projectSupportLead', 'Project Support Lead', 'Search People...')}
        <div className="form-group">
          <label>
            <input type="checkbox" {...register('casesDCSupportTeam')} />
            <span>Cases DC Support Team</span>
            <Info size={14} className="info-icon" />
          </label>
        </div>
        {renderPeopleSearchField('recruitmentLead', 'Recruitment Lead', 'Search People...')}
        {renderPeopleSearchField('qualificationLead', 'Qualification Lead', 'Search People...')}
        {renderPeopleSearchField('onboardingLead', 'Onboarding Lead', 'Search People...')}
      </div>
    </div>
  );
};

export default PeopleSection;
