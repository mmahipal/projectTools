import React, { useState, useMemo } from 'react';
import { Download, Loader, RefreshCw, X, Search } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ActiveContributorsByProjectTable = ({ 
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
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  const [contributors, setContributors] = useState([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  // const [selectedProjectObjective, setSelectedProjectObjective] = useState(null); // Unused
  const setSelectedProjectObjective = () => {}; // Placeholder to prevent errors
  const [selectedProjectObjectiveName, setSelectedProjectObjectiveName] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Format the count display: show "X / Total" if totalCount is available, otherwise just "X"
  const getCountDisplay = () => {
    const loadedCount = data ? data.length : 0;
    if (totalCount !== null && totalCount !== undefined && totalCount > 0) {
      return `${loadedCount} / ${totalCount}`;
    }
    return loadedCount.toString();
  };


  // Flatten data - memoized to avoid recalculating on every render
  const flattenedData = useMemo(() => {
    const flattened = [];
    data.forEach(project => {
      if (project.projectObjectives && project.projectObjectives.length > 0) {
        project.projectObjectives.forEach(po => {
          flattened.push({
            projectName: project.projectName,
            projectObjectiveName: po.name,
            projectObjectiveId: po.id,
            activeContributorCount: po.activeContributorCount || 0
          });
        });
      } else {
        // Project with no project objectives
        flattened.push({
          projectName: project.projectName,
          projectObjectiveName: '',
          projectObjectiveId: null,
          activeContributorCount: 0
        });
      }
    });
    // Sort by Active Contributor Count in descending order
    return flattened.sort((a, b) => (b.activeContributorCount || 0) - (a.activeContributorCount || 0));
  }, [data]);

  // Filter flattened data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return flattenedData;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return flattenedData.filter(item => {
      const projectName = (item.projectName || '').toLowerCase();
      const projectObjectiveName = (item.projectObjectiveName || '').toLowerCase();
      return projectName.includes(searchLower) || projectObjectiveName.includes(searchLower);
    });
  }, [flattenedData, searchTerm]);

  const handleCountClick = async (projectObjectiveId, projectObjectiveName) => {
    if (!projectObjectiveId || projectObjectiveId === 'null') {
      return;
    }

    setSelectedProjectObjective(projectObjectiveId);
    setSelectedProjectObjectiveName(projectObjectiveName);
    setShowContributorsModal(true);
    setLoadingContributors(true);
    setContributors([]);

    try {
      const response = await apiClient.get(`/active-contributors-by-project/contributors/${projectObjectiveId}`);
      if (response.data.success) {
        // Backend returns array of contributor objects with name, email, country, language
        setContributors(response.data.contributors || []);
      } else {
        toast.error(response.data.error || 'Failed to fetch contributor details');
        setShowContributorsModal(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch contributor details';
      toast.error(errorMessage);
      setShowContributorsModal(false);
    } finally {
      setLoadingContributors(false);
    }
  };

  const handleExportContributorsToExcel = () => {
    if (!contributors || contributors.length === 0) {
      toast.error('No contributors to export');
      return;
    }

    try {
      // Prepare data for Excel export
      const exportData = contributors.map((contributor, index) => {
        // Handle both string (name only) and object (full details) formats
        if (typeof contributor === 'string') {
          return {
            'S.No': index + 1,
            'Contributor Name': contributor,
            'Email ID': '-',
            'Country': '-',
            'Primary Language': '-'
          };
        } else {
          return {
            'S.No': index + 1,
            'Contributor Name': contributor.name || contributor.Name || '-',
            'Email ID': contributor.email || contributor.Email || '-',
            'Country': contributor.country || contributor.Country || '-',
            'Primary Language': contributor.language || contributor.Language || contributor.primaryLanguage || '-'
          };
        }
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Active Contributors');

      // Generate Excel file
      const fileName = `active_contributors_${(selectedProjectObjectiveName || 'project_objective').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Contributors exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export contributors to Excel');
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData;
    if (!exportData || exportData.length === 0) return;
    
    const headers = [
      'Project Name',
      'Project Objective Name',
      'Active Contributor Count'
    ];
    
    const csvRows = [headers.join(',')];
    
    exportData.forEach(item => {
      const row = [
        `"${(item.projectName || '').replace(/"/g, '""')}"`,
        `"${(item.projectObjectiveName || '').replace(/"/g, '""')}"`,
        item.activeContributorCount || 0
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `active_contributors_by_project_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="case-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading Active Contributors by Project data...</p>
      </div>
    );
  }

  // const totalRows = filteredData.length; // Unused

  return (
    <>
      <div className="case-table-container" ref={tableContainerRef}>
        <div className="case-table-header">
          <h3>Active Contributors by Project ({getCountDisplay()})</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Search Input */}
            <div className="table-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Project or Project Objective..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="table-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
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
              disabled={!filteredData || filteredData.length === 0}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {!filteredData || filteredData.length === 0 ? (
          <div className="case-table-empty">
            <p>{searchTerm ? 'No results found for your search' : 'No data found'}</p>
          </div>
        ) : (
          <div className="case-table-scroll-wrapper">
            <table className="case-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Project Objective Name</th>
                  <th>Active Contributor Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={`${item.projectName}-${item.projectObjectiveId || 'no-po'}-${index}`} className="case-table-row">
                    <td>{item.projectName || ''}</td>
                    <td>{item.projectObjectiveName || ''}</td>
                    <td>
                      {item.projectObjectiveId && item.projectObjectiveId !== 'null' ? (
                        <button
                          onClick={() => handleCountClick(item.projectObjectiveId, item.projectObjectiveName)}
                          className="count-link"
                          title="Click to view contributor names"
                        >
                          {item.activeContributorCount || 0}
                        </button>
                      ) : (
                        <span>{item.activeContributorCount || 0}</span>
                      )}
                    </td>
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
                Showing {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} for "{searchTerm}"
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

      {/* Contributors Modal */}
      {showContributorsModal && (
        <div className="modal-overlay" onClick={() => setShowContributorsModal(false)}>
          <div className="modal-content contributors-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Active Contributors - {selectedProjectObjectiveName}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {contributors.length > 0 && !loadingContributors && (
                  <button
                    onClick={handleExportContributorsToExcel}
                    className="btn-export-excel"
                    title="Export to Excel"
                  >
                    <Download size={16} />
                    <span>Export Excel</span>
                  </button>
                )}
                <button className="modal-close" onClick={() => setShowContributorsModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              {loadingContributors ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '16px' }}>
                  <Loader className="spinning" size={24} />
                  <p>Loading contributors...</p>
                </div>
              ) : contributors.length === 0 ? (
                <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No active contributors found</p>
              ) : (
                <div className="contributors-list">
                  <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px', fontWeight: '500' }}>
                    Total: {contributors.length} contributor{contributors.length !== 1 ? 's' : ''}
                  </p>
                  <div className="contributors-table-wrapper">
                    <table className="contributors-table">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Contributor Name</th>
                          <th>Email ID</th>
                          <th>Country</th>
                          <th>Primary Language</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contributors.map((contributor, index) => {
                          // Handle both string (name only) and object (full details) formats
                          const name = typeof contributor === 'string' 
                            ? contributor 
                            : (contributor.name || contributor.Name || '-');
                          const email = typeof contributor === 'string' 
                            ? '-' 
                            : (contributor.email || contributor.Email || '-');
                          const country = typeof contributor === 'string' 
                            ? '-' 
                            : (contributor.country || contributor.Country || '-');
                          const language = typeof contributor === 'string' 
                            ? '-' 
                            : (contributor.language || contributor.Language || contributor.primaryLanguage || '-');
                          
                          return (
                            <tr key={contributor.id || index}>
                              <td>{index + 1}</td>
                              <td>{name}</td>
                              <td>{email}</td>
                              <td>{country}</td>
                              <td>{language}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActiveContributorsByProjectTable;

