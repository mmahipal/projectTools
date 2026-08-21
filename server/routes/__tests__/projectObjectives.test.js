/**
 * Sanity Tests for Project Objectives Routes
 * Tests basic project objectives CRUD operations
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const projectObjectiveRoutes = require('../projectObjectives');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/project-objectives', projectObjectiveRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to create auth token
const createAuthToken = (user = { id: '1', email: 'test@example.com', role: ROLES.ADMIN, permissions: ['all'] }) => {
  return jwt.sign(user, JWT_SECRET);
};

describe('Project Objectives Routes - Sanity Tests', () => {
  let authToken;

  beforeEach(() => {
    authToken = createAuthToken();
  });

  describe('GET /api/project-objectives', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/project-objectives');
      
      expect(response.status).toBe(401);
    });

    it('should return project objectives list with authentication', async () => {
      const response = await request(app)
        .get('/api/project-objectives')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/project-objectives', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/project-objectives')
        .send({
          objectiveName: 'Test Objective'
        });
      
      expect(response.status).toBe(401);
    });

    it('should create a new project objective with valid data', async () => {
      const objectiveData = {
        objectiveName: `Test Objective ${Date.now()}`,
        projectId: '1',
        status: 'Draft'
      };

      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${authToken}`)
        .send(objectiveData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.objectiveName).toBe(objectiveData.objectiveName);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing objectiveName
        });
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/project-objectives/:id', () => {
    it('should return 404 for non-existent objective', async () => {
      const response = await request(app)
        .get('/api/project-objectives/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/project-objectives/:id', () => {
    it('should update an existing objective', async () => {
      // Create an objective first
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          objectiveName: `Test Objective ${Date.now()}`,
          projectId: '1'
        });
      
      const objectiveId = createResponse.body.id;

      // Update it
      const updateResponse = await request(app)
        .put(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          objectiveName: 'Updated Objective Name'
        });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.objectiveName).toBe('Updated Objective Name');
    });
  });

  describe('DELETE /api/project-objectives/:id', () => {
    it('should delete an existing objective', async () => {
      // Create an objective first
      const createResponse = await request(app)
        .post('/api/project-objectives')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          objectiveName: `Test Objective ${Date.now()}`,
          projectId: '1'
        });
      
      const objectiveId = createResponse.body.id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/project-objectives/${objectiveId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });
});
