import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/SaveReportModal.css';

const SaveReportModal = ({ show, onClose, reportConfig, onSave }) => {
  const [reportName, setReportName] = useState(reportConfig.name || '');
  const [category, setCategory] = useState(reportConfig.category || 'Uncategorized');

  const handleSave = () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    // Check if multi-object mode or legacy single-object mode
    const isMultiObjectMode = reportConfig.objects && reportConfig.objects.length > 0;
    
    if (isMultiObjectMode) {
      // Multi-object mode: check if at least one object has fields
      const hasFields = reportConfig.objects.some(obj => 
        obj.fields && obj.fields.length > 0
      );
      
      if (!hasFields) {
        toast.error('Please add at least one field to at least one object');
        return;
      }
      
      // Also check if at least one object is selected
      if (reportConfig.objects.length === 0) {
        toast.error('Please select at least one object');
        return;
      }
    } else {
      // Legacy single-object mode
      if (!reportConfig.objectType) {
        toast.error('Please select an object type');
        return;
      }

      if (!reportConfig.fields || reportConfig.fields.length === 0) {
        toast.error('Please add at least one field');
        return;
      }
    }

    const reportToSave = {
      ...reportConfig,
      name: reportName.trim(),
      category: category.trim() || 'Uncategorized',
      id: reportConfig.id || `advanced_report_${Date.now()}`,
      createdAt: reportConfig.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(reportToSave);
    onClose();
    setReportName('');
    setCategory('Uncategorized');
  };

  if (!show) return null;

  return (
    <div className="save-report-modal-overlay" onClick={onClose}>
      <div className="save-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="save-modal-header">
          <h3>Save Report</h3>
          <button className="save-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="save-modal-content">
          <div className="save-modal-field">
            <label>Report Name *</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
              className="save-modal-input"
              autoFocus
            />
          </div>
          <div className="save-modal-field">
            <label>Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Uncategorized"
              className="save-modal-input"
            />
          </div>
        </div>
        <div className="save-modal-actions">
          <button className="save-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="save-modal-save" onClick={handleSave}>
            <Save size={16} /> Save Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveReportModal;

