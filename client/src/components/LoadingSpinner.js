import React from 'react';
import { Loader } from 'lucide-react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ size = 48, message = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <Loader size={size} className="spinner-icon" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
























