import React, { useState, useEffect } from 'react';
import { GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import apiClient from '../../../config/api';
import toast from 'react-hot-toast';
import '../../../styles/RelationshipTree.css';

const RelationshipTree = ({ objectType, onRelationshipDrag, searchTerm }) => {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRelationships, setExpandedRelationships] = useState(new Set());
  const [relatedFields, setRelatedFields] = useState({});

  useEffect(() => {
    if (objectType) {
      loadRelationships();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectType]);

  const loadRelationships = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/update-object-fields/relationships/${encodeURIComponent(objectType)}`
      );
      if (response.data.success) {
        // Filter out subquery relationships (they're handled separately)
        const parentRelationships = (response.data.relationships || []).filter(
          rel => !rel.isSubquery && rel.relationshipType !== 'child'
        );
        setRelationships(parentRelationships);
      } else {
        setRelationships([]);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
      toast.error('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const toggleRelationship = async (relationship) => {
    const newExpanded = new Set(expandedRelationships);
    if (newExpanded.has(relationship.relationshipName)) {
      newExpanded.delete(relationship.relationshipName);
    } else {
      newExpanded.add(relationship.relationshipName);
      // Load fields for this relationship
      await loadRelationshipFields(relationship);
    }
    setExpandedRelationships(newExpanded);
  };

  const loadRelationshipFields = async (relationship) => {
    if (relatedFields[relationship.relationshipName]) {
      return; // Already loaded
    }

    try {
      // Use describe-object endpoint for any object
      const response = await apiClient.get(
        `/update-object-fields/describe-object/${encodeURIComponent(relationship.targetObject)}?forReporting=true`
      );
      if (response.data.success) {
        setRelatedFields(prev => ({
          ...prev,
          [relationship.relationshipName]: response.data.fields || []
        }));
      }
    } catch (error) {
      console.error(`Error loading fields for ${relationship.targetObject}:`, error);
    }
  };

  const handleRelationshipDrag = (e, relationship) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'relationship',
      relationship: relationship
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDrag = (e, field, relationshipName) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'relationship-field',
      field: field,
      relationshipName: relationshipName
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const filteredRelationships = relationships.filter(rel =>
    searchTerm === '' ||
    rel.fieldLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.relationshipName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="relationships-loading">Loading relationships...</div>;
  }

  if (filteredRelationships.length === 0) {
    return <div className="relationships-empty">No relationships found</div>;
  }

  return (
    <div className="relationship-tree">
      {filteredRelationships.map(relationship => {
        const isExpanded = expandedRelationships.has(relationship.relationshipName);
        const fields = relatedFields[relationship.relationshipName] || [];
        const filteredFields = fields.filter(field =>
          searchTerm === '' ||
          field.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div key={relationship.relationshipName} className="relationship-item">
            <div
              className="relationship-header"
              draggable
              onDragStart={(e) => handleRelationshipDrag(e, relationship)}
            >
              <button
                className="relationship-toggle"
                onClick={() => toggleRelationship(relationship)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <GripVertical size={14} className="drag-handle" />
              <span className="relationship-label">
                {relationship.fieldLabel || relationship.relationshipName}
              </span>
              <span className="relationship-target">→ {relationship.targetObject}</span>
            </div>
            {isExpanded && (
              <div className="relationship-fields">
                {filteredFields.length === 0 ? (
                  <div className="fields-loading">Loading fields...</div>
                ) : (
                  filteredFields.map(field => (
                    <div
                      key={field.name}
                      className="relationship-field-item"
                      draggable
                      onDragStart={(e) => handleFieldDrag(e, field, relationship.relationshipName)}
                    >
                      <GripVertical size={12} className="drag-handle" />
                      <span className="field-label">{field.label || field.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RelationshipTree;

