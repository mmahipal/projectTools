import React from 'react';
import { FolderOpen, Users, DollarSign, BarChart3 } from 'lucide-react';
import './ApplicationOverview.css';

const ApplicationOverview = () => {
  const overviewItems = [
    {
      icon: FolderOpen,
      title: 'Project Management',
      description: 'Create and manage Salesforce projects with integrated workflows and team collaboration',
      color: '#08979C'
    },
    {
      icon: Users,
      title: 'Contributor Analytics',
      description: 'Track contributor performance, demographics, and engagement metrics across all projects',
      color: '#3b82f6'
    },
    {
      icon: DollarSign,
      title: 'Payment Management',
      description: 'Monitor and manage contributor payments with comprehensive reporting and analytics',
      color: '#10b981'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time dashboards, case analytics, and performance metrics for data-driven decisions',
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="application-overview-card">
      <h3 className="card-title">Application Overview</h3>
      <div className="overview-grid">
        {overviewItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="overview-item">
              <div className="overview-icon" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                <IconComponent size={24} />
              </div>
              <div className="overview-content">
                <h4 className="overview-title">{item.title}</h4>
                <p className="overview-description">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationOverview;

