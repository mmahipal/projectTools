import React, { useState, useMemo } from 'react';
import { Download, Loader, RefreshCw, X, Search } from 'lucide-react';
// import apiClient from '../../config/api'; // Unused
// import toast from 'react-hot-toast'; // Unused
// import * as XLSX from 'xlsx'; // Unused
import ObjectViewModal from '../ClientToolAccount/ObjectViewModal';

const ActiveProjectObjectivesByQualStepTable = ({ 
  data, 
  loading, 
  onRefresh, 
  refreshing,
  loadingMore,
  hasMore,
  totalCount,
  infiniteScrollRef,
  tableContainerRef,
  searchTerm,
  onSearchChange
}) => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalObjectId, setViewModalObjectId] = useState(null);
  const [viewModalObjectName, setViewModalObjectName] = useState(null);

  // Format the count display: show "X / Total" if totalCount is available, otherwise just "X"
  const getCountDisplay = () => {
    const loadedCount = data ? data.length : 0;
    if (totalCount !== null && totalCount !== undefined && totalCount > 0) {
      return `${loadedCount} / ${totalCount}`;
    }
    return loadedCount.toString();
  };

  // Transform data - each row is a qualification step with project objective count
  const flattenedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.warn('[Active Project Objectives by Qual Step] Data is not an array:', data);
      return [];
    }
    
    return data.map((qualStep) => ({
      qualStepName: qualStep.qualStepName || '',
      qualStepId: qualStep.qualStepId || null,
      status: qualStep.status || '',
      passingPercentageScore: qualStep.passingPercentageScore || null,
      projectCount: qualStep.projectCount || 0,
      projectObjectiveCount: qualStep.projectObjectiveCount || 0
    }));
  }, [data]);

  const handleQualStepNameClick = (qualStepId, qualStepName) => {
    if (!qualStepId || qualStepId === 'null') {
      return;
    }
    setViewModalObjectId(qualStepId);
    setViewModalObjectName(qualStepName);
    setViewModalOpen(true);
  };


  const handleExportCSV = () => {
    const exportData = flattenedData;
    if (!exportData || exportData.length === 0) return;
    
    const headers = [
      'Qualification Step',
      'Status',
      'Project Objectives Count',
      'Projects Count',
      'Passing Percentage Score'
    ];
    
    const csvRows = [headers.join(',')];
    
    exportData.forEach(item => {
      const row = [
        `"${(item.qualStepName || '').replace(/"/g, '""')}"`,
        `"${(item.status || '').replace(/"/g, '""')}"`,
        item.projectObjectiveCount || 0,
        item.projectCount || 0,
        item.passingPercentageScore || ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `active_project_objectives_by_qual_step_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading Active Project Objectives by Qualification Step data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="case-table-container" ref={tableContainerRef}>
        <div className="case-table-header">
          <h3>Active Project Objectives by Qualification Step ({getCountDisplay()})</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Search Input */}
            <div className="table-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Qualification Step..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="table-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={onRefresh}
              disabled={refreshing || loading}
              className="btn-action"
              title="Refresh data"
              style={{ marginRight: '8px' }}
            >
              {refreshing ? <Loader size={16} className="spinning" /> : <RefreshCw size={16} />}
              <span>Refresh</span>
            </button>
            <button
              className="btn-export-csv"
              onClick={handleExportCSV}
              title="Export to CSV"
              disabled={!flattenedData || flattenedData.length === 0}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {!flattenedData || flattenedData.length === 0 ? (
          <div className="case-table-empty">
            <p>{searchTerm ? 'No results found for your search' : 'No data found'}</p>
          </div>
        ) : (
          <div className="case-table-scroll-wrapper">
            <table className="case-table">
                      <thead>
                        <tr>
                          <th>Qualification Step</th>
                          <th>Status</th>
                          <th>Project Objectives Count</th>
                          <th>Projects Count</th>
                          <th>Passing Percentage Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flattenedData.map((item, index) => (
                          <tr key={`${item.qualStepId}-${index}`} className="case-table-row">
                            <td>
                              {item.qualStepId && item.qualStepId !== 'null' ? (
                                <button
                                  onClick={() => handleQualStepNameClick(item.qualStepId, item.qualStepName)}
                                  className="count-link"
                                  title="Click to view Qualification Step details"
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#0176d3', 
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: 0,
                                    fontSize: 'inherit'
                                  }}
                                >
                                  {item.qualStepName || ''}
                                </button>
                              ) : (
                                <span>{item.qualStepName || ''}</span>
                              )}
                            </td>
                            <td>{item.status || ''}</td>
                            <td>{item.projectObjectiveCount || 0}</td>
                            <td>{item.projectCount || 0}</td>
                            <td>{item.passingPercentageScore !== null && item.passingPercentageScore !== undefined ? `${item.passingPercentageScore}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Search results info */}
            {searchTerm && (
              <div style={{ 
                padding: '12px 16px', 
                fontSize: '13px', 
                color: '#666',
                borderTop: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}>
                Showing {flattenedData.length} result{flattenedData.length !== 1 ? 's' : ''} for "{searchTerm}"
              </div>
            )}
            
            {/* Infinite scroll trigger and loading indicator */}
            {hasMore && !searchTerm && (
              <>
                {!loadingMore && (
                  <div
                    ref={infiniteScrollRef}
                    style={{ 
                      height: '50px', 
                      width: '100%', 
                      marginTop: '20px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      padding: '10px'
                    }}>
                      Scroll for more...
                    </div>
                  </div>
                )}
                {loadingMore && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    padding: '20px',
                    gap: '12px'
                  }}>
                    <Loader className="spinning" size={20} style={{ color: '#0176d3' }} />
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Loading more records...</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Qualification Step View Modal */}
      <ObjectViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewModalObjectId(null);
          setViewModalObjectName(null);
        }}
        objectType="Qualification_Step__c"
        objectId={viewModalObjectId}
        objectName={viewModalObjectName}
        readOnly={true}
      />
    </>
  );
};

export default ActiveProjectObjectivesByQualStepTable;

