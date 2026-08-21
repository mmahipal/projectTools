import React from 'react';
import { FileText, Info } from 'lucide-react';
import './EmailConfig.css';

const EmailTemplateEditor = ({ 
  subject, 
  body, 
  reportName,
  onSubjectChange, 
  onBodyChange 
}) => {
  const variables = [
    { key: '{reportName}', label: 'Report Name', example: reportName || 'My Report' },
    { key: '{date}', label: 'Current Date', example: new Date().toLocaleDateString() },
    { key: '{time}', label: 'Current Time', example: new Date().toLocaleTimeString() },
    { key: '{recordCount}', label: 'Record Count', example: '1,234' }
  ];

  const insertVariable = (variable) => {
    const textarea = document.getElementById('email-body-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = body || '';
      const newText = text.substring(0, start) + variable + text.substring(end);
      onBodyChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <div className="email-template-editor">
      <div className="email-template-section">
        <label className="email-template-label">
          Email Subject *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Enter email subject"
          className="email-template-subject-input"
        />
        <div className="email-template-hint">
          You can use variables: {variables.map(v => v.key).join(', ')}
        </div>
      </div>

      <div className="email-template-section">
        <div className="email-template-header">
          <label className="email-template-label">
            Email Body
          </label>
          <div className="email-template-variables">
            <span className="email-template-variables-label">Insert variables:</span>
            {variables.map(variable => (
              <button
                key={variable.key}
                type="button"
                onClick={() => insertVariable(variable.key)}
                className="email-template-variable-btn"
                title={`${variable.label}: ${variable.example}`}
              >
                {variable.key}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="email-body-textarea"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Enter email body (optional)"
          className="email-template-body-input"
          rows={8}
        />
        <div className="email-template-preview">
          <div className="email-template-preview-header">
            <Info size={14} />
            <span>Preview:</span>
          </div>
          <div className="email-template-preview-content">
            <div className="email-template-preview-subject">
              {subject.replace(/\{reportName\}/g, reportName || 'My Report')
                      .replace(/\{date\}/g, new Date().toLocaleDateString())
                      .replace(/\{time\}/g, new Date().toLocaleTimeString())
                      .replace(/\{recordCount\}/g, '1,234')}
            </div>
            <div className="email-template-preview-body">
              {body.replace(/\{reportName\}/g, reportName || 'My Report')
                    .replace(/\{date\}/g, new Date().toLocaleDateString())
                    .replace(/\{time\}/g, new Date().toLocaleTimeString())
                    .replace(/\{recordCount\}/g, '1,234') || '(empty)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;

