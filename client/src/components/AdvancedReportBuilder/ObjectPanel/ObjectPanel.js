import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Package, Link2, FileText } from 'lucide-react';
import ObjectBrowser from './ObjectBrowser';
import RelationshipTree from './RelationshipTree';
import SubqueryList from './SubqueryList';
import '../../../styles/ObjectPanel.css';

const ObjectPanel = ({
  selectedObject, // Legacy: single selected object
  selectedObjects = [], // New: array of selected objects
  onObjectSelect, // Legacy: single object selection
  onObjectAdd, // New: add object to multi-object report
  onObjectRemove, // New: remove object from multi-object report
  onFieldDrag,
  onRelationshipDrag,
  onSubqueryDrag
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    objects: true,
    relationships: false,
    subqueries: false
  });
  const [currentObjectForFields, setCurrentObjectForFields] = useState(selectedObject || (selectedObjects.length > 0 ? selectedObjects[0] : ''));

  // Update currentObjectForFields when selectedObjects changes
  useEffect(() => {
    if (selectedObjects.length > 0) {
      // If current object is not in the list, set to first object
      if (!selectedObjects.includes(currentObjectForFields)) {
        setCurrentObjectForFields(selectedObjects[0]);
      }
    } else if (selectedObject) {
      setCurrentObjectForFields(selectedObject);
    }
  }, [selectedObjects, selectedObject]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Use multi-object array if available, otherwise fall back to single object
  const activeObjects = selectedObjects.length > 0 ? selectedObjects : (selectedObject ? [selectedObject] : []);

  return (
    <div className="object-panel">
      <div className="object-panel-header">
        <h3>Objects & Fields</h3>
        <div className="object-panel-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="object-panel-content">
        {/* Objects Section - Multi-Object Support */}
        <div className="panel-section">
          <button
            className="panel-section-header"
            onClick={() => toggleSection('objects')}
          >
            {expandedSections.objects ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Package size={16} />
            <span>Data Sources</span>
            {activeObjects.length > 0 && (
              <span className="object-count-badge">{activeObjects.length}</span>
            )}
          </button>
          {expandedSections.objects && (
            <>
              <ObjectBrowser
                selectedObject={currentObjectForFields}
                selectedObjects={activeObjects}
                onObjectSelect={(objectType) => {
                  if (onObjectAdd && objectType) {
                    // In multi-object mode, add the object
                    onObjectAdd(objectType);
                    // Set it as current object to view its fields
                    setCurrentObjectForFields(objectType);
                  } else if (onObjectSelect) {
                    // Legacy single-object mode
                    onObjectSelect(objectType);
                    if (objectType) {
                      setCurrentObjectForFields(objectType);
                    }
                  }
                }}
                onObjectAdd={onObjectAdd}
                onObjectRemove={onObjectRemove}
                onFieldDrag={(field) => {
                  // Pass the current object type so fields go to the correct object
                  onFieldDrag(field, currentObjectForFields);
                }}
                searchTerm={searchTerm}
                multiObjectMode={onObjectAdd !== undefined || (selectedObjects && selectedObjects.length > 0)}
              />
              {/* Object selector for viewing fields - show when multiple objects are selected */}
              {activeObjects.length > 1 && (
                <div className="object-field-viewer">
                  <label className="field-viewer-label">View fields for:</label>
                  <select
                    value={currentObjectForFields || ''}
                    onChange={(e) => setCurrentObjectForFields(e.target.value)}
                    className="field-viewer-select"
                  >
                    <option value="">Select object to view fields</option>
                    {activeObjects.map(objType => (
                      <option key={objType} value={objType}>
                        {objType}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {activeObjects.length > 0 && (
                <div className="selected-objects-list">
                  <div className="selected-objects-header">Selected Objects:</div>
                  {activeObjects.map(objType => (
                    <div 
                      key={objType} 
                      className={`selected-object-item ${currentObjectForFields === objType ? 'active' : ''}`}
                      onClick={() => setCurrentObjectForFields(objType)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{objType}</span>
                      {onObjectRemove && (
                        <button
                          className="remove-object-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onObjectRemove(objType);
                            if (currentObjectForFields === objType && activeObjects.length > 1) {
                              setCurrentObjectForFields(activeObjects.find(o => o !== objType) || '');
                            } else if (currentObjectForFields === objType) {
                              setCurrentObjectForFields('');
                            }
                          }}
                          title="Remove object"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Relationships Section - Show for current object */}
        {currentObjectForFields && (
          <div className="panel-section">
            <button
              className="panel-section-header"
              onClick={() => toggleSection('relationships')}
            >
              {expandedSections.relationships ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Link2 size={16} />
              <span>Related Objects ({currentObjectForFields})</span>
            </button>
            {expandedSections.relationships && (
              <RelationshipTree
                objectType={currentObjectForFields}
                onRelationshipDrag={onRelationshipDrag}
                searchTerm={searchTerm}
              />
            )}
          </div>
        )}

        {/* Subqueries Section - Show for current object */}
        {currentObjectForFields && (
          <div className="panel-section">
            <button
              className="panel-section-header"
              onClick={() => toggleSection('subqueries')}
            >
              {expandedSections.subqueries ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <FileText size={16} />
              <span>Child Records ({currentObjectForFields})</span>
            </button>
            {expandedSections.subqueries && (
              <SubqueryList
                objectType={currentObjectForFields}
                onSubqueryDrag={onSubqueryDrag}
                searchTerm={searchTerm}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectPanel;

