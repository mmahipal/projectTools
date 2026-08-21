import React from 'react';
import { Search, X, ChevronRight } from 'lucide-react';

const HelpSidebar = ({ 
  documentationContent, 
  selectedTopic, 
  setSelectedTopic, 
  searchQuery, 
  setSearchQuery, 
  filteredTopics 
}) => {
  return (
    <div className="help-sidebar">
      <div className="help-sidebar-header">
        <h2>Documentation</h2>
        <div className="help-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="help-search-input"
          />
          {searchQuery && (
            <button
              className="help-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <nav className="help-nav">
        {filteredTopics.map((key) => {
          const topic = documentationContent[key];
          if (!topic) return null;
          const isActive = selectedTopic === key;
          return (
            <button
              key={key}
              className={`help-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedTopic(key)}
            >
              <span>{topic.title}</span>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
        {filteredTopics.length === 0 && (
          <div className="help-no-results">
            <p>No results found for "{searchQuery}"</p>
          </div>
        )}
      </nav>
    </div>
  );
};

export default HelpSidebar;





