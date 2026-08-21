import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { useVisibilityAwarePolling } from '../hooks/useVisibilityAwarePolling';
import HeroSection from '../components/Welcome/HeroSection';
import QuickActions from '../components/Welcome/QuickActions';
import SystemStatus from '../components/Welcome/SystemStatus';
import RecentActivity from '../components/Welcome/RecentActivity';
import ApplicationOverview from '../components/Welcome/ApplicationOverview';
import Recommendations from '../components/Welcome/Recommendations';
import RecentItems from '../components/Welcome/RecentItems';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { cachedFetch } from '../utils/requestCache';
import { batchApiCalls, createWelcomeBatchRequests } from '../utils/batchApi';
import { 
  Menu, 
  Users, 
  BarChart3, 
  DollarSign, 
  Workflow, 
  Wrench, 
  FolderOpen, 
  Settings, 
  UserCog,
  ArrowRight,
  ListChecks,
  Search,
  Filter
} from 'lucide-react';
import UserProfileDropdown from '../components/UserProfileDropdown/UserProfileDropdown';
import '../styles/Welcome.css';
import '../styles/Sidebar.css';
import '../styles/GlobalHeader.css';

const Welcome = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [welcomeData, setWelcomeData] = useState({
    stats: null,
    activity: [],
    systemStatus: null,
    recommendations: [],
    loading: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const features = [
    // },
    {
      id: 'case-analytics',
      title: 'Case Analytics',
      description: 'Analyze case resolution trends, performance metrics, and daily solved cases by project and contributor name.',
      icon: BarChart3,
      path: '/case-analytics',
      color: '#08979C',
      category: 'Analytics',
      permission: null
    },
    {
      id: 'contributor-payments',
      title: 'Contributor Payments',
      description: 'Track and manage contributor payments, view payment trends, and analyze payment distribution by method, status, and country.',
      icon: DollarSign,
      path: '/contributor-payments',
      color: '#08979C',
      category: 'Financial',
      permission: null
    },
    {
      id: 'workstream-management',
      title: 'Workstream Management',
      description: 'Create and manage workstreams, assign project objectives, and generate comprehensive workstream reports.',
      icon: Workflow,
      path: '/workstream-management',
      color: '#08979C',
      category: 'Management',
      permission: null
    },
    {
      id: 'client-tool-account',
      title: 'Client Tool Account',
      description: 'Manage client tool account mappings for contributor projects and ensure proper account assignments.',
      icon: Wrench,
      path: '/client-tool-account',
      color: '#08979C',
      category: 'Management',
      permission: null
    },
    {
      id: 'queue-status-management',
      title: 'Queue Status Management',
      description: 'Update and manage queue status for contributor projects, including bulk updates and status tracking.',
      icon: ListChecks,
      path: '/queue-status-management',
      color: '#08979C',
      category: 'Management',
      permission: null
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure application settings, manage Salesforce connections, and customize your workspace preferences.',
      icon: Settings,
      path: '/settings',
      color: '#08979C',
      category: 'Configuration',
      permission: 'all'
    }
  ];

  const adminFeatures = [
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions for application access and security.',
      icon: UserCog,
      path: '/user-management',
      color: '#08979C',
      category: 'Administration',
      permission: 'all'
    }
  ];

  // Fetch welcome page data
  const fetchWelcomeData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setWelcomeData(prev => ({ ...prev, loading: true }));
      }

      // Use batch API to fetch all data in a single request (reduces HTTP overhead)
      // Falls back to individual cached requests if batch fails
      let statsData = null;
      let activityData = null;
      let statusData = null;
      let recommendationsData = null;

      try {
        // Try batch API first (reduces 4 HTTP requests to 1)
        const batchRequests = createWelcomeBatchRequests();
        const batchResults = await batchApiCalls(batchRequests);
        
        // Process batch results
        if (batchResults && batchResults.length === 4) {
          statsData = batchResults[0]?.success ? batchResults[0].data : null;
          activityData = batchResults[1]?.success ? batchResults[1].data : null;
          statusData = batchResults[2]?.success ? batchResults[2].data : null;
          recommendationsData = batchResults[3]?.success ? batchResults[3].data : null;
        } else {
          throw new Error('Invalid batch response');
        }
      } catch (batchError) {
        // Fallback to individual cached requests if batch fails
        console.warn('[Welcome] Batch API failed, falling back to individual requests:', batchError);
        
        const [statsRes, activityRes, statusRes, recommendationsRes] = await Promise.allSettled([
          cachedFetch(
            '/welcome/stats',
            {},
            async () => apiClient.get('/welcome/stats'),
            { ttl: 2 * 60 * 1000, useCache: true }
          ),
          cachedFetch(
            '/welcome/activity',
            {},
            async () => apiClient.get('/welcome/activity'),
            { ttl: 2 * 60 * 1000, useCache: true }
          ),
          cachedFetch(
            '/welcome/system-status',
            {},
            async () => apiClient.get('/welcome/system-status'),
            { ttl: 2 * 60 * 1000, useCache: true }
          ),
          cachedFetch(
            '/welcome/recommendations',
            {},
            async () => apiClient.get('/welcome/recommendations'),
            { ttl: 2 * 60 * 1000, useCache: true }
          )
        ]);

        // Handle both cached response (which is already data) and axios response
        const getData = (result) => {
          if (result.status === 'fulfilled') {
            const value = result.value;
            // If it's an axios response, use .data, otherwise it's already the data
            return value?.data !== undefined ? value.data : value;
          }
          return null;
        };

        statsData = getData(statsRes);
        activityData = getData(activityRes);
        statusData = getData(statusRes);
        recommendationsData = getData(recommendationsRes);
      }

      setWelcomeData({
        stats: statsData || null,
        activity: activityData?.activities || [],
        systemStatus: statusData?.status || null,
        recommendations: recommendationsData?.recommendations || [],
        loading: false
      });
    } catch (error) {
      console.error('Error fetching welcome data:', error);
      if (!silent) {
        toast.error('Failed to load welcome page data');
      }
      setWelcomeData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchWelcomeData();
  }, [fetchWelcomeData]);

  // Set up visibility-aware polling - refresh every 120 seconds (increased from 30s)
  // Automatically pauses when tab is hidden and resumes when visible
  useVisibilityAwarePolling(
    () => {
      fetchWelcomeData(true); // Silent refresh
    },
    120000, // 120 seconds (increased from 30 seconds)
    {
      enabled: true,
      pauseWhenHidden: true
    }
  );

  // Filter features based on user permissions, search, and category
  const filteredFeatures = features.filter(feature => {
    // Permission check
    if (feature.permission && (!user || !hasPermission(feature.permission))) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        feature.title.toLowerCase().includes(query) ||
        feature.description.toLowerCase().includes(query) ||
        feature.category.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (selectedCategory !== 'All' && feature.category !== selectedCategory) {
      return false;
    }
    
    return true;
  });

  const allCategories = ['All', ...new Set(features.map(f => f.category))];

  const handleFeatureClick = (path) => {
    navigate(path);
  };

  const handleMetricClick = (type) => {
    navigate('/history');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div 
        className="welcome-page" 
        style={{ 
          marginLeft: `${sidebarWidth}px`, 
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'margin-left 0.2s ease, width 0.2s ease'
        }}
      >
        <div className="welcome-container">
          {/* Header */}
          <div className="welcome-header">
            <div className="header-content">
              <div className="header-left">
                <button 
                  className="header-menu-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="page-title">Welcome</h1>
                  <p className="page-subtitle">Your comprehensive project and contributor management platform</p>
                </div>
              </div>
              <div className="header-user-profile">
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          {/* Welcome Content */}
          <div className="welcome-content">
            {/* Hero Section with Metrics */}
            <HeroSection 
              stats={welcomeData.stats} 
              user={welcomeData.stats?.user || user}
              onMetricClick={handleMetricClick}
            />

            {/* Quick Actions */}
            <QuickActions />

            {/* Main Content - Two Column Layout */}
            <div className="welcome-main-content">
              <div className="welcome-left-column">
                {/* System Status */}
                <SystemStatus 
                  status={welcomeData.systemStatus} 
                  loading={welcomeData.loading}
                />

                {/* Application Overview */}
                <ApplicationOverview />

                {/* Recommendations */}
                <Recommendations 
                  recommendations={welcomeData.recommendations}
                  loading={welcomeData.loading}
                />
              </div>

              <div className="welcome-right-column">
                {/* Recent Activity */}
                <RecentActivity 
                  activities={welcomeData.activity}
                  loading={welcomeData.loading}
                />

                {/* Recent Items */}
                <RecentItems />
              </div>
            </div>

            {/* Features Grid with Search and Filter */}
            <div className="features-section">
              <div className="features-section-header">
                <h3 className="section-title">Available Features</h3>
                <div className="features-controls">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="filter-box">
                    <Filter size={16} />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="filter-select"
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {filteredFeatures.length === 0 ? (
                <div className="no-features-message">
                  No features found matching your search criteria.
                </div>
              ) : (
                <div className="features-grid">
                  {filteredFeatures.map((feature) => {
                    const IconComponent = feature.icon;
                    return (
                      <div
                        key={feature.id}
                        className="feature-card"
                        onClick={() => handleFeatureClick(feature.path)}
                      >
                        <div className="feature-card-header">
                          <div className="feature-icon" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                            <IconComponent size={24} />
                          </div>
                          <div className="feature-category">{feature.category}</div>
                        </div>
                        <div className="feature-card-body">
                          <h4 className="feature-title">{feature.title}</h4>
                          <p className="feature-description">{feature.description}</p>
                        </div>
                        <div className="feature-card-footer">
                          <span className="feature-link">
                            Open <ArrowRight size={16} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin Features Section */}
            {user && hasPermission('all') && (
              <div className="features-section">
                <h3 className="section-title">Administration</h3>
                <div className="features-grid">
                  {adminFeatures.map((feature) => {
                    const IconComponent = feature.icon;
                    return (
                      <div
                        key={feature.id}
                        className="feature-card"
                        onClick={() => handleFeatureClick(feature.path)}
                      >
                        <div className="feature-card-header">
                          <div className="feature-icon" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                            <IconComponent size={24} />
                          </div>
                          <div className="feature-category">{feature.category}</div>
                        </div>
                        <div className="feature-card-body">
                          <h4 className="feature-title">{feature.title}</h4>
                          <p className="feature-description">{feature.description}</p>
                        </div>
                        <div className="feature-card-footer">
                          <span className="feature-link">
                            Open <ArrowRight size={16} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

