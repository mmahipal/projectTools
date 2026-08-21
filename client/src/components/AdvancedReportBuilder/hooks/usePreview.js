import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getCsrfToken } from '../../../config/api';

const reportApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for preview
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

export const usePreview = () => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePreview = useCallback(async (reportConfig) => {
    if (!reportConfig) {
      setPreviewData(null);
      return;
    }

    // Check if multi-object mode or legacy single-object mode
    const isMultiObjectMode = reportConfig.objects && reportConfig.objects.length > 0;
    
    // Validate multi-object mode
    if (isMultiObjectMode) {
      // Filter out objects with no fields before sending
      const objectsWithFields = reportConfig.objects.filter(obj => {
        const fields = obj.fields || [];
        return fields.length > 0;
      });

      if (objectsWithFields.length === 0) {
        setPreviewData(null);
        return;
      }
    } else {
      // Legacy single-object mode: validate required fields
      if (!reportConfig.objectType || !reportConfig.fields || reportConfig.fields.length === 0) {
        setPreviewData(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isMultiObjectMode) {
        // Multi-object mode: send objects array
        const objectsWithFields = reportConfig.objects.filter(obj => {
          const fields = obj.fields || [];
          return fields.length > 0;
        });

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
          sortBy: reportConfig.sortBy,
          sortOrder: reportConfig.sortOrder,
          groupBy: reportConfig.groupBy,
          limit: reportConfig.limit || 10000
        });

        if (response.data.success) {
          setPreviewData(response.data.records || []);
        } else {
          setError(response.data.error || 'Failed to preview report');
          toast.error(response.data.error || 'Failed to preview report');
        }
      } else {
        // Legacy single-object mode
        const fields = (reportConfig.fields || []).map(f => typeof f === 'string' ? f : (f?.name || f));

        // Double-check we have required data before calling API
        if (!reportConfig.objectType || !fields || fields.length === 0) {
          // Skipping legacy preview - missing data
            hasObjectType: !!reportConfig.objectType,
            objectType: reportConfig.objectType,
            fieldsCount: fields ? fields.length : 0,
            fields: fields
          });
          setPreviewData(null);
          setLoading(false);
          return;
        }

        const filters = (reportConfig.filters && reportConfig.filters.length > 0) ? {
          groups: [{
            id: 'group_1',
            logic: 'AND',
            conditions: (reportConfig.filters || []).map(filter => ({
              field: filter?.field || '',
              operator: filter?.operator || 'equals',
              value: filter?.value || ''
            }))
          }],
          groupLogic: 'AND'
        } : {};

        // Final validation before API call
        if (!reportConfig.objectType || !fields || fields.length === 0) {
          console.warn('[Preview] Skipping preview - missing objectType or fields:', {
            objectType: reportConfig.objectType,
            fieldsCount: fields.length
          });
          setPreviewData(null);
          setLoading(false);
          return;
        }

        const response = await reportApiClient.post('/reports/preview', {
          objectType: reportConfig.objectType,
          fields,
          filters,
          sortBy: reportConfig.sortBy,
          sortOrder: reportConfig.sortOrder,
          groupBy: reportConfig.groupBy,
          limit: reportConfig.limit
        });

        if (response.data.success) {
          setPreviewData(response.data.records || []);
        } else {
          setError(response.data.error || 'Failed to preview report');
          toast.error(response.data.error || 'Failed to preview report');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to preview report';
      setError(errorMessage);
      toast.error(errorMessage);
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    previewData,
    loading,
    error,
    generatePreview
  };
};

