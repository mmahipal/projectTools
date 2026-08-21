import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { addRecentItem } from '../utils/crossFeature/recentItems';

/**
 * Component to track page navigation and add to recent items
 * Should be placed in App.js to track all navigation
 */
const NavigationTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname) {
      const path = location.pathname;
      
      // Skip certain paths that shouldn't be tracked
      const skipPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/welcome'];
      if (skipPaths.includes(path)) {
        return;
      }

      // Get page name from path
      const pathParts = path.split('/').filter(p => p);
      const pageName = pathParts[pathParts.length - 1] || 'Home';
      
      // Format page name (e.g., "client-tool-account" -> "Client Tool Account")
      const formattedName = pageName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Add to recent items
      addRecentItem({
        type: 'page',
        id: path,
        name: formattedName,
        path: path,
        timestamp: new Date().toISOString()
      });
    }
  }, [location.pathname]);

  return null;
};

export default NavigationTracker;

