import React, { useState, useEffect } from 'react';
import { Layout, Plus, BarChart3, TrendingUp, Users, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import WidgetContainer from './WidgetContainer';
import WidgetConfigModal from './WidgetConfigModal';

const DashboardWidgetsManager = ({ stats = [], analytics = {} }) => {
  const [widgets, setWidgets] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [configuringWidget, setConfiguringWidget] = useState(null);

  // Debug: Log when data changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
  }, [stats, analytics]);

  useEffect(() => {
    loadWidgets();
  }, []);

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddMenu && !event.target.closest('[data-add-menu]')) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  const loadWidgets = () => {
    try {
      const saved = localStorage.getItem('dashboard_widgets');
      if (saved) {
        const parsedWidgets = JSON.parse(saved);
        // Ensure all widgets have required default fields
        const widgetsWithDefaults = parsedWidgets.map(w => ({
          dataSource: w.type === 'chart' || w.type === 'table' ? 'publishes' : 'dashboard',
          chartType: 'bar',
          chartDataField: w.type === 'chart' || w.type === 'table' ? (w.chartDataField || 'byObjectType') : '',
          metricField: 'totalPublishes',
          color: '#08979C',
          showLegend: true,
          showGrid: true,
          ...w
        }));
        setWidgets(widgetsWithDefaults);
      } else {
        // Default widgets
        const defaultWidget = {
          id: 'widget_1',
          type: 'summary',
          title: 'Total Publishes',
          dataSource: 'dashboard',
          metricField: 'totalPublishes',
          color: '#08979C'
        };
        setWidgets([defaultWidget]);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    }
  };

  const saveWidgets = (newWidgets) => {
    try {
      // Don't save React components to localStorage - they can't be serialized
      const widgetsToSave = newWidgets.map(w => {
        const { component, ...widgetData } = w;
        return widgetData;
      });
      localStorage.setItem('dashboard_widgets', JSON.stringify(widgetsToSave));
      // Update state with widgets (without components - they'll be generated on render)
      setWidgets(widgetsToSave);
    } catch (error) {
      console.error('Error saving widgets:', error);
    }
  };

  const addWidget = (widgetType) => {
    // Set default configuration based on widget type
    const defaultConfig = {
      id: `widget_${Date.now()}`,
      type: widgetType,
      title: getWidgetTitle(widgetType),
      dataSource: widgetType === 'chart' || widgetType === 'table' ? 'publishes' : 'dashboard',
      chartType: 'bar',
      chartDataField: widgetType === 'chart' || widgetType === 'table' ? 'byObjectType' : '',
      metricField: 'totalPublishes',
      color: '#08979C',
      showLegend: true,
      showGrid: true
    };
    const newWidgets = [...widgets, defaultConfig];
    saveWidgets(newWidgets);
    setShowAddMenu(false);
    // Open configuration modal for new widget
    setConfiguringWidget(defaultConfig);
  };

  const handleConfigure = (widget) => {
    setConfiguringWidget(widget);
  };

  const handleSaveConfig = (widgetId, config) => {
    const updatedWidgets = widgets.map(w => {
      if (w.id === widgetId) {
        return {
          ...w,
          ...config,
          updatedAt: Date.now() // Add timestamp to force re-render
        };
      }
      return w;
    });
    saveWidgets(updatedWidgets);
    // Close modal after saving
    setConfiguringWidget(null);
  };

  const removeWidget = (widgetId) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    saveWidgets(newWidgets);
  };

  const getWidgetTitle = (type) => {
    const titles = {
      summary: 'Summary',
      chart: 'Chart',
      table: 'Table',
      metric: 'Metric',
      list: 'List'
    };
    return titles[type] || 'Widget';
  };

  const getWidgetData = (widget) => {
    const dataSource = widget.dataSource || 'dashboard';
    
    switch (dataSource) {
      case 'dashboard':
        // Return dashboard stats
        const dashboardData = {
          totalPublishes: stats.find(s => s.label === 'Total Publishes')?.value || '0',
          todayPublishes: stats.find(s => s.label === 'Today')?.value || '0',
          recentPublishes: stats.find(s => s.label === 'Last 7 Days')?.value || '0',
          successRate: stats.find(s => s.label === 'Success Rate')?.value || '0%'
        };
        if (process.env.NODE_ENV === 'development') {
        }
        return dashboardData;
      case 'publishes':
        // Return publishing activity data
        const publishesData = {
          byObjectType: analytics.publishesByObjectType || {},
          byOperation: analytics.publishesByOperation || {},
          activityByDay: analytics.activityByDay || []
        };
        if (process.env.NODE_ENV === 'development') {
        }
        return publishesData;
      case 'projects':
        // Return project data
        return {
          byUser: analytics.projectsByUser || {},
          byDate: analytics.projectsByDate || {}
        };
      default:
        return {};
    }
  };

  const getWidgetComponent = (widget) => {
    const type = widget.type || 'summary';
    const color = widget.color || '#08979C';
    const data = getWidgetData(widget);
    
    switch (type) {
      case 'summary':
        // Display a summary metric based on data source
        let summaryValue = '0';
        let summaryLabel = 'Total Items';
        
        if (widget.dataSource === 'dashboard') {
          const metric = widget.metricField || 'totalPublishes';
          summaryValue = data[metric] || '0';
          summaryLabel = widget.metricLabel || 'Total Publishes';
        } else if (widget.dataSource === 'publishes') {
          const total = Object.values(data.byObjectType || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
          summaryValue = total.toString();
          summaryLabel = widget.metricLabel || 'Total Publishes';
        }
        
        return (
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: color }}>{summaryValue}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{summaryLabel}</div>
          </div>
        );
        
      case 'chart':
        const chartType = widget.chartType || 'bar';
        let chartData = [];
        let chartConfig = {};
        
        // Determine chartDataField if not set (use default based on dataSource)
        const chartDataField = widget.chartDataField || (widget.dataSource === 'publishes' ? 'byObjectType' : '');
        
        if (widget.dataSource === 'publishes') {
          if (chartDataField === 'byObjectType') {
            chartData = Object.entries(data.byObjectType || {}).map(([name, value]) => ({
              name: name.replace(/_/g, ' ').replace(/__c/g, '').replace(/\b\w/g, l => l.toUpperCase()),
              value: Number(value) || 0
            })).filter(item => item.value > 0);
          } else if (chartDataField === 'byOperation') {
            chartData = Object.entries(data.byOperation || {}).map(([name, value]) => ({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              value: Number(value) || 0
            })).filter(item => item.value > 0);
          } else if (chartDataField === 'activityByDay') {
            chartData = (data.activityByDay || []).map(item => ({
              date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              creates: item.creates || 0,
              updates: item.updates || 0,
              total: item.total || 0
            }));
          }
        } else if (widget.dataSource === 'dashboard') {
          // For dashboard data source, show stats as chart
          chartData = [
            { name: 'Total', value: Number(data.totalPublishes) || 0 },
            { name: 'Today', value: Number(data.todayPublishes) || 0 },
            { name: 'Last 7 Days', value: Number(data.recentPublishes) || 0 }
          ].filter(item => item.value > 0);
        }
        
        if (chartData.length === 0) {
          return (
            <div style={{ padding: '12px', textAlign: 'center', color: '#666', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <BarChart3 size={32} style={{ opacity: 0.3, color: color, margin: '0 auto' }} />
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                {widget.dataSource === 'publishes' && !chartDataField 
                  ? 'Please configure: Select a Data Field (By Object Type, By Operation, or Activity Over Time)'
                  : 'No data available. Data may not be loaded yet.'}
              </div>
            </div>
          );
        }
        
        const COLORS = [color, '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
        
        if (chartType === 'pie') {
          return (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                {widget.showLegend !== false && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          );
        } else if (chartType === 'line') {
          return (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                {widget.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {widget.showLegend !== false && <Legend />}
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          );
        } else if (chartType === 'area') {
          return (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                {widget.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {widget.showLegend !== false && <Legend />}
                <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          );
        } else {
          // Bar chart (default)
          return (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                {widget.showGrid !== false && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {widget.showLegend !== false && <Legend />}
                <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        }
        
      case 'table':
        let tableData = [];
        const tableDataField = widget.chartDataField || (widget.dataSource === 'publishes' ? 'byObjectType' : '');
        
        if (widget.dataSource === 'publishes') {
          if (tableDataField === 'byObjectType') {
            tableData = Object.entries(data.byObjectType || {}).map(([name, value]) => ({
              name: name.replace(/_/g, ' ').replace(/__c/g, '').replace(/\b\w/g, l => l.toUpperCase()),
              value: Number(value) || 0
            })).filter(item => item.value > 0);
          } else if (tableDataField === 'byOperation') {
            tableData = Object.entries(data.byOperation || {}).map(([name, value]) => ({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              value: Number(value) || 0
            })).filter(item => item.value > 0);
          }
        } else if (widget.dataSource === 'dashboard') {
          // For dashboard, show stats as table
          tableData = [
            { name: 'Total Publishes', value: Number(data.totalPublishes) || 0 },
            { name: 'Today', value: Number(data.todayPublishes) || 0 },
            { name: 'Last 7 Days', value: Number(data.recentPublishes) || 0 },
            { name: 'Success Rate', value: data.successRate || '0%' }
          ].filter(item => {
            if (typeof item.value === 'string' && item.value.includes('%')) return true;
            return Number(item.value) > 0;
          });
        }
        
        if (tableData.length === 0) {
          return (
            <div style={{ padding: '12px', textAlign: 'center', color: '#666', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <FileText size={32} style={{ opacity: 0.3, color: color, margin: '0 auto' }} />
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                {widget.dataSource === 'publishes' && !tableDataField 
                  ? 'Please configure: Select a Data Field'
                  : 'No data available. Data may not be loaded yet.'}
              </div>
            </div>
          );
        }
        
        return (
          <div style={{ padding: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600', color: '#002329' }}>Name</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '600', color: '#002329' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, 5).map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', color: '#002329' }}>{row.name}</td>
                    <td style={{ textAlign: 'right', padding: '8px', color: color, fontWeight: '600' }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'metric':
        let metricValue = widget.metricValue || '0';
        let metricLabel = widget.metricLabel || 'Metric';
        
        // If data source is dashboard, try to get real value
        if (widget.dataSource === 'dashboard' && widget.metricField) {
          metricValue = data[widget.metricField] || metricValue;
        }
        
        return (
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: color }}>
              {metricValue}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {metricLabel}
            </div>
          </div>
        );
        
      default:
        return <div style={{ padding: '12px', color: '#666' }}>Widget content</div>;
    }
  };

  const widgetTypes = [
    { type: 'summary', label: 'Summary', icon: BarChart3 },
    { type: 'chart', label: 'Chart', icon: TrendingUp },
    { type: 'table', label: 'Table', icon: FileText },
    { type: 'metric', label: 'Metric', icon: Users }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layout size={24} color="#0176d3" />
          Dashboard Widgets
        </h2>
        <div style={{ position: 'relative' }} data-add-menu>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              padding: '8px 16px',
              background: '#08979C',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#067a7f'}
            onMouseLeave={(e) => e.target.style.background = '#08979C'}
          >
            <Plus size={16} />
            Add Widget
          </button>

          {showAddMenu && (
            <div
              data-add-menu
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '8px',
                minWidth: '200px',
                zIndex: 1000
              }}
            >
              {widgetTypes.map(wt => {
                const Icon = wt.icon;
                return (
                  <div
                    key={wt.type}
                    onClick={() => addWidget(wt.type)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <Icon size={16} color="#0176d3" />
                    {wt.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {widgets.map(widget => {
          // Ensure widget has required default fields
          const widgetWithDefaults = {
            dataSource: 'dashboard',
            chartType: 'bar',
            chartDataField: '',
            metricField: 'totalPublishes',
            color: '#08979C',
            showLegend: true,
            showGrid: true,
            ...widget
          };
          
          // Generate component dynamically based on widget config
          const widgetWithComponent = {
            ...widgetWithDefaults,
            component: getWidgetComponent(widgetWithDefaults)
          };
          return (
            <WidgetContainer
              key={`${widget.id}-${widget.updatedAt || 0}`}
              widget={widgetWithComponent}
              onRemove={removeWidget}
              onConfigure={handleConfigure}
            />
          );
        })}
      </div>

      {widgets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <Layout size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>No widgets. Add widgets to customize your dashboard.</p>
        </div>
      )}

      {/* Configuration Modal */}
      <WidgetConfigModal
        show={!!configuringWidget}
        onClose={() => setConfiguringWidget(null)}
        widget={configuringWidget}
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default DashboardWidgetsManager;

