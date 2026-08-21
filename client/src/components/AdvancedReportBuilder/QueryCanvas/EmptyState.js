import React, { useState, useEffect } from 'react';
import { Package, ArrowDown } from 'lucide-react';
import apiClient from '../../../config/api';
import '../../../styles/EmptyState.css';

const EmptyState = ({ onObjectSelect }) => {
  const [availableObjects, setAvailableObjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadObjects();
  }, []);

  const loadObjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/update-object-fields/objects');
      if (response.data.success) {
        setAvailableObjects(response.data.objects || []);
      }
    } catch (error) {
      console.error('Error loading objects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="query-canvas-empty">
      <div className="empty-state-content">
        <Package size={48} className="empty-icon" />
        <h2>Start Building Your Report</h2>
        <p>Select an object to begin creating your report</p>
        
        {loading ? (
          <div className="empty-loading">Loading objects...</div>
        ) : (
          <>
            <div className="empty-object-selector">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onObjectSelect(e.target.value);
                  }
                }}
                className="empty-object-select"
                defaultValue=""
              >
                <option value="">Select an Object</option>
                {availableObjects.map(obj => (
                  <option key={obj.value} value={obj.value}>
                    {obj.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="empty-hint">
              <ArrowDown size={16} />
              <span>Or drag an object from the left panel</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

