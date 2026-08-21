import React from 'react';
import { CheckCircle, Zap, Activity, Target, TrendingUp, TrendingDown } from 'lucide-react';
import './HeroSection.css';

const HeroSection = ({ stats, user, onMetricClick }) => {
  if (!stats) return null;

  const metrics = [
    {
      label: 'Total Publishes',
      value: stats.metrics?.totalPublishes || 0,
      icon: CheckCircle,
      color: '#08979C',
      trend: stats.trends?.totalPublishes,
      onClick: () => onMetricClick && onMetricClick('history')
    },
    {
      label: 'Today',
      value: stats.metrics?.todayPublishes || 0,
      icon: Zap,
      color: '#10b981',
      trend: stats.trends?.todayPublishes,
      onClick: () => onMetricClick && onMetricClick('history')
    },
    {
      label: 'Last 7 Days',
      value: stats.metrics?.recentPublishes || 0,
      icon: Activity,
      color: '#3b82f6',
      trend: stats.trends?.recentPublishes,
      onClick: () => onMetricClick && onMetricClick('history')
    },
    {
      label: 'Success Rate',
      value: `${stats.metrics?.successRate || 100}%`,
      icon: Target,
      color: '#8b5cf6',
      trend: stats.trends?.successRate,
      onClick: () => onMetricClick && onMetricClick('history')
    }
  ];

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="hero-section">
      <div className="hero-header">
        <div className="hero-greeting">
          <h1 className="hero-title">
            {getGreeting()}, {user?.name || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          {user?.lastLogin && (
            <p className="hero-subtitle">
              Last login: {formatTime(user.lastLogin)}
            </p>
          )}
        </div>
      </div>
      
      <div className="metrics-grid">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          const TrendIcon = metric.trend?.direction === 'up' ? TrendingUp : TrendingDown;
          const trendValue = metric.trend?.value || 0;
          
          return (
            <div
              key={index}
              className="metric-card"
              onClick={metric.onClick}
              style={{ '--metric-color': metric.color }}
            >
              <div className="metric-header">
                <div className="metric-icon" style={{ backgroundColor: `${metric.color}15`, color: metric.color }}>
                  <IconComponent size={24} />
                </div>
                {metric.trend && trendValue > 0 && (
                  <div className={`metric-trend trend-${metric.trend.direction}`}>
                    <TrendIcon size={14} />
                    <span>{trendValue}{metric.trend.direction === 'up' ? '%' : ''}</span>
                  </div>
                )}
              </div>
              <div className="metric-body">
                <div className="metric-value">{metric.value}</div>
                <div className="metric-label">{metric.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeroSection;

