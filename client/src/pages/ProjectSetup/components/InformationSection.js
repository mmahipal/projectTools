// InformationSection component for ProjectSetup
// Extracted from ProjectSetup.js

import React from 'react';
import { Search } from 'lucide-react';
import FieldHelpIcon from '../../../components/FieldHelpIcon/FieldHelpIcon';
import { getObjectTypeForHelp, getSalesforceFieldName } from '../../../utils/fieldNameMapping';

const InformationSection = ({ register, errors, fieldErrors, watch, accounts, loadingAccounts }) => (
  <div className="section-content">
    <h2>Information</h2>
    <div className="form-grid compact-grid">
      <div className="form-group">
        <label>
          <input type="checkbox" {...register('auditorProject')} />
          <span>Auditor Project</span>
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'auditorProject')} 
            size={14} 
            className="info-icon" 
          />
        </label>
      </div>
      <div className="form-group">
        <label>
          Project Name *
        </label>
        <input {...register('projectName', { required: true })} className={fieldErrors.projectName ? 'error-field' : ''} />
        {errors.projectName && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>
          Short Project Name *
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'shortProjectName')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <input {...register('shortProjectName', { required: true })} className={fieldErrors.shortProjectName ? 'error-field' : ''} />
        {errors.shortProjectName && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>
          Contributor Project Name *
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'contributorProjectName')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <input {...register('contributorProjectName', { required: true })} className={fieldErrors.contributorProjectName ? 'error-field' : ''} />
        {errors.contributorProjectName && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>
          Appen Partner *
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'appenPartner')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <select {...register('appenPartner', { required: true })} className={fieldErrors.appenPartner ? 'error-field' : ''}>
          <option value="">--None--</option>
          <option value="Appen">Appen</option>
          <option value="Appen China">Appen China</option>
        </select>
        {errors.appenPartner && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>
          Job Category
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'jobCategory')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <select {...register('jobCategory')}>
          <option value="--None--">--None--</option>
          <option value="Computer Sciences">Computer Sciences</option>
          <option value="Creative Writing">Creative Writing</option>
          <option value="Finance & Accounting">Finance & Accounting</option>
          <option value="General Interest">General Interest</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Legal">Legal</option>
          <option value="Programming">Programming</option>
          <option value="STEM">STEM</option>
        </select>
      </div>
      <div className="form-group full-width">
        <label>
          Project Short Description
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'projectShortDescription')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <textarea {...register('projectShortDescription')} rows="4" />
      </div>
      <div className="form-group full-width">
        <label>Project Long Description</label>
        <textarea {...register('projectLongDescription')} rows="6" />
      </div>
      <div className="form-group">
        <label>
          Project Type *
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'projectType')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <select {...register('projectType', { required: true })} className={fieldErrors.projectType ? 'error-field' : ''}>
          <option value="">--None--</option>
          <option value="Benchmarking Evaluation">Benchmarking Evaluation</option>
          <option value="Data collection">Data collection</option>
          <option value="Generative AI">Generative AI</option>
          <option value="Linguistics">Linguistics</option>
          <option value="Other">Other</option>
          <option value="Search Relevance">Search Relevance</option>
          <option value="Social Media">Social Media</option>
          <option value="Text Utterance Generation">Text Utterance Generation</option>
          <option value="Transcription">Transcription</option>
          <option value="Translation">Translation</option>
          <option value="Web Evaluation">Web Evaluation</option>
          <option value="Web Research">Web Research</option>
          <option value="Search Evaluation">Search Evaluation</option>
        </select>
        {errors.projectType && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>
          Project Priority *
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'projectPriority')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <input type="number" {...register('projectPriority', { required: true, valueAsNumber: true })} defaultValue={50.0} className={fieldErrors.projectPriority ? 'error-field' : ''} />
        {errors.projectPriority && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>Project ID for Reports</label>
        <input {...register('projectIdForReports')} readOnly />
        <p className="field-description">This field is calculated upon save</p>
      </div>
      <div className="form-group">
        <label>
          Workday Project ID
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'workdayProjectId')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <input {...register('workdayProjectId')} />
      </div>
      <div className="form-group">
        <label>Account *</label>
        {loadingAccounts ? (
          <div style={{ padding: '8px', fontSize: '13px', color: '#666' }}>Loading accounts...</div>
        ) : accounts.length > 0 ? (
          <select 
            {...register('account', { required: true })} 
            className={fieldErrors.account ? 'error-field' : ''}
            style={{ fontSize: '12px', padding: '6px 10px', width: '100%', height: '32px' }}
          >
            <option value="">--Select Account--</option>
            {accounts.map(account => (
              <option key={account.id} value={account.name}>
                {account.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="search-input-group">
            <input {...register('account', { required: true })} placeholder="Enter Account name..." className={fieldErrors.account ? 'error-field' : ''} />
            <Search size={16} className="search-icon" />
          </div>
        )}
        {errors.account && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>Program Name</label>
        <select {...register('programName')}>
          <option value="--None--">--None--</option>
          <option value="Ads">Ads</option>
          <option value="Agave Data Collection">Agave Data Collection</option>
          <option value="Amani Data Validation Phase 2 Q2 2023">Amani Data Validation Phase 2 Q2 2023</option>
          <option value="Apollo Cardinal Linguistic Staffing">Apollo Cardinal Linguistic Staffing</option>
          <option value="Apollo Chapters">Apollo Chapters</option>
          <option value="Apollo Data Collection">Apollo Data Collection</option>
          <option value="Apollo Fount">Apollo Fount</option>
          <option value="Apollo Iceberg">Apollo Iceberg</option>
          <option value="Apollo Iceberg Dialog Generation">Apollo Iceberg Dialog Generation</option>
          <option value="Apollo Iceberg German Language Annotation">Apollo Iceberg German Language Annotation</option>
          <option value="Apollo Iceberg Text Normalization Annotation Greek & Hungarian">Apollo Iceberg Text Normalization Annotation Greek & Hungarian</option>
          <option value="Apollo Kendra">Apollo Kendra</option>
          <option value="Apollo Lex Text Utterance Collection">Apollo Lex Text Utterance Collection</option>
          <option value="Apollo Linguistic Judgments">Apollo Linguistic Judgments</option>
          <option value="Apollo Shopping LLM">Apollo Shopping LLM</option>
          <option value="Apollo US English Synthetic Chat DC 2022">Apollo US English Synthetic Chat DC 2022</option>
          <option value="Appen Tests">Appen Tests</option>
          <option value="Aracari Data Collection">Aracari Data Collection</option>
          <option value="Arremon Data Collection">Arremon Data Collection</option>
          <option value="Axel Data Collection">Axel Data Collection</option>
          <option value="Aztec Ads">Aztec Ads</option>
          <option value="Aztec Arrow Butler">Aztec Arrow Butler</option>
          <option value="Aztec Data Collection">Aztec Data Collection</option>
        </select>
      </div>
      <div className="form-group">
        <label>Hire Start Date *</label>
        <input type="date" {...register('hireStartDate', { required: true })} className={fieldErrors.hireStartDate ? 'error-field' : ''} />
        {errors.hireStartDate && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>Predicted Close Date *</label>
        <input type="date" {...register('predictedCloseDate', { required: true })} className={fieldErrors.predictedCloseDate ? 'error-field' : ''} />
        {errors.predictedCloseDate && <span className="error">Required</span>}
      </div>
      <div className="form-group">
        <label>Delivery Tool Org</label>
        <select {...register('deliveryToolOrg')}>
          <option value="--None--">--None--</option>
          <option value="Appen">Appen</option>
          <option value="Client Tool">Client Tool</option>
        </select>
      </div>
      <div className="form-group">
        <label>Delivery Tool Name</label>
        <select {...register('deliveryToolName')}>
          <option value="--None--">--None--</option>
          <option value="A9">A9</option>
          <option value="ADAP">ADAP</option>
          <option value="Ampersand">Ampersand</option>
          <option value="Appen Collect">Appen Collect</option>
          <option value="AppenLex">AppenLex</option>
          <option value="Baseline">Baseline</option>
          <option value="EWOQ">EWOQ</option>
          <option value="Exotel">Exotel</option>
          <option value="Other">Other</option>
          <option value="Polyglot">Polyglot</option>
          <option value="QF">QF</option>
        </select>
      </div>
      <div className="form-group">
        <label>
          Project Page
          <FieldHelpIcon 
            objectType={getObjectTypeForHelp('Project')} 
            fieldName={getSalesforceFieldName('Project', 'projectPage')} 
            size={14} 
            className="info-icon" 
          />
        </label>
        <input {...register('projectPage')} />
      </div>
      <div className="form-group">
        <label>Project Status *</label>
        <select {...register('projectStatus', { required: true })} className={fieldErrors.projectStatus ? 'error-field' : ''}>
          <option value="">--None--</option>
          <option value="Draft">Draft</option>
          <option value="Open">Open</option>
          <option value="Roster Hold">Roster Hold</option>
          <option value="Closed">Closed</option>
        </select>
        {errors.projectStatus && <span className="error">Required</span>}
      </div>
    </div>
  </div>
);

export default InformationSection;
