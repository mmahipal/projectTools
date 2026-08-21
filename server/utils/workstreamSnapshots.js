const fs = require('fs');
const path = require('path');

const SNAPSHOTS_FILE = path.join(__dirname, '../data/workstream-snapshots.json');

// Ensure data directory exists
const dataDir = path.dirname(SNAPSHOTS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Load snapshots from file
 */
const loadSnapshots = () => {
  try {
    if (fs.existsSync(SNAPSHOTS_FILE)) {
      const fileContent = fs.readFileSync(SNAPSHOTS_FILE, 'utf8');
      const snapshots = JSON.parse(fileContent);
      return Array.isArray(snapshots) ? snapshots : [];
    }
  } catch (error) {
    console.error('Error loading workstream snapshots:', error);
  }
  return [];
};

/**
 * Save snapshots to file
 */
const saveSnapshots = (snapshots) => {
  try {
    fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(snapshots, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving workstream snapshots:', error);
    throw error;
  }
};

/**
 * Get today's date string (YYYY-MM-DD)
 */
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Create or update today's snapshot
 * @param {Array} workstreams - Array of workstream summary data
 * @returns {Promise<Object|null>} - Promise that resolves to snapshot object or null on error
 */
const createSnapshot = async (workstreams) => {
  try {
    const snapshots = loadSnapshots();
    const today = getTodayDateString();
    
    // Find existing snapshot for today
    const existingIndex = snapshots.findIndex(s => s.date === today);
    
    const snapshot = {
      date: today,
      timestamp: new Date().toISOString(),
      data: workstreams.map(ws => ({
        deliveryToolName: ws.deliveryToolName,
        projectObjectivesCount: ws.projectObjectivesCount || 0,
        projectsCount: ws.projectsCount || 0
      }))
    };
    
    if (existingIndex >= 0) {
      // Update existing snapshot
      snapshots[existingIndex] = snapshot;
      console.log(`Updated snapshot for ${today}`);
    } else {
      // Add new snapshot
      snapshots.push(snapshot);
      console.log(`Created snapshot for ${today}`);
    }
    
    // Sort by date (newest first)
    snapshots.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Keep only last 365 days of snapshots
    if (snapshots.length > 365) {
      snapshots.splice(365);
    }
    
    saveSnapshots(snapshots);
    return snapshot;
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return null;
  }
};

/**
 * Get snapshots for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
const getSnapshots = (startDate = null, endDate = null) => {
  const snapshots = loadSnapshots();
  
  if (!startDate && !endDate) {
    return snapshots;
  }
  
  return snapshots.filter(snapshot => {
    const snapshotDate = snapshot.date;
    if (startDate && snapshotDate < startDate) {
      return false;
    }
    if (endDate && snapshotDate > endDate) {
      return false;
    }
    return true;
  });
};

/**
 * Get trend data for a specific delivery tool
 * @param {string} deliveryToolName - Name of the delivery tool
 * @param {number} days - Number of days to look back (default: 30)
 */
const getTrendData = (deliveryToolName, days = 30) => {
  const snapshots = loadSnapshots();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  const startDateString = startDate.toISOString().split('T')[0];
  
  // Filter snapshots within date range
  const relevantSnapshots = snapshots.filter(s => s.date >= startDateString);
  
  // Extract data for the specific delivery tool
  const trendData = relevantSnapshots.map(snapshot => {
    const toolData = snapshot.data.find(d => d.deliveryToolName === deliveryToolName);
    return {
      date: snapshot.date,
      count: toolData ? toolData.projectObjectivesCount : 0
    };
  });
  
  // Sort by date (oldest first)
  trendData.sort((a, b) => a.date.localeCompare(b.date));
  
  return trendData;
};

/**
 * Get trend data for all delivery tools
 * @param {number} days - Number of days to look back (default: 30)
 */
const getAllTrends = (days = 30) => {
  const snapshots = loadSnapshots();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  const startDateString = startDate.toISOString().split('T')[0];
  
  // Filter snapshots within date range
  const relevantSnapshots = snapshots.filter(s => s.date >= startDateString);
  
  // Get all unique delivery tool names
  const allToolNames = new Set();
  relevantSnapshots.forEach(snapshot => {
    snapshot.data.forEach(tool => {
      if (tool.deliveryToolName && tool.deliveryToolName !== 'Unassigned') {
        allToolNames.add(tool.deliveryToolName);
      }
    });
  });
  
  // Build trend data for each tool
  const trends = {};
  allToolNames.forEach(toolName => {
    trends[toolName] = relevantSnapshots.map(snapshot => {
      const toolData = snapshot.data.find(d => d.deliveryToolName === toolName);
      return {
        date: snapshot.date,
        count: toolData ? toolData.projectObjectivesCount : 0
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  });
  
  return trends;
};

module.exports = {
  loadSnapshots,
  saveSnapshots,
  createSnapshot,
  getSnapshots,
  getTrendData,
  getAllTrends,
  getTodayDateString
};

