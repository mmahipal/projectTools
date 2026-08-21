import React, { useMemo } from 'react';
import { Calendar, Clock, Globe, Mail, FileText } from 'lucide-react';
import './ScheduleComponents.css';

const SchedulePreview = ({ formData, emailConfig }) => {
  const nextRuns = useMemo(() => {
    if (!formData.schedule || formData.scheduleType === 'one-time') {
      return [formData.runDate || 'N/A'];
    }

    // Calculate next 5 run dates (simplified)
    const runs = [];
    const now = new Date();
    
    for (let i = 0; i < 5; i++) {
      const next = new Date(now);
      if (formData.schedule === 'daily') {
        next.setDate(next.getDate() + i + 1);
      } else if (formData.schedule === 'weekly') {
        next.setDate(next.getDate() + (7 * (i + 1)));
      } else if (formData.schedule === 'monthly') {
        next.setMonth(next.getMonth() + i + 1);
      }
      runs.push(next.toLocaleDateString());
    }
    
    return runs;
  }, [formData]);

  return (
    <div className="schedule-preview">
      <div className="schedule-preview-section">
        <h4 className="schedule-preview-title">
          <Calendar size={16} />
          Schedule Details
        </h4>
        <div className="schedule-preview-content">
          <div className="schedule-preview-item">
            <span className="schedule-preview-label">Type:</span>
            <span className="schedule-preview-value">
              {formData.scheduleType === 'one-time' ? 'One-Time' : 'Recurring'}
            </span>
          </div>
          {formData.scheduleType === 'recurring' && (
            <>
              <div className="schedule-preview-item">
                <span className="schedule-preview-label">Frequency:</span>
                <span className="schedule-preview-value">
                  {formData.schedule === 'daily' ? 'Daily' :
                   formData.schedule === 'weekly' ? 'Weekly' :
                   formData.schedule === 'monthly' ? 'Monthly' :
                   'Custom'}
                </span>
              </div>
              {formData.schedule === 'weekly' && (
                <div className="schedule-preview-item">
                  <span className="schedule-preview-label">Day of Week:</span>
                  <span className="schedule-preview-value">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(formData.dayOfWeek || '1')]}
                  </span>
                </div>
              )}
              {formData.schedule === 'monthly' && (
                <div className="schedule-preview-item">
                  <span className="schedule-preview-label">Day of Month:</span>
                  <span className="schedule-preview-value">{formData.dayOfMonth || '1'}</span>
                </div>
              )}
            </>
          )}
          <div className="schedule-preview-item">
            <span className="schedule-preview-label">
              <Clock size={14} />
              Time:
            </span>
            <span className="schedule-preview-value">{formData.runTime || '09:00'}</span>
          </div>
          <div className="schedule-preview-item">
            <span className="schedule-preview-label">
              <Globe size={14} />
              Timezone:
            </span>
            <span className="schedule-preview-value">{formData.timezone || 'Local'}</span>
          </div>
        </div>
      </div>

      {formData.scheduleType === 'recurring' && (
        <div className="schedule-preview-section">
          <h4 className="schedule-preview-title">Next 5 Runs</h4>
          <div className="schedule-preview-runs">
            {nextRuns.map((run, index) => (
              <div key={index} className="schedule-preview-run">
                {index + 1}. {run} at {formData.runTime || '09:00'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="schedule-preview-section">
        <h4 className="schedule-preview-title">
          <Mail size={16} />
          Email Configuration
        </h4>
        <div className="schedule-preview-content">
          <div className="schedule-preview-item">
            <span className="schedule-preview-label">Recipients:</span>
            <span className="schedule-preview-value">
              {emailConfig?.recipients?.length || 0} recipient(s)
            </span>
          </div>
          <div className="schedule-preview-item">
            <span className="schedule-preview-label">Subject:</span>
            <span className="schedule-preview-value">{emailConfig?.subject || 'N/A'}</span>
          </div>
          <div className="schedule-preview-item">
            <span className="schedule-preview-label">Attach File:</span>
            <span className="schedule-preview-value">
              {emailConfig?.attachFile !== false ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="schedule-preview-item">
            <span className="schedule-preview-label">Delivery Method:</span>
            <span className="schedule-preview-value">
              {emailConfig?.deliveryMethod === 'email' ? 'Email Only' :
               emailConfig?.deliveryMethod === 'email_and_cloud' ? 'Email + Cloud' :
               emailConfig?.deliveryMethod === 'cloud_only' ? 'Cloud Only' : 'Email Only'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePreview;

