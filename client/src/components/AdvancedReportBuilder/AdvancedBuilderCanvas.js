import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import ObjectPanel from './ObjectPanel/ObjectPanel';
import QueryCanvas from './QueryCanvas/QueryCanvas';
import PreviewPanel from './PreviewPanel/PreviewPanel';
import { useQueryBuilder } from './hooks/useQueryBuilder';
import { usePreview } from './hooks/usePreview';
import '../../styles/AdvancedBuilderCanvas.css';
import InfoModal from './InfoModal';

const AdvancedBuilderCanvas = forwardRef(({ reportToLoad, onReportLoaded }, ref) => {
  const {
    reportConfig,
    updateConfig,
    loadReport,
    // Legacy single-object methods
    addField,
    removeField,
    addRelationship,
    removeRelationship,
    addSubquery,
    removeSubquery,
    addFilter,
    removeFilter,
    updateSort,
    updateGroupBy,
    // New multi-object methods
    addObject,
    removeObject,
    addFieldToObject,
    removeFieldFromObject,
    reorderFieldsInObject,
    addRelationshipToObject,
    removeRelationshipFromObject,
    addSubqueryToObject,
    removeSubqueryFromObject,
    addFilterToObject,
    removeFilterFromObject
  } = useQueryBuilder();

  const {
    previewData,
    loading,
    error,
    generatePreview
  } = usePreview();

  const [showPreview, setShowPreview] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  // Load report when reportToLoad prop changes
  useEffect(() => {
    if (reportToLoad) {
      loadReport(reportToLoad);
      if (onReportLoaded) {
        onReportLoaded();
      }
    }
  }, [reportToLoad, loadReport, onReportLoaded]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      const canvasLayout = document.querySelector('.canvas-layout');
      if (!canvasLayout) return;
      
      const rect = canvasLayout.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      
      // Constrain width between min and max
      if (newWidth >= 200 && newWidth <= 600) {
        setLeftPanelWidth(newWidth);
      } else if (newWidth < 200) {
        setLeftPanelWidth(200);
      } else if (newWidth > 600) {
        setLeftPanelWidth(600);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
  }, [isResizing]);

  // Expose reportConfig, loadReport, and showPreview via ref
  useImperativeHandle(ref, () => ({
    getReportConfig: () => reportConfig,
    loadReport: (report) => loadReport(report),
    showPreview: () => {
      // Generate preview if not already loaded
      if (!previewData || previewData.length === 0) {
        generatePreview(reportConfig).then(() => {
          setShowPreview(true);
        }).catch(err => {
          console.error('Preview generation error:', err);
        });
      } else {
        setShowPreview(true);
      }
    }
  }));

  // Auto-preview when config changes (debounced)
  useEffect(() => {
    if (!reportConfig) {
      return;
    }

    // Check if we have objects with fields (multi-object mode) or legacy single-object mode
    const isMultiObjectMode = reportConfig.objects && reportConfig.objects.length > 0;
    
    let shouldGeneratePreview = false;
    
    if (isMultiObjectMode) {
      // Multi-object mode: only preview if at least one object has fields
      shouldGeneratePreview = reportConfig.objects.some(obj => 
        obj && obj.objectType && obj.fields && obj.fields.length > 0
      );
    } else {
      // Legacy single-object mode: only preview if objectType and fields exist
      shouldGeneratePreview = reportConfig.objectType && 
                               reportConfig.fields && 
                               Array.isArray(reportConfig.fields) &&
                               reportConfig.fields.length > 0;
    }
    
    if (shouldGeneratePreview) {
      const timer = setTimeout(() => {
        generatePreview(reportConfig).catch(err => {
          // Silently handle errors - toast already shown in usePreview
          console.error('Preview generation error:', err);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
    // Don't generate preview if no valid data - usePreview hook will handle clearing
  }, [reportConfig, generatePreview]);

  return (
    <div className="advanced-builder-canvas">
      <div className="canvas-layout">
        {/* Left Panel - Object Browser */}
        <div 
          className="canvas-left-panel"
          style={{ width: `${leftPanelWidth}px`, minWidth: `${leftPanelWidth}px` }}
        >
          <ObjectPanel
            selectedObject={reportConfig.objectType}
            selectedObjects={reportConfig.objects?.map(obj => obj.objectType) || []}
            onObjectSelect={(objectType) => {
              // Legacy: single object mode
              updateConfig({ objectType });
            }}
            onObjectAdd={(objectType) => {
              addObject(objectType);
            }}
            onObjectRemove={(objectType) => {
              removeObject(objectType);
            }}
            onFieldDrag={(field, sourceObjectType) => {
              // In multi-object mode, add to the object that matches the source
              // The sourceObjectType is passed from ObjectBrowser when dragging
              if (reportConfig.objects && reportConfig.objects.length > 0) {
                // If sourceObjectType is provided, add to that object
                // Otherwise, add to the first object (legacy behavior)
                const targetObject = sourceObjectType || reportConfig.objects[0].objectType;
                addFieldToObject(targetObject, field);
              } else {
                addField(field);
              }
            }}
            onRelationshipDrag={(relationship) => {
              if (reportConfig.objects && reportConfig.objects.length > 0) {
                addRelationshipToObject(reportConfig.objects[0].objectType, relationship);
              } else {
                addRelationship(relationship);
              }
            }}
            onSubqueryDrag={(subquery) => {
              if (reportConfig.objects && reportConfig.objects.length > 0) {
                addSubqueryToObject(reportConfig.objects[0].objectType, subquery);
              } else {
                addSubquery(subquery);
              }
            }}
          />
        </div>
        
        {/* Resize Handle */}
        <div
          className="resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />

        {/* Center Panel - Visual Query Builder */}
        <div className="canvas-center-panel">
          <QueryCanvas
            reportConfig={reportConfig}
            // Legacy single-object methods
            onFieldAdd={addField}
            onFieldRemove={removeField}
            onRelationshipAdd={addRelationship}
            onRelationshipRemove={removeRelationship}
            onSubqueryAdd={addSubquery}
            onSubqueryRemove={removeSubquery}
            onFilterAdd={addFilter}
            onFilterRemove={removeFilter}
            onSortUpdate={updateSort}
            onGroupByUpdate={updateGroupBy}
            onConfigUpdate={updateConfig}
            // New multi-object methods
            onObjectAdd={addObject}
            onObjectRemove={removeObject}
            onFieldAddToObject={addFieldToObject}
            onFieldRemoveFromObject={removeFieldFromObject}
            onFieldReorderInObject={reorderFieldsInObject}
            onRelationshipAddToObject={addRelationshipToObject}
            onRelationshipRemoveFromObject={removeRelationshipFromObject}
            onSubqueryAddToObject={addSubqueryToObject}
            onSubqueryRemoveFromObject={removeSubqueryFromObject}
            onFilterAddToObject={addFilterToObject}
            onFilterRemoveFromObject={removeFilterFromObject}
          />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <InfoModal
          show={showPreview}
          onClose={() => setShowPreview(false)}
          title="Report Preview"
          size="large"
        >
          <PreviewPanel
            data={previewData}
            loading={loading}
            error={error}
            expanded={true}
            onToggle={() => {}}
            reportName={reportConfig.name}
            reportConfig={reportConfig}
          />
        </InfoModal>
      )}
    </div>
  );
});

AdvancedBuilderCanvas.displayName = 'AdvancedBuilderCanvas';

export default AdvancedBuilderCanvas;

