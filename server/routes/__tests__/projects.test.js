/**
 * Sanity Tests for Projects Routes
 * Tests basic project CRUD operations
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const projectRoutes = require('../projects');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to create auth token
const createAuthToken = (user = { id: '1', email: 'test@example.com', role: ROLES.ADMIN, permissions: ['all'] }) => {
  return jwt.sign(user, JWT_SECRET);
};

describe('Projects Routes - Sanity Tests', () => {
  let authToken;

  beforeEach(() => {
    authToken = createAuthToken();
  });

  describe('GET /api/projects', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/projects');
      
      expect(response.status).toBe(401);
    });

    it('should return projects list with authentication', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/projects/stats', () => {
    it('should return project statistics', async () => {
      const response = await request(app)
        .get('/api/projects/stats')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalProjects');
      expect(response.body).toHaveProperty('activeProjects');
      expect(typeof response.body.totalProjects).toBe('number');
    });
  });

  describe('POST /api/projects', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'Test Project',
          shortProjectName: 'Test'
        });
      
      expect(response.status).toBe(401);
    });

    it('should create a new project with valid data', async () => {
      const projectData = {
        projectName: `Test Project ${Date.now()}`,
        shortProjectName: 'Test',
        projectType: 'Test Type',
        status: 'Draft'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.projectName).toBe(projectData.projectName);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing projectName
          shortProjectName: 'Test'
        });
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
    });

    it('should return project by id when it exists', async () => {
      // First create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectName: `Test Project ${Date.now()}`,
          shortProjectName: 'Test'
        });
      
      const projectId = createResponse.body.id;

      // Then fetch it
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(projectId);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update an existing project', async () => {
      // Create a project first
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectName: `Test Project ${Date.now()}`,
          shortProjectName: 'Test'
        });
      
      const projectId = createResponse.body.id;

      // Update it
      const updateResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectName: 'Updated Project Name',
          shortProjectName: 'Updated'
        });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.projectName).toBe('Updated Project Name');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete an existing project', async () => {
      // Create a project first
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectName: `Test Project ${Date.now()}`,
          shortProjectName: 'Test'
        });
      
      const projectId = createResponse.body.id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getResponse.status).toBe(404);
    });
  });
});
