// CreateProjectObjectiveSection component for QuickSetupWizard

import React from 'react';
import { Sparkles, Search } from 'lucide-react';
import { COUNTRIES, DIALECTS } from '../constants';

const CreateProjectObjectiveSection = ({
  register,
  errors,
  fieldErrors,
  watch,
  // Project search
  projectSearchTerm,
  selectedProject,
  projects,
  loadingProjects,
  showProjectDropdown,
  handleProjectSelect
}) => {
  return (
    <div className="section-content" style={{ marginBottom: '24px' }}>
      <h2 style={{ marginBottom: '12px', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
        <Sparkles size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Create Project Objective
      </h2>
      <div className="form-grid compact-grid">
        <div className="form-group">
          <label>
            Contributor Facing Project Name *
          </label>
          <input {...register('contributorFacingProjectName', { required: true })} className={fieldErrors.contributorFacingProjectName ? 'error-field' : ''} />
          {errors.contributorFacingProjectName && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            Project Objective Name *
          </label>
          <input {...register('projectObjectiveName', { required: true })} className={fieldErrors.projectObjectiveName ? 'error-field' : ''} />
          {errors.projectObjectiveName && <span className="error">Required</span>}
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            * Project
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              {...register('project', { required: true })}
              value={watch('projectName') || projectSearchTerm || watch('project') || selectedProject || ''}
              readOnly
              className={fieldErrors.project ? 'error-field' : ''}
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', paddingRight: '40px' }}
            />
            <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Auto-filled from Create Project section</p>
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
            {showProjectDropdown && projects.length > 0 && (
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
                {loadingProjects ? (
                  <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>Searching...</div>
                ) : (
                  projects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
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
                      {project.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.project && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            * Work Type
          </label>
          <select {...register('workType', { required: true })} className={fieldErrors.workType ? 'error-field' : ''}>
            <option value="">--None--</option>
            <option value="Independent Contractor - Project Based">Independent Contractor - Project Based</option>
            <option value="Independent Contractor - Ongoing">Independent Contractor - Ongoing</option>
            <option value="Employee">Employee</option>
          </select>
          {errors.workType && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            * Days Between Reminder Emails
          </label>
          <input type="number" {...register('daysBetweenReminderEmails', { required: true, valueAsNumber: true })} className={fieldErrors.daysBetweenReminderEmails ? 'error-field' : ''} />
          {errors.daysBetweenReminderEmails && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            Country <span style={{ color: '#e74c3c' }}>*</span>
            <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px', fontStyle: 'italic' }}>
              (At least one of Country or Language must be selected)
            </span>
          </label>
          <select 
            {...register('country')} 
            className={fieldErrors.country ? 'error-field' : ''}
            style={{ 
              fontSize: '13px', 
              padding: '8px',
              border: fieldErrors.country ? '2px solid #e74c3c' : '1px solid #ddd'
            }}
          >
            <option value="">--None--</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {fieldErrors.country && <span className="error" style={{ fontSize: '12px', color: '#e74c3c', display: 'block', marginTop: '4px' }}>{fieldErrors.country}</span>}
        </div>
        <div className="form-group">
          <label>
            Language <span style={{ color: '#e74c3c' }}>*</span>
            <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px', fontStyle: 'italic' }}>
              (At least one of Country or Language must be selected)
            </span>
          </label>
          <select 
            {...register('language')} 
            className={fieldErrors.language ? 'error-field' : ''}
            style={{ 
              fontSize: '13px', 
              padding: '8px',
              border: fieldErrors.language ? '2px solid #e74c3c' : '1px solid #ddd'
            }}
          >
            <option value="">--None--</option>
            {DIALECTS.map(language => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
          {fieldErrors.language && <span className="error" style={{ fontSize: '12px', color: '#e74c3c', display: 'block', marginTop: '4px' }}>{fieldErrors.language}</span>}
        </div>
      </div>
    </div>
  );
};

export default CreateProjectObjectiveSection;

