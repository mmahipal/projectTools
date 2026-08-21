import React, { useState } from 'react';
import { Plus, Folder, X, Trash2 } from 'lucide-react';

const SavedReportsPanel = ({ 
  savedReports, 
  selectedReportId, 
  onSelectReport, 
  onCreateNew,
  onDeleteReport
}) => {
  const [hoveredReportId, setHoveredReportId] = useState(null);
  return (
    <div style={{ 
      width: '320px', 
      borderRight: '1px solid #e5e7eb',
      paddingRight: '24px',
      height: 'fit-content',
      maxHeight: 'calc(100vh - 200px)',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Folder size={18} color="#08979C" />
          Saved Reports
        </h3>
      </div>
      <button
        onClick={onCreateNew}
        style={{
          width: '100%',
          padding: '8px 16px',
          background: '#08979C',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontFamily: 'Poppins'
        }}
      >
        <Plus size={16} />
        New Report
      </button>
      {savedReports.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
          No saved reports. Create a new report to save it.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {savedReports.map(report => (
            <div
              key={report.id}
              style={{
                padding: '12px',
                background: selectedReportId === report.id ? '#e6fffa' : '#f9fafb',
                borderRadius: '6px',
                border: selectedReportId === report.id ? '2px solid #08979C' : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={() => setHoveredReportId(report.id)}
              onMouseLeave={() => setHoveredReportId(null)}
            >
              <div 
                onClick={() => onSelectReport(report)}
                style={{ paddingRight: onDeleteReport ? '24px' : '0' }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{report.name}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>{report.objectType}</div>
                {report.category && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    {report.category}
                  </div>
                )}
              </div>
              {onDeleteReport && hoveredReportId === report.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteReport(report.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                  title="Delete report"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedReportsPanel;

