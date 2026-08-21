import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import './SystemStatus.css';

const SystemStatus = ({ status, loading }) => {
  if (loading) {
    return (
      <div className="system-status-card">
        <h3 className="card-title">System Status</h3>
        <div className="status-loading">
          <Loader2 size={16} className="spinner" />
          <span>Checking status...</span>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const getStatusIcon = (statusValue) => {
    switch (statusValue) {
      case 'connected':
      case 'healthy':
      case 'operational':
      case 'running':
      case 'configured':
        return <CheckCircle2 size={16} className="status-icon status-ok" />;
      case 'not_configured':
      case 'not_run':
        return <AlertCircle size={16} className="status-icon status-warning" />;
      default:
        return <XCircle size={16} className="status-icon status-error" />;
    }
  };

  const getStatusText = (statusValue) => {
    switch (statusValue) {
      case 'connected':
        return 'Connected';
      case 'healthy':
        return 'Healthy';
      case 'operational':
        return 'Operational';
      case 'running':
        return 'Running';
      case 'configured':
        return 'Configured';
      case 'not_configured':
        return 'Not Configured';
      case 'not_run':
        return 'Not Run';
      default:
        return 'Error';
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  const statusItems = [
    {
      label: 'Salesforce API',
      status: status.salesforce?.status || 'unknown',
      details: status.salesforce?.responseTime 
        ? `Response: ${status.salesforce.responseTime}ms`
        : null
    },
    {
      label: 'Backend API',
      status: status.backend?.status || 'unknown',
      details: status.backend?.uptime 
        ? `Uptime: ${formatUptime(status.backend.uptime)}`
        : null
    },
    {
      label: 'Queue Scheduler',
      status: status.queueScheduler?.status || 'unknown',
      details: status.queueScheduler?.lastRun 
        ? `Last run: ${formatTime(status.queueScheduler.lastRun)}`
        : null
    },
    {
      label: 'Database',
      status: status.database?.status || 'unknown',
      details: status.database?.lastBackup 
        ? `Last backup: ${formatTime(status.database.lastBackup)}`
        : 'File-based storage'
    }
  ];

  return (
    <div className="system-status-card">
      <h3 className="card-title">System Status</h3>
      <div className="status-list">
        {statusItems.map((item, index) => (
          <div key={index} className="status-item">
            <div className="status-header">
              {getStatusIcon(item.status)}
              <span className="status-label">{item.label}</span>
            </div>
            <div className="status-details">
              <span className={`status-text status-${item.status}`}>
                {getStatusText(item.status)}
              </span>
              {item.details && (
                <span className="status-meta">{item.details}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatus;

