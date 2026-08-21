// Shared utilities for projects routes

const fs = require('fs');
const path = require('path');

/**
 * Get projects file path
 */
const getProjectsPath = () => {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'projects.json');
};

/**
 * Load users
 */
const loadUsers = () => {
  try {
    const usersPath = path.join(__dirname, '../../data/users.json');
    if (fs.existsSync(usersPath)) {
      const fileContent = fs.readFileSync(usersPath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading users from file:', error);
  }
  return [];
};

/**
 * Load projects from file
 */
const loadProjects = () => {
  try {
    const projectsPath = getProjectsPath();
    if (fs.existsSync(projectsPath)) {
      const fileContent = fs.readFileSync(projectsPath, 'utf8');
      const projects = JSON.parse(fileContent);
      console.log(`Loaded ${projects.length} projects from persistent storage`);
      return projects;
    }
  } catch (error) {
    console.error('Error loading projects from file:', error);
  }
  return [];
};

/**
 * Save projects to file
 */
const saveProjects = (projectsArray) => {
  try {
    const projectsPath = getProjectsPath();
    
    const cleanedProjects = projectsArray.map(project => {
      const cleaned = {};
      Object.keys(project).forEach(key => {
        const value = project[key];
        if (typeof value === 'function') {
          return;
        }
        if (value === undefined) {
          return;
        }
        if (typeof value === 'object' && value !== null) {
          try {
            JSON.stringify(value);
            cleaned[key] = value;
          } catch (e) {
            console.warn(`Skipping circular reference in field: ${key}`);
          }
        } else {
          cleaned[key] = value;
        }
      });
      return cleaned;
    });
    
    const jsonData = JSON.stringify(cleanedProjects, null, 2);
    const tempPath = projectsPath + '.tmp';
    fs.writeFileSync(tempPath, jsonData, 'utf8');
    fs.renameSync(tempPath, projectsPath);
    console.log(`Saved ${cleanedProjects.length} projects to persistent storage`);
  } catch (error) {
    console.error('Error saving projects to file:', error);
    throw error;
  }
};

/**
 * Safe stringify
 */
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    if (typeof value === 'function') {
      return undefined;
    }
    if (value === undefined) {
      return undefined;
    }
    return value;
  });
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  getProjectsPath,
  loadUsers,
  loadProjects,
  saveProjects,
  safeStringify,
  asyncHandler
};

