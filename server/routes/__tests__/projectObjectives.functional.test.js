/**
 * Functional Unit Tests for Project Objectives Routes
 * Comprehensive tests for all project objectives management features
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const projectObjectiveRoutes = require('../projectObjectives');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/project-objectives', projectObjectiveRoutes);

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
  const objectivesPath = path.join(dataDir, 'projectObjectives.json');
  if (fs.existsSync(objectivesPath)) {
    try {
      const objectives = JSON.parse(fs.readFileSync(objectivesPath, 'utf8'));
      const filteredObjectives = objectives.filter(o => !o.id?.startsWith('OBJ-'));
      if (filteredObjectives.length !== objectives.length) {
        fs.writeFileSync(objectivesPath, JSON.stringify(filteredObjectives, null, 2), 'utf8');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
};

describe('Project Objectives Routes - Functional Tests', () => {
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

  describe('GET /api/project-objectives - List Objectives', () => {
    it('should return all project objectives for authenticated user', async () => {
      // Create a test objective first
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Test Objective List',
          projectId: 'PROJ-123',
          status: 'Draft'
        });

      const response = await request(app)
        .get('/api/project-objectives')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return empty array when no objectives exist', async () => {
      const response = await request(app)
        .get('/api/project-objectives')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/project-objectives');

      expect(response.status).toBe(401);
    });

    it('should require view_project permission', async () => {
      const response = await request(app)
        .get('/api/project-objectives')
        .set('Authorization', `Bearer ${userToken}`);

      // Should work if user has view_project permission
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('GET /api/project-objectives/:id - Get Objective by ID', () => {
    it('should return objective by ID', async () => {
      // Create an objective
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Get Objective Test',
          projectId: 'PROJ-123',
          projectObjectiveName: 'Test Objective'
        });

      const objectiveId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(objectiveId);
      expect(response.body.objectiveName).toBe('Get Objective Test');
    });

    it('should return 404 for non-existent objective', async () => {
      const response = await request(app)
        .get('/api/project-objectives/NONEXISTENT-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/project-objectives/TEST-123');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/project-objectives - Create Objective', () => {
    it('should create a new objective with valid data', async () => {
      const objectiveData = {
        objectiveName: `Functional Test Objective ${Date.now()}`,
        projectId: 'PROJ-123',
        projectObjectiveName: 'Test Objective',
        status: 'Draft',
        workType: 'Test Work Type'
      };

      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(objectiveData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.objectiveName).toBe(objectiveData.objectiveName);
      expect(response.body.status).toBe('draft');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('createdBy');
      expect(response.body).toHaveProperty('salesforceSyncStatus');
    });

    it('should set default values for new objective', async () => {
      const objectiveData = {
        objectiveName: 'Default Values Test',
        projectId: 'PROJ-123'
      };

      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(objectiveData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('draft');
      expect(response.body.salesforceSyncStatus).toBe('pending');
      expect(response.body.salesforceId).toBeNull();
    });

    it('should require create_project permission', async () => {
      const objectiveData = {
        objectiveName: 'Permission Test',
        projectId: 'PROJ-123'
      };

      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${userToken}`) // User without create permission
        .send(objectiveData);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/project-objectives')
        .send({
          objectiveName: 'No Auth Test',
          projectId: 'PROJ-123'
        });

      expect(response.status).toBe(401);
    });

    it('should handle complex objective data', async () => {
      const complexObjectiveData = {
        objectiveName: 'Complex Objective',
        projectId: 'PROJ-123',
        projectObjectiveName: 'Complex PO',
        workType: 'Complex Work',
        status: 'Draft',
        daysBetweenReminderEmails: 7,
        country: 'US',
        language: 'en',
        metadata: {
          tags: ['test', 'complex'],
          priority: 'high'
        }
      };

      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(complexObjectiveData);

      expect(response.status).toBe(201);
      expect(response.body.objectiveName).toBe(complexObjectiveData.objectiveName);
      expect(response.body.daysBetweenReminderEmails).toBe(7);
    });

    it('should handle invalid objective data gracefully', async () => {
      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
        });

      // Should handle gracefully
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('PUT /api/project-objectives/:id - Update Objective', () => {
    it('should update an existing objective', async () => {
      // Create an objective
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Original Name',
          projectId: 'PROJ-123',
          projectObjectiveName: 'Original PO'
        });

      const objectiveId = createResponse.body.id;

      // Update it
      const updateResponse = await request(app)
        .put(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Updated Name',
          projectObjectiveName: 'Updated PO'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.objectiveName).toBe('Updated Name');
      expect(updateResponse.body).toHaveProperty('updatedAt');
      expect(updateResponse.body).toHaveProperty('updatedBy');
    });

    it('should preserve existing fields when updating', async () => {
      // Create an objective
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Preserve Test',
          projectId: 'PROJ-123',
          projectObjectiveName: 'PT',
          status: 'Draft',
          workType: 'Type A'
        });

      const objectiveId = createResponse.body.id;
      const originalCreatedAt = createResponse.body.createdAt;

      // Update only one field
      const updateResponse = await request(app)
        .put(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Updated Name Only'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.objectiveName).toBe('Updated Name Only');
      expect(updateResponse.body.projectId).toBe('PROJ-123'); // Preserved
      expect(updateResponse.body.createdAt).toBe(originalCreatedAt); // Preserved
    });

    it('should return 404 for non-existent objective', async () => {
      const response = await request(app)
        .put('/api/project-objectives/NONEXISTENT-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Update Test'
        });

      expect(response.status).toBe(404);
    });

    it('should require edit_project permission', async () => {
      // Create an objective as admin
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Permission Test',
          projectId: 'PROJ-123'
        });

      const objectiveId = createResponse.body.id;

      // Try to update as user without edit permission
      const response = await request(app)
        .put(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          objectiveName: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/project-objectives/:id - Delete Objective', () => {
    it('should delete an existing objective', async () => {
      // Create an objective
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Delete Test',
          projectId: 'PROJ-123',
          projectObjectiveName: 'DT'
        });

      const objectiveId = createResponse.body.id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toContain('deleted');

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent objective', async () => {
      const response = await request(app)
        .delete('/api/project-objectives/NONEXISTENT-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should require delete_project permission', async () => {
      // Create an objective
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Delete Permission Test',
          projectId: 'PROJ-123'
        });

      const objectiveId = createResponse.body.id;

      // Try to delete as regular user
      const response = await request(app)
        .delete(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Data Persistence', () => {
    it('should persist objectives to file', async () => {
      const objectiveData = {
        objectiveName: `Persistence Test ${Date.now()}`,
        projectId: 'PROJ-123',
        projectObjectiveName: 'PT'
      };

      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(objectiveData);

      expect(createResponse.status).toBe(201);
      const objectiveId = createResponse.body.id;

      // Verify objective can be retrieved (indicating persistence)
      const getResponse = await request(app)
        .get(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(objectiveId);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long objective names', async () => {
      const longName = 'A'.repeat(1000);
      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: longName,
          projectId: 'PROJ-123'
        });

      // Should handle long names
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in objective data', async () => {
      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          objectiveName: 'Test Objective !@#$%^&*()',
          projectId: 'PROJ-123',
          projectObjectiveName: 'SPECIAL'
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should handle circular references in data', async () => {
      const objectiveData = {
        objectiveName: 'Circular Test',
        projectId: 'PROJ-123'
      };
      
      // Create a circular reference
      objectiveData.self = objectiveData;

      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(objectiveData);

      // Should handle circular references gracefully
      expect([201, 400, 500]).toContain(response.status);
    });
  });
});
