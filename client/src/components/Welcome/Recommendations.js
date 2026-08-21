import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowRight } from 'lucide-react';
import './Recommendations.css';

const Recommendations = ({ recommendations, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="recommendations-card">
        <h3 className="card-title">Recommended for You</h3>
        <div className="recommendations-loading">Loading recommendations...</div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleRecommendationClick = (link) => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="recommendations-card">
      <div className="recommendations-header">
        <Lightbulb size={20} className="recommendations-icon" />
        <h3 className="card-title">Recommended for You</h3>
      </div>
      <div className="recommendations-list">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div
            key={rec.id || index}
            className="recommendation-item"
            onClick={() => handleRecommendationClick(rec.link)}
          >
            <div className="recommendation-content">
              <span className="recommendation-title">{rec.title}</span>
              <span className="recommendation-description">{rec.description}</span>
            </div>
            <ArrowRight size={16} className="recommendation-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;

