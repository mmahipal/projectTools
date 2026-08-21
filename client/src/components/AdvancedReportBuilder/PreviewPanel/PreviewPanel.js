import React from 'react';
import { ChevronUp, ChevronDown, Download } from 'lucide-react';
import { exportData } from '../../../utils/crossFeature/exportService';
import PreviewTable from './PreviewTable';
import '../../../styles/PreviewPanel.css';

const PreviewPanel = ({ data, loading, error, expanded, onToggle, reportName, reportConfig }) => {
  // Always show the header so users can expand/collapse
  // Only hide completely if there's no data, no loading, and no error
  const hasContent = data || loading || error;
  
  // If collapsed and no content, still show a minimal header to allow expansion
  if (!expanded && !hasContent) {
    return (
      <div className="preview-panel collapsed">
        <div className="preview-panel-header" onClick={onToggle}>
          <div className="preview-header-left">
            <ChevronUp size={18} />
            <h3>Preview</h3>
            <span className="preview-hint">(Click to expand)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`preview-panel ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="preview-panel-header" onClick={onToggle}>
        <div className="preview-header-left">
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          <h3>Preview</h3>
          {data && <span className="preview-count">({data.length} rows)</span>}
          {loading && <span className="preview-status">Loading...</span>}
          {error && <span className="preview-status error">Error</span>}
        </div>
        {expanded && data && data.length > 0 && (
          <div className="preview-actions">
            <button
              className="preview-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                exportData(data, reportName || 'report', 'excel');
              }}
              title="Export to Excel"
            >
              <Download size={16} /> Export
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="preview-panel-content">
          {loading ? (
            <div className="preview-loading">
              <div className="spinner"></div>
              <p>Loading preview...</p>
            </div>
          ) : error ? (
            <div className="preview-error">
              <p>Error: {error}</p>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="preview-empty">
              <p>No data to preview. Add fields and configure your report.</p>
            </div>
          ) : (
            <PreviewTable data={data.slice(0, 10)} />
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;

