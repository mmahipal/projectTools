import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import useSidebarWidth from '../hooks/useSidebarWidth';
import { PlusCircle, FileText, Settings, TrendingUp, Users, Clock, ArrowRight, Menu, LogOut, CheckCircle, XCircle, BarChart3, Calendar, Activity, PieChart, Zap, Target, Loader, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie, AreaChart, Area } from 'recharts';
import DashboardWidgetsManager from '../components/DashboardWidgets/DashboardWidgetsManager';
import '../styles/Dashboard.css';
import '../styles/Sidebar.css';
import '../styles/Login.css';
import '../styles/GlobalHeader.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasPermission, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = useSidebarWidth(sidebarOpen);
  const [stats, setStats] = useState([
    { label: 'Total Publishes', value: '0', icon: CheckCircle, color: '#08979C', description: 'All items published to Salesforce', onClick: () => navigate('/history') },
    { label: 'Today', value: '0', icon: Zap, color: '#10b981', description: 'Published today', onClick: () => navigate('/history') },
    { label: 'Last 7 Days', value: '0', icon: Activity, color: '#3b82f6', description: 'Published in last week', onClick: () => navigate('/history') },
    { label: 'Success Rate', value: '0%', icon: Target, color: '#8b5cf6', description: 'Publish success rate', onClick: () => navigate('/history') }
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    projectsByUser: {},
    projectsByDate: {},
    publishesByObjectType: {},
    publishesByOperation: {},
    activityByDay: []
  });

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }
      
      const response = await apiClient.get('/projects/stats');
      
      const statsData = response.data || {};
      setStats([
        { label: 'Total Publishes', value: (statsData.totalPublishes || 0).toString(), icon: CheckCircle, color: '#08979C', description: 'All items published to Salesforce', onClick: () => navigate('/history') },
        { label: 'Today', value: (statsData.todayPublishes || 0).toString(), icon: Zap, color: '#10b981', description: 'Published today', onClick: () => navigate('/history') },
        { label: 'Last 7 Days', value: (statsData.recentPublishes || 0).toString(), icon: Activity, color: '#3b82f6', description: 'Published in last week', onClick: () => navigate('/history') },
        { label: 'Success Rate', value: `${statsData.successRate || 100}%`, icon: Target, color: '#8b5cf6', description: 'Publish success rate', onClick: () => navigate('/history') }
      ]);
      setAnalytics({
        projectsByUser: statsData.projectsByUser || {},
        projectsByDate: statsData.projectsByDate || {},
        publishesByObjectType: statsData.publishesByObjectType || {},
        publishesByOperation: statsData.publishesByOperation || {},
        activityByDay: statsData.activityByDay || []
      });
      
      if (!silent) {
        toast.success('Dashboard updated');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching stats:', error);
      }
      // Don't show toast for 401 errors (handled by auth context) or silent refreshes
      if (error.response?.status !== 401 && !silent) {
        toast.error('Error loading dashboard statistics');
      }
      // Ensure analytics state is set even on error to prevent crashes
      setAnalytics({
        projectsByUser: {},
        projectsByDate: {},
        publishesByObjectType: {},
        publishesByOperation: {},
        activityByDay: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
    
    // Set up automatic refresh every 10 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchStats(true); // Silent refresh
    }, 10000); // 10 seconds
    
    // Refresh when user returns to the tab/window
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats(true); // Silent refresh when tab becomes visible
      }
    };
    
    // Refresh when window gains focus
    const handleFocus = () => {
      fetchStats(true); // Silent refresh when window gains focus
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStats]);


  const quickActions = [
    {
      id: 'create',
      title: 'Create New Project',
      description: 'Start a new project setup process',
      icon: PlusCircle,
      action: () => navigate('/setup'),
      gradient: 'var(--gradient-primary)'
    },
    {
      id: 'view',
      title: 'View Saved Content',
      description: 'Browse and manage existing projects',
      icon: FileText,
      action: () => navigate('/projects'),
      gradient: 'var(--gradient-secondary)',
      permission: 'view_project'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure application settings',
      icon: Settings,
      action: () => navigate('/settings'),
      gradient: 'var(--gradient-accent)',
      permission: 'all'
    }
  ];

  const filteredQuickActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="dashboard-content" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.3s ease, width 0.3s ease' }}>
          <header className="dashboard-header">
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
                  <h1 className="page-title">Dashboard</h1>
                  <p className="page-subtitle">Welcome back! Here's what's happening with your projects.</p>
                </div>
              </div>
            </div>
          </header>
          <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '16px' }}>
            <Loader className="spinner" size={24} style={{ color: '#0176d3' }} />
            <p style={{ color: '#706e6b', fontSize: '14px' }}>Loading...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="dashboard-content" style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)`, transition: 'margin-left 0.3s ease, width 0.3s ease' }}>
        <header className="dashboard-header">
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
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back! Here's what's happening with your projects.</p>
              </div>
            </div>
            <div className="header-user-profile">
              <button
                onClick={() => fetchStats(false)}
                disabled={refreshing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  marginRight: '12px',
                  background: refreshing ? '#f0f0f0' : '#08979C',
                  color: refreshing ? '#666' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                title="Refresh dashboard"
              >
                <RefreshCw size={16} className={refreshing ? 'spinning' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="user-profile">
                <div className="user-avatar">
                  {(user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user?.email || 'User'}</span>
                <button className="logout-btn" onClick={logout} title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="stat-card neumorphic fade-in" 
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    cursor: stat.onClick ? 'pointer' : 'default',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={stat.onClick}
                  title={stat.description}
                  onMouseEnter={(e) => {
                    if (stat.onClick) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (stat.onClick) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }
                  }}
                >
                  <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                    {stat.description && (
                      <div className="stat-description" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.8 }}>
                        {stat.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <section className="dashboard-section">
            <h2 className="section-title">Quick Actions</h2>
            <div className="actions-grid">
              {filteredQuickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    className="action-card neumorphic fade-in"
                    onClick={action.action}
                    style={{ 
                      animationDelay: `${(index + 4) * 0.1}s`,
                      cursor: 'pointer'
                    }}
                  >
                    <div className="action-icon" style={{ background: action.gradient }}>
                      <Icon size={28} color="white" />
                    </div>
                    <div className="action-content">
                      <h3 className="action-title">{action.title}</h3>
                      <p className="action-description">{action.description}</p>
                    </div>
                    <ArrowRight size={20} className="action-arrow" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Analytics Section */}
          <section className="dashboard-section">
            <h2 className="section-title">Publishing Analytics</h2>
            <div className="analytics-grid">
              {/* Publishing Activity Over Time */}
              <div className="analytics-card neumorphic fade-in" style={{ animationDelay: '0.5s', gridColumn: 'span 2' }}>
                <div className="analytics-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} color="#08979C" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Publishing Activity (Last 30 Days)</h3>
                  </div>
                </div>
                {(() => {
                  if (!analytics.activityByDay || analytics.activityByDay.length === 0) {
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#666', fontSize: '14px' }}>No publishing activity data available</p>
                      </div>
                    );
                  }
                  
                  try {
                    const chartData = analytics.activityByDay.map(item => ({
                      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      fullDate: item.date,
                      creates: item.creates || 0,
                      updates: item.updates || 0,
                      total: item.total || 0
                    }));
                    
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#08979C" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#08979C" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCreates" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value, name, props) => {
                              // Custom formatter to control order: Creates, Updates, Total (last)
                              // Recharts calls this for each data series
                              if (name === 'creates') {
                                return [value, 'Creates'];
                              } else if (name === 'updates') {
                                return [value, 'Updates'];
                              } else if (name === 'total') {
                                return [value, 'Total'];
                              }
                              // Fallback
                              return [value, name];
                            }}
                            labelFormatter={(label) => {
                              const item = chartData.find(d => d.date === label);
                              return item ? new Date(item.fullDate).toLocaleDateString() : label;
                            }}
                            contentStyle={{ fontSize: '13px', borderRadius: '6px' }}
                            content={({ active, payload, label }) => {
                              if (!active || !payload || !payload.length) return null;
                              
                              // Sort payload to show Creates, Updates, Total (last)
                              const sortedPayload = [...payload].sort((a, b) => {
                                const order = { 'creates': 1, 'updates': 2, 'total': 3 };
                                return (order[a.dataKey] || 99) - (order[b.dataKey] || 99);
                              });
                              
                              return (
                                <div style={{ 
                                  background: 'white', 
                                  padding: '10px', 
                                  border: '1px solid #ccc', 
                                  borderRadius: '6px',
                                  fontSize: '13px'
                                }}>
                                  <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                                    {label}
                                  </p>
                                  {sortedPayload.map((entry, index) => (
                                    <p key={index} style={{ margin: '4px 0', color: entry.color }}>
                                      {entry.name}: <strong>{entry.value}</strong>
                                    </p>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Legend 
                            formatter={(value, entry) => {
                              // In Recharts Legend, 'value' is the name prop from Area component
                              // But we need to check the dataKey from entry.payload
                              // entry.payload contains the dataKey in the 'dataKey' property
                              if (entry && entry.payload) {
                                const dataKey = entry.payload.dataKey;
                                if (dataKey === 'creates') return 'Creates';
                                if (dataKey === 'updates') return 'Updates';
                                if (dataKey === 'total') return 'Total';
                              }
                              // Fallback: use value (which is the name prop: "Total", "Creates", "Updates")
                              return value;
                            }}
                            wrapperStyle={{ fontSize: '13px' }}
                          />
                          <Area type="monotone" dataKey="total" stroke="#08979C" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                          <Area type="monotone" dataKey="creates" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCreates)" name="Creates" />
                          <Area type="monotone" dataKey="updates" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUpdates)" name="Updates" />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Error rendering activity chart:', error);
                    }
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#ef4444', fontSize: '14px' }}>Error loading chart</p>
                      </div>
                    );
                  }
                })()}
              </div>
              
              {/* Publishes by Object Type */}
              <div className="analytics-card neumorphic fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="analytics-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChart size={20} color="#08979C" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>By Object Type</h3>
                  </div>
                </div>
                {(() => {
                  if (!analytics.publishesByObjectType || Object.keys(analytics.publishesByObjectType).length === 0) {
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#666', fontSize: '14px' }}>No data available</p>
                      </div>
                    );
                  }
                  
                  try {
                    // Map Salesforce API names to user-friendly names
                    const objectTypeMap = {
                      'Project': 'Project',
                      'Project__c': 'Project',
                      'Project Objective': 'Project Objective',
                      'Project_Objective__c': 'Project Objective',
                      'Project Objective__c': 'Project Objective',
                      'Contributor Project': 'Contributor Project',
                      'Contributor_Project__c': 'Contributor Project',
                      'Client Tool Account': 'Client Tool Account',
                      'Client_Tool_Account__c': 'Client Tool Account',
                      'WorkStream': 'WorkStream',
                      'WorkStream__c': 'WorkStream',
                      'Work_Stream__c': 'WorkStream',
                      'Project_Workstream__c': 'WorkStream',
                      'Project Workstream': 'WorkStream',
                      'Qualification Step': 'Qualification Step',
                      'Qualification_Step__c': 'Qualification Step'
                    };
                    
                    // Aggregate by friendly name
                    const aggregatedData = {};
                    Object.entries(analytics.publishesByObjectType).forEach(([apiName, value]) => {
                      const friendlyName = objectTypeMap[apiName] || apiName.replace(/_/g, ' ').replace(/__c/g, '').replace(/\b\w/g, l => l.toUpperCase());
                      aggregatedData[friendlyName] = (aggregatedData[friendlyName] || 0) + Number(value || 0);
                    });
                    
                    const COLORS = ['#08979C', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
                    const total = Object.values(aggregatedData).reduce((sum, val) => sum + val, 0);
                    
                    const chartData = Object.entries(aggregatedData)
                      .map(([name, value]) => ({
                        name: name,
                        value: Number(value || 0),
                        percent: total > 0 ? ((value / total) * 100).toFixed(0) : '0'
                      }))
                      .filter(item => item.value > 0)
                      .sort((a, b) => b.value - a.value);
                    
                    if (chartData.length === 0) {
                      return (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: '#666', fontSize: '14px' }}>No data available</p>
                        </div>
                      );
                    }
                    
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} publishes (${props.payload.percent}%)`,
                              props.payload.name
                            ]}
                            contentStyle={{ fontSize: '13px', borderRadius: '6px' }}
                          />
                          <Legend 
                            formatter={(value, entry) => {
                              if (entry && entry.payload) {
                                return `${entry.payload.name}: ${entry.payload.percent}%`;
                              }
                              return value;
                            }}
                            wrapperStyle={{ fontSize: '13px', fontWeight: '500' }}
                            verticalAlign="bottom"
                            height={60}
                            iconType="circle"
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    );
                  } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Error rendering object type chart:', error);
                    }
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#ef4444', fontSize: '14px' }}>Error loading chart</p>
                      </div>
                    );
                  }
                })()}
              </div>
              
              {/* Publishes by Operation Type */}
              <div className="analytics-card neumorphic fade-in" style={{ animationDelay: '0.7s' }}>
                <div className="analytics-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#08979C" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>By Operation</h3>
                  </div>
                </div>
                {(() => {
                  if (!analytics.publishesByOperation || Object.keys(analytics.publishesByOperation).length === 0) {
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#666', fontSize: '14px' }}>No data available</p>
                      </div>
                    );
                  }
                  
                  try {
                    const chartData = Object.entries(analytics.publishesByOperation)
                      .map(([operation, count]) => ({
                        operation: operation.charAt(0).toUpperCase() + operation.slice(1),
                        count: Number(count || 0)
                      }))
                      .filter(item => item.count > 0)
                      .sort((a, b) => b.count - a.count);
                    
                    if (chartData.length === 0) {
                      return (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: '#666', fontSize: '14px' }}>No data available</p>
                        </div>
                      );
                    }
                    
                    const COLORS = {
                      'Create': '#10b981',
                      'Update': '#3b82f6',
                      'Delete': '#ef4444',
                      'Unknown': '#6b7280'
                    };
                    
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="operation" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value) => [`${value} publishes`, 'Count']}
                            contentStyle={{ fontSize: '13px', borderRadius: '6px' }}
                          />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.operation] || COLORS['Unknown']} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Error rendering operation chart:', error);
                    }
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#ef4444', fontSize: '14px' }}>Error loading chart</p>
                      </div>
                    );
                  }
                })()}
              </div>
              
              {/* Top Publishers */}
              <div className="analytics-card neumorphic fade-in" style={{ animationDelay: '0.8s' }}>
                <div className="analytics-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} color="#08979C" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Top Publishers</h3>
                  </div>
                </div>
                {(() => {
                  if (!analytics.projectsByUser || Object.keys(analytics.projectsByUser).length === 0) {
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#666', fontSize: '14px' }}>No data available</p>
                      </div>
                    );
                  }
                  
                  try {
                    const topPublishers = Object.entries(analytics.projectsByUser)
                      .map(([user, data]) => ({
                        user: user.length > 25 ? user.substring(0, 25) + '...' : user,
                        fullUser: user,
                        published: Number((data && data.published) || 0)
                      }))
                      .filter(item => item.published > 0)
                      .sort((a, b) => b.published - a.published)
                      .slice(0, 10);
                    
                    if (topPublishers.length === 0) {
                      return (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: '#666', fontSize: '14px' }}>No data available</p>
                        </div>
                      );
                    }
                    
                    const maxValue = Math.max(...topPublishers.map(p => p.published));
                    
                    return (
                      <div style={{ padding: '16px 0' }}>
                        {topPublishers.map((publisher, index) => (
                          <div key={index} style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: '#002329' }} title={publisher.fullUser}>
                                {publisher.user}
                              </span>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#08979C' }}>
                                {publisher.published}
                              </span>
                            </div>
                            <div style={{ 
                              width: '100%', 
                              height: '8px', 
                              backgroundColor: '#e5e7eb', 
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${(publisher.published / maxValue) * 100}%`,
                                height: '100%',
                                backgroundColor: '#08979C',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Error rendering top publishers:', error);
                    }
                    return (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#ef4444', fontSize: '14px' }}>Error loading data</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </section>

          {/* Dashboard Widgets Section */}
          <section className="dashboard-section" style={{ marginTop: '32px' }}>
            <DashboardWidgetsManager 
              stats={stats}
              analytics={analytics}
            />
          </section>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;

