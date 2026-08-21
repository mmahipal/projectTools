// API service functions for UpdateObjectFields

import apiClient from '../../../config/api';
import toast from 'react-hot-toast';

/**
 * Fetch fields for an object type
 * @param {string} objectType - The object type to fetch fields for
 * @param {boolean} isSourceObject - Whether this is for source object
 * @returns {Promise<Array>} Array of fields
 */
export const fetchFields = async (objectType, isSourceObject = false) => {
  if (!objectType) return [];
  
  try {
    const response = await apiClient.get(`/update-object-fields/fields/${objectType}`);
    if (response.data.success) {
      return response.data.fields || [];
    } else {
      toast.error(response.data.error || 'Failed to fetch fields');
      return [];
    }
  } catch (error) {
    console.error('Error fetching fields:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.isBackendDown) {
      toast.error(error.userMessage || 'Unable to connect to server. Please ensure the backend server is running on port 5000.');
    } else {
      toast.error(error.response?.data?.error || error.message || 'Failed to fetch fields from Salesforce');
    }
    return [];
  }
};

/**
 * Fetch picklist values for a field
 * @param {string} objectType - The object type
 * @param {string} fieldName - The field name
 * @returns {Promise<Array>} Array of picklist values
 */
export const fetchPicklistValues = async (objectType, fieldName) => {
  if (!objectType || !fieldName) return [];
  
  try {
    const response = await apiClient.get(`/update-object-fields/picklist-values/${objectType}/${fieldName}`);
    if (response.data.success) {
      return response.data.values || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching picklist values:', error);
    return [];
  }
};

/**
 * Search for reference records
 * @param {string} referenceObject - The reference object type
 * @param {string} searchTerm - The search term
 * @returns {Promise<Array>} Array of matching records
 */
export const searchReference = async (referenceObject, searchTerm) => {
  if (!referenceObject || !searchTerm || searchTerm.trim() === '') {
    return [];
  }

  try {
    const response = await apiClient.get(`/update-object-fields/search-reference/${encodeURIComponent(referenceObject)}?search=${encodeURIComponent(searchTerm)}`);
    if (response.data.success) {
      return (response.data.records || []).map(r => ({ Id: r.id, Name: r.name }));
    }
    return [];
  } catch (error) {
    console.error('Error searching reference:', error);
    return [];
  }
};

/**
 * Fetch filter options for an object
 * @param {string} objectType - The object type
 * @returns {Promise<Object>} Filter options object
 */
export const fetchFilterOptions = async (objectType) => {
  if (!objectType) return {};
  
  try {
    const response = await apiClient.get(`/update-object-fields/filter-options/${objectType}`);
    if (response.data.success) {
      return response.data.filterOptions || {};
    }
    return {};
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {};
  }
};

/**
 * Fetch all projects
 * @returns {Promise<Array>} Array of projects
 */
export const fetchAllProjects = async () => {
  try {
    const response = await apiClient.get('/update-object-fields/projects');
    if (response.data.success) {
      return response.data.projects || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

/**
 * Fetch all project objectives
 * @param {string|null} projectId - Optional project ID to filter by
 * @returns {Promise<Array>} Array of project objectives
 */
export const fetchAllProjectObjectives = async (projectId = null) => {
  try {
    const url = projectId 
      ? `/update-object-fields/project-objectives?projectId=${projectId}`
      : '/update-object-fields/project-objectives';
    const response = await apiClient.get(url);
    if (response.data.success) {
      return response.data.projectObjectives || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching project objectives:', error);
    return [];
  }
};

/**
 * Get matching records count based on filters
 * @param {string} objectType - The object type
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number|null>} Count of matching records or null if error
 */
export const getMatchingRecordsCount = async (objectType, filters) => {
  if (!objectType) return null;
  
  try {
    const response = await apiClient.post(`/update-object-fields/count/${objectType}`, { filters });
    if (response.data.success) {
      return response.data.count || 0;
    }
    return null;
  } catch (error) {
    console.error('Error getting matching records count:', error);
    return null;
  }
};

/**
 * Preview updates
 * @param {string} objectType - The object type (target object for field mapping)
 * @param {Object} updateConfig - Update configuration
 * @param {Object} filters - Filter criteria
 * @param {string} sourceObject - Source object (for field mapping mode)
 * @returns {Promise<Object>} Preview data
 */
export const previewUpdates = async (objectType, updateConfig, filters, sourceObject = null) => {
  if (!objectType) return null;
  
  try {
    // Handle different update modes
    if (updateConfig.mode === 'mapping') {
      // Field mapping mode - use preview-mapping endpoint
      if (!sourceObject || !updateConfig.fieldMappings || updateConfig.fieldMappings.length === 0) {
        toast.error('Source object and field mappings are required for preview');
        return null;
      }
      
      const response = await apiClient.post(`/update-object-fields/preview-mapping`, {
        sourceObject: sourceObject,
        targetObject: objectType,
        mappings: updateConfig.fieldMappings,
        filters: filters || {}
      });
      
      if (response.data.success) {
        return response.data;
      }
      return null;
    } else if (updateConfig.mode === 'multiple') {
      // Multiple fields mode - use preview-multiple endpoint
      const response = await apiClient.post(`/update-object-fields/preview-multiple`, {
        objectType: objectType,
        fieldUpdates: updateConfig.multipleFieldUpdates,
        filters: filters || {}
      });
      
      if (response.data.success) {
        return response.data;
      }
      return null;
    } else {
      // Single field mode - use preview endpoint
      const singleUpdate = updateConfig.singleFieldUpdate;
      if (!singleUpdate || !singleUpdate.field || singleUpdate.newValue === undefined) {
        toast.error('Field and new value are required for preview');
        return null;
      }
      
      const response = await apiClient.post(`/update-object-fields/preview`, {
        objectType: objectType,
        fieldName: singleUpdate.field,
        updateMode: singleUpdate.updateMode,
        currentValue: singleUpdate.currentValue,
        newValue: singleUpdate.newValue,
        filters: filters || {}
      });
      
      if (response.data.success) {
        return response.data;
      }
      return null;
    }
  } catch (error) {
    console.error('Error previewing updates:', error);
    toast.error(error.response?.data?.error || 'Failed to preview updates');
    return null;
  }
};

/**
 * Execute updates
 * @param {string} objectType - The object type
 * @param {Object} updateConfig - Update configuration
 * @param {Object} filters - Filter criteria
 * @param {string} sourceObject - Source object (for field mapping mode)
 * @returns {Promise<Object>} Update result
 */
export const executeUpdates = async (objectType, updateConfig, filters, sourceObject = null) => {
  if (!objectType) {
    toast.error('Please select an object');
    return null;
  }
  
  try {
    // Handle different update modes
    if (updateConfig.mode === 'mapping') {
      // Field mapping mode - use update-mapping endpoint
      if (!sourceObject || !updateConfig.fieldMappings || updateConfig.fieldMappings.length === 0) {
        toast.error('Source object and field mappings are required for update');
        return null;
      }
      
      const response = await apiClient.post(`/update-object-fields/update-mapping`, {
        sourceObject: sourceObject,
        targetObject: objectType,
        mappings: updateConfig.fieldMappings,
        filters: filters || {},
        batchSize: updateConfig.batchSize || 200,
        errorHandlingMode: updateConfig.errorHandlingMode || 'default'
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        toast.error(response.data.error || 'Update failed');
        return null;
      }
    } else {
      // Single or multiple field update - use update/:objectType endpoint
      const response = await apiClient.post(`/update-object-fields/update/${objectType}`, {
        updateConfig,
        filters
      });
      if (response.data.success) {
        return response.data;
      } else {
        toast.error(response.data.error || 'Update failed');
        return null;
      }
    }
  } catch (error) {
    console.error('Error executing updates:', error);
    toast.error(error.response?.data?.error || error.message || 'Failed to update records');
    return null;
  }
};

