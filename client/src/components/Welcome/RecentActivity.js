import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, FileText, Users, DollarSign } from 'lucide-react';
import './RecentActivity.css';

const RecentActivity = ({ activities, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="recent-activity-card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        <div className="activity-loading">Loading activities...</div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="recent-activity-card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        <div className="activity-empty">No recent activity</div>
      </div>
    );
  }

  const getActivityIcon = (type, status) => {
    if (status === 'error') {
      return <XCircle size={16} className="activity-icon activity-error" />;
    }
    
    switch (type) {
      case 'create':
        return <FileText size={16} className="activity-icon activity-create" />;
      case 'update':
        return <Users size={16} className="activity-icon activity-update" />;
      default:
        return <CheckCircle2 size={16} className="activity-icon activity-success" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleActivityClick = (activity) => {
    if (activity.link) {
      navigate(activity.link);
    } else {
      navigate('/history');
    }
  };

  return (
    <div className="recent-activity-card">
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>
        <button 
          className="view-all-link"
          onClick={() => navigate('/history')}
        >
          View All →
        </button>
      </div>
      <div className="activity-list">
        {activities.slice(0, 5).map((activity, index) => (
          <div
            key={activity.id || index}
            className={`activity-item ${activity.link ? 'clickable' : ''}`}
            onClick={() => activity.link && handleActivityClick(activity)}
          >
            <div className="activity-icon-wrapper">
              {getActivityIcon(activity.type, activity.status)}
            </div>
            <div className="activity-content">
              <div className="activity-description">{activity.description}</div>
              <div className="activity-meta">
                <span className="activity-user">{activity.user}</span>
                <span className="activity-separator">•</span>
                <span className="activity-time">
                  <Clock size={12} />
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;

