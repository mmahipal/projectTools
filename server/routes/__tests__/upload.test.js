/**
 * Sanity Tests for Upload Routes
 * Tests basic file upload functionality
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const uploadRoutes = require('../upload');
const { ROLES } = require('../../utils/roles');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api/upload', uploadRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to create auth token
const createAuthToken = (user = { id: '1', email: 'test@example.com', role: ROLES.ADMIN, permissions: ['all'] }) => {
  return jwt.sign(user, JWT_SECRET);
};

describe('Upload Routes - Sanity Tests', () => {
  let authToken;

  beforeEach(() => {
    authToken = createAuthToken();
  });

  describe('POST /api/upload/json', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/upload/json');
      
      expect(response.status).toBe(401);
    });

    it('should return 400 for missing file', async () => {
      const response = await request(app)
        .post('/api/upload/json')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No file uploaded');
    });

    it('should parse valid JSON file', async () => {
      // Create a temporary JSON file
      const testData = { test: 'data', number: 123 };
      const tempFilePath = path.join(__dirname, '../../uploads', `test-${Date.now()}.json`);
      const uploadDir = path.dirname(tempFilePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(tempFilePath, JSON.stringify(testData));

      const response = await request(app)
        .post('/api/upload/json')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', tempFilePath);

      // Clean up
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(testData);
      expect(response.body.message).toContain('successfully');
    });
  });

  describe('POST /api/upload/csv', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/upload/csv');
      
      expect(response.status).toBe(401);
    });

    it('should return 400 for missing file', async () => {
      const response = await request(app)
        .post('/api/upload/csv')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
    });

    it('should parse valid CSV file', async () => {
      // Create a temporary CSV file
      const csvContent = 'name,email\nJohn Doe,john@example.com\nJane Doe,jane@example.com';
      const tempFilePath = path.join(__dirname, '../../uploads', `test-${Date.now()}.csv`);
      const uploadDir = path.dirname(tempFilePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(tempFilePath, csvContent);

      const response = await request(app)
        .post('/api/upload/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', tempFilePath);

      // Clean up
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
