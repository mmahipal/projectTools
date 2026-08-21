import React, { useState } from 'react';
import { Mail, Plus, X, Send, FileText } from 'lucide-react';
import EmailRecipientManager from './EmailRecipientManager';
import EmailTemplateEditor from './EmailTemplateEditor';
import './EmailConfig.css';

const EmailConfig = ({ 
  emailConfig, 
  onEmailConfigChange,
  reportName 
}) => {
  const [activeTab, setActiveTab] = useState('recipients');

  return (
    <div className="email-config">
      <div className="email-config-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} color="#08979C" />
          <label style={{ fontSize: '13px', fontWeight: '500' }}>
            Email & Delivery Configuration
          </label>
        </div>
      </div>

      <div className="email-config-tabs">
        <button
          type="button"
          className={`email-config-tab ${activeTab === 'recipients' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipients')}
        >
          Recipients
        </button>
        <button
          type="button"
          className={`email-config-tab ${activeTab === 'template' ? 'active' : ''}`}
          onClick={() => setActiveTab('template')}
        >
          Email Template
        </button>
        <button
          type="button"
          className={`email-config-tab ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery')}
        >
          Delivery Options
        </button>
      </div>

      <div className="email-config-content">
        {activeTab === 'recipients' && (
          <EmailRecipientManager
            recipients={emailConfig.recipients || []}
            onRecipientsChange={(recipients) => 
              onEmailConfigChange({ ...emailConfig, recipients })
            }
          />
        )}

        {activeTab === 'template' && (
          <EmailTemplateEditor
            subject={emailConfig.subject || `Report: ${reportName || 'Untitled'}`}
            body={emailConfig.body || ''}
            reportName={reportName}
            onSubjectChange={(subject) => 
              onEmailConfigChange({ ...emailConfig, subject })
            }
            onBodyChange={(body) => 
              onEmailConfigChange({ ...emailConfig, body })
            }
          />
        )}

        {activeTab === 'delivery' && (
          <div className="email-delivery-options">
            <div className="email-delivery-option">
              <label className="email-delivery-label">
                <input
                  type="checkbox"
                  checked={emailConfig.attachFile !== false}
                  onChange={(e) => 
                    onEmailConfigChange({ ...emailConfig, attachFile: e.target.checked })
                  }
                />
                <span>Attach report file to email</span>
              </label>
            </div>
            <div className="email-delivery-option">
              <label className="email-delivery-label">
                <input
                  type="checkbox"
                  checked={emailConfig.includeLink === true}
                  onChange={(e) => 
                    onEmailConfigChange({ ...emailConfig, includeLink: e.target.checked })
                  }
                />
                <span>Include download link in email</span>
              </label>
            </div>
            <div className="email-delivery-option">
              <label className="email-delivery-label">
                <input
                  type="checkbox"
                  checked={emailConfig.embedData === true}
                  onChange={(e) => 
                    onEmailConfigChange({ ...emailConfig, embedData: e.target.checked })
                  }
                />
                <span>Embed report data in email body (for small reports)</span>
              </label>
            </div>
            <div className="email-delivery-option">
              <label className="email-delivery-label">
                <span>Delivery Method:</span>
                <select
                  value={emailConfig.deliveryMethod || 'email'}
                  onChange={(e) => 
                    onEmailConfigChange({ ...emailConfig, deliveryMethod: e.target.value })
                  }
                  className="email-delivery-select"
                >
                  <option value="email">Email Only</option>
                  <option value="email_and_cloud">Email + Cloud Storage</option>
                  <option value="cloud_only">Cloud Storage Only</option>
                </select>
              </label>
            </div>
            {emailConfig.deliveryMethod !== 'email' && (
              <div className="email-delivery-option">
                <label className="email-delivery-label">
                  <span>Cloud Storage:</span>
                  <select
                    value={emailConfig.cloudStorage || 'none'}
                    onChange={(e) => 
                      onEmailConfigChange({ ...emailConfig, cloudStorage: e.target.value })
                    }
                    className="email-delivery-select"
                  >
                    <option value="none">None</option>
                    <option value="google_drive">Google Drive</option>
                    <option value="dropbox">Dropbox</option>
                    <option value="onedrive">OneDrive</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfig;

