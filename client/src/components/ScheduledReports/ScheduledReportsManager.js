import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash2, Play, Pause, Calendar, Mail } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../ConfirmModal';

const ScheduledReportsManager = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    objectType: '',
    fields: [],
    schedule: 'daily',
    format: 'excel',
    recipients: []
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/scheduled-reports');
      if (response.data.success) {
        setReports(response.data.reports || []);
      }
    } catch (error) {
      toast.error('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.objectType) {
      toast.error('Name and object type are required');
      return;
    }

    try {
      const response = await apiClient.post('/scheduled-reports', formData);
      if (response.data.success) {
        toast.success('Scheduled report created');
        setShowForm(false);
        setFormData({ name: '', objectType: '', fields: [], schedule: 'daily', format: 'excel', recipients: [] });
        loadReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create scheduled report');
    }
  };

  const handleUpdate = async () => {
    if (!editingReport) return;

    try {
      const response = await apiClient.put(`/scheduled-reports/${editingReport.id}`, formData);
      if (response.data.success) {
        toast.success('Scheduled report updated');
        setShowForm(false);
        setEditingReport(null);
        setFormData({ name: '', objectType: '', fields: [], schedule: 'daily', format: 'excel', recipients: [] });
        loadReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update scheduled report');
    }
  };

  const handleDelete = async (id) => {
    setDeleteConfirmData({ id });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmData) return;
    const { id } = deleteConfirmData;
    setShowDeleteConfirm(false);

    try {
      const response = await apiClient.delete(`/scheduled-reports/${id}`);
      if (response.data.success) {
        toast.success('Scheduled report deleted');
        loadReports();
      }
    } catch (error) {
      toast.error('Failed to delete scheduled report');
    }
  };

  const handleToggle = async (report) => {
    try {
      const response = await apiClient.put(`/scheduled-reports/${report.id}`, {
        enabled: !report.enabled
      });
      if (response.data.success) {
        toast.success(`Report ${report.enabled ? 'disabled' : 'enabled'}`);
        loadReports();
      }
    } catch (error) {
      toast.error('Failed to toggle report');
    }
  };

  const startEdit = (report) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      objectType: report.objectType,
      fields: report.fields || [],
      schedule: report.schedule,
      format: report.format || 'excel',
      recipients: report.recipients || []
    });
    setShowForm(true);
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={24} color="#0176d3" />
          Scheduled Reports
        </h2>
        <button
          onClick={() => {
            setEditingReport(null);
            setFormData({ name: '', objectType: '', fields: [], schedule: 'daily', format: 'excel', recipients: [] });
            setShowForm(true);
          }}
          style={{
            padding: '8px 16px',
            background: '#0176d3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          Create Report
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            {editingReport ? 'Edit' : 'Create'} Scheduled Report
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Report Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Object Type *
              </label>
              <input
                type="text"
                value={formData.objectType}
                onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                placeholder="e.g., Project, Contributor Project"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Schedule *
              </label>
              <select
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: '#fff'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: '#fff'
                }}
              >
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={editingReport ? handleUpdate : handleCreate}
              style={{
                padding: '8px 16px',
                background: '#0176d3',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {editingReport ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingReport(null);
              }}
              style={{
                padding: '8px 16px',
                background: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>No scheduled reports. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {reports.map(report => (
            <div
              key={report.id}
              style={{
                padding: '16px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{report.name}</h4>
                  <span
                    style={{
                      padding: '2px 8px',
                      background: report.enabled ? '#d1fae5' : '#fee2e2',
                      color: report.enabled ? '#065f46' : '#991b1b',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {report.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {report.schedule}
                  </span>
                  <span>{report.objectType}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} />
                    {report.recipients?.length || 0} recipients
                  </span>
                  {report.lastRunAt && (
                    <span>Last run: {new Date(report.lastRunAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleToggle(report)}
                  style={{
                    padding: '6px 12px',
                    background: report.enabled ? '#fef3c7' : '#d1fae5',
                    color: report.enabled ? '#92400e' : '#065f46',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {report.enabled ? <Pause size={14} /> : <Play size={14} />}
                  {report.enabled ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => startEdit(report)}
                  style={{
                    padding: '6px 12px',
                    background: '#e0e7ff',
                    color: '#3730a3',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(report.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        show={showDeleteConfirm}
        message="Are you sure you want to delete this scheduled report?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmData(null);
        }}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ScheduledReportsManager;

