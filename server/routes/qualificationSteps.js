const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const getQualificationStepsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'qualificationSteps.json');
};

const loadQualificationSteps = () => {
  try {
    const stepsPath = getQualificationStepsPath();
    if (fs.existsSync(stepsPath)) {
      const fileContent = fs.readFileSync(stepsPath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading qualification steps from file:', error);
  }
  return [];
};

const saveQualificationSteps = (stepsArray) => {
  try {
    const stepsPath = getQualificationStepsPath();
    fs.writeFileSync(stepsPath, JSON.stringify(stepsArray, null, 2), 'utf8');
    console.log(`Saved ${stepsArray.length} qualification steps to persistent storage`);
  } catch (error) {
    console.error('Error saving qualification steps to file:', error);
    throw error;
  }
};

let qualificationSteps = loadQualificationSteps();

// GET all qualification steps
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { project } = req.query;
  
  let filteredSteps = qualificationSteps;
  
  // Filter by project if provided
  if (project) {
    filteredSteps = qualificationSteps.filter(step => 
      step.project === project || step.projectName === project
    );
  }
  
  // Sort by createdAt descending (most recent first)
  filteredSteps.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });
  
  res.json({
    success: true,
    qualificationSteps: filteredSteps
  });
}));

// GET qualification step by ID
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const step = qualificationSteps.find(s => s.id === req.params.id);
  if (step) {
    res.json(step);
  } else {
    res.status(404).json({ error: 'Qualification step not found' });
  }
}));

// POST create new qualification step
router.post('/', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  const newStep = {
    id: `QSTEP-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    createdBy: req.user.email,
    status: 'draft',
    salesforceId: null,
    salesforceSyncStatus: 'pending'
  };
  qualificationSteps.push(newStep);
  saveQualificationSteps(qualificationSteps);
  res.status(201).json(newStep);
}));

// PUT update qualification step
router.put('/:id', authenticate, authorize('edit_project', 'all'), asyncHandler(async (req, res) => {
  const index = qualificationSteps.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    qualificationSteps[index] = {
      ...qualificationSteps[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email
    };
    saveQualificationSteps(qualificationSteps);
    res.json(qualificationSteps[index]);
  } else {
    res.status(404).json({ error: 'Qualification step not found' });
  }
}));

// DELETE qualification step
router.delete('/:id', authenticate, authorize('all'), asyncHandler(async (req, res) => {
  const initialLength = qualificationSteps.length;
  qualificationSteps = qualificationSteps.filter(s => s.id !== req.params.id);
  if (qualificationSteps.length < initialLength) {
    saveQualificationSteps(qualificationSteps);
    res.status(204).send(); // No Content
  } else {
    res.status(404).json({ error: 'Qualification step not found' });
  }
}));

module.exports = router;


