import apiClient from '../config/api';

/**
 * Draft storage utility - stores draft data on the server instead of localStorage
 * This ensures data persists across service restarts
 */

// Save draft project data
export const saveDraftProject = async (projectData) => {
  try {
    const response = await apiClient.post('/drafts/project', projectData);
    return response.data.success;
  } catch (error) {
    console.error('Error saving draft project:', error);
    // Fallback to localStorage if server is unavailable
    try {
      localStorage.setItem('projectData', JSON.stringify(projectData));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

// Load draft project data
export const loadDraftProject = async () => {
  try {
    const response = await apiClient.get('/drafts/project');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback to localStorage if server returns no data
    const localData = localStorage.getItem('projectData');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Migrate to server storage
        await saveDraftProject(parsed);
        return parsed;
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading draft project:', error);
    // Fallback to localStorage
    const localData = localStorage.getItem('projectData');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    return null;
  }
};

// Delete draft project data
export const deleteDraftProject = async () => {
  try {
    await apiClient.delete('/drafts/project');
    // Also clear localStorage as fallback
    localStorage.removeItem('projectData');
    return true;
  } catch (error) {
    console.error('Error deleting draft project:', error);
    // Fallback to localStorage
    localStorage.removeItem('projectData');
    return false;
  }
};

// Save draft project objective data
export const saveDraftProjectObjective = async (objectiveData) => {
  try {
    const response = await apiClient.post('/drafts/project-objective', objectiveData);
    return response.data.success;
  } catch (error) {
    console.error('Error saving draft project objective:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('projectObjectiveData', JSON.stringify(objectiveData));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

// Load draft project objective data
export const loadDraftProjectObjective = async () => {
  try {
    const response = await apiClient.get('/drafts/project-objective');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback to localStorage
    const localData = localStorage.getItem('projectObjectiveData');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Migrate to server storage
        await saveDraftProjectObjective(parsed);
        return parsed;
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading draft project objective:', error);
    // Fallback to localStorage
    const localData = localStorage.getItem('projectObjectiveData');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    return null;
  }
};

// Delete draft project objective data
export const deleteDraftProjectObjective = async () => {
  try {
    await apiClient.delete('/drafts/project-objective');
    // Also clear localStorage as fallback
    localStorage.removeItem('projectObjectiveData');
    return true;
  } catch (error) {
    console.error('Error deleting draft project objective:', error);
    // Fallback to localStorage
    localStorage.removeItem('projectObjectiveData');
    return false;
  }
};

// Save draft qualification step data
export const saveDraftQualificationStep = async (stepData) => {
  try {
    const response = await apiClient.post('/drafts/qualification-step', stepData);
    return response.data.success;
  } catch (error) {
    console.error('Error saving draft qualification step:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('qualificationStepData', JSON.stringify(stepData));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

// Load draft qualification step data
export const loadDraftQualificationStep = async () => {
  try {
    const response = await apiClient.get('/drafts/qualification-step');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback to localStorage
    const localData = localStorage.getItem('qualificationStepData');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Migrate to server storage
        await saveDraftQualificationStep(parsed);
        return parsed;
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading draft qualification step:', error);
    // Fallback to localStorage
    const localData = localStorage.getItem('qualificationStepData');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    return null;
  }
};

// Delete draft qualification step data
export const deleteDraftQualificationStep = async () => {
  try {
    await apiClient.delete('/drafts/qualification-step');
    // Also clear localStorage as fallback
    localStorage.removeItem('qualificationStepData');
    return true;
  } catch (error) {
    console.error('Error deleting draft qualification step:', error);
    // Fallback to localStorage
    localStorage.removeItem('qualificationStepData');
    return false;
  }
};

// Save user settings
export const saveUserSettings = async (settings) => {
  try {
    const response = await apiClient.post('/drafts/settings', settings);
    return response.data.success;
  } catch (error) {
    console.error('Error saving user settings:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

// Load user settings
export const loadUserSettings = async () => {
  try {
    const response = await apiClient.get('/drafts/settings');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback to localStorage
    const localData = localStorage.getItem('userSettings');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Migrate to server storage
        await saveUserSettings(parsed);
        return parsed;
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading user settings:', error);
    // Fallback to localStorage
    const localData = localStorage.getItem('userSettings');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    return null;
  }
};

// Save draft project page data
export const saveDraftProjectPage = async (pageData) => {
  try {
    const response = await apiClient.post('/drafts/project-page', pageData);
    return response.data.success;
  } catch (error) {
    console.error('Error saving draft project page:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('projectPageData', JSON.stringify(pageData));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

// Load draft project page data
export const loadDraftProjectPage = async () => {
  try {
    const response = await apiClient.get('/drafts/project-page');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // Fallback to localStorage
    const localData = localStorage.getItem('projectPageData');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Migrate to server storage
        await saveDraftProjectPage(parsed);
        return parsed;
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading draft project page:', error);
    // Fallback to localStorage
    const localData = localStorage.getItem('projectPageData');
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    return null;
  }
};

// Delete draft project page data
export const deleteDraftProjectPage = async () => {
  try {
    await apiClient.delete('/drafts/project-page');
    // Also clear localStorage as fallback
    localStorage.removeItem('projectPageData');
    return true;
  } catch (error) {
    console.error('Error deleting draft project page:', error);
    // Fallback to localStorage
    localStorage.removeItem('projectPageData');
    return false;
  }
};

// Save draft quick setup data
export const saveDraftQuickSetup = async (quickSetupData) => {
  try {
    const response = await apiClient.post('/drafts/quick-setup', quickSetupData);
    return response.data.success;
  } catch (error) {
    console.error('Error saving draft quick setup:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('quickSetupData', JSON.stringify(quickSetupData));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

// Load draft quick setup data
export const loadDraftQuickSetup = async () => {
  try {
    const response = await apiClient.get('/drafts/quick-setup');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    // No draft exists, return null
    return null;
  } catch (error) {
    // Only log non-404 errors (404 means no draft exists, which is fine)
    if (error.response && error.response.status !== 404) {
      console.error('Error loading draft quick setup:', error);
    }
    // Fallback to localStorage
    const localData = localStorage.getItem('quickSetupData');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Migrate to server storage
        await saveDraftQuickSetup(parsed);
        return parsed;
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    return null;
  }
};

// Delete draft quick setup data
export const deleteDraftQuickSetup = async () => {
  try {
    await apiClient.delete('/drafts/quick-setup');
    // Also clear localStorage as fallback
    localStorage.removeItem('quickSetupData');
    return true;
  } catch (error) {
    console.error('Error deleting draft quick setup:', error);
    // Fallback to localStorage
    localStorage.removeItem('quickSetupData');
    return false;
  }
};
