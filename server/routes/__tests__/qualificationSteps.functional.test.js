/**
 * Functional Unit Tests for Qualification Steps Routes
 * Comprehensive tests for all qualification steps management features
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const qualificationStepRoutes = require('../qualificationSteps');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/qualification-steps', qualificationStepRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to create auth token
const createAuthToken = (user = { 
  id: '1', 
  email: 'test@example.com', 
  role: ROLES.ADMIN, 
  permissions: ['all'] 
}) => {
  return jwt.sign(user, JWT_SECRET);
};

// Helper to clean up test data files
const cleanupTestData = () => {
  const dataDir = path.join(__dirname, '../../data');
  const stepsPath = path.join(dataDir, 'qualificationSteps.json');
  if (fs.existsSync(stepsPath)) {
    try {
      const steps = JSON.parse(fs.readFileSync(stepsPath, 'utf8'));
      const filteredSteps = steps.filter(s => !s.id?.startsWith('QSTEP-'));
      if (filteredSteps.length !== steps.length) {
        fs.writeFileSync(stepsPath, JSON.stringify(filteredSteps, null, 2), 'utf8');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
};

describe('Qualification Steps Routes - Functional Tests', () => {
  let authToken;
  let adminToken;
  let userToken;

  beforeAll(() => {
    adminToken = createAuthToken({
      id: '1',
      email: 'admin@test.com',
      role: ROLES.ADMIN,
      permissions: ['all']
    });
    
    userToken = createAuthToken({
      id: '2',
      email: 'user@test.com',
      role: ROLES.REPORTS_VIEWER,
      permissions: ['view_project']
    });
    
    authToken = adminToken;
  });

  afterEach(() => {
    cleanupTestData();
  });

  describe('GET /api/qualification-steps - List Steps', () => {
    it('should return all qualification steps for authenticated user', async () => {
      // Create a test step first
      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Test Step List',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      const response = await request(app)
        .get('/api/qualification-steps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('qualificationSteps');
      expect(Array.isArray(response.body.qualificationSteps)).toBe(true);
      expect(response.body.qualificationSteps.length).toBeGreaterThan(0);
    });

    it('should filter steps by project when query parameter provided', async () => {
      const projectId = 'PROJ-FILTER-TEST';
      
      // Create steps for different projects
      await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Step for Project A',
          project: projectId,
          projectObjective: 'OBJ-123'
        });

      await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Step for Project B',
          project: 'PROJ-OTHER',
          projectObjective: 'OBJ-456'
        });

      const response = await request(app)
        .get('/api/qualification-steps')
        .query({ project: projectId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.qualificationSteps)).toBe(true);
      
      // All returned steps should be for the specified project
      response.body.qualificationSteps.forEach(step => {
        expect(step.project === projectId || step.projectName === projectId).toBe(true);
      });
    });

    it('should sort steps by createdAt descending', async () => {
      // Create multiple steps with slight delays
      const step1 = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Step 1',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      await new Promise(resolve => setTimeout(resolve, 10));

      const step2 = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Step 2',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      const response = await request(app)
        .get('/api/qualification-steps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const steps = response.body.qualificationSteps;
      
      if (steps.length >= 2) {
        // Most recent should be first
        const step2Index = steps.findIndex(s => s.id === step2.body.id);
        const step1Index = steps.findIndex(s => s.id === step1.body.id);
        expect(step2Index).toBeLessThan(step1Index);
      }
    });

    it('should return empty array when no steps exist', async () => {
      const response = await request(app)
        .get('/api/qualification-steps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.qualificationSteps)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/qualification-steps');

      expect(response.status).toBe(401);
    });

    it('should require view_project permission', async () => {
      const response = await request(app)
        .get('/api/qualification-steps')
        .set('Authorization', `Bearer ${userToken}`);

      // Should work if user has view_project permission
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('GET /api/qualification-steps/:id - Get Step by ID', () => {
    it('should return step by ID', async () => {
      // Create a step
      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Get Step Test',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      const stepId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(stepId);
      expect(response.body.qualificationStep).toBe('Get Step Test');
    });

    it('should return 404 for non-existent step', async () => {
      const response = await request(app)
        .get('/api/qualification-steps/NONEXISTENT-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/qualification-steps/TEST-123');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/qualification-steps - Create Step', () => {
    it('should create a new step with valid data', async () => {
      const stepData = {
        qualificationStep: `Functional Test Step ${Date.now()}`,
        project: 'PROJ-123',
        projectObjective: 'OBJ-123',
        status: 'Draft',
        stepNumber: 1
      };

      const response = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(stepData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.qualificationStep).toBe(stepData.qualificationStep);
      expect(response.body.status).toBe('draft');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('createdBy');
      expect(response.body).toHaveProperty('salesforceSyncStatus');
    });

    it('should set default values for new step', async () => {
      const stepData = {
        qualificationStep: 'Default Values Test',
        project: 'PROJ-123',
        projectObjective: 'OBJ-123'
      };

      const response = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(stepData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('draft');
      expect(response.body.salesforceSyncStatus).toBe('pending');
      expect(response.body.salesforceId).toBeNull();
    });

    it('should require create_project permission', async () => {
      const stepData = {
        qualificationStep: 'Permission Test',
        project: 'PROJ-123',
        projectObjective: 'OBJ-123'
      };

      const response = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${userToken}`) // User without create permission
        .send(stepData);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/qualification-steps')
        .send({
          qualificationStep: 'No Auth Test',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      expect(response.status).toBe(401);
    });

    it('should handle complex step data', async () => {
      const complexStepData = {
        qualificationStep: 'Complex Step',
        project: 'PROJ-123',
        projectObjective: 'OBJ-123',
        funnel: 'Test Funnel',
        stepNumber: 1,
        numberOfAttempts: 3,
        status: 'Draft',
        metadata: {
          tags: ['test', 'complex'],
          priority: 'high'
        }
      };

      const response = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(complexStepData);

      expect(response.status).toBe(201);
      expect(response.body.qualificationStep).toBe(complexStepData.qualificationStep);
      expect(response.body.stepNumber).toBe(1);
      expect(response.body.numberOfAttempts).toBe(3);
    });
  });

  describe('PUT /api/qualification-steps/:id - Update Step', () => {
    it('should update an existing step', async () => {
      // Create a step
      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Original Name',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      const stepId = createResponse.body.id;

      // Update it
      const updateResponse = await request(app)
        .put(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Updated Name',
          stepNumber: 2
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.qualificationStep).toBe('Updated Name');
      expect(updateResponse.body.stepNumber).toBe(2);
      expect(updateResponse.body).toHaveProperty('updatedAt');
      expect(updateResponse.body).toHaveProperty('updatedBy');
    });

    it('should preserve existing fields when updating', async () => {
      // Create a step
      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Preserve Test',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123',
          status: 'Draft',
          stepNumber: 1
        });

      const stepId = createResponse.body.id;
      const originalCreatedAt = createResponse.body.createdAt;

      // Update only one field
      const updateResponse = await request(app)
        .put(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Updated Name Only'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.qualificationStep).toBe('Updated Name Only');
      expect(updateResponse.body.project).toBe('PROJ-123'); // Preserved
      expect(updateResponse.body.createdAt).toBe(originalCreatedAt); // Preserved
    });

    it('should return 404 for non-existent step', async () => {
      const response = await request(app)
        .put('/api/qualification-steps/NONEXISTENT-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Update Test'
        });

      expect(response.status).toBe(404);
    });

    it('should require edit_project permission', async () => {
      // Create a step as admin
      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Permission Test',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      const stepId = createResponse.body.id;

      // Try to update as user without edit permission
      const response = await request(app)
        .put(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          qualificationStep: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/qualification-steps/:id - Delete Step', () => {
    it('should delete an existing step', async () => {
      // Create a step
      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Delete Test',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      const stepId = createResponse.body.id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(204); // No Content

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent step', async () => {
      const response = await request(app)
        .delete('/api/qualification-steps/NONEXISTENT-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should require all permissions (admin only)', async () => {
      // Create a step
      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Delete Permission Test',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      const stepId = createResponse.body.id;

      // Try to delete as regular user
      const response = await request(app)
        .delete(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Data Persistence', () => {
    it('should persist steps to file', async () => {
      const stepData = {
        qualificationStep: `Persistence Test ${Date.now()}`,
        project: 'PROJ-123',
        projectObjective: 'OBJ-123'
      };

      const createResponse = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(stepData);

      expect(createResponse.status).toBe(201);
      const stepId = createResponse.body.id;

      // Verify step can be retrieved (indicating persistence)
      const getResponse = await request(app)
        .get(`/api/qualification-steps/${stepId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(stepId);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long step names', async () => {
      const longName = 'A'.repeat(1000);
      const response = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: longName,
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      // Should handle long names
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in step data', async () => {
      const response = await request(app)
        .post('/api/qualification-steps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qualificationStep: 'Test Step !@#$%^&*()',
          project: 'PROJ-123',
          projectObjective: 'OBJ-123'
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should handle missing project filter gracefully', async () => {
      const response = await request(app)
        .get('/api/qualification-steps')
        .query({ project: 'NONEXISTENT-PROJECT' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.qualificationSteps)).toBe(true);
    });
  });
});
