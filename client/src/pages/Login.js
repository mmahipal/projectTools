import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Hooks must be called unconditionally at the top level
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading === false && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Only show loading if authLoading is explicitly true
  // If undefined or false, show the login form
  const isLoading = authLoading === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        // Small delay to ensure state is updated before navigation
        // The useEffect will also handle redirect if user is set
        setTimeout(() => {
          if (user) {
            navigate('/', { replace: true });
          } else {
            // If user is still not set after delay, navigate anyway
            // The verifyToken will set it soon
            navigate('/', { replace: true });
          }
        }, 100);
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner only if explicitly loading
  if (isLoading) {
    return (
      <div style={{ 
        background: '#ffffff', 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader className="spinner" size={24} style={{ color: '#0176d3' }} />
          <p style={{ color: '#706e6b', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Always render something - even if there's an error
  return (
    <div 
      className="login-container" 
      style={{ 
        background: '#ffffff', 
        minHeight: '100vh', 
        width: '100%', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        visibility: 'visible',
        opacity: 1,
        zIndex: 1
      }}
    >
      <div 
        className="login-card fade-in" 
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          padding: '48px',
          borderRadius: '12px',
          boxShadow: 'none',
          border: 'none',
          borderWidth: 0,
          borderStyle: 'none',
          borderColor: 'transparent',
          outline: 'none',
          position: 'relative',
          zIndex: 1,
          visibility: 'visible',
          opacity: 1,
          display: 'block'
        }}
      >
        <div className="login-header">
          <div className="login-logo-wrapper">
            <img src="/appen_symbol_black_cmyk.svg" alt="Appen" className="login-logo" onError={(e) => { e.target.src = "/appen_logo_black_660X400 (1).png"; }} />
          </div>
          <h1>Project Tools</h1>
          <p>Sign in to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          
          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
            <Link 
              to="/forgot-password" 
              style={{ 
                color: '#08979C', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontFamily: 'Poppins'
              }}
            >
              Forgot Password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ color: '#666', fontSize: '14px', fontFamily: 'Poppins' }}>
              Don't have an account?{' '}
            </span>
            <Link 
              to="/register" 
              style={{ 
                color: '#08979C', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600
              }}
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

