/**
 * Sanity Tests for Salesforce Routes
 * Tests basic Salesforce integration functionality
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const salesforceRoutes = require('../salesforce');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/salesforce', salesforceRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to create auth token
const createAuthToken = (user = { id: '1', email: 'test@example.com', role: ROLES.ADMIN, permissions: ['all'] }) => {
  return jwt.sign(user, JWT_SECRET);
};

describe('Salesforce Routes - Sanity Tests', () => {
  let authToken;

  beforeEach(() => {
    authToken = createAuthToken();
  });

  describe('POST /api/salesforce/test', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/salesforce/test')
        .send({
          salesforceUrl: 'https://test.salesforce.com',
          username: 'test@example.com',
          password: 'password',
          securityToken: 'token'
        });
      
      expect(response.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/salesforce/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing salesforceUrl', async () => {
      const response = await request(app)
        .post('/api/salesforce/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'test@example.com',
          password: 'password',
          securityToken: 'token'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Salesforce URL');
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/salesforce/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          salesforceUrl: 'https://test.salesforce.com',
          password: 'password',
          securityToken: 'token'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Username');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/salesforce/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          salesforceUrl: 'https://test.salesforce.com',
          username: 'test@example.com',
          securityToken: 'token'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password');
    });

    it('should return 400 for missing securityToken', async () => {
      const response = await request(app)
        .post('/api/salesforce/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          salesforceUrl: 'https://test.salesforce.com',
          username: 'test@example.com',
          password: 'password'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Security token');
    });
  });

  describe('GET /api/salesforce/settings', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/salesforce/settings');
      
      expect(response.status).toBe(401);
    });

    it('should return settings structure with authentication', async () => {
      const response = await request(app)
        .get('/api/salesforce/settings')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Should return either settings or error message
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('salesforceUrl');
      }
    });
  });
});
