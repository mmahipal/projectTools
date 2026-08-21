// CreateQualificationStepSection component for QuickSetupWizard

import React from 'react';
import { Sparkles, Search } from 'lucide-react';

const CreateQualificationStepSection = ({
  register,
  errors,
  fieldErrors,
  watch,
  // Qualification step search
  qualificationStepSearchTerm,
  setQualificationStepSearchTerm,
  setValue,
  qualificationSteps,
  loadingQualificationSteps,
  showQualificationStepDropdown,
  setShowQualificationStepDropdown,
  handleQualificationStepSelect,
  // Project search
  projectSearchTerm,
  selectedProject
}) => {
  return (
    <div className="section-content" style={{ marginBottom: '24px' }}>
      <h2 style={{ marginBottom: '12px', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
        <Sparkles size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Create Project Qualification step
      </h2>
      <div className="form-grid compact-grid">
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            * Project
          </label>
          <input
            type="text"
            {...register('qualificationStepProject', { required: true })}
            value={watch('projectName') || watch('qualificationStepProject') || projectSearchTerm || selectedProject || ''}
            readOnly
            className={fieldErrors.qualificationStepProject ? 'error-field' : ''}
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
          {errors.qualificationStepProject && <span className="error">Required</span>}
          <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Auto-filled from Create Project section</p>
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            * Project Objective
          </label>
          <input
            type="text"
            {...register('qualificationStepProjectObjective', { required: true })}
            value={watch('projectObjectiveName') || watch('contributorFacingProjectName') || ''}
            readOnly
            className={fieldErrors.qualificationStepProjectObjective ? 'error-field' : ''}
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
          {errors.qualificationStepProjectObjective && <span className="error">Required</span>}
          <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Auto-filled from Create Project Objective section</p>
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            * Qualification Step
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              {...register('qualificationStep', { required: true })}
              value={qualificationStepSearchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                setQualificationStepSearchTerm(newValue);
                setValue('qualificationStep', newValue);
                setShowQualificationStepDropdown(true);
              }}
              onFocus={() => {
                if (qualificationStepSearchTerm && qualificationSteps.length > 0) {
                  setShowQualificationStepDropdown(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowQualificationStepDropdown(false), 200);
              }}
              className={fieldErrors.qualificationStep ? 'error-field' : ''}
              placeholder="Search qualification steps from Salesforce..."
              style={{ paddingRight: '36px', fontSize: '12px', padding: '6px 10px', height: '32px', width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
            {(showQualificationStepDropdown && (qualificationSteps.length > 0 || loadingQualificationSteps)) && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginTop: '4px'
              }}>
                {loadingQualificationSteps ? (
                  <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>Searching...</div>
                ) : qualificationSteps.length > 0 ? (
                  qualificationSteps.map(step => (
                    <div
                      key={step.id}
                      onClick={() => handleQualificationStepSelect(step)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        borderBottom: '1px solid #f0f0f0',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.color = '#000000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.color = '#000000';
                      }}
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
          {errors.qualificationStep && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            * Funnel
          </label>
          <select {...register('funnel', { required: true })} className={fieldErrors.funnel ? 'error-field' : ''}>
            <option value="">--None--</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
          {errors.funnel && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            * Step Number
          </label>
          <input type="number" {...register('stepNumber', { required: true, valueAsNumber: true })} className={fieldErrors.stepNumber ? 'error-field' : ''} />
          {errors.stepNumber && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            * Number of Attempts
          </label>
          <input type="number" {...register('numberOfAttempts', { required: true, valueAsNumber: true })} className={fieldErrors.numberOfAttempts ? 'error-field' : ''} />
          {errors.numberOfAttempts && <span className="error">Required</span>}
        </div>
      </div>
    </div>
  );
};

export default CreateQualificationStepSection;

