// CreateProjectSection component for QuickSetupWizard

import React from 'react';
import { Sparkles, Plus, Search } from 'lucide-react';

const CreateProjectSection = ({
  register,
  errors,
  fieldErrors,
  watch,
  setValue,
  // Add Field functionality
  showAddFieldDropdown,
  setShowAddFieldDropdown,
  addFieldDropdownRef,
  availableFields,
  loadingFields,
  fieldSearchTerm,
  setFieldSearchTerm,
  selectedSection,
  setSelectedSection,
  sections,
  filteredFields,
  totalFilteredCount,
  debouncedSearchTerm,
  handleAddField,
  // Account search
  loadingAccounts,
  accountSearchTerm,
  setAccountSearchTerm,
  accountSearchResults,
  setAccountSearchResults,
  showAccountDropdown,
  setShowAccountDropdown,
  handleAccountSelect,
  selectedAccount,
  // Project Manager search
  projectManagerSearchTerm,
  setProjectManagerSearchTerm,
  projectManagerSearchResults,
  setProjectManagerSearchResults,
  showProjectManagerDropdown,
  setShowProjectManagerDropdown,
  loadingProjectManagerSearch,
  handleProjectManagerSelect,
  projectManagerSearchTimeoutRef,
  projectManagerSearchCacheRef,
  searchProjectManager
}) => {
  return (
    <div className="section-content" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
          <Sparkles size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Create Project
        </h2>
        <div style={{ position: 'relative' }} ref={addFieldDropdownRef}>
          <button
            type="button"
            onClick={() => setShowAddFieldDropdown(!showAddFieldDropdown)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            Add Field
          </button>
          
          {/* Add Field Dropdown */}
          {showAddFieldDropdown && (
            <div
              ref={addFieldDropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '16px',
                minWidth: '500px',
                maxWidth: '600px',
                maxHeight: '500px',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                zIndex: 2000,
                border: '1px solid #e5e7eb',
                color: '#000000'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#000000' }}>Add Field</h3>
                
                {/* Search and Filter */}
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                      type="text"
                      placeholder="Search fields..."
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 36px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                      minWidth: '150px'
                    }}
                  >
                    <option value="">All Sections</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Fields List */}
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {loadingFields ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#000000', fontSize: '12px', backgroundColor: '#ffffff' }}>Loading fields...</div>
                ) : filteredFields.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#000000', fontSize: '12px', backgroundColor: '#ffffff' }}>
                    {debouncedSearchTerm && debouncedSearchTerm.length >= 1 
                      ? 'No fields found matching your search' 
                      : 'No fields available to add'}
                  </div>
                ) : (
                  <>
                    {totalFilteredCount > 50 && (
                      <div style={{ padding: '8px 12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '8px', fontSize: '12px', color: '#856404' }}>
                        Showing first 50 of {totalFilteredCount} results. Refine your search to see more.
                      </div>
                    )}
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {filteredFields.map(field => {
                        const { key, label, description, type, section } = field;
                        return (
                          <div
                            key={key}
                            style={{
                              padding: '12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                              backgroundColor: '#ffffff',
                              color: '#000000'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.color = '#000000';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#000000';
                            }}
                            onClick={() => handleAddField(field)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px', color: '#000000' }}>{label}</div>
                                {description && (
                                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>{description}</div>
                                )}
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  <span style={{ marginRight: '10px' }}>Type: {type}</span>
                                  <span style={{ marginRight: '10px' }}>Section: {section}</span>
                                </div>
                              </div>
                              <Plus size={18} style={{ color: '#00B8D9', marginLeft: '10px', flexShrink: 0 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="form-grid compact-grid">
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
          </label>
          <input {...register('shortProjectName', { required: true })} className={fieldErrors.shortProjectName ? 'error-field' : ''} />
          {errors.shortProjectName && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            Contributor Project Name *
          </label>
          <input {...register('contributorProjectName', { required: true })} className={fieldErrors.contributorProjectName ? 'error-field' : ''} />
          {errors.contributorProjectName && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            Appen Partner *
          </label>
          <select {...register('appenPartner', { required: true })} className={fieldErrors.appenPartner ? 'error-field' : ''} style={{ fontSize: '13px', padding: '8px', width: '100%' }}>
            <option value="">--None--</option>
            <option value="Appen">Appen</option>
            <option value="Appen China">Appen China</option>
          </select>
          {errors.appenPartner && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            Project Type *
          </label>
          <select {...register('projectType', { required: true })} className={fieldErrors.projectType ? 'error-field' : ''} style={{ fontSize: '13px', padding: '8px', width: '100%' }}>
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
          </select>
          {errors.projectType && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>
            Project Priority *
          </label>
          <input type="number" {...register('projectPriority', { required: true, valueAsNumber: true })} defaultValue={50.0} className={fieldErrors.projectPriority ? 'error-field' : ''} style={{ fontSize: '13px', padding: '8px', width: '100%' }} />
          {errors.projectPriority && <span className="error">Required</span>}
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>Account *</label>
          {loadingAccounts ? (
            <div style={{ padding: '6px', fontSize: '12px', color: '#666' }}>Loading accounts...</div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                {...register('account', { required: true })}
                value={accountSearchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setAccountSearchTerm(newValue);
                  setValue('account', newValue);
                  if (newValue !== selectedAccount) {
                    setShowAccountDropdown(true);
                  } else {
                    setShowAccountDropdown(false);
                    setAccountSearchResults([]);
                  }
                }}
                onFocus={() => {
                  if (accountSearchTerm && accountSearchResults.length > 0) {
                    setShowAccountDropdown(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowAccountDropdown(false), 200);
                }}
                className={fieldErrors.account ? 'error-field' : ''}
                placeholder="Search or enter account name..."
                style={{ paddingRight: '36px' }}
              />
              <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
              {showAccountDropdown && accountSearchResults.length > 0 && (
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
                  {accountSearchResults.map(account => (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        color: '#000000',
                        fontSize: '14px',
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
                      {account.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.account && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>Hire Start Date *</label>
          <input type="date" {...register('hireStartDate', { required: true })} className={fieldErrors.hireStartDate ? 'error-field' : ''} style={{ fontSize: '13px', padding: '8px', width: '100%' }} />
          {errors.hireStartDate && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>Predicted Close Date *</label>
          <input type="date" {...register('predictedCloseDate', { required: true })} className={fieldErrors.predictedCloseDate ? 'error-field' : ''} />
          {errors.predictedCloseDate && <span className="error">Required</span>}
        </div>
        <div className="form-group">
          <label>Project Status *</label>
          <select {...register('projectStatus', { required: true })} className={fieldErrors.projectStatus ? 'error-field' : ''} style={{ fontSize: '13px', padding: '8px', width: '100%' }}>
            <option value="">--None--</option>
            <option value="Draft">Draft</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
          {errors.projectStatus && <span className="error">Required</span>}
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>
            Project Manager *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              {...register('projectManager', { required: true })}
              value={projectManagerSearchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setProjectManagerSearchTerm(value);
                
                if (projectManagerSearchTimeoutRef.current) {
                  clearTimeout(projectManagerSearchTimeoutRef.current);
                }
                
                if (!value || value.trim().length < 2) {
                  setProjectManagerSearchResults([]);
                  setShowProjectManagerDropdown(false);
                  if (!value || value.trim() === '') {
                    setValue('projectManager', '');
                    setValue('projectManagerName', '');
                  }
                  return;
                }
                
                setShowProjectManagerDropdown(true);
                
                const trimmedValue = value.trim().toLowerCase();
                if (projectManagerSearchCacheRef.current.has(trimmedValue)) {
                  const cachedResults = projectManagerSearchCacheRef.current.get(trimmedValue);
                  setProjectManagerSearchResults(cachedResults);
                  if (cachedResults.length > 0) {
                    setShowProjectManagerDropdown(true);
                  }
                  const debounceTime = 100;
                  projectManagerSearchTimeoutRef.current = setTimeout(() => {
                    searchProjectManager(value.trim());
                  }, debounceTime);
                  return;
                }
                
                let hasPartialMatch = false;
                for (const [cachedTerm, cachedResults] of projectManagerSearchCacheRef.current.entries()) {
                  if (trimmedValue.startsWith(cachedTerm) || cachedTerm.startsWith(trimmedValue)) {
                    if (cachedResults.length > 0) {
                      setProjectManagerSearchResults(cachedResults);
                      setShowProjectManagerDropdown(true);
                      hasPartialMatch = true;
                      break;
                    }
                  }
                }
                
                const searchLength = value.trim().length;
                const debounceTime = searchLength >= 15 ? 50 : searchLength >= 10 ? 100 : searchLength >= 5 ? 150 : 250;
                projectManagerSearchTimeoutRef.current = setTimeout(() => {
                  searchProjectManager(value.trim());
                }, debounceTime);
              }}
              onFocus={() => {
                if (projectManagerSearchResults.length > 0) {
                  setShowProjectManagerDropdown(true);
                } else if (projectManagerSearchTerm && projectManagerSearchTerm.trim().length >= 2) {
                  searchProjectManager(projectManagerSearchTerm.trim());
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowProjectManagerDropdown(false);
                }, 200);
              }}
              className={fieldErrors.projectManager ? 'error-field' : ''}
              placeholder="Search People..."
              style={{ paddingRight: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
            {showProjectManagerDropdown && (
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
                {loadingProjectManagerSearch ? (
                  <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>Searching...</div>
                ) : projectManagerSearchResults.length > 0 ? (
                  projectManagerSearchResults.map(manager => (
                    <div
                      key={manager.id}
                      onClick={() => handleProjectManagerSelect(manager)}
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
                      <div style={{ fontWeight: '500', color: '#000000' }}>{manager.name}</div>
                      {manager.email && (
                        <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>{manager.email}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '6px', fontSize: '12px', color: '#000000', textAlign: 'center', backgroundColor: '#ffffff' }}>No results found</div>
                )}
              </div>
            )}
          </div>
          {errors.projectManager && <span className="error">Required</span>}
        </div>
      </div>
    </div>
  );
};

export default CreateProjectSection;

