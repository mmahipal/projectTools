import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Globe, Eye } from 'lucide-react';
import TimePicker from './ScheduleComponents/TimePicker';
import TimezoneSelector from './ScheduleComponents/TimezoneSelector';
import SchedulePreview from './ScheduleComponents/SchedulePreview';
import EmailConfig from './EmailConfig';
import './ScheduleModal.css';

const ScheduleModal = ({ show, formData, onClose, onSave, onChange, reportName }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [emailConfig, setEmailConfig] = useState(formData.emailConfig || {
    recipients: [],
    subject: `Report: ${reportName || 'Untitled'}`,
    body: '',
    attachFile: true,
    includeLink: false,
    embedData: false,
    deliveryMethod: 'email',
    cloudStorage: 'none'
  });

  useEffect(() => {
    onChange({ ...formData, emailConfig });
  }, [emailConfig]);

  if (!show) return null;

  const handleSave = () => {
    const finalData = {
      ...formData,
      emailConfig
    };
    onSave(finalData);
  };

  return (
    <div className="schedule-modal-overlay">
      <div className="schedule-modal">
        <div className="schedule-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="#08979C" />
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Schedule Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="schedule-modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="schedule-modal-tabs">
          <button
            type="button"
            className={`schedule-modal-tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={16} />
            Schedule
          </button>
          <button
            type="button"
            className={`schedule-modal-tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <Clock size={16} />
            Email & Delivery
          </button>
          <button
            type="button"
            className={`schedule-modal-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={16} />
            Preview
          </button>
        </div>

        <div className="schedule-modal-content">
          {activeTab === 'schedule' && (
            <div className="schedule-settings">
              <div className="schedule-setting-group">
                <label className="schedule-label">
                  Schedule Type *
                </label>
                <select
                  value={formData.scheduleType || 'recurring'}
                  onChange={(e) => onChange({ ...formData, scheduleType: e.target.value })}
                  className="schedule-select"
                >
                  <option value="recurring">Recurring</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>

              {formData.scheduleType === 'one-time' ? (
                <div className="schedule-setting-group">
                  <label className="schedule-label">
                    Run Date & Time *
                  </label>
                  <div className="schedule-datetime-inputs">
                    <input
                      type="date"
                      value={formData.runDate || ''}
                      onChange={(e) => onChange({ ...formData, runDate: e.target.value })}
                      className="schedule-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <TimePicker
                      value={formData.runTime || '09:00'}
                      onChange={(time) => onChange({ ...formData, runTime: time })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="schedule-setting-group">
                    <label className="schedule-label">
                      Frequency *
                    </label>
                    <select
                      value={formData.schedule || 'daily'}
                      onChange={(e) => onChange({ ...formData, schedule: e.target.value })}
                      className="schedule-select"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom (Cron Expression)</option>
                    </select>
                  </div>

                  {formData.schedule === 'weekly' && (
                    <div className="schedule-setting-group">
                      <label className="schedule-label">
                        Day of Week *
                      </label>
                      <select
                        value={formData.dayOfWeek || '1'}
                        onChange={(e) => onChange({ ...formData, dayOfWeek: e.target.value })}
                        className="schedule-select"
                      >
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                    </div>
                  )}

                  {formData.schedule === 'monthly' && (
                    <div className="schedule-setting-group">
                      <label className="schedule-label">
                        Day of Month *
                      </label>
                      <select
                        value={formData.dayOfMonth || '1'}
                        onChange={(e) => onChange({ ...formData, dayOfMonth: e.target.value })}
                        className="schedule-select"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.schedule === 'custom' && (
                    <div className="schedule-setting-group">
                      <label className="schedule-label">
                        Cron Expression *
                      </label>
                      <input
                        type="text"
                        value={formData.cronExpression || ''}
                        onChange={(e) => onChange({ ...formData, cronExpression: e.target.value })}
                        placeholder="0 9 * * * (minute hour day month weekday)"
                        className="schedule-input"
                      />
                      <div className="schedule-hint">
                        Format: minute hour day month weekday (e.g., "0 9 * * *" for daily at 9 AM)
                      </div>
                    </div>
                  )}

                  <div className="schedule-setting-group">
                    <label className="schedule-label">
                      Time *
                    </label>
                    <TimePicker
                      value={formData.runTime || '09:00'}
                      onChange={(time) => onChange({ ...formData, runTime: time })}
                    />
                  </div>
                </>
              )}

              <div className="schedule-setting-group">
                <label className="schedule-label">
                  Timezone *
                </label>
                <TimezoneSelector
                  value={formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                  onChange={(tz) => onChange({ ...formData, timezone: tz })}
                />
              </div>

              <div className="schedule-setting-group">
                <label className="schedule-label">
                  <input
                    type="checkbox"
                    checked={formData.enabled !== false}
                    onChange={(e) => onChange({ ...formData, enabled: e.target.checked })}
                  />
                  <span>Enable schedule immediately</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <EmailConfig
              emailConfig={emailConfig}
              onEmailConfigChange={setEmailConfig}
              reportName={reportName}
            />
          )}

          {activeTab === 'preview' && (
            <SchedulePreview
              formData={formData}
              emailConfig={emailConfig}
            />
          )}
        </div>

        <div className="schedule-modal-footer">
          <button
            onClick={onClose}
            className="schedule-modal-btn schedule-modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="schedule-modal-btn schedule-modal-btn-save"
          >
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
