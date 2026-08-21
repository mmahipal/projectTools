import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Search, Folder, FolderOpen } from 'lucide-react';
import apiClient from '../../../config/api';
import './RelationshipBrowser.css';

const RelationshipBrowser = ({ 
  objectType, 
  selectedFields, 
  onFieldToggle,
  availableFields = []
}) => {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [relatedObjectFields, setRelatedObjectFields] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRef, setLoadingRef] = useState(false); // Prevent multiple simultaneous calls

  useEffect(() => {
    if (objectType && !loadingRef) {
      loadRelationships();
    }
    // Reset relationships when objectType changes
    return () => {
      setRelationships([]);
      setExpandedPaths(new Set());
      setRelatedObjectFields({});
    };
  }, [objectType]);

  const loadRelationships = async () => {
    if (loadingRef) {
      return;
    }
    
    setLoadingRef(true);
    setLoading(true);
    try {
      const response = await apiClient.get(`/update-object-fields/relationships/${encodeURIComponent(objectType)}`, {
        timeout: 60000 // 60 second timeout
      });
      if (response.data.success) {
        setRelationships(response.data.relationships || []);
      } else {
        console.error('[RelationshipBrowser] Failed to load relationships:', response.data.error);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
      if (error.code === 'ECONNABORTED') {
        console.error('[RelationshipBrowser] Request timed out - relationship discovery may be taking too long');
      }
    } finally {
      setLoading(false);
      setLoadingRef(false);
    }
  };

  const loadRelatedObjectFields = async (targetObject, relationshipPath) => {
    // Check if we already have fields for this object
    if (relatedObjectFields[targetObject]) {
      return;
    }

    try {
      // First try to use the object type map for known objects
      const objectTypeMap = {
        'Contact': 'contributor',
        'Case': 'cases',
        'Project__c': 'project',
        'Project_Objective__c': 'project objective',
        'Contributor_Project__c': 'contributor project'
      };
      
      const objectTypeKey = objectTypeMap[targetObject];
      
      if (objectTypeKey) {
        const response = await apiClient.get(`/update-object-fields/fields/${encodeURIComponent(objectTypeKey)}?forReporting=true`);
        if (response.data.success) {
          setRelatedObjectFields(prev => ({
            ...prev,
            [targetObject]: response.data.fields || []
          }));
          return;
        }
      }
      
      // For objects not in our map (like Account, custom objects, etc.), use the describe endpoint
      try {
        const response = await apiClient.get(`/update-object-fields/describe-object/${encodeURIComponent(targetObject)}?forReporting=true`);
        if (response.data.success) {
          setRelatedObjectFields(prev => ({
            ...prev,
            [targetObject]: response.data.fields || []
          }));
        }
      } catch (describeError) {
        console.error(`Error describing object ${targetObject}:`, describeError);
      }
    } catch (error) {
      console.error(`Error loading fields for ${targetObject}:`, error);
    }
  };

  const togglePath = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      // Load fields when expanding
      const pathParts = path.split('.');
      if (pathParts.length > 0) {
        const relationship = findRelationshipByPath(pathParts);
        if (relationship) {
          loadRelatedObjectFields(relationship.targetObject, relationship.relationshipPath);
        }
      }
    }
    setExpandedPaths(newExpanded);
  };

  const findRelationshipByPath = (pathParts) => {
    let currentRelationships = relationships;
    let currentRelationship = null;

    for (const part of pathParts) {
      currentRelationship = currentRelationships.find(r => 
        r.relationshipName === part || r.fieldName === part
      );
      if (!currentRelationship) break;
      currentRelationships = currentRelationship.nestedRelationships || [];
    }

    return currentRelationship;
  };

  const getFieldPath = (relationshipPath, fieldName) => {
    return `${relationshipPath}.${fieldName}`;
  };

  const isFieldSelected = (fieldPath) => {
    return selectedFields.includes(fieldPath);
  };

  const handleFieldToggle = (fieldPath) => {
    onFieldToggle(fieldPath);
  };

  const renderRelationshipTree = (rels, parentPath = '', depth = 0) => {
    if (depth > 4) return null; // Max depth 5

    return rels.map((rel, index) => {
      const currentPath = parentPath ? `${parentPath}.${rel.relationshipName}` : rel.relationshipName;
      const isExpanded = expandedPaths.has(currentPath);
      const fields = relatedObjectFields[rel.targetObject] || [];
      const filteredFields = searchTerm 
        ? fields.filter(f => 
            f.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : fields;

      return (
        <div key={`${currentPath}-${index}`} className="relationship-node" style={{ marginLeft: `${depth * 20}px` }}>
          <div 
            className="relationship-header"
            onClick={() => togglePath(currentPath)}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="relationship-icon" />
            ) : (
              <ChevronRight size={16} className="relationship-icon" />
            )}
            {isExpanded ? (
              <FolderOpen size={16} className="relationship-folder-icon" />
            ) : (
              <Folder size={16} className="relationship-folder-icon" />
            )}
            <span className="relationship-label">
              {rel.isSubquery ? '📋 ' : ''}{rel.fieldLabel || rel.fieldName} → {rel.targetObject}
              {rel.isSubquery && <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '4px' }}>(Child Records)</span>}
            </span>
            <span className={`relationship-type-badge ${rel.isSubquery ? 'subquery-badge' : ''}`}>
              {rel.isSubquery ? 'Subquery' : rel.relationshipType}
            </span>
          </div>

          {isExpanded && (
            <div className="relationship-fields">
              {filteredFields.length === 0 ? (
                <div className="relationship-loading">Loading fields...</div>
              ) : (
                filteredFields
                  .filter(field => 
                    field.type !== 'base64' && 
                    !field.name.startsWith('System') &&
                    field.name !== 'Id' // Exclude Id as it's the lookup field
                  )
                  .map(field => {
                    // For subqueries, the path format is: relationshipName.fieldName (e.g., Cases.Subject)
                    // For parent relationships, it's: relationshipName.fieldName (e.g., Account__r.Name)
                    const fieldPath = rel.isSubquery 
                      ? `SUBQUERY:${rel.relationshipName}.${field.name}`
                      : getFieldPath(rel.relationshipName, field.name);
                    const isSelected = isFieldSelected(fieldPath) || isFieldSelected(`SUBQUERY:${rel.relationshipName}.${field.name}`);
                    
                    return (
                      <div 
                        key={field.name}
                        className={`relationship-field-item ${isSelected ? 'selected' : ''} ${rel.isSubquery ? 'subquery-field' : ''}`}
                        onClick={() => handleFieldToggle(fieldPath)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFieldToggle(fieldPath)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="field-label">{field.label || field.name}</span>
                        <span className="field-path">{rel.isSubquery ? `${rel.relationshipName}.${field.name}` : fieldPath}</span>
                      </div>
                    );
                  })
              )}
              
              {/* Render nested relationships */}
              {rel.nestedRelationships && rel.nestedRelationships.length > 0 && (
                <div className="nested-relationships">
                  {renderRelationshipTree(rel.nestedRelationships, currentPath, depth + 1)}
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return <div className="relationship-browser-loading">Loading relationships...</div>;
  }

  if (relationships.length === 0) {
    return (
      <div className="relationship-browser-empty">
        <p>No relationships found for this object.</p>
        <p className="hint">You can still select fields from the primary object.</p>
      </div>
    );
  }

  return (
    <div className="relationship-browser">
      <div className="relationship-browser-header">
        <h3>Related Objects</h3>
        <div className="relationship-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search related fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="relationship-tree">
        {renderRelationshipTree(relationships)}
      </div>
    </div>
  );
};

export default RelationshipBrowser;

