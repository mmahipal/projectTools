import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import '../../../styles/ContributorTimeStatus/BottleneckAnalysis.css';

const BottleneckAnalysis = ({ data, error }) => {
  if (error) {
    return (
      <div className="bottleneck-error">
        <p>Error loading bottleneck data: {error}</p>
      </div>
    );
  }
  
  // Check if we have any data at all
  if (!data) {
    return (
      <div className="bottleneck-empty">
        <p>No bottleneck data available</p>
      </div>
    );
  }
  
  const topBottlenecks = (data.topBottlenecks || []).slice(0, 10);
  const maxDays = topBottlenecks.length > 0 ? Math.max(...topBottlenecks.map(b => b.averageDays), 1) : 1;
  
  // Check if we have heatmap data even if no bottlenecks
  const hasHeatmapData = data.heatmapData && Object.keys(data.heatmapData).length > 0;
  
  // If no bottlenecks and no heatmap, show empty message
  if (topBottlenecks.length === 0 && !hasHeatmapData) {
    return (
      <div className="bottleneck-empty">
        <p>No bottleneck data available</p>
      </div>
    );
  }
  
  return (
    <div className="bottleneck-analysis">
      <div className="bottleneck-header">
        <div className="header-icon">
          <AlertTriangle size={24} color="#ef4444" />
        </div>
        <div>
          <h3 className="bottleneck-title">Bottleneck Analysis</h3>
          <p className="bottleneck-subtitle">Statuses where contributors spend the most time</p>
        </div>
      </div>
      
      <div className="bottleneck-content">
        {topBottlenecks.length > 0 && (
          <div className="bottleneck-table-container">
            <table className="bottleneck-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Status</th>
                  <th>Average Days</th>
                  <th>Contributors Affected</th>
                  <th>% of Total Time</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                {topBottlenecks.map((bottleneck, index) => (
                  <tr key={bottleneck.status}>
                    <td className="rank-cell">#{index + 1}</td>
                    <td className="status-cell">
                      <strong>{bottleneck.status}</strong>
                    </td>
                    <td className="days-cell">
                      <TrendingUp size={16} color="#f59e0b" />
                      {bottleneck.averageDays.toFixed(1)} days
                    </td>
                    <td>{bottleneck.contributorsAffected.toLocaleString()}</td>
                    <td>{bottleneck.percentOfTotalTime.toFixed(1)}%</td>
                    <td>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${(bottleneck.averageDays / maxDays) * 100}%`,
                            background: '#ef4444'
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data.heatmapData && Object.keys(data.heatmapData).length > 0 && (
          <div className="heatmap-section">
            <h4 className="heatmap-title">Time by Project/Objective (Heatmap)</h4>
            <div className="heatmap-container">
              <div className="heatmap-grid">
                {Object.keys(data.heatmapData)
                  .filter(key => key.trim() !== '')
                  .slice(0, 20)
                  .map(key => (
                  <div key={key} className="heatmap-item">
                    <div className="heatmap-label">{key}</div>
                    <div className="heatmap-bars">
                      {Object.keys(data.heatmapData[key]).map(status => {
                        const value = data.heatmapData[key][status];
                        const maxValue = Math.max(...Object.values(data.heatmapData[key]), 1);
                        return (
                          <div key={status} className="heatmap-bar-item">
                            <div className="heatmap-bar-label">{status}</div>
                            <div className="heatmap-bar-container">
                              <div 
                                className="heatmap-bar"
                                style={{ 
                                  width: `${(value / maxValue) * 100}%`,
                                  background: value > 10 ? '#ef4444' : value > 5 ? '#f59e0b' : '#10b981'
                                }}
                                title={`${status}: ${value.toFixed(1)} days`}
                              />
                              <span className="heatmap-bar-value">{value.toFixed(1)}d</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottleneckAnalysis;

