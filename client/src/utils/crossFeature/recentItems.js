// Recent Items Tracking System

const RECENT_ITEMS_KEY = 'recent_items';
const MAX_RECENT_ITEMS = 20;

/**
 * Get recent items from localStorage
 * @returns {Array}
 */
export const getRecentItems = () => {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading recent items:', error);
    return [];
  }
};

/**
 * Add an item to recent items
 * @param {Object} item - { type, id, name, path, timestamp }
 */
export const addRecentItem = (item) => {
  try {
    const recentItems = getRecentItems();
    
    // Remove if already exists
    const filtered = recentItems.filter(i => !(i.type === item.type && i.id === item.id));
    
    // Add to beginning
    const updated = [
      {
        ...item,
        timestamp: new Date().toISOString()
      },
      ...filtered
    ].slice(0, MAX_RECENT_ITEMS);
    
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving recent item:', error);
    return getRecentItems();
  }
};

/**
 * Remove an item from recent items
 * @param {string} type - Item type
 * @param {string} id - Item ID
 */
export const removeRecentItem = (type, id) => {
  try {
    const recentItems = getRecentItems();
    const filtered = recentItems.filter(i => !(i.type === type && i.id === id));
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Error removing recent item:', error);
    return getRecentItems();
  }
};

/**
 * Clear all recent items
 */
export const clearRecentItems = () => {
  try {
    localStorage.removeItem(RECENT_ITEMS_KEY);
    return [];
  } catch (error) {
    console.error('Error clearing recent items:', error);
    return getRecentItems();
  }
};

/**
 * Get recent items by type
 * @param {string} type - Item type filter
 * @returns {Array}
 */
export const getRecentItemsByType = (type) => {
  const recentItems = getRecentItems();
  return recentItems.filter(item => item.type === type);
};

