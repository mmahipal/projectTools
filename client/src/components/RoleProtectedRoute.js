import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute, ROLES, PERMISSIONS } from '../utils/rbac';
import toast from 'react-hot-toast';

/**
 * Role-based protected route component
 * Checks if user has permission to access the route based on their role
 */
const RoleProtectedRoute = ({ children, requiredPermission, requiredRole, fallbackPath = '/dashboard' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #08979C', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#666', fontSize: '14px' }}>Checking permissions...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize role to lowercase for comparison (handle case sensitivity issues)
  const userRole = user.role ? user.role.toLowerCase().trim() : null;
  
  // Check if user has 'all' permission (admin or equivalent)
  const hasAllPermission = user.permissions && (
    user.permissions.includes('all') || 
    user.permissions.includes(PERMISSIONS.ALL)
  );

  // Admin or users with 'all' permission have access to everything
  if (userRole === ROLES.ADMIN || hasAllPermission) {
    return <>{children}</>;
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole.toLowerCase()) {
    toast.error('You do not have permission to access this page');
    return <Navigate to={fallbackPath} replace />;
  }

  // Check permission-based access using route
  if (requiredPermission) {
    const route = location.pathname;
    if (!canAccessRoute(userRole, route)) {
      toast.error('You do not have permission to access this page');
      return <Navigate to={fallbackPath} replace />;
    }
  } else {
    // Default: check route access
    const route = location.pathname;
    if (!canAccessRoute(userRole, route)) {
      toast.error('You do not have permission to access this page');
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;

