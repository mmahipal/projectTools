// Bookmarks/Favorites System

const BOOKMARKS_KEY = 'bookmarks';

/**
 * Get all bookmarks from localStorage
 * @returns {Array}
 */
export const getBookmarks = () => {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    return [];
  }
};

/**
 * Add a bookmark
 * @param {Object} bookmark - { type, id, name, path, description }
 */
export const addBookmark = (bookmark) => {
  try {
    const bookmarks = getBookmarks();
    
    // Check if already bookmarked
    const exists = bookmarks.find(b => b.type === bookmark.type && b.id === bookmark.id);
    if (exists) {
      return { success: false, error: 'Already bookmarked' };
    }
    
    const newBookmark = {
      ...bookmark,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...bookmarks, newBookmark];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return { success: true, bookmark: newBookmark };
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a bookmark
 * @param {string} type - Bookmark type
 * @param {string} id - Bookmark ID
 */
export const removeBookmark = (type, id) => {
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter(b => !(b.type === type && b.id === id));
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if an item is bookmarked
 * @param {string} type - Item type
 * @param {string} id - Item ID
 * @returns {boolean}
 */
export const isBookmarked = (type, id) => {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.type === type && b.id === id);
};

/**
 * Get bookmarks by type
 * @param {string} type - Bookmark type filter
 * @returns {Array}
 */
export const getBookmarksByType = (type) => {
  const bookmarks = getBookmarks();
  return bookmarks.filter(bookmark => bookmark.type === type);
};

