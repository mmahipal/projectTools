import React from 'react';
import { Download, Loader, RefreshCw } from 'lucide-react';

const ProjectRosterFunnelTable = ({ 
  data, 
  loading, 
  onRefresh, 
  refreshing,
  loadingMore,
  hasMore,
  totalCount,
  infiniteScrollRef,
  tableContainerRef
}) => {
  // Format the count display: show "X / Total" if totalCount is available, otherwise just "X"
  const getCountDisplay = () => {
    const loadedCount = data ? data.length : 0;
    if (totalCount !== null && totalCount !== undefined && totalCount > 0) {
      return `${loadedCount} / ${totalCount}`;
    }
    return loadedCount.toString();
  };
  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    
    const headers = [
      'Project Objective Name',
      'Draft',
      'Invite',
      'App Received',
      'Matched',
      'Qualified',
      'Active',
      'Production',
      'Removed',
      'Total'
    ];
    
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const row = [
        `"${(item.name || '').replace(/"/g, '""')}"`,
        item.Draft || 0,
        item.Invite || 0,
        item['App Received'] || 0,
        item.Matched || 0,
        item.Qualified || 0,
        item.Active || 0,
        item.Production || 0,
        item.Removed || 0,
        item.Total || 0
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `project_roster_funnel_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading Project Roster Funnel data...</p>
      </div>
    );
  }

  return (
    <div className="case-table-container" ref={tableContainerRef}>
      <div className="case-table-header">
        <h3>Project Roster Funnel ({getCountDisplay()})</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
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
            disabled={!data || data.length === 0}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div className="case-table-empty">
          <p>No Project Objectives found</p>
        </div>
      ) : (
        <div className="case-table-scroll-wrapper">
          <table className="case-table">
            <thead>
              <tr>
                <th>Project Objective Name</th>
                <th>Draft</th>
                <th>Invite</th>
                <th>App Received</th>
                <th>Matched</th>
                <th>Qualified</th>
                <th>Active</th>
                <th>Production</th>
                <th>Removed</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="case-table-row">
                  <td>{item.name || ''}</td>
                  <td>{item.Draft || 0}</td>
                  <td>{item.Invite || 0}</td>
                  <td>{item['App Received'] || 0}</td>
                  <td>{item.Matched || 0}</td>
                  <td>{item.Qualified || 0}</td>
                  <td>{item.Active || 0}</td>
                  <td>{item.Production || 0}</td>
                  <td>{item.Removed || 0}</td>
                  <td>{item.Total || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Infinite scroll trigger and loading indicator */}
          {hasMore && (
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
  );
};

export default ProjectRosterFunnelTable;

