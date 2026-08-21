import React, { useState, useEffect } from 'react';
import { documentationContent } from './documentation/index';
import HelpSidebar from './components/HelpSidebar';
import HelpContent from './components/HelpContent';
import '../../styles/Help.css';

const Help = () => {
  const [selectedTopic, setSelectedTopic] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTopics, setFilteredTopics] = useState(Object.keys(documentationContent));

  // Debug: Log documentation content on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
        totalTopics: Object.keys(documentationContent).length,
        topics: Object.keys(documentationContent),
        selectedTopic,
        selectedContent: documentationContent[selectedTopic] ? {
          title: documentationContent[selectedTopic].title,
          sectionsCount: documentationContent[selectedTopic].sections?.length || 0
        } : null
      });
    }
  }, [selectedTopic]);

  // Filter topics based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTopics(Object.keys(documentationContent));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = Object.keys(documentationContent).filter(key => {
      const content = documentationContent[key];
      if (!content) return false;
      const titleMatch = content.title.toLowerCase().includes(query);
      const contentMatch = content.sections.some(section => 
        section.heading.toLowerCase().includes(query) ||
        section.content.toLowerCase().includes(query)
      );
      return titleMatch || contentMatch;
    });

    setFilteredTopics(filtered);
    
    // If current topic is filtered out, select first filtered topic
    if (!filtered.includes(selectedTopic) && filtered.length > 0) {
      setSelectedTopic(filtered[0]);
    }
  }, [searchQuery, selectedTopic]);

  const selectedContent = documentationContent[selectedTopic];

  return (
    <div className="help-page">
      <div className="help-content-wrapper">
        <div className="help-container">
          <HelpSidebar
            documentationContent={documentationContent}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredTopics={filteredTopics}
          />
          <div className="help-main-content">
            <HelpContent selectedContent={selectedContent} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

