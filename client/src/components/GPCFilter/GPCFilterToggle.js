import React from 'react';
import { Filter, X } from 'lucide-react';
import { useGPCFilter } from '../../context/GPCFilterContext';
import { ENABLE_GPC_FILTER } from '../../config/featureFlags';
import './GPCFilterToggle.css';

const GPCFilterToggle = () => {
  const { setOverride, shouldApplyFilter, preferences } = useGPCFilter();

  if (!ENABLE_GPC_FILTER) {
    return null;
  }

  // Don't show if user has disabled GPC filtering
  if (preferences.gpcFilterEnabled === false) {
    return null;
  }

  // Don't show if no preferences are set
  if (!preferences.interestedAccounts.length && !preferences.interestedProjects.length) {
    return null;
  }

  const isFilterActive = shouldApplyFilter();
  const hasPreferences = preferences.interestedAccounts.length > 0 || preferences.interestedProjects.length > 0;

  if (!hasPreferences) {
    return null;
  }

  return (
    <div className="gpc-filter-toggle">
      {isFilterActive ? (
        <div className="filter-active-indicator">
          <Filter size={16} />
          <span>Showing: My Interested Items</span>
          <button
            className="filter-override-btn"
            onClick={() => setOverride(true)}
            title="Click to view all data"
          >
            View All
          </button>
        </div>
      ) : (
        <div className="filter-override-indicator">
          <X size={16} />
          <span>Showing: All Data</span>
          <button
            className="filter-reset-btn"
            onClick={() => setOverride(false)}
            title="Click to show only your interested items"
          >
            Show My Items
          </button>
        </div>
      )}
    </div>
  );
};

export default GPCFilterToggle;

