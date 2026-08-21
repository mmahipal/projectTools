import React from 'react';
import { HelpCircle } from 'lucide-react';

const HelpContent = ({ selectedContent }) => {
  if (!selectedContent) {
    return (
      <div className="help-no-content">
        <HelpCircle size={48} />
        <p>Select a topic from the left panel to view documentation</p>
      </div>
    );
  }

  // Debug: Log content to verify it's loaded
  if (process.env.NODE_ENV === 'development') {
    console.log('HelpContent loaded:', {
      title: selectedContent.title,
      sectionsCount: selectedContent.sections?.length || 0,
      sections: selectedContent.sections?.map(s => s.heading) || []
    });
  }

  return (
    <>
      <div className="help-content-header">
        <h1>{selectedContent.title}</h1>
      </div>
      <div className="help-content-body">
        {selectedContent.sections.map((section, index) => (
          <div key={index} className="help-section">
            <h2>{section.heading}</h2>
            <div 
              className="help-section-content"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default HelpContent;
