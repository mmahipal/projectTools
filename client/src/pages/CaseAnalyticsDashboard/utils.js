// CaseAnalyticsDashboard utilities

import { BASELINE_STORAGE_KEY } from './constants';

/**
 * Load baseline data from localStorage
 */
export const loadBaselineData = () => {
  try {
    const saved = localStorage.getItem(BASELINE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    // Silently fail baseline loading
  }
  return null;
};

/**
 * Save current dashboard state as baseline
 */
export const saveBaselineData = (dashboardState) => {
  try {
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify({
      ...dashboardState,
      savedAt: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    return false;
  }
};

