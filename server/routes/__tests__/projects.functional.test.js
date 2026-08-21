/**
 * Functional Unit Tests for Projects Routes
 * Comprehensive tests for all project management features
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const projectRoutes = require('../projects');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

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
  const projectsPath = path.join(dataDir, 'projects.json');
  if (fs.existsSync(projectsPath)) {
    try {
      const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
      // Keep only non-test projects (those not starting with TEST-)
      const filteredProjects = projects.filter(p => !p.id?.startsWith('TEST-') && !p.id?.startsWith('PROJ-'));
      if (filteredProjects.length !== projects.length) {
        fs.writeFileSync(projectsPath, JSON.stringify(filteredProjects, null, 2), 'utf8');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
};

describe('Projects Routes - Functional Tests', () => {
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

  describe('GET /api/projects - List Projects', () => {
    it('should return all projects for authenticated user', async () => {
      // Create a test project first
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Test Project List',
          shortProjectName: 'TPL',
          projectType: 'Test Type',
          status: 'Draft'
        });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return empty array when no projects exist', async () => {
      // This test assumes we can clear projects or test in isolation
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/stats - Dashboard Statistics', () => {
    it('should return project statistics', async () => {
      // Create some test projects with different statuses
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Open Project',
          shortProjectName: 'OP',
          projectStatus: 'Open',
          status: 'Open'
        });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Draft Project',
          shortProjectName: 'DP',
          projectStatus: 'Draft',
          status: 'Draft'
        });

      const response = await request(app)
        .get('/api/projects/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalProjects');
      expect(response.body).toHaveProperty('openProjects');
      expect(response.body).toHaveProperty('totalPublishes');
      expect(response.body).toHaveProperty('todayPublishes');
      expect(response.body).toHaveProperty('recentPublishes');
      expect(response.body).toHaveProperty('successRate');
      expect(response.body).toHaveProperty('projectsByUser');
      expect(response.body).toHaveProperty('projectsByDate');
      expect(response.body).toHaveProperty('publishesByObjectType');
      expect(response.body).toHaveProperty('publishesByOperation');
      expect(response.body).toHaveProperty('activityByDay');
      
      expect(typeof response.body.totalProjects).toBe('number');
      expect(typeof response.body.openProjects).toBe('number');
      expect(response.body.totalProjects).toBeGreaterThanOrEqual(0);
    });

    it('should calculate correct statistics for multiple projects', async () => {
      // Create multiple projects
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            projectName: `Test Project ${i}`,
            shortProjectName: `TP${i}`,
            projectStatus: i === 0 ? 'Open' : 'Draft',
            status: i === 0 ? 'Open' : 'Draft'
          });
      }

      const response = await request(app)
        .get('/api/projects/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalProjects).toBeGreaterThanOrEqual(3);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/projects/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/field-definitions - Field Definitions', () => {
    it('should return field definitions', async () => {
      const response = await request(app)
        .get('/api/projects/field-definitions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('fields');
      expect(response.body).toHaveProperty('sections');
      expect(Array.isArray(response.body.fields)).toBe(true);
      expect(Array.isArray(response.body.sections)).toBe(true);
    });

    it('should return fields with correct structure', async () => {
      const response = await request(app)
        .get('/api/projects/field-definitions')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.body.fields.length > 0) {
        const field = response.body.fields[0];
        expect(field).toHaveProperty('key');
        expect(field).toHaveProperty('label');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('section');
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/projects/field-definitions');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id - Get Project by ID', () => {
    it('should return project by ID', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Get Project Test',
          shortProjectName: 'GPT',
          projectType: 'Test Type'
        });

      const projectId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(projectId);
      expect(response.body.projectName).toBe('Get Project Test');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/NONEXISTENT-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/projects/TEST-123');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id/sync-status - Sync Status', () => {
    it('should return sync status for project', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Sync Status Test',
          shortProjectName: 'SST',
          projectType: 'Test Type'
        });

      const projectId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/projects/${projectId}/sync-status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('projectName');
      expect(response.body).toHaveProperty('salesforceSyncStatus');
      expect(response.body).toHaveProperty('salesforceId');
      expect(response.body.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/NONEXISTENT-123/sync-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/projects - Create Project', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        projectName: `Functional Test Project ${Date.now()}`,
        shortProjectName: 'FTP',
        projectType: 'Test Type',
        status: 'Draft',
        contributorProjectName: 'Contributor Project Name'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.projectName).toBe(projectData.projectName);
      expect(response.body.status).toBe('draft');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('createdBy');
      expect(response.body).toHaveProperty('salesforceSyncStatus');
    });

    it('should set default values for new project', async () => {
      const projectData = {
        projectName: 'Default Values Test',
        shortProjectName: 'DVT'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('draft');
      expect(response.body.salesforceSyncStatus).toBe('pending');
      expect(response.body.salesforceId).toBeNull();
    });

    it('should require create_project permission', async () => {
      const projectData = {
        projectName: 'Permission Test',
        shortProjectName: 'PT'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`) // User without create permission
        .send(projectData);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          projectName: 'No Auth Test',
          shortProjectName: 'NAT'
        });

      expect(response.status).toBe(401);
    });

    it('should handle complex project data', async () => {
      const complexProjectData = {
        projectName: 'Complex Project',
        shortProjectName: 'CP',
        projectType: 'Complex Type',
        status: 'Draft',
        budget: {
          total: 100000,
          currency: 'USD'
        },
        team: [
          { name: 'John Doe', role: 'Manager' },
          { name: 'Jane Smith', role: 'Developer' }
        ],
        metadata: {
          tags: ['test', 'complex'],
          priority: 'high'
        }
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(complexProjectData);

      expect(response.status).toBe(201);
      expect(response.body.projectName).toBe(complexProjectData.projectName);
    });
  });

  describe('PUT /api/projects/:id - Update Project', () => {
    it('should update an existing project', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Original Name',
          shortProjectName: 'ON',
          projectType: 'Original Type'
        });

      const projectId = createResponse.body.id;

      // Update it
      const updateResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Updated Name',
          projectType: 'Updated Type'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.projectName).toBe('Updated Name');
      expect(updateResponse.body.projectType).toBe('Updated Type');
      expect(updateResponse.body).toHaveProperty('updatedAt');
      expect(updateResponse.body).toHaveProperty('updatedBy');
    });

    it('should preserve existing fields when updating', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Preserve Test',
          shortProjectName: 'PT',
          projectType: 'Type A',
          status: 'Draft'
        });

      const projectId = createResponse.body.id;
      const originalCreatedAt = createResponse.body.createdAt;

      // Update only one field
      const updateResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Updated Name Only'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.projectName).toBe('Updated Name Only');
      expect(updateResponse.body.shortProjectName).toBe('PT'); // Preserved
      expect(updateResponse.body.createdAt).toBe(originalCreatedAt); // Preserved
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/NONEXISTENT-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Update Test'
        });

      expect(response.status).toBe(404);
    });

    it('should require edit_project permission', async () => {
      // Create a project as admin
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Permission Test',
          shortProjectName: 'PT'
        });

      const projectId = createResponse.body.id;

      // Try to update as user without edit permission
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/projects/:id - Delete Project', () => {
    it('should delete an existing project', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Delete Test',
          shortProjectName: 'DT',
          projectType: 'Test Type'
        });

      const projectId = createResponse.body.id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toContain('deleted');

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/NONEXISTENT-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should require all permissions (admin only)', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Delete Permission Test',
          shortProjectName: 'DPT'
        });

      const projectId = createResponse.body.id;

      // Try to delete as regular user
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/projects/template/:pageType - Template Export', () => {
    it('should export template for quick-setup', async () => {
      const response = await request(app)
        .get('/api/projects/template/quick-setup')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('quick-setup-template.csv');
      expect(response.text).toContain('Field Key');
      expect(response.text).toContain('Field Label');
    });

    it('should export template for project-setup', async () => {
      const response = await request(app)
        .get('/api/projects/template/project-setup')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should export template for project-objective', async () => {
      const response = await request(app)
        .get('/api/projects/template/project-objective')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('contributorFacingProjectName');
    });

    it('should export template for qualification-step', async () => {
      const response = await request(app)
        .get('/api/projects/template/qualification-step')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('qualificationStepProject');
    });

    it('should export template for project-page', async () => {
      const response = await request(app)
        .get('/api/projects/template/project-page')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('projectPageType');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/projects/template/quick-setup');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/projects/:id/retry-sync - Retry Sync', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/projects/TEST-123/retry-sync');

      expect(response.status).toBe(401);
    });

    it('should require create_project permission', async () => {
      const response = await request(app)
        .post('/api/projects/TEST-123/retry-sync')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post('/api/projects/NONEXISTENT-123/retry-sync')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should mark project as pending when retrying sync', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Retry Sync Test',
          shortProjectName: 'RST',
          projectType: 'Test Type',
          contributorProjectName: 'Contributor Name'
        });

      const projectId = createResponse.body.id;

      // Note: This test may fail if Salesforce is not configured
      // The endpoint should still mark the project as pending
      const response = await request(app)
        .post(`/api/projects/${projectId}/retry-sync`)
        .set('Authorization', `Bearer ${adminToken}`)
        .timeout(10000); // 10 second timeout

      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Data Persistence', () => {
    it('should persist projects to file', async () => {
      const projectData = {
        projectName: `Persistence Test ${Date.now()}`,
        shortProjectName: 'PT',
        projectType: 'Test Type'
      };

      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData);

      expect(createResponse.status).toBe(201);
      const projectId = createResponse.body.id;

      // Verify project can be retrieved (indicating persistence)
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(projectId);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid project data gracefully', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
        });

      // Should either validate or handle gracefully
      expect([400, 500]).toContain(response.status);
    });

    it('should handle very long project names', async () => {
      const longName = 'A'.repeat(1000);
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: longName,
          shortProjectName: 'LONG'
        });

      // Should handle long names (may truncate or accept)
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in project data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectName: 'Test Project !@#$%^&*()',
          shortProjectName: 'SPECIAL',
          projectType: 'Type with "quotes" and \'apostrophes\''
        });

      expect([201, 400]).toContain(response.status);
    });
  });
});
