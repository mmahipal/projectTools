const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Get project objectives file path
const getProjectObjectivesPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'projectObjectives.json');
};

// Load project objectives from file
const loadProjectObjectives = () => {
  try {
    const objectivesPath = getProjectObjectivesPath();
    if (fs.existsSync(objectivesPath)) {
      const fileContent = fs.readFileSync(objectivesPath, 'utf8');
      const objectives = JSON.parse(fileContent);
      return Array.isArray(objectives) ? objectives : [];
    }
  } catch (error) {
    console.error('Error loading project objectives:', error);
  }
  return [];
};

// Save project objectives to file
const saveProjectObjectives = (objectivesArray) => {
  try {
    const objectivesPath = getProjectObjectivesPath();
    const cleanedObjectives = objectivesArray.map(obj => {
      const cleaned = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (typeof value === 'function') {
          return;
        }
        if (value !== undefined) {
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
        }
      });
      return cleaned;
    });
    
    const jsonData = JSON.stringify(cleanedObjectives, null, 2);
    JSON.parse(jsonData);
    
    const tempPath = objectivesPath + '.tmp';
    fs.writeFileSync(tempPath, jsonData, 'utf8');
    fs.renameSync(tempPath, objectivesPath);
    
    console.log(`Saved ${objectivesArray.length} project objectives to persistent storage`);
  } catch (error) {
    console.error('Error saving project objectives to file:', error);
    throw error;
  }
};

// Initialize project objectives array
let projectObjectives = loadProjectObjectives();

// Get all project objectives
router.get('/', authenticate, asyncHandler(async (req, res) => {
  res.json(projectObjectives);
}));

// Get a single project objective
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const objective = projectObjectives.find(p => p.id === req.params.id);
  if (!objective) {
    return res.status(404).json({ error: 'Project objective not found' });
  }
  res.json(objective);
}));

// Create project objective
router.post('/', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  const objectiveData = req.body;
  
  if (!objectiveData || typeof objectiveData !== 'object') {
    throw new Error('Invalid project objective data');
  }
  
  const cleanedObjectiveData = { ...objectiveData };
  Object.keys(cleanedObjectiveData).forEach(key => {
    if (typeof cleanedObjectiveData[key] === 'function') {
      delete cleanedObjectiveData[key];
    }
  });
  
  const newObjective = {
    id: `OBJ-${Date.now()}`,
    ...cleanedObjectiveData,
    createdAt: new Date().toISOString(),
    createdBy: req.user.email,
    status: 'draft',
    salesforceId: null,
    salesforceSyncStatus: 'pending'
  };

  projectObjectives.push(newObjective);
  saveProjectObjectives(projectObjectives);
  
  res.status(201).json(newObjective);
}));

// Update project objective
router.put('/:id', authenticate, authorize('edit_project', 'all'), asyncHandler(async (req, res) => {
  const objective = projectObjectives.find(p => p.id === req.params.id);
  if (!objective) {
    return res.status(404).json({ error: 'Project objective not found' });
  }

  const objectiveData = req.body;
  const cleanedObjectiveData = { ...objectiveData };
  Object.keys(cleanedObjectiveData).forEach(key => {
    if (typeof cleanedObjectiveData[key] === 'function') {
      delete cleanedObjectiveData[key];
    }
  });

  const objectiveIndex = projectObjectives.findIndex(p => p.id === req.params.id);
  projectObjectives[objectiveIndex] = {
    ...projectObjectives[objectiveIndex],
    ...cleanedObjectiveData,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user.email
  };

  saveProjectObjectives(projectObjectives);
  res.json(projectObjectives[objectiveIndex]);
}));

// Delete project objective
router.delete('/:id', authenticate, authorize('delete_project', 'all'), asyncHandler(async (req, res) => {
  const objectiveIndex = projectObjectives.findIndex(p => p.id === req.params.id);
  if (objectiveIndex === -1) {
    return res.status(404).json({ error: 'Project objective not found' });
  }

  projectObjectives.splice(objectiveIndex, 1);
  saveProjectObjectives(projectObjectives);
  res.json({ message: 'Project objective deleted successfully' });
}));

module.exports = router;


