import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, BarChart3, Search, Clock } from 'lucide-react';
import './RecentItems.css';

const RecentItems = () => {
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    // Load recent items from localStorage
    const stored = localStorage.getItem('recentItems');
    if (stored) {
      try {
        const items = JSON.parse(stored);
        // Filter out items older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const validItems = items.filter(item => {
          const itemTime = new Date(item.lastAccessed).getTime();
          return itemTime > thirtyDaysAgo;
        });
        setRecentItems(validItems.slice(0, 5));
      } catch (error) {
        console.error('Error parsing recent items:', error);
      }
    }
  }, []);

  if (recentItems.length === 0) {
    return null;
  }

  const getItemIcon = (type) => {
    switch (type) {
      case 'project':
        return <FileText size={16} className="item-icon" />;
      case 'dashboard':
        return <BarChart3 size={16} className="item-icon" />;
      case 'report':
        return <Search size={16} className="item-icon" />;
      default:
        return <FileText size={16} className="item-icon" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleItemClick = (item) => {
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="recent-items-card">
      <h3 className="card-title">Recent Items</h3>
      <div className="recent-items-list">
        {recentItems.map((item, index) => (
          <div
            key={item.id || index}
            className="recent-item"
            onClick={() => handleItemClick(item)}
          >
            <div className="item-icon-wrapper">
              {getItemIcon(item.type)}
            </div>
            <div className="item-content">
              <div className="item-title">{item.title}</div>
              <div className="item-meta">
                <Clock size={12} />
                <span>{formatTime(item.lastAccessed)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentItems;

