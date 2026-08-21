import React, { useState } from 'react';
import { BarChart3, Activity, TrendingUp, Users, Wrench } from 'lucide-react';
import WorkstreamHealthDashboard from './WorkstreamHealthDashboard';
import CompletionRatesAnalytics from './CompletionRatesAnalytics';
import ToolPerformanceMetrics from './ToolPerformanceMetrics';
import TrendAnalysis from './TrendAnalysis';
import ComparativeAnalysis from './ComparativeAnalysis';

const WorkStreamAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('health');

  const tabs = [
    { id: 'health', label: 'Health Dashboard', icon: Activity },
    { id: 'completion', label: 'Completion Rates', icon: BarChart3 },
    { id: 'performance', label: 'Tool Performance', icon: Wrench },
    { id: 'trends', label: 'Trend Analysis', icon: TrendingUp },
    { id: 'comparative', label: 'Comparative Analysis', icon: Users }
  ];

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #0176d3' : '2px solid transparent',
                color: activeTab === tab.id ? '#0176d3' : '#666',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '-2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'health' && <WorkstreamHealthDashboard />}
      {activeTab === 'completion' && <CompletionRatesAnalytics />}
      {activeTab === 'performance' && <ToolPerformanceMetrics />}
      {activeTab === 'trends' && <TrendAnalysis />}
      {activeTab === 'comparative' && <ComparativeAnalysis />}
    </div>
  );
};

export default WorkStreamAnalyticsDashboard;

