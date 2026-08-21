import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute, ROLES, PERMISSIONS, hasPermission } from '../utils/rbac';
import TruncatedSpan from './TruncatedSpan';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Target,
  BookOpen,
  Users,
  File,
  Sparkles,
  History,
  FolderOpen,
  Wrench,
  ListChecks,
  Workflow,
  Edit3,
  BarChart3,
  DollarSign,
  TrendingUp,
  Shield,
  FileText as FileTextIcon,
  Clock as ClockIcon,
  Copy,
  AlertCircle,
  Users2,
  CheckCircle
} from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  // Handle resize
  useEffect(() => {
    if (!isOpen || !isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(280, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, isResizing]);
  
  // Helper to check if user can access a route
  const canAccess = (path, itemRoles = null) => {
    if (!user || !user.role) return false;
    if (user.role === ROLES.ADMIN) return true;
    
    // Check role-based access if roles are specified
    if (itemRoles && Array.isArray(itemRoles)) {
      return itemRoles.includes(user.role);
    }
    
    if (!path) return true; // Parent menu items without paths
    return canAccessRoute(user.role, path);
  };

  const menuItems = [
    {
      id: 'dashboards',
      label: 'Dashboards',
      icon: BarChart3,
      path: null, // No path - expandable menu only
      permission: null,
      children: [
        {
          id: 'case-analytics',
          label: 'Case Analytics',
          icon: BarChart3,
          path: '/case-analytics',
          permission: null
        },
        {
          id: 'contributor-payments',
          label: 'Contributor Payments',
          icon: DollarSign,
          path: '/contributor-payments',
          permission: null
        },
        {
          id: 'project-performance',
          label: 'Project Performance',
          icon: TrendingUp,
          path: '/project-performance',
          permission: null
        }
      ]
    },
    {
      id: 'create-objects',
      label: 'Create Objects',
      icon: FolderOpen,
      path: null, // No path - expandable menu only
      permission: null,
      children: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          permission: null,
          roles: [ROLES.ADMIN, ROLES.SALESFORCE_MANAGER] // Only Admin and Salesforce Manager
        },
        {
          id: 'quick-setup',
          label: 'Quick Setup Wizard',
          icon: Sparkles,
          path: '/quick-setup',
          permission: null
        },
        {
          id: 'create',
          label: 'Create Project',
          icon: PlusCircle,
          path: '/setup',
          permission: null
        },
        {
          id: 'create-objective',
          label: 'Create Project Objective',
          icon: Target,
          path: '/setup-objective',
          permission: null
        },
        {
          id: 'create-qualification-step',
          label: 'Create Qualification Step',
          icon: BookOpen,
          path: '/setup-qualification-step',
          permission: null
        },
        {
          id: 'create-project-page',
          label: 'Create Project Page',
          icon: File,
          path: '/setup-project-page',
          permission: null
        },
        {
          id: 'create-project-team',
          label: 'Create Project Team',
          icon: Users,
          path: '/setup-project-team',
          permission: null
        },
        {
          id: 'clone',
          label: 'Clone',
          icon: Copy,
          path: '/clone',
          permission: null
        },
        {
          id: 'add-contributor-review',
          label: 'Add Contributor Review',
          icon: FileTextIcon,
          path: '/add-contributor-review',
          permission: null
        },
        {
          id: 'projects',
          label: 'View Saved Content',
          icon: FileText,
          path: '/projects',
          permission: null,
          roles: [ROLES.ADMIN, ROLES.SALESFORCE_MANAGER] // Only Admin and Salesforce Manager
        }
      ]
    },
    {
      id: 'project-management',
      label: 'Project Management',
      icon: Workflow,
      path: null, // No path - expandable menu only
      permission: null,
      children: [
        {
          id: 'client-tool-account',
          label: 'Client Tool Account',
          icon: Wrench,
          path: '/client-tool-account',
          permission: null
        },
        {
          id: 'queue-status-management',
          label: 'Queue Status Management',
          icon: ListChecks,
          path: '/queue-status-management',
          permission: null
        },
        {
          id: 'workstream-management',
          label: 'Workstream Management',
          icon: Workflow,
          path: '/workstream-management',
          permission: null
        },
        {
          id: 'update-object-fields',
          label: 'Update Object Fields',
          icon: Edit3,
          path: '/update-object-fields',
          permission: null
        },
        {
          id: 'case-management',
          label: 'Case Management',
          icon: AlertCircle,
          path: '/case-management',
          permission: null
        },
        {
          id: 'pm-approvals',
          label: 'PM Approvals',
          icon: CheckCircle,
          path: '/pm-approvals',
          permission: null
        },
        {
          id: 'payment-adjustments',
          label: 'Payment Adjustments',
          icon: DollarSign,
          path: '/payment-adjustments',
          permission: null
        }
      ]
    },
    {
      id: 'reporting',
      label: 'Reporting',
      icon: FileTextIcon,
      path: null, // No path - expandable menu only
      permission: null,
      children: [
        {
          id: 'report-builder',
          label: 'Report Builder',
          icon: FileTextIcon,
          path: '/report-builder',
          permission: null
        },
        {
          id: 'advanced-report-builder',
          label: 'Advanced Builder',
          icon: Sparkles,
          path: '/advanced-report-builder',
          permission: null
        },
        {
          id: 'scheduled-reports',
          label: 'Scheduled Reports',
          icon: ClockIcon,
          path: '/scheduled-reports',
          permission: null
        },
        {
          id: 'mfa-verification-logs',
          label: 'MFA Verification Logs',
          icon: Shield,
          path: '/mfa-verification-logs',
          permission: null
        },
        {
          id: 'project-roster-funnel',
          label: 'Project Roster Funnel',
          icon: Users2,
          path: '/project-roster-funnel',
          permission: null
        },
        {
          id: 'active-contributors-by-project',
          label: 'Active Contributors by Project',
          icon: Users,
          path: '/active-contributors-by-project',
          permission: null
        },
        {
          id: 'active-project-objectives-by-qual-step',
          label: 'Active Project Objectives by Qualification Step',
          icon: Users,
          path: '/active-project-objectives-by-qual-step',
          permission: null
        },
        {
          id: 'onboarding-contributors',
          label: 'Onboarding Contributors',
          icon: Users,
          path: '/onboarding-contributors',
          permission: null
        },
        {
          id: 'contributor-time-status',
          label: 'Contributor Time Status',
          icon: ClockIcon,
          path: '/contributor-time-status',
          permission: null
        },
        {
          id: 'contributor-match-matrix',
          label: 'Contributor Match Matrix',
          icon: FileTextIcon,
          path: '/contributor-match-matrix',
          permission: null
        },
        {
          id: 'po-pay-rates',
          label: 'PO Pay Rates',
          icon: DollarSign,
          path: '/po-pay-rates',
          permission: null
        },
        {
          id: 'po-productivity-targets',
          label: 'PO Productivity Targets',
          icon: Target,
          path: '/po-productivity-targets',
          permission: null
        }
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: Shield,
      path: '/administration',
      permission: 'all'
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      path: '/user-management',
      permission: 'all',
      hidden: true // Hidden - now under Administration
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      path: '/history',
      permission: null,
      hidden: true // Hidden from UI but route remains active
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      permission: 'all',
      hidden: true // Hidden - now under Administration
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // Hide items marked as hidden
    if (item.hidden) {
      return false;
    }
    
    // Check role-based access (pass item.roles if it exists)
    if (!canAccess(item.path, item.roles)) {
      return false;
    }
    
    // If item has children, filter them too
    if (item.children) {
      const filteredChildren = item.children.filter(child => canAccess(child.path));
      return filteredChildren.length > 0;
    }
    
    return true;
  });

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => {
      const isCurrentlyExpanded = prev[menuId];
      // If opening this menu, close all others
      if (!isCurrentlyExpanded) {
        const newState = {};
        // Close all other menus
        Object.keys(prev).forEach(key => {
          newState[key] = false;
        });
        // Open the clicked menu
        newState[menuId] = true;
        return newState;
      } else {
        // If closing, just toggle this one
        return {
          ...prev,
          [menuId]: false
        };
      }
    });
  };

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/quick-setup') {
      return location.pathname === '/quick-setup';
    }
    if (path === '/setup') {
      return location.pathname === '/setup';
    }
    if (path === '/setup-objective') {
      return location.pathname === '/setup-objective';
    }
    if (path === '/setup-qualification-step') {
      return location.pathname === '/setup-qualification-step';
    }
    if (path === '/setup-project-page') {
      return location.pathname === '/setup-project-page';
    }
    if (path === '/setup-project-team') {
      return location.pathname === '/setup-project-team';
    }
    if (path === '/administration') {
      return location.pathname === '/administration';
    }
    if (path === '/user-management') {
      return location.pathname === '/user-management';
    }
    if (path === '/history') {
      return location.pathname === '/history';
    }
    if (path === '/client-tool-account') {
      return location.pathname === '/client-tool-account';
    }
    if (path === '/create-workstream') {
      return location.pathname === '/create-workstream';
    }
    if (path === '/workstream-reporting') {
      return location.pathname === '/workstream-reporting';
    }
    if (path === '/update-object-fields') {
      return location.pathname === '/update-object-fields';
    }
    if (path === '/case-analytics') {
      return location.pathname === '/case-analytics';
    }
    if (path === '/contributor-payments') {
      return location.pathname === '/contributor-payments';
    }
    if (path === '/pm-approvals') {
      return location.pathname === '/pm-approvals';
    }
    return location.pathname.startsWith(path);
  };

  const isChildActive = (item) => {
    if (item.children) {
      return item.children.some(child => isActive(child.path));
    }
    return false;
  };

  // Auto-expand parent menu if any child is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => isActive(child.path));
        if (hasActiveChild) {
          setExpandedMenus(prev => ({
            ...prev,
            [item.id]: true
          }));
        }
      }
    });
  }, [location.pathname]);

  return (
    <aside 
      className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      style={isOpen ? { width: `${sidebarWidth}px` } : {}}
      ref={sidebarRef}
    >
      {isOpen && (
        <div
          className="sidebar-resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />
      )}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img 
            src="/appen_symbol_black_cmyk.svg" 
            alt="Appen" 
            className={`logo-icon ${!isOpen ? 'logo-icon-collapsed' : 'logo-icon-expanded'}`}
            onError={(e) => { 
              e.target.src = "/appen_logo_black_660X400 (1).png";
            }}
          />
          {isOpen && <span className="logo-text">Project Tools</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.id];
          const active = isActive(item.path) || isChildActive(item);
          
          if (hasChildren) {
            const filteredChildren = item.children.filter(child => canAccess(child.path, child.roles));
            
            return (
              <div key={item.id} className="nav-group">
                <button
                  className={`nav-item nav-item-parent ${active ? 'nav-item-active' : ''} ${isExpanded ? 'nav-item-expanded' : ''}`}
                  onClick={() => toggleMenu(item.id)}
                >
                  <Icon size={20} className="nav-icon" />
                  {isOpen && <span className="nav-label">{item.label}</span>}
                  {isOpen && (
                    <span className="nav-chevron">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  )}
                </button>
                {isExpanded && isOpen && (
                  <div className="nav-children">
                    {filteredChildren.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.path);
                      
                      return (
                        <button
                          key={child.id}
                          className={`nav-item nav-item-child ${childActive ? 'nav-item-active' : ''}`}
                          onClick={() => navigate(child.path)}
                        >
                          <ChildIcon size={18} className="nav-icon" />
                          <span className="nav-label">{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
              onClick={() => item.path && navigate(item.path)}
            >
              <Icon size={20} className="nav-icon" />
              {isOpen && (
                <TruncatedSpan className="nav-label" title={item.label}>
                  {item.label}
                </TruncatedSpan>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

