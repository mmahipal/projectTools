import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  

  useEffect(() => {
    if (loading) {
      // Set timeout for loading state (10 seconds)
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timer);
    } else {
      // Reset timeout if loading completes
      setTimeoutReached(false);
    }
  }, [loading]);

  if (loading && !timeoutReached) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '16px'
      }}>
        <Loader className="spinner" size={24} style={{ color: '#0176d3' }} />
        <p style={{ color: '#706e6b', fontSize: '14px' }}>Loading...</p>
      </div>
    );
  }

  // If timeout reached or no user, redirect to login
  if (timeoutReached || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;











