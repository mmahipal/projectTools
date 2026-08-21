import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, Settings, TrendingUp, Clock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './QuickActions.css';

const QuickActions = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const actions = [
    {
      id: 'create',
      title: 'Create Project',
      description: 'Start a new project',
      icon: PlusCircle,
      path: '/setup',
      color: '#08979C',
      permission: null
    },
    {
      id: 'view',
      title: 'View Projects',
      description: 'Browse projects',
      icon: FileText,
      path: '/projects',
      color: '#3b82f6',
      permission: 'view_project'
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'View analytics',
      icon: TrendingUp,
      path: '/dashboard',
      color: '#10b981',
      permission: null
    },
    {
      id: 'history',
      title: 'History',
      description: 'View activity',
      icon: Clock,
      path: '/history',
      color: '#8b5cf6',
      permission: null
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure app',
      icon: Settings,
      path: '/settings',
      color: '#f59e0b',
      permission: 'all'
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'View reports',
      icon: Search,
      path: '/report-builder',
      color: '#ef4444',
      permission: null
    }
  ];

  const filteredActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="quick-actions-section">
      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        {filteredActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.id}
              className="quick-action-btn"
              onClick={() => handleActionClick(action.path)}
              style={{ '--action-color': action.color }}
            >
              <div className="action-icon" style={{ backgroundColor: `${action.color}15`, color: action.color }}>
                <IconComponent size={20} />
              </div>
              <div className="action-content">
                <span className="action-title">{action.title}</span>
                <span className="action-description">{action.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;

