import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import './ScheduleReportModal.css';

const ScheduleReportModal = ({ show, savedReports, onClose, onSelect }) => {
  const [selectedReportId, setSelectedReportId] = useState(null);

  if (!show) return null;

  const handleSelect = () => {
    if (selectedReportId) {
      const report = savedReports.find(r => r.id === selectedReportId);
      if (report) {
        onSelect(report);
        setSelectedReportId(null);
      }
    }
  };

  return (
    <div className="schedule-report-modal-overlay" onClick={onClose}>
      <div className="schedule-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-report-modal-header">
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Schedule Existing Report
          </h3>
          <button
            onClick={onClose}
            className="schedule-report-modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="schedule-report-modal-content">
          {savedReports.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <p>No saved reports available. Please create a report in Report Builder first.</p>
            </div>
          ) : (
            <div className="schedule-report-list">
              {savedReports.map(report => (
                <div
                  key={report.id}
                  className={`schedule-report-item ${selectedReportId === report.id ? 'selected' : ''}`}
                  onClick={() => setSelectedReportId(report.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {report.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {report.objectType} • {report.fields?.length || 0} field(s)
                      {report.category && ` • ${report.category}`}
                    </div>
                  </div>
                  {selectedReportId === report.id && (
                    <Check size={18} color="#08979C" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="schedule-report-modal-footer">
          <button
            onClick={onClose}
            className="schedule-report-modal-btn schedule-report-modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedReportId}
            className="schedule-report-modal-btn schedule-report-modal-btn-done"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleReportModal;

