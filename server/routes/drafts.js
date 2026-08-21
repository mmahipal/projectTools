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

// Get drafts directory path
const getDraftsPath = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'drafts');
};

// Ensure drafts directory exists
const ensureDraftsDir = () => {
  const draftsDir = getDraftsPath();
  if (!fs.existsSync(draftsDir)) {
    fs.mkdirSync(draftsDir, { recursive: true });
  }
  return draftsDir;
};

// Get user-specific draft file path
const getUserDraftPath = (userId, type) => {
  ensureDraftsDir();
  return path.join(getDraftsPath(), `${userId}_${type}.json`);
};

// Load draft data for a user
const loadDraft = (userId, type) => {
  try {
    const draftPath = getUserDraftPath(userId, type);
    if (fs.existsSync(draftPath)) {
      const fileContent = fs.readFileSync(draftPath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error(`Error loading draft ${type} for user ${userId}:`, error);
  }
  return null;
};

// Save draft data for a user
const saveDraft = (userId, type, data) => {
  try {
    ensureDraftsDir();
    const draftPath = getUserDraftPath(userId, type);
    fs.writeFileSync(draftPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving draft ${type} for user ${userId}:`, error);
    throw error;
  }
};

// Delete draft data for a user
const deleteDraft = (userId, type) => {
  try {
    const draftPath = getUserDraftPath(userId, type);
    if (fs.existsSync(draftPath)) {
      fs.unlinkSync(draftPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting draft ${type} for user ${userId}:`, error);
    return false;
  }
};

// Get draft project data
router.get('/project', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = loadDraft(userId, 'project');
    
    if (draftData) {
      res.json({
        success: true,
        data: draftData
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Error loading draft project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draft project data'
    });
  }
}));

// Save draft project data
router.post('/project', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const projectData = req.body;
    
    saveDraft(userId, 'project', projectData);
    
    res.json({
      success: true,
      message: 'Draft project data saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft project data'
    });
  }
}));

// Delete draft project data
router.delete('/project', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    deleteDraft(userId, 'project');
    
    res.json({
      success: true,
      message: 'Draft project data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft project data'
    });
  }
}));

// Get draft project objective data
router.get('/project-objective', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = loadDraft(userId, 'projectObjective');
    
    if (draftData) {
      res.json({
        success: true,
        data: draftData
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Error loading draft project objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draft project objective data'
    });
  }
}));

// Save draft project objective data
router.post('/project-objective', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const objectiveData = req.body;
    
    saveDraft(userId, 'projectObjective', objectiveData);
    
    res.json({
      success: true,
      message: 'Draft project objective data saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft project objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft project objective data'
    });
  }
}));

// Delete draft project objective data
router.delete('/project-objective', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    deleteDraft(userId, 'projectObjective');
    
    res.json({
      success: true,
      message: 'Draft project objective data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft project objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft project objective data'
    });
  }
}));

// Get draft qualification step data
router.get('/qualification-step', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = loadDraft(userId, 'qualificationStep');
    
    if (draftData) {
      res.json({
        success: true,
        data: draftData
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Error loading draft qualification step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draft qualification step data'
    });
  }
}));

// Save draft qualification step data
router.post('/qualification-step', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const stepData = req.body;
    
    saveDraft(userId, 'qualificationStep', stepData);
    
    res.json({
      success: true,
      message: 'Draft qualification step data saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft qualification step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft qualification step data'
    });
  }
}));

// Delete draft qualification step data
router.delete('/qualification-step', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    deleteDraft(userId, 'qualificationStep');
    
    res.json({
      success: true,
      message: 'Draft qualification step data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft qualification step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft qualification step data'
    });
  }
}));

// Get user settings
router.get('/settings', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = loadDraft(userId, 'settings');
    
    if (draftData) {
      res.json({
        success: true,
        data: draftData
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Error loading user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load user settings'
    });
  }
}));

// Save user settings
router.post('/settings', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;
    
    saveDraft(userId, 'settings', settings);
    
    res.json({
      success: true,
      message: 'User settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save user settings'
    });
  }
}));

// Get draft project page data
router.get('/project-page', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = loadDraft(userId, 'projectPage');
    
    if (draftData) {
      res.json({
        success: true,
        data: draftData
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Error loading draft project page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draft project page data'
    });
  }
}));

// Save draft project page data
router.post('/project-page', authenticate, authorize('create_project', 'all'), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const pageData = req.body;
    
    saveDraft(userId, 'projectPage', pageData);
    
    res.json({
      success: true,
      message: 'Draft project page data saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft project page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft project page data'
    });
  }
}));

// Delete draft project page data
router.delete('/project-page', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    deleteDraft(userId, 'projectPage');
    
    res.json({
      success: true,
      message: 'Draft project page data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft project page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft project page data'
    });
  }
}));

// Quick Setup Wizard draft endpoints
router.get('/quick-setup', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = loadDraft(userId, 'quick-setup');
    
    if (draftData) {
      res.json({
        success: true,
        data: draftData
      });
    } else {
      res.json({
        success: false,
        data: null
      });
    }
  } catch (error) {
    console.error('Error loading quick setup draft:', error);
    res.status(500).json({
      success: false,
      error: 'Error loading quick setup draft'
    });
  }
}));

router.post('/quick-setup', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const quickSetupData = req.body;
    
    saveDraft(userId, 'quick-setup', quickSetupData);
    
    res.json({
      success: true,
      message: 'Quick setup draft saved successfully'
    });
  } catch (error) {
    console.error('Error saving quick setup draft:', error);
    res.status(500).json({
      success: false,
      error: 'Error saving quick setup draft'
    });
  }
}));

router.delete('/quick-setup', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    deleteDraft(userId, 'quick-setup');
    
    res.json({
      success: true,
      message: 'Quick setup draft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quick setup draft:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting quick setup draft'
    });
  }
}));

module.exports = router;

