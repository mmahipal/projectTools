import React, { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import apiClient from '../../../config/api';
import toast from 'react-hot-toast';
import '../../../styles/ObjectBrowser.css';

const ObjectBrowser = ({ 
  selectedObject, 
  selectedObjects = [], // Array of already selected objects
  onObjectSelect, // Legacy: single object selection
  onObjectAdd, // New: add object to multi-object report
  onObjectRemove, // New: remove object
  onFieldDrag, 
  searchTerm,
  multiObjectMode = false 
}) => {
  const [availableObjects, setAvailableObjects] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableObjects();
  }, []);

  useEffect(() => {
    if (selectedObject) {
      loadFieldsForObject(selectedObject);
    } else {
      setAvailableFields([]);
    }
  }, [selectedObject]);

  const loadAvailableObjects = async () => {
    try {
      const response = await apiClient.get('/update-object-fields/objects');
      if (response.data.success) {
        setAvailableObjects(response.data.objects || []);
      }
    } catch (error) {
      console.error('Error loading objects:', error);
    }
  };

  const loadFieldsForObject = async (objectType) => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/update-object-fields/fields/${encodeURIComponent(objectType)}?forReporting=true`
      );
      if (response.data.success) {
        setAvailableFields(response.data.fields || []);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
      toast.error('Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, field) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'field',
      field: field,
      sourceObjectType: selectedObject // Include which object this field belongs to
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const filteredFields = availableFields.filter(field =>
    searchTerm === '' ||
    field.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleObjectChange = (objectType) => {
    if (multiObjectMode && onObjectAdd) {
      // In multi-object mode, add the object instead of replacing
      if (objectType && !selectedObjects.includes(objectType)) {
        onObjectAdd(objectType);
        // Also call onObjectSelect to update the current object for field viewing
        if (onObjectSelect) {
          onObjectSelect(objectType);
        }
      }
    } else if (onObjectSelect) {
      // Legacy single-object mode
      onObjectSelect(objectType);
    }
  };

  // Filter out already selected objects in multi-object mode
  const availableObjectsList = multiObjectMode 
    ? availableObjects.filter(obj => !selectedObjects.includes(obj.value))
    : availableObjects;

  return (
    <div className="object-browser">
      {/* Object Selector */}
      <div className="object-selector">
        <select
          value={multiObjectMode ? '' : (selectedObject || '')}
          onChange={(e) => handleObjectChange(e.target.value)}
          className="object-select-input"
        >
          <option value="">{multiObjectMode ? 'Add Object to Report' : 'Select Object'}</option>
          {availableObjectsList.map(obj => (
            <option key={obj.value} value={obj.value}>
              {obj.label}
            </option>
          ))}
        </select>
        {multiObjectMode && (
          <div className="multi-object-hint">
            Select an object to add it to your report. You can add multiple objects.
          </div>
        )}
      </div>

      {/* Fields List */}
      {selectedObject ? (
        <div className="fields-list">
          <div className="fields-list-header">
            <span className="fields-list-title">Fields for: {selectedObject}</span>
          </div>
          {loading ? (
            <div className="fields-loading">Loading fields...</div>
          ) : filteredFields.length === 0 ? (
            <div className="fields-empty">No fields found</div>
          ) : (
            filteredFields.map(field => (
              <div
                key={field.name}
                className="field-item"
                draggable
                onDragStart={(e) => handleDragStart(e, field)}
              >
                <GripVertical size={14} className="drag-handle" />
                <span className="field-label">{field.label || field.name}</span>
              </div>
            ))
          )}
        </div>
      ) : multiObjectMode && selectedObjects.length > 0 ? (
        <div className="fields-empty">
          Select an object from the list above or choose one from "Selected Objects" to view its fields.
        </div>
      ) : (
        <div className="fields-empty">
          Select an object to view its fields.
        </div>
      )}
    </div>
  );
};

export default ObjectBrowser;

