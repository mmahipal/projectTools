import React from 'react';
import { Table, RefreshCw, Eye, Edit2, Trash2, Calendar } from 'lucide-react';

const ReportsList = ({
  reportsHistory,
  loadingHistory,
  selectedCategory,
  categories,
  onCategoryChange,
  onRefresh,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}) => {
  const getFilteredReports = () => {
    if (selectedCategory === 'All') {
      return reportsHistory;
    }
    return reportsHistory.filter(r => (r.category || 'Uncategorized') === selectedCategory);
  };

  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={24} color="#08979C" />
          All Reports
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '13px',
              background: '#fff'
            }}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={onRefresh}
            disabled={loadingHistory}
            style={{
              padding: '8px 16px',
              background: '#08979C',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'Poppins',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} className={loadingHistory ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loadingHistory ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <RefreshCw size={32} className="spinning" style={{ marginBottom: '12px' }} />
          <p>Loading reports...</p>
        </div>
      ) : getFilteredReports().length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <Table size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>No reports found. Generate a report to see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {getFilteredReports().map(report => (
            <div
              key={report.id}
              style={{
                padding: '16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0, marginBottom: '8px' }}>
                    {report.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span>{report.objectType}</span>
                    <span>{report.recordCount || (report.data ? report.data.length : 0)} {report.recordCount === 1 ? 'entry' : 'entries'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {new Date(report.generatedAt || report.createdAt).toLocaleString()}
                    </span>
                    {report.generatedBy && (
                      <span>By: {report.generatedBy}</span>
                    )}
                    {report.category && (
                      <span style={{ padding: '2px 6px', background: '#e0e7ff', borderRadius: '4px', fontSize: '11px' }}>
                        {report.category}
                      </span>
                    )}
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: report.type === 'scheduled' ? '#dbeafe' : '#d1fae5',
                        color: report.type === 'scheduled' ? '#1e40af' : '#065f46'
                      }}
                    >
                      {report.type === 'scheduled' ? 'SCHEDULED' : 'MANUAL'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {report.data && report.data.length > 0 && (
                    <>
                      <button
                        onClick={() => onView(report.id)}
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
                        <Eye size={14} />
                        View
                      </button>
                      {canEdit && onEdit && (
                        <button
                          onClick={() => onEdit(report.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      )}
                    </>
                  )}
                  {canDelete && onDelete && report.type !== 'scheduled' && (
                    <button
                      onClick={() => onDelete(report.id)}
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsList;

