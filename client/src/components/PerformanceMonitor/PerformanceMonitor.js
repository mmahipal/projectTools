/**
 * Performance Monitor Component
 * Displays performance metrics for API requests and cache statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Activity, Database, Clock } from 'lucide-react';
import { getCacheStats } from '../../utils/requestCache';
import { useVisibilityAwarePolling } from '../../hooks/useVisibilityAwarePolling';
import './PerformanceMonitor.css';

const PerformanceMonitor = ({ isOpen, onClose, performanceData }) => {
  const [cacheStats, setCacheStats] = useState(null);
  const [requestStats, setRequestStats] = useState(null);

  // Update stats function - memoized to prevent unnecessary re-renders
  const updateStats = useCallback(() => {
    setCacheStats(getCacheStats());
    if (performanceData && performanceData.requests) {
      const requests = performanceData.requests;
      if (requests.length > 0) {
        const durations = requests.map(r => r.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        // Group by widget
        const byWidget = {};
        requests.forEach(req => {
          if (!byWidget[req.widget]) {
            byWidget[req.widget] = [];
          }
          byWidget[req.widget].push(req.duration);
        });
        
        const widgetStats = Object.entries(byWidget).map(([widget, durations]) => ({
          widget,
          count: durations.length,
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations)
        })).sort((a, b) => b.avgDuration - a.avgDuration);

        setRequestStats({
          total: requests.length,
          avgDuration,
          minDuration,
          maxDuration,
          cacheHits: performanceData.cacheHits || 0,
          cacheMisses: performanceData.cacheMisses || 0,
          widgetStats
        });
      }
    }
  }, [performanceData]);

  // Initial update when component opens or data changes
  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen, updateStats]);

  // Set up visibility-aware polling - update every 10 seconds (increased from 2s)
  // Automatically pauses when tab is hidden and resumes when visible
  useVisibilityAwarePolling(
    updateStats,
    10000, // 10 seconds (increased from 2 seconds)
    {
      enabled: isOpen, // Only poll when monitor is open
      pauseWhenHidden: true
    }
  );

  if (!isOpen) return null;

  return (
    <div className="performance-monitor-overlay" onClick={onClose}>
      <div className="performance-monitor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="performance-monitor-header">
          <div className="performance-monitor-title">
            <Activity size={20} />
            <h3>Performance Monitor</h3>
          </div>
          <button className="performance-monitor-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="performance-monitor-content">
          {/* Cache Statistics */}
          {cacheStats && (
            <div className="performance-section">
              <div className="performance-section-header">
                <Database size={16} />
                <h4>Cache Statistics</h4>
              </div>
              <div className="performance-stats-grid">
                <div className="performance-stat">
                  <span className="stat-label">Total Entries</span>
                  <span className="stat-value">{cacheStats.totalEntries}</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Valid Entries</span>
                  <span className="stat-value">{cacheStats.validEntries}</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Expired Entries</span>
                  <span className="stat-value">{cacheStats.expiredEntries}</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Cache Size</span>
                  <span className="stat-value">{cacheStats.totalSize}</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Max Size</span>
                  <span className="stat-value">{cacheStats.maxSize}</span>
                </div>
              </div>
            </div>
          )}

          {/* Request Statistics */}
          {requestStats && (
            <div className="performance-section">
              <div className="performance-section-header">
                <Clock size={16} />
                <h4>Request Statistics</h4>
              </div>
              <div className="performance-stats-grid">
                <div className="performance-stat">
                  <span className="stat-label">Total Requests</span>
                  <span className="stat-value">{requestStats.total}</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Cache Hits</span>
                  <span className="stat-value success">{requestStats.cacheHits}</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Cache Misses</span>
                  <span className="stat-value warning">{requestStats.cacheMisses}</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Avg Duration</span>
                  <span className="stat-value">{requestStats.avgDuration.toFixed(0)}ms</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Min Duration</span>
                  <span className="stat-value">{requestStats.minDuration.toFixed(0)}ms</span>
                </div>
                <div className="performance-stat">
                  <span className="stat-label">Max Duration</span>
                  <span className="stat-value">{requestStats.maxDuration.toFixed(0)}ms</span>
                </div>
              </div>

              {/* Widget Performance Breakdown */}
              {requestStats.widgetStats && requestStats.widgetStats.length > 0 && (
                <div className="performance-widget-breakdown">
                  <h5>Widget Performance</h5>
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>Widget</th>
                        <th>Requests</th>
                        <th>Avg (ms)</th>
                        <th>Min (ms)</th>
                        <th>Max (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestStats.widgetStats.map((stat, idx) => (
                        <tr key={idx}>
                          <td>{stat.widget}</td>
                          <td>{stat.count}</td>
                          <td>{stat.avgDuration.toFixed(0)}</td>
                          <td>{stat.minDuration.toFixed(0)}</td>
                          <td>{stat.maxDuration.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;





