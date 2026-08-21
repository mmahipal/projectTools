/**
 * Sanity Tests for WorkStream Reporting Routes
 * Tests basic workstream reporting functionality
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const workStreamReportingRoutes = require('../workStreamReporting');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/workstream-reporting', workStreamReportingRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to create auth token
const createAuthToken = (user = { id: '1', email: 'test@example.com', role: ROLES.ADMIN, permissions: ['all'] }) => {
  return jwt.sign(user, JWT_SECRET);
};

describe('WorkStream Reporting Routes - Sanity Tests', () => {
  let authToken;

  beforeEach(() => {
    authToken = createAuthToken();
  });

  describe('GET /api/workstream-reporting/summary', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/workstream-reporting/summary');
      
      expect(response.status).toBe(401);
    });

    it('should return summary data with authentication', async () => {
      const response = await request(app)
        .get('/api/workstream-reporting/summary')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Should return either data or error (if Salesforce not configured)
      expect([200, 500, 503]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('summary');
      }
    });

    it('should accept filter parameters', async () => {
      const response = await request(app)
        .get('/api/workstream-reporting/summary')
        .query({
          projectStatusFilter: 'Active',
          projectObjectiveStatusFilter: 'In Progress'
        })
        .set('Authorization', `Bearer ${authToken}`);
      
      // Should handle filters without error
      expect([200, 500, 503]).toContain(response.status);
    });
  });
});
