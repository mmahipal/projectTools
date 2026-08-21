/**
 * Sanity Tests for Authentication Routes
 * Tests basic authentication functionality
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('../auth');
const { ROLES } = require('../../utils/roles');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('Authentication Routes - Sanity Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should login with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toBe('admin@example.com');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should register a new user', async () => {
      const uniqueEmail = `test${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'testpassword123',
          name: 'Test User'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toBe(uniqueEmail);
    });

    it('should return 400 for duplicate email', async () => {
      const email = `test${Date.now()}@example.com`;
      
      // Register first time
      await request(app)
        .post('/api/auth/register')
        .send({
          email: email,
          password: 'testpassword123',
          name: 'Test User'
        });
      
      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: email,
          password: 'testpassword123',
          name: 'Test User'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');
      
      expect(response.status).toBe(401);
    });

    it('should verify valid token', async () => {
      const token = jwt.sign(
        { id: '1', email: 'test@example.com', role: ROLES.ADMIN },
        JWT_SECRET
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeTruthy();
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });
      
      expect(response.status).toBe(404);
    });

    it('should generate reset token for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'admin@example.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeTruthy();
    });
  });
});
