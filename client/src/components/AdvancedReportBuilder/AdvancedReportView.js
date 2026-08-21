import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, Edit, Loader, Filter, Plus } from 'lucide-react';
import { exportData } from '../../utils/crossFeature/exportService';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getCsrfToken } from '../../config/api';
import '../../styles/AdvancedReportView.css';

const reportApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000,
});

reportApiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
  if (!config.url?.includes('/auth/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
    try {
      const csrf = await getCsrfToken();
      if (csrf) {
        config.headers['X-CSRF-Token'] = csrf;
      }
    } catch (error) {
      console.warn('Failed to get CSRF token for report request:', error);
    }
  }
  
  return config;
});

const AdvancedReportView = ({ report, onClose, onEdit }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (report) {
      loadReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if multi-object mode or legacy single-object mode
      const isMultiObjectMode = report.objects && report.objects.length > 0;

      if (isMultiObjectMode) {
        // Multi-object mode: use preview-multi endpoint
        const objectsWithFields = report.objects.filter(obj => {
          const fields = obj.fields || [];
          return fields.length > 0;
        });

        if (objectsWithFields.length === 0) {
          setError('No objects with fields found in this report');
          setLoading(false);
          return;
        }

        const objects = objectsWithFields.map(obj => ({
          objectType: obj.objectType,
          fields: (obj.fields || []).map(f => typeof f === 'string' ? f : (f?.name || f)),
          filters: (obj.filters && obj.filters.length > 0) ? {
            groups: [{
              id: 'group_1',
              logic: 'AND',
              conditions: (obj.filters || []).map(filter => ({
                field: filter?.field || '',
                operator: filter?.operator || 'equals',
                value: filter?.value || ''
              }))
            }],
            groupLogic: 'AND'
          } : {},
          relationships: obj.relationships || [],
          subqueries: obj.subqueries || []
        }));

        const response = await reportApiClient.post('/reports/preview-multi', {
          objects,
          sortBy: report.sortBy,
          sortOrder: report.sortOrder,
          groupBy: report.groupBy,
          limit: report.limit || 10000
        });

        if (response.data.success) {
          setReportData(response.data.records || []);
        } else {
          setError(response.data.error || 'Failed to load report data');
        }
      } else {
        // Legacy single-object mode: use preview endpoint
        const fields = (report.fields || []).map(f => typeof f === 'string' ? f : (f?.name || f));

        // Validate required fields
        if (!report.objectType || !fields || fields.length === 0) {
          setError('Report configuration is invalid: missing objectType or fields');
          setLoading(false);
          return;
        }

        const filters = (report.filters && report.filters.length > 0) ? {
          groups: [{
            id: 'group_1',
            logic: 'AND',
            conditions: (report.filters || []).map(filter => ({
              field: filter?.field || '',
              operator: filter?.operator || 'equals',
              value: filter?.value || ''
            }))
          }],
          groupLogic: 'AND'
        } : {};

        const response = await reportApiClient.post('/reports/preview', {
          objectType: report.objectType,
          fields,
          filters,
          sortBy: report.sortBy,
          sortOrder: report.sortOrder,
          groupBy: report.groupBy,
          limit: report.limit || 10000
        });

        if (response.data.success) {
          setReportData(response.data.records || []);
        } else {
          setError(response.data.error || 'Failed to load report data');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load report data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!reportData || reportData.length === 0) {
      toast.error('No data to export');
      return;
    }
    exportData(reportData, report.name || 'report', format);
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  // Utility function to get field label from API name
  const getFieldLabel = (apiName) => {
    if (!report || !apiName) return apiName;

    // Handle multi-object mode
    if (report.objects && report.objects.length > 0) {
      // Parse the field name: "project_Name" or "project_Project_Status__c" or "project objective_Name"
      // The format is: "objectType_FieldName"
      const underscoreIndex = apiName.indexOf('_');
      if (underscoreIndex === -1) {
        // No underscore, try to find in all objects
        for (const obj of report.objects) {
          if (obj.fields) {
            const field = obj.fields.find(f => {
              const fName = typeof f === 'string' ? f : (f?.name || '');
              return fName === apiName;
            });
            if (field) {
              if (typeof field === 'string') return field;
              return field.label || field.name || apiName;
            }
          }
        }
        return apiName;
      }

      // Find the object type (first part before first underscore)
      const objectType = apiName.substring(0, underscoreIndex);
      // Reconstruct the field name (everything after the first underscore)
      const fieldName = apiName.substring(underscoreIndex + 1);

      // Find the object in report
      const obj = report.objects.find(o => o.objectType === objectType);
      if (obj && obj.fields) {
        // Find the field in the object's fields array
        const field = obj.fields.find(f => {
          const fName = typeof f === 'string' ? f : (f?.name || '');
          return fName === fieldName || fName === apiName;
        });

        if (field) {
          // Return the label if available, otherwise use the name
          if (typeof field === 'string') {
            return field;
          }
          return field.label || field.name || apiName;
        }
      }
    }

    // Handle legacy single-object mode
    if (report.fields && report.fields.length > 0) {
      const field = report.fields.find(f => {
        const fName = typeof f === 'string' ? f : (f?.name || '');
        return fName === apiName;
      });

      if (field) {
        if (typeof field === 'string') {
          return field;
        }
        return field.label || field.name || apiName;
      }
    }

    // Fallback: try to format the API name nicely
    return apiName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate columns - must be before early returns
  const columns = reportData && reportData.length > 0
    ? Object.keys(reportData[0]).filter(k => !k.startsWith('_'))
    : [];

  // Get available fields for filtering (only fields in the report) - must be before early returns
  const availableFields = useMemo(() => {
    return columns.map(col => ({
      name: col,
      label: getFieldLabel(col),
      type: 'string' // Default type, could be enhanced to detect actual types
    }));
  }, [columns, report]);

  // Apply filters to data - must be before early returns
  const filteredData = useMemo(() => {
    if (!reportData || filters.length === 0) return reportData;
    
    return reportData.filter(row => {
      return filters.every(filter => {
        if (!filter.field || !filter.operator) return true;
        
        const cellValue = row[filter.field];
        const filterValue = filter.value;
        
        // Handle null/undefined
        if (cellValue === null || cellValue === undefined) {
          if (filter.operator === 'isEmpty') return true;
          if (filter.operator === 'isNotEmpty') return false;
          return false;
        }
        
        const cellStr = String(cellValue).toLowerCase();
        const filterStr = String(filterValue).toLowerCase();
        
        switch (filter.operator) {
          case 'equals':
            return cellStr === filterStr;
          case 'notEquals':
            return cellStr !== filterStr;
          case 'contains':
            return cellStr.includes(filterStr);
          case 'notContains':
            return !cellStr.includes(filterStr);
          case 'startsWith':
            return cellStr.startsWith(filterStr);
          case 'endsWith':
            return cellStr.endsWith(filterStr);
          case 'isEmpty':
            return !cellValue || String(cellValue).trim() === '';
          case 'isNotEmpty':
            return cellValue && String(cellValue).trim() !== '';
          default:
            return true;
        }
      });
    });
  }, [reportData, filters]);

  // Early returns must come AFTER all hooks
  if (loading) {
    return (
      <div className="advanced-report-view">
        <div className="report-view-loading">
          <Loader size={32} className="spinning" />
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="advanced-report-view">
        <div className="report-view-error">
          <p>Error: {error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index, updates) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], ...updates };
    setFilters(updated);
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return (
    <div className="advanced-report-view">
      <div className="report-view-header">
        <div className="report-view-title">
          <h2>{report.name || 'Unnamed Report'}</h2>
          <span className="report-view-meta">
            {reportData ? `${reportData.length} records` : '0 records'}
          </span>
        </div>
        <div className="report-view-actions">
          <button
            className="report-view-btn"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <Filter size={16} /> {filters.length > 0 ? `Filters (${filters.length})` : 'Filter'}
          </button>
          <button
            className="report-view-btn"
            onClick={() => handleExport('excel')}
            disabled={!reportData || reportData.length === 0}
          >
            <Download size={16} /> Export Excel
          </button>
          <button
            className="report-view-btn"
            onClick={() => handleExport('csv')}
            disabled={!reportData || reportData.length === 0}
          >
            <Download size={16} /> Export CSV
          </button>
          {onEdit && (
            <button
              className="report-view-btn edit-btn"
              onClick={onEdit}
            >
              <Edit size={16} /> Edit
            </button>
          )}
          <button
            className="report-view-btn close-btn"
            onClick={onClose}
          >
            <X size={16} /> Close
          </button>
        </div>
      </div>

      <div className="report-view-content">
        {/* Filter Panel */}
        {showFilters && (
          <div className="report-view-filters">
            <div className="filters-header">
              <h3>Filter Report</h3>
              <div className="filters-actions">
                <button className="filter-btn-add" onClick={addFilter}>
                  <Plus size={14} /> Add Filter
                </button>
                {filters.length > 0 && (
                  <button className="filter-btn-clear" onClick={clearFilters}>
                    Clear All
                  </button>
                )}
              </div>
            </div>
            {filters.length === 0 ? (
              <div className="filters-empty">
                <p>No filters applied. Click "Add Filter" to filter the report data.</p>
              </div>
            ) : (
              <div className="filters-list">
                {filters.map((filter, index) => (
                  <div key={index} className="filter-row">
                    <select
                      className="filter-field-select"
                      value={filter.field}
                      onChange={(e) => updateFilter(index, { field: e.target.value, value: '' })}
                    >
                      <option value="">Select Field</option>
                      {availableFields.map(field => (
                        <option key={field.name} value={field.name}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="filter-operator-select"
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, { operator: e.target.value })}
                      disabled={!filter.field}
                    >
                      <option value="equals">Equals</option>
                      <option value="notEquals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="notContains">Not Contains</option>
                      <option value="startsWith">Starts With</option>
                      <option value="endsWith">Ends With</option>
                      <option value="isEmpty">Is Empty</option>
                      <option value="isNotEmpty">Is Not Empty</option>
                    </select>
                    {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                      <input
                        type="text"
                        className="filter-value-input"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Enter value"
                        disabled={!filter.field}
                      />
                    )}
                    <button
                      className="filter-remove-btn"
                      onClick={() => removeFilter(index)}
                      title="Remove filter"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!reportData || reportData.length === 0 ? (
          <div className="report-view-empty">
            <p>No data available for this report</p>
          </div>
        ) : (
          <div className="report-view-table-container">
            <div className="report-view-table-header">
              <span className="table-count">
                Showing {filteredData?.length || 0} of {reportData.length} records
                {filters.length > 0 && ' (filtered)'}
              </span>
            </div>
            <table className="report-view-table">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column}>{getFieldLabel(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={index}>
                      {columns.map(column => (
                        <td key={column}>
                          {row[column] !== null && row[column] !== undefined
                            ? String(row[column])
                            : ''}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="no-results">
                      No records match the applied filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedReportView;

