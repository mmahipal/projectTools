import React, { useState, useEffect } from 'react';
import { GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import apiClient from '../../../config/api';
import toast from 'react-hot-toast';
import '../../../styles/SubqueryList.css';

const SubqueryList = ({ objectType, onSubqueryDrag, searchTerm }) => {
  const [subqueries, setSubqueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSubqueries, setExpandedSubqueries] = useState(new Set());
  const [subqueryFields, setSubqueryFields] = useState({});

  useEffect(() => {
    if (objectType) {
      loadSubqueries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectType]);

  const loadSubqueries = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/update-object-fields/relationships/${encodeURIComponent(objectType)}`
      );
      if (response.data.success) {
        // Filter only subquery relationships (child records)
        const childRelationships = (response.data.relationships || []).filter(
          rel => rel.isSubquery === true || rel.relationshipType === 'child'
        );
        setSubqueries(childRelationships);
      } else {
        setSubqueries([]);
      }
    } catch (error) {
      console.error('Error loading subqueries:', error);
      toast.error('Failed to load child records');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubquery = async (subquery) => {
    const newExpanded = new Set(expandedSubqueries);
    if (newExpanded.has(subquery.relationshipName)) {
      newExpanded.delete(subquery.relationshipName);
    } else {
      newExpanded.add(subquery.relationshipName);
      // Load fields for this subquery
      await loadSubqueryFields(subquery);
    }
    setExpandedSubqueries(newExpanded);
  };

  const loadSubqueryFields = async (subquery) => {
    if (subqueryFields[subquery.relationshipName]) {
      return; // Already loaded
    }

    try {
      const response = await apiClient.get(
        `/update-object-fields/describe-object/${encodeURIComponent(subquery.targetObject)}?forReporting=true`
      );
      if (response.data.success) {
        setSubqueryFields(prev => ({
          ...prev,
          [subquery.relationshipName]: response.data.fields || []
        }));
      }
    } catch (error) {
      console.error(`Error loading fields for ${subquery.targetObject}:`, error);
    }
  };

  const handleSubqueryDrag = (e, subquery) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'subquery',
      subquery: subquery
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDrag = (e, field, relationshipName) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'subquery-field',
      field: field,
      relationshipName: relationshipName
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const filteredSubqueries = subqueries.filter(sub =>
    searchTerm === '' ||
    sub.fieldLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.relationshipName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="subqueries-loading">Loading child records...</div>;
  }

  if (filteredSubqueries.length === 0) {
    return <div className="subqueries-empty">No child records found</div>;
  }

  return (
    <div className="subquery-list">
      {filteredSubqueries.map(subquery => {
        const isExpanded = expandedSubqueries.has(subquery.relationshipName);
        const fields = subqueryFields[subquery.relationshipName] || [];
        const filteredFields = fields.filter(field =>
          searchTerm === '' ||
          field.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div key={subquery.relationshipName} className="subquery-item">
            <div
              className="subquery-header"
              draggable
              onDragStart={(e) => handleSubqueryDrag(e, subquery)}
            >
              <button
                className="subquery-toggle"
                onClick={() => toggleSubquery(subquery)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <GripVertical size={14} className="drag-handle" />
              <span className="subquery-label">
                📋 {subquery.fieldLabel || subquery.relationshipName}
              </span>
              <span className="subquery-target">→ {subquery.targetObject}</span>
            </div>
            {isExpanded && (
              <div className="subquery-fields">
                {filteredFields.length === 0 ? (
                  <div className="fields-loading">Loading fields...</div>
                ) : (
                  filteredFields.map(field => (
                    <div
                      key={field.name}
                      className="subquery-field-item"
                      draggable
                      onDragStart={(e) => handleFieldDrag(e, field, subquery.relationshipName)}
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

export default SubqueryList;

