import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import apiClient from '../config/api';
import toast from 'react-hot-toast';
import '../styles/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: email
      });

      setEmailSent(true);
      toast.success(response.data.message);
      
      // In development, show the reset token and provide link
      if (response.data.resetToken) {
        const resetLink = `${window.location.origin}/reset-password?token=${response.data.resetToken}`;
        toast.success(
          `Reset Token (dev only): ${response.data.resetToken}\nClick here: ${resetLink}`,
          { duration: 15000 }
        );
        // Also show in alert for easy copy
        setTimeout(() => {
          alert(`Development Mode - Reset Token:\n${response.data.resetToken}\n\nReset Link:\n${resetLink}`);
        }, 500);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send reset email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-header">
            <div className="login-icon-wrapper">
              <Mail size={40} className="login-icon" />
            </div>
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to {email}</p>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link 
              to="/login" 
              style={{ 
                color: '#08979C', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600
              }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <Mail size={40} className="login-icon" />
          </div>
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset link</p>
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
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link 
              to="/login" 
              style={{ 
                color: '#08979C', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontFamily: 'Poppins',
                fontWeight: 600
              }}
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

