import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import apiClient from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import './FieldHelpIcon.css';

/**
 * FieldHelpIcon Component
 * Displays an info icon that shows field help text on hover
 * 
 * @param {string} objectType - The object type (e.g., 'Project', 'Project_Objective__c')
 * @param {string} fieldName - The Salesforce field API name (e.g., 'Name', 'Short_Project_Name__c')
 * @param {number} size - Icon size (default: 14)
 * @param {string} className - Additional CSS classes
 */
const FieldHelpIcon = ({ objectType, fieldName, size = 14, className = '' }) => {
  const { user } = useAuth();
  const [helpText, setHelpText] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if user is authenticated and we have both objectType and fieldName
    if (!user || !objectType || !fieldName) {
      return;
    }

    const fetchHelpText = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/field-help-text/${encodeURIComponent(objectType)}/${encodeURIComponent(fieldName)}`);
        if (response.data && response.data.success && response.data.helpText) {
          setHelpText(response.data.helpText);
        } else {
          setHelpText(null);
        }
      } catch (error) {
        // Silently fail - if help text doesn't exist or user not authenticated, don't show tooltip
        setHelpText(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHelpText();
  }, [user, objectType, fieldName]);

  // Always show icon if we have objectType and fieldName (even if help text is loading or not found)
  // This allows users to see that help might be available
  if (!objectType || !fieldName) {
    return null;
  }

  return (
    <span
      className={`field-help-icon ${className}`}
      onMouseEnter={() => {
        if (helpText) {
          setShowTooltip(true);
        }
      }}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        marginLeft: '4px', 
        cursor: helpText ? 'help' : 'default',
        position: 'relative'
      }}
      title={helpText || (loading ? 'Loading help text...' : 'No help text available')}
    >
      <Info size={size} className="info-icon" style={{ opacity: helpText ? 1 : 0.5 }} />
      {showTooltip && helpText && (
        <div className="field-help-tooltip">
          <div className="field-help-tooltip-content">
            {helpText}
          </div>
          <div className="field-help-tooltip-arrow" />
        </div>
      )}
    </span>
  );
};

export default FieldHelpIcon;
