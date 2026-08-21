import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { addBookmark, removeBookmark, isBookmarked } from '../utils/crossFeature/bookmarks';
import toast from 'react-hot-toast';

/**
 * Bookmark button component to add/remove bookmarks for the current page
 * Should be placed in page headers
 */
const BookmarkButton = ({ pageName, pageType = 'page' }) => {
  const location = useLocation();
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    const currentBookmarked = isBookmarked(pageType, path);
    setBookmarked(currentBookmarked);
  }, [location.pathname, pageType]);

  const handleToggleBookmark = () => {
    const path = location.pathname;
    const name = pageName || path.split('/').filter(p => p).pop() || 'Page';
    
    if (bookmarked) {
      const result = removeBookmark(pageType, path);
      if (result.success) {
        setBookmarked(false);
        toast.success('Bookmark removed');
      }
    } else {
      const result = addBookmark({
        type: pageType,
        id: path,
        name: name,
        path: path,
        description: `Bookmark for ${name}`
      });
      if (result.success) {
        setBookmarked(true);
        toast.success('Page bookmarked');
      } else {
        toast.error(result.error || 'Failed to add bookmark');
      }
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: bookmarked ? '#0176d3' : '#666',
        transition: 'color 0.2s'
      }}
      title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
    </button>
  );
};

export default BookmarkButton;

