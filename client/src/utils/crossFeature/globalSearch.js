// Global Search Service - Search across all features

import apiClient from '../../config/api';

// Searchable feature types
const SEARCHABLE_FEATURES = {
  PROJECTS: 'projects',
  PROJECT_OBJECTIVES: 'project_objectives',
  WORKSTREAMS: 'workstreams',
  CONTRIBUTOR_PROJECTS: 'contributor_projects',
  CASES: 'cases',
  CONTACTS: 'contacts',
  ACCOUNTS: 'accounts',
  PAGES: 'pages' // Navigation pages from sidebar
};

/**
 * Search across all features
 * @param {string} query - Search query
 * @param {Array} features - Features to search (default: all)
 * @returns {Promise<Object>} Search results grouped by feature
 */
export const globalSearch = async (query, features = null) => {
  if (!query || query.trim() === '') {
    return { results: {}, total: 0 };
  }

  const featuresToSearch = features || Object.values(SEARCHABLE_FEATURES);
  const results = {};
  let total = 0;

  try {
    // Search each feature in parallel
    const searchPromises = featuresToSearch.map(async (feature) => {
      try {
        // Handle pages search (navigation items) - no API call needed
        if (feature === SEARCHABLE_FEATURES.PAGES) {
          const pageResults = searchPages(query);
          return {
            feature,
            items: pageResults,
            count: pageResults.length
          };
        }

        let response;
        switch (feature) {
          case SEARCHABLE_FEATURES.PROJECTS:
            response = await apiClient.get(`/projects?searchTerm=${encodeURIComponent(query)}&limit=10`);
            break;
          case SEARCHABLE_FEATURES.PROJECT_OBJECTIVES:
            response = await apiClient.get(`/project-objectives?searchTerm=${encodeURIComponent(query)}&limit=10`);
            break;
          case SEARCHABLE_FEATURES.WORKSTREAMS:
            response = await apiClient.get(`/workstream?searchTerm=${encodeURIComponent(query)}&limit=10`);
            break;
          case SEARCHABLE_FEATURES.CONTRIBUTOR_PROJECTS:
            response = await apiClient.get(`/queue-status-management/contributor-projects?searchTerm=${encodeURIComponent(query)}&limit=10`);
            break;
          default:
            return { feature, items: [], count: 0 };
        }

        if (response.data.success) {
          const items = response.data.projects || response.data.objectives || response.data.workstreams || [];
          return {
            feature,
            items: items.map(item => ({
              ...item,
              type: feature,
              path: getPathForFeature(feature, item.id)
            })),
            count: items.length
          };
        }
        return { feature, items: [], count: 0 };
      } catch (error) {
        console.error(`Error searching ${feature}:`, error);
        return { feature, items: [], count: 0 };
      }
    });

    const searchResults = await Promise.all(searchPromises);
    
    searchResults.forEach(result => {
      results[result.feature] = {
        items: result.items,
        count: result.count
      };
      total += result.count;
    });

    return { results, total };
  } catch (error) {
    console.error('Error in global search:', error);
    return { results: {}, total: 0, error: error.message };
  }
};

/**
 * Get all navigation pages from sidebar menu structure
 * @returns {Array} Array of page objects with label and path
 */
const getAllPages = () => {
  // Define all menu items (matching Sidebar.js structure)
  const menuItems = [
    //   category: 'Dashboards'
    // },
    {
      label: 'Case Analytics',
      path: '/case-analytics',
      category: 'Dashboards'
    },
    {
      label: 'Contributor Payments',
      path: '/contributor-payments',
      category: 'Dashboards'
    },
    {
      label: 'Project Performance',
      path: '/project-performance',
      category: 'Dashboards'
    },
    {
      label: 'Dashboard',
      path: '/dashboard',
      category: 'Create Objects'
    },
    {
      label: 'Quick Setup Wizard',
      path: '/quick-setup',
      category: 'Create Objects'
    },
    {
      label: 'Create Project',
      path: '/setup',
      category: 'Create Objects'
    },
    {
      label: 'Create Project Objective',
      path: '/setup-objective',
      category: 'Create Objects'
    },
    {
      label: 'Create Qualification Step',
      path: '/setup-qualification-step',
      category: 'Create Objects'
    },
    {
      label: 'Create Project Page',
      path: '/setup-project-page',
      category: 'Create Objects'
    },
    {
      label: 'Create Project Team',
      path: '/setup-project-team',
      category: 'Create Objects'
    },
    {
      label: 'Clone',
      path: '/clone',
      category: 'Create Objects'
    },
    {
      label: 'View Saved Content',
      path: '/projects',
      category: 'Create Objects'
    },
    {
      label: 'Client Tool Account',
      path: '/client-tool-account',
      category: 'Project Management'
    },
    {
      label: 'Queue Status Management',
      path: '/queue-status-management',
      category: 'Project Management'
    },
    {
      label: 'Workstream Management',
      path: '/workstream-management',
      category: 'Project Management'
    },
    {
      label: 'Update Object Fields',
      path: '/update-object-fields',
      category: 'Project Management'
    },
    {
      label: 'Case Management',
      path: '/case-management',
      category: 'Project Management'
    },
    {
      label: 'Report Builder',
      path: '/report-builder',
      category: 'Reporting'
    },
    {
      label: 'Advanced Builder',
      path: '/advanced-report-builder',
      category: 'Reporting'
    },
    {
      label: 'Scheduled Reports',
      path: '/scheduled-reports',
      category: 'Reporting'
    },
    {
      label: 'MFA Verification Logs',
      path: '/mfa-verification-logs',
      category: 'Reporting'
    },
    {
      label: 'Project Roster Funnel',
      path: '/project-roster-funnel',
      category: 'Reporting'
    },
    {
      label: 'Active Contributors by Project',
      path: '/active-contributors-by-project',
      category: 'Reporting'
    },
    {
      label: 'Active Project Objectives by Qualification Step',
      path: '/active-project-objectives-by-qual-step',
      category: 'Reporting'
    },
    {
      label: 'Onboarding Contributors',
      path: '/onboarding-contributors',
      category: 'Reporting'
    },
    {
      label: 'Contributor Time Status',
      path: '/contributor-time-status',
      category: 'Reporting'
    },
    {
      label: 'Contributor Match Matrix',
      path: '/contributor-match-matrix',
      category: 'Reporting'
    },
    {
      label: 'PO Pay Rates',
      path: '/po-pay-rates',
      category: 'Reporting'
    },
    {
      label: 'PO Productivity Targets',
      path: '/po-productivity-targets',
      category: 'Reporting'
    },
    {
      label: 'Administration',
      path: '/administration',
      category: 'Administration'
    }
  ];

  return menuItems;
};

/**
 * Search through navigation pages
 * @param {string} query - Search query
 * @returns {Array} Matching pages
 */
const searchPages = (query) => {
  const queryLower = query.toLowerCase().trim();
  if (!queryLower) return [];

  const allPages = getAllPages();
  const matchingPages = allPages.filter(page => {
    const labelLower = page.label.toLowerCase();
    const categoryLower = page.category.toLowerCase();
    const pathLower = page.path.toLowerCase();
    
    return (
      labelLower.includes(queryLower) ||
      categoryLower.includes(queryLower) ||
      pathLower.includes(queryLower)
    );
  });

  return matchingPages.map(page => ({
    name: page.label,
    path: page.path,
    type: 'pages',
    category: page.category
  }));
};

/**
 * Get path for a feature item
 * @param {string} feature - Feature type
 * @param {string} id - Item ID
 * @returns {string} Route path
 */
const getPathForFeature = (feature, id) => {
  const paths = {
    [SEARCHABLE_FEATURES.PROJECTS]: `/projects/${id}`,
    [SEARCHABLE_FEATURES.PROJECT_OBJECTIVES]: `/project-objectives/${id}`,
    [SEARCHABLE_FEATURES.WORKSTREAMS]: `/workstream-management`,
    [SEARCHABLE_FEATURES.CONTRIBUTOR_PROJECTS]: `/queue-status-management`,
    [SEARCHABLE_FEATURES.CASES]: `/case-analytics`,
    [SEARCHABLE_FEATURES.CONTACTS]: `/contacts/${id}`,
    [SEARCHABLE_FEATURES.ACCOUNTS]: `/accounts/${id}`
  };
  return paths[feature] || '/';
};

export { SEARCHABLE_FEATURES };

