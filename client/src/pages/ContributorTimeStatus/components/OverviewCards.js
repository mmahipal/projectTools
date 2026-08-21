import React from 'react';
import { Clock, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import '../../../styles/ContributorTimeStatus/OverviewCards.css';

const OverviewCards = ({ data, error }) => {
  if (error) {
    return (
      <div className="overview-cards-error">
        <p>Error loading overview data: {error}</p>
      </div>
    );
  }
  
  if (!data || !data.averageTimeByStatus) {
    return null;
  }
  
  // Calculate key metrics
  const statuses = Object.keys(data.averageTimeByStatus);
  // Use activeContributorsCount if available, otherwise calculate from currentStatusCounts
  const activeContributors = data.activeContributorsCount || ((data.currentStatusCounts || {})['Active'] || 0) + ((data.currentStatusCounts || {})['Production'] || 0);
  const totalContributors = Object.values(data.currentStatusCounts || {}).reduce((sum, count) => sum + count, 0);
  
  // Find average time across all statuses
  const avgTimeAllStatuses = statuses.length > 0
    ? statuses.reduce((sum, status) => sum + (data.averageTimeByStatus[status]?.days || 0), 0) / statuses.length
    : 0;
  
  // Find bottleneck status (highest average time)
  const bottleneckStatus = statuses.reduce((max, status) => {
    const current = data.averageTimeByStatus[status]?.days || 0;
    const maxDays = data.averageTimeByStatus[max]?.days || 0;
    return current > maxDays ? status : max;
  }, statuses[0] || 'N/A');
  
  const bottleneckDays = data.averageTimeByStatus[bottleneckStatus]?.days || 0;
  
  // Find most common current status
  const currentStatusCounts = data.currentStatusCounts || {};
  const mostCommonStatus = Object.keys(currentStatusCounts).reduce((max, status) => {
    return currentStatusCounts[status] > (currentStatusCounts[max] || 0) ? status : max;
  }, Object.keys(currentStatusCounts)[0] || 'N/A');
  
  const mostCommonCount = currentStatusCounts[mostCommonStatus] || 0;
  
  return (
    <div className="overview-cards">
      <div className="overview-card">
        <div className="card-icon" style={{ background: '#e0f2fe' }}>
          <Clock size={24} color="#08979C" />
        </div>
        <div className="card-content">
          <h3 className="card-title">Average Time in Status</h3>
          <p className="card-value">{avgTimeAllStatuses.toFixed(1)} days</p>
          <p className="card-subtitle">Across all statuses</p>
        </div>
      </div>
      
      <div className="overview-card">
        <div className="card-icon" style={{ background: '#f0fdf4' }}>
          <Users size={24} color="#10b981" />
        </div>
        <div className="card-content">
          <h3 className="card-title">Active Contributors</h3>
          <p className="card-value">{activeContributors.toLocaleString()}</p>
          <p className="card-subtitle">Active or Production status</p>
        </div>
      </div>
      
      <div className="overview-card">
        <div className="card-icon" style={{ background: '#fef3c7' }}>
          <TrendingUp size={24} color="#f59e0b" />
        </div>
        <div className="card-content">
          <h3 className="card-title">Most Common Status</h3>
          <p className="card-value">{mostCommonStatus}</p>
          <p className="card-subtitle">{mostCommonCount.toLocaleString()} contributors</p>
        </div>
      </div>
      
      <div className="overview-card">
        <div className="card-icon" style={{ background: '#fee2e2' }}>
          <AlertTriangle size={24} color="#ef4444" />
        </div>
        <div className="card-content">
          <h3 className="card-title">Top Bottleneck</h3>
          <p className="card-value">{bottleneckStatus}</p>
          <p className="card-subtitle">{bottleneckDays.toFixed(1)} days average</p>
        </div>
      </div>
    </div>
  );
};

export default OverviewCards;

