import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import AdvancedReportView from './AdvancedReportView';
import ConfirmModal from '../ConfirmModal';
import '../../styles/AdvancedReportsList.css';

const AdvancedReportsList = ({ onEditReport }) => {
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = () => {
    try {
      const saved = localStorage.getItem('advanced_saved_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedReports(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
      // Silently fail - don't show browser alert
      setSavedReports([]);
    }
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setViewMode(true);
  };

  const handleEdit = (report) => {
    if (onEditReport) {
      onEditReport(report);
    }
  };

  const handleDelete = (reportId) => {
    setReportToDelete(reportId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (reportToDelete) {
      try {
        const updated = savedReports.filter(r => r.id !== reportToDelete);
        localStorage.setItem('advanced_saved_reports', JSON.stringify(updated));
        setSavedReports(updated);
        toast.success('Report deleted successfully');
        if (selectedReport && selectedReport.id === reportToDelete) {
          setSelectedReport(null);
          setViewMode(false);
        }
        setReportToDelete(null);
      } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('Failed to delete report');
        // Silently fail - don't show browser alert
      }
    }
    setShowDeleteConfirm(false);
  };

  const filteredReports = savedReports.filter(report =>
    searchTerm === '' ||
    report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group reports by category
  const reportsByCategory = {};
  filteredReports.forEach(report => {
    const category = report.category || 'Uncategorized';
    if (!reportsByCategory[category]) {
      reportsByCategory[category] = [];
    }
    reportsByCategory[category].push(report);
  });
  const categories = Object.keys(reportsByCategory).sort();

  if (viewMode && selectedReport) {
    return (
      <AdvancedReportView
        report={selectedReport}
        onClose={() => {
          setViewMode(false);
          setSelectedReport(null);
        }}
        onEdit={() => {
          handleEdit(selectedReport);
        }}
      />
    );
  }

  return (
    <div className="advanced-reports-list">
      <div className="reports-header">
        <h2>Saved Reports</h2>
        <div className="reports-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="reports-empty">
          <FileText size={48} />
          <h3>No saved reports</h3>
          <p>Create a report in the Builder tab to get started</p>
        </div>
      ) : (
        <div className="reports-list-container">
          {categories.map(category => (
            <div key={category} className="reports-category-section">
              <div className="category-header">
                <FileText size={18} />
                <h3 className="category-title">{category}</h3>
                <span className="category-count">({reportsByCategory[category].length})</span>
              </div>
              <div className="reports-list">
                {reportsByCategory[category].map(report => (
                  <div key={report.id} className="report-list-item">
                    <div className="report-item-info">
                      <h4 className="report-item-name">{report.name || 'Unnamed Report'}</h4>
                      <div className="report-item-details">
                        <span className="report-item-object">
                          {report.objects && report.objects.length > 0 
                            ? `${report.objects.map(o => o.objectType).join(', ')}`
                            : `${report.objectType || 'N/A'}`
                          }
                        </span>
                        <span className="report-item-separator">•</span>
                        <span className="report-item-fields">
                          {(() => {
                            // Count fields in multi-object mode or legacy single-object mode
                            if (report.objects && report.objects.length > 0) {
                              const totalFields = report.objects.reduce((sum, obj) => 
                                sum + (obj.fields?.length || 0), 0
                              );
                              return `${totalFields} field(s)`;
                            } else {
                              return `${report.fields?.length || 0} field(s)`;
                            }
                          })()}
                        </span>
                        {report.updatedAt && (
                          <>
                            <span className="report-item-separator">•</span>
                            <span className="report-item-date">
                              Updated: {new Date(report.updatedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="report-item-actions">
                      <button
                        className="report-action-btn view-btn"
                        onClick={() => handleView(report)}
                        title="View Report"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="report-action-btn edit-btn"
                        onClick={() => handleEdit(report)}
                        title="Edit Report"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="report-action-btn delete-btn"
                        onClick={() => handleDelete(report.id)}
                        title="Delete Report"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteConfirm}
        message="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setReportToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdvancedReportsList;

