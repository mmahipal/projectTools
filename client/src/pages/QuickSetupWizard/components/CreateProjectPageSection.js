// CreateProjectPageSection component for QuickSetupWizard

import React from 'react';
import { Sparkles, Search, Info } from 'lucide-react';

const CreateProjectPageSection = ({
  register,
  errors,
  fieldErrors,
  watch,
  setValue,
  // Project search
  pageProjectSearchTerm,
  setPageProjectSearchTerm,
  selectedPageProject,
  setSelectedPageProject,
  pageProjects,
  setPageProjects,
  loadingPageProjects,
  showPageProjectDropdown,
  setShowPageProjectDropdown,
  handlePageProjectSelect,
  // Project Objective search
  loadingPageProjectObjectives,
  pageProjectObjectives,
  setPageProjectObjectives,
  pageProjectObjectiveSearchTerm,
  setPageProjectObjectiveSearchTerm,
  selectedPageProjectObjective,
  setSelectedPageProjectObjective,
  showPageProjectObjectiveDropdown,
  setShowPageProjectObjectiveDropdown,
  handlePageProjectObjectiveSelect,
  // Qualification Step search
  pageQualificationStepSearchTerm,
  setPageQualificationStepSearchTerm,
  selectedPageQualificationStep,
  setSelectedPageQualificationStep,
  pageQualificationSteps,
  setPageQualificationSteps,
  loadingPageQualificationSteps,
  showPageQualificationStepDropdown,
  setShowPageQualificationStepDropdown,
  handlePageQualificationStepSelect,
  // Qualification search (for Default Qualification Page)
  pageProjectQualificationSearchTerm,
  setPageProjectQualificationSearchTerm,
  selectedPageProjectQualification,
  setSelectedPageProjectQualification,
  pageProjectQualifications,
  setPageProjectQualifications,
  loadingPageProjectQualifications,
  showPageProjectQualificationDropdown,
  setShowPageProjectQualificationDropdown
}) => {
  return (
    <div className="section-content" style={{ marginBottom: '24px' }}>
      <h2 style={{ marginBottom: '12px', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
        <Sparkles size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Create Project Page
      </h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            * Project Page Type
          </label>
          <select {...register('projectPageType', { required: true })} className={fieldErrors.projectPageType ? 'error-field' : ''}>
            <option value="">--None--</option>
            <option value="Project Splash Page (Preapply)">Project Splash Page (Preapply)</option>
            <option value="Project Pre-Qualification">Project Pre-Qualification</option>
            <option value="Project Qualifying Page">Project Qualifying Page</option>
            <option value="Project Active Page">Project Active Page</option>
            <option value="Default Qualification Page">Default Qualification Page</option>
          </select>
          {errors.projectPageType && <span className="error">Required</span>}
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            * Project
            <Info size={14} className="info-icon" />
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              {...register('pageProject', { required: true })}
              className={fieldErrors.pageProject ? 'error-field' : ''}
              placeholder="Search or enter project name..."
              style={{ fontSize: '12px', padding: '6px 10px', paddingRight: '36px', height: '32px', width: '100%' }}
              value={pageProjectSearchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                setPageProjectSearchTerm(newValue);
                setValue('pageProject', newValue);
                if (selectedPageProject && newValue === selectedPageProject) {
                  setShowPageProjectDropdown(false);
                  setPageProjects([]);
                } else if (newValue.trim() !== '') {
                  setShowPageProjectDropdown(true);
                } else {
                  setShowPageProjectDropdown(false);
                  setPageProjects([]);
                }
                if (newValue !== selectedPageProject) {
                  setPageQualificationStepSearchTerm('');
                  setSelectedPageQualificationStep(null);
                  setPageQualificationSteps([]);
                  setValue('pageQualificationStep', '');
                }
              }}
              onFocus={() => {
                const searchTerm = pageProjectSearchTerm;
                const selectedProject = selectedPageProject;
                if (searchTerm && searchTerm !== selectedProject && pageProjects.length > 0) {
                  setShowPageProjectDropdown(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowPageProjectDropdown(false), 200);
              }}
            />
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
            {showPageProjectDropdown && pageProjects.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginTop: '4px'
              }}>
                {loadingPageProjects ? (
                  <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>Searching...</div>
                ) : (
                  pageProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => handlePageProjectSelect(project)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: '#ffffff',
                        color: '#000000'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                    >
                      {project.name} {project.status && `(${project.status})`}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.pageProject && <span className="error">Required</span>}
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            * Project Objective
          </label>
          {loadingPageProjectObjectives ? (
            <div style={{ padding: '6px', fontSize: '12px', color: '#666' }}>Loading project objectives...</div>
          ) : pageProjectObjectives.length > 0 ? (
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                {...register('pageProjectObjective', { required: true })} 
                className={fieldErrors.pageProjectObjective ? 'error-field' : ''} 
                placeholder="Search or enter project objective name..."
                style={{ fontSize: '12px', padding: '6px 10px', paddingRight: '36px', height: '32px', width: '100%' }}
                value={pageProjectObjectiveSearchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setPageProjectObjectiveSearchTerm(newValue);
                  setValue('pageProjectObjective', newValue);
                  const selectedObjective = selectedPageProjectObjective;
                  if (selectedObjective && newValue !== selectedObjective) {
                    setSelectedPageProjectObjective(null);
                  }
                  if (!selectedObjective || newValue !== selectedObjective) {
                    setShowPageProjectObjectiveDropdown(true);
                  } else {
                    setShowPageProjectObjectiveDropdown(false);
                    setPageProjectObjectives([]);
                  }
                }}
                onFocus={() => {
                  const selectedObjective = selectedPageProjectObjective;
                  const searchTerm = pageProjectObjectiveSearchTerm;
                  if (searchTerm && (!selectedObjective || searchTerm !== selectedObjective) && pageProjectObjectives.length > 0) {
                    setShowPageProjectObjectiveDropdown(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowPageProjectObjectiveDropdown(false), 200);
                }}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
              {showPageProjectObjectiveDropdown && pageProjectObjectives.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  marginTop: '4px'
                }}>
                  {pageProjectObjectives.map(objective => (
                    <div
                      key={objective.id}
                      onClick={() => handlePageProjectObjectiveSelect(objective)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: '#ffffff',
                        color: '#000000'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                    >
                      {objective.contributorFacingProjectName || objective.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedPageProject ? (
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                {...register('pageProjectObjective', { required: true })} 
                placeholder="No project objectives found. Enter manually..."
                style={{ paddingRight: '36px', fontSize: '12px', padding: '6px 10px', height: '32px' }}
                value={pageProjectObjectiveSearchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setPageProjectObjectiveSearchTerm(newValue);
                  setValue('pageProjectObjective', newValue);
                }}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                {...register('pageProjectObjective', { required: true })} 
                placeholder="Select a project first..."
                disabled
                style={{ paddingRight: '36px', fontSize: '12px', padding: '6px 10px', height: '32px', opacity: 0.5 }}
                value={pageProjectObjectiveSearchTerm}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            </div>
          )}
          {errors.pageProjectObjective && <span className="error">Required</span>}
        </div>
        {watch('projectPageType') === 'Project Qualifying Page' && (
          <div className="form-group" style={{ position: 'relative' }}>
            <label>
              * Project Qualification Step
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                {...register('pageQualificationStep', {
                  validate: (value) => {
                    const pageType = watch('projectPageType');
                    if (pageType === 'Project Qualifying Page' && (!value || value.trim() === '')) {
                      return 'Project Qualification Step is required when Project Page Type is "Project Qualifying Page"';
                    }
                    return true;
                  }
                })}
                className={fieldErrors.pageQualificationStep ? 'error-field' : ''}
                placeholder="Search or enter qualification step name..."
                style={{ fontSize: '12px', padding: '6px 10px', paddingRight: '36px', height: '32px', width: '100%' }}
                value={pageQualificationStepSearchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setPageQualificationStepSearchTerm(newValue);
                  setValue('pageQualificationStep', newValue);
                  const selectedStep = selectedPageQualificationStep;
                  if (selectedStep && newValue !== selectedStep) {
                    setSelectedPageQualificationStep(null);
                  }
                  if (!selectedStep || newValue !== selectedStep) {
                    setShowPageQualificationStepDropdown(true);
                  } else {
                    setShowPageQualificationStepDropdown(false);
                    setPageQualificationSteps([]);
                  }
                }}
                onFocus={() => {
                  const selectedStep = selectedPageQualificationStep;
                  const searchTerm = pageQualificationStepSearchTerm;
                  if (searchTerm && (!selectedStep || searchTerm !== selectedStep) && pageQualificationSteps.length > 0) {
                    setShowPageQualificationStepDropdown(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowPageQualificationStepDropdown(false), 200);
                }}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
              {showPageQualificationStepDropdown && (pageQualificationSteps.length > 0 || loadingPageQualificationSteps) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  marginTop: '4px'
                }}>
                  {loadingPageQualificationSteps ? (
                    <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>Searching...</div>
                  ) : pageQualificationSteps.length > 0 ? (
                    pageQualificationSteps.map(step => (
                      <div
                        key={step.id}
                        onClick={() => handlePageQualificationStepSelect(step)}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: '#ffffff',
                          color: '#000000'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                      >
                        {step.name}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>No results found</div>
                  )}
                </div>
              )}
            </div>
            {errors.pageQualificationStep && <span className="error">Required</span>}
          </div>
        )}
        {watch('projectPageType') === 'Default Qualification Page' && (
          <div className="form-group" style={{ position: 'relative' }}>
            <label>
              * Qualification
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                {...register('pageProjectQualification', {
                  validate: (value) => {
                    const pageType = watch('projectPageType');
                    if (pageType === 'Default Qualification Page' && (!value || value.trim() === '')) {
                      return 'Qualification is required when Project Page Type is "Default Qualification Page"';
                    }
                    return true;
                  }
                })}
                className={fieldErrors.pageProjectQualification ? 'error-field' : ''}
                placeholder="Search or enter qualification name..."
                style={{ fontSize: '12px', padding: '6px 10px', paddingRight: '36px', height: '32px', width: '100%' }}
                value={pageProjectQualificationSearchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setPageProjectQualificationSearchTerm(newValue);
                  setValue('pageProjectQualification', newValue);
                  const selectedQualification = selectedPageProjectQualification;
                  if (selectedQualification && newValue !== selectedQualification) {
                    setSelectedPageProjectQualification(null);
                  }
                  if (!selectedQualification || newValue !== selectedQualification) {
                    setShowPageProjectQualificationDropdown(true);
                  } else {
                    setShowPageProjectQualificationDropdown(false);
                    setPageProjectQualifications([]);
                  }
                }}
                onFocus={() => {
                  const selectedQualification = selectedPageProjectQualification;
                  const searchTerm = pageProjectQualificationSearchTerm;
                  if (searchTerm && (!selectedQualification || searchTerm !== selectedQualification) && pageProjectQualifications.length > 0) {
                    setShowPageProjectQualificationDropdown(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowPageProjectQualificationDropdown(false), 200);
                }}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
              {showPageProjectQualificationDropdown && (pageProjectQualifications.length > 0 || loadingPageProjectQualifications) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  marginTop: '4px'
                }}>
                  {loadingPageProjectQualifications ? (
                    <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>Searching...</div>
                  ) : pageProjectQualifications.length > 0 ? (
                    pageProjectQualifications.map(qualification => (
                      <div
                        key={qualification.id}
                        onClick={() => {
                          setValue('pageProjectQualification', qualification.name);
                          setPageProjectQualificationSearchTerm(qualification.name);
                          setSelectedPageProjectQualification(qualification.name);
                          setShowPageProjectQualificationDropdown(false);
                          setPageProjectQualifications([]);
                        }}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: '#ffffff',
                          color: '#000000'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                      >
                        {qualification.name}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>No results found</div>
                  )}
                </div>
              )}
            </div>
            {errors.pageProjectQualification && <span className="error">Required</span>}
          </div>
        )}
        <div className="form-group">
          <label>
            <input type="checkbox" {...register('active')} defaultChecked />
            <span>Active</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectPageSection;

