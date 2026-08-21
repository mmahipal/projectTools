import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const WidgetConfigModal = ({ show, onClose, widget, onSave }) => {
  const [config, setConfig] = useState({
    title: '',
    type: '',
    dataSource: 'dashboard',
    chartType: 'bar',
    chartDataField: '',
    metricField: 'totalPublishes',
    metricValue: '',
    metricLabel: '',
    showLegend: true,
    showGrid: true,
    color: '#08979C'
  });

  useEffect(() => {
    if (widget) {
      setConfig({
        title: widget.title || '',
        type: widget.type || '',
        dataSource: widget.dataSource || 'dashboard',
        chartType: widget.chartType || 'bar',
        chartDataField: widget.chartDataField || '',
        metricField: widget.metricField || 'totalPublishes',
        metricValue: widget.metricValue || '',
        metricLabel: widget.metricLabel || '',
        showLegend: widget.showLegend !== undefined ? widget.showLegend : true,
        showGrid: widget.showGrid !== undefined ? widget.showGrid : true,
        color: widget.color || '#08979C'
      });
    }
  }, [widget]);

  if (!show || !widget) return null;

  const handleSave = () => {
    onSave(widget.id, config);
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '12px'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#002329' }}>
            Configure Widget
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.04)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        <div className="modal-body" style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Help Text */}
          <div style={{ 
            padding: '12px', 
            background: '#f0f9ff', 
            borderRadius: '6px', 
            marginBottom: '20px',
            fontSize: '13px',
            color: '#002329',
            lineHeight: '1.5'
          }}>
            <strong>How to use widgets:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li><strong>Summary:</strong> Display a single metric value (e.g., Total Publishes)</li>
              <li><strong>Chart:</strong> Visualize data as bar, line, area, or pie charts</li>
              <li><strong>Table:</strong> Display data in a tabular format</li>
              <li><strong>Metric:</strong> Show a key performance indicator with value and label</li>
            </ul>
            <div style={{ marginTop: '8px' }}>
              <strong>Data Sources:</strong> Choose "Dashboard Stats" for summary metrics, or "Publishing Activity" for detailed analytics.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Widget Title */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#002329',
                marginBottom: '8px'
              }}>
                Widget Title *
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Enter widget title"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Widget Type */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#002329',
                marginBottom: '8px'
              }}>
                Widget Type
              </label>
              <select
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: '#fff'
                }}
              >
                <option value="summary">Summary</option>
                <option value="chart">Chart</option>
                <option value="table">Table</option>
                <option value="metric">Metric</option>
                <option value="list">List</option>
              </select>
            </div>

            {/* Data Source */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#002329',
                marginBottom: '8px'
              }}>
                Data Source
              </label>
              <select
                value={config.dataSource}
                onChange={(e) => setConfig({ ...config, dataSource: e.target.value, chartDataField: '', metricField: '' })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: '#fff'
                }}
              >
                <option value="dashboard">Dashboard Stats</option>
                <option value="publishes">Publishing Activity</option>
                <option value="projects">Projects</option>
              </select>
            </div>

            {/* Metric Field (for summary/metric widgets with dashboard data source) */}
            {(config.type === 'summary' || config.type === 'metric') && config.dataSource === 'dashboard' && (
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#002329',
                  marginBottom: '8px'
                }}>
                  Metric Field
                </label>
                <select
                  value={config.metricField || 'totalPublishes'}
                  onChange={(e) => {
                    const fieldLabels = {
                      totalPublishes: 'Total Publishes',
                      todayPublishes: 'Today\'s Publishes',
                      recentPublishes: 'Last 7 Days',
                      successRate: 'Success Rate'
                    };
                    setConfig({ 
                      ...config, 
                      metricField: e.target.value,
                      metricLabel: config.metricLabel || fieldLabels[e.target.value] || 'Metric'
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="totalPublishes">Total Publishes</option>
                  <option value="todayPublishes">Today's Publishes</option>
                  <option value="recentPublishes">Last 7 Days</option>
                  <option value="successRate">Success Rate</option>
                </select>
              </div>
            )}

            {/* Chart Data Field (for chart/table widgets with publishes data source) */}
            {(config.type === 'chart' || config.type === 'table') && config.dataSource === 'publishes' && (
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#002329',
                  marginBottom: '8px'
                }}>
                  Data Field
                </label>
                <select
                  value={config.chartDataField || ''}
                  onChange={(e) => setConfig({ ...config, chartDataField: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="byObjectType">By Object Type</option>
                  <option value="byOperation">By Operation (Create/Update)</option>
                  <option value="activityByDay">Activity Over Time</option>
                </select>
              </div>
            )}

            {/* Chart Type (for chart widgets) */}
            {config.type === 'chart' && (
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#002329',
                  marginBottom: '8px'
                }}>
                  Chart Type
                </label>
                <select
                  value={config.chartType}
                  onChange={(e) => setConfig({ ...config, chartType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            )}

            {/* Metric Label (for metric widgets - only show if not using dashboard data source) */}
            {config.type === 'metric' && config.dataSource !== 'dashboard' && (
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#002329',
                  marginBottom: '8px'
                }}>
                  Metric Label
                </label>
                <input
                  type="text"
                  value={config.metricLabel}
                  onChange={(e) => setConfig({ ...config, metricLabel: e.target.value })}
                  placeholder="e.g., Total Items, Success Rate"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Summary Label (for summary widgets) */}
            {config.type === 'summary' && config.dataSource !== 'dashboard' && (
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#002329',
                  marginBottom: '8px'
                }}>
                  Summary Label
                </label>
                <input
                  type="text"
                  value={config.metricLabel}
                  onChange={(e) => setConfig({ ...config, metricLabel: e.target.value })}
                  placeholder="e.g., Total Publishes, Total Items"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Color Picker */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#002329',
                marginBottom: '8px'
              }}>
                Widget Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  placeholder="#08979C"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Chart Options */}
            {config.type === 'chart' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="showLegend"
                    checked={config.showLegend}
                    onChange={(e) => setConfig({ ...config, showLegend: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="showLegend" style={{ fontSize: '14px', color: '#002329', cursor: 'pointer' }}>
                    Show Legend
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="showGrid"
                    checked={config.showGrid}
                    onChange={(e) => setConfig({ ...config, showGrid: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="showGrid" style={{ fontSize: '14px', color: '#002329', cursor: 'pointer' }}>
                    Show Grid
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              color: '#002329',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!config.title.trim()}
            style={{
              padding: '10px 20px',
              background: config.title.trim() ? '#08979C' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: config.title.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (config.title.trim()) {
                e.target.style.background = '#067a7f';
              }
            }}
            onMouseLeave={(e) => {
              if (config.title.trim()) {
                e.target.style.background = '#08979C';
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;

