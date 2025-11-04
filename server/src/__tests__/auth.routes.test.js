/**
 * Authentication Routes Tests
 * Integration tests for auth endpoints: register, login, me, change-password
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from '../routes/auth.js';
import { TestDatabase, TestDataFactory, TestAssertions } from '../../tests/testUtils.js';

describe('Authentication Routes', () => {
    let app;
    let testDb;
    let dataFactory;

    beforeEach(async () => {
        // Setup test app
        app = express();
        app.use(bodyParser.json());

        // Setup test database
        testDb = new TestDatabase();
        dataFactory = new TestDataFactory(testDb);

        // Add database to app locals
        app.locals.pool = testDb.pool;

        // Setup routes
        app.use('/auth', authRoutes);
    });

    afterEach(async () => {
        await testDb.cleanup();
    });

    describe('POST /auth/register', () => {
        test('should register new user successfully', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'ValidPassword123!'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            TestAssertions.expectSuccessResponse(response, 201);
            expect(response.body.message).toBe('Usuario registrado exitosamente');
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.role).toBe('user');
            expect(response.body.token).toBeDefined();
        });

        test('should reject registration with invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'ValidPassword123!'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
            expect(response.body.details).toContain('El email no tiene un formato válido');
        });

        test('should reject registration with weak password', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'weak'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
            expect(response.body.details).toContain('La contraseña debe tener al menos 12 caracteres');
        });

        test('should reject registration with duplicate email', async () => {
            // Create existing user
            await dataFactory.createUser({ email: 'existing@example.com' });

            const userData = {
                email: 'existing@example.com',
                password: 'ValidPassword123!'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            TestAssertions.expectErrorResponse(response, 409, 'EMAIL_EXISTS');
        });

        test('should reject registration with missing fields', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({});

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
            expect(response.body.details).toContain('Email y contraseña son requeridos');
        });
    });

    describe('POST /auth/login', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await dataFactory.createUser({
                email: 'logintest@example.com',
                password: 'ValidPassword123!'
            });
        });

        test('should login with valid credentials', async () => {
            const credentials = {
                email: 'logintest@example.com',
                password: 'ValidPassword123!'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(credentials);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.message).toBe('Login exitoso');
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(credentials.email);
            expect(response.body.token).toBeDefined();
        });

        test('should reject login with invalid email', async () => {
            const credentials = {
                email: 'nonexistent@example.com',
                password: 'ValidPassword123!'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(credentials);

            TestAssertions.expectErrorResponse(response, 401, 'INVALID_CREDENTIALS');
        });

        test('should reject login with invalid password', async () => {
            const credentials = {
                email: 'logintest@example.com',
                password: 'WrongPassword123!'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(credentials);

            TestAssertions.expectErrorResponse(response, 401, 'INVALID_CREDENTIALS');
        });

        test('should reject login for inactive user', async () => {
            // Create inactive user
            const inactiveUser = await dataFactory.createUser({
                email: 'inactive@example.com',
                password: 'ValidPassword123!',
                isActive: false
            });

            const credentials = {
                email: 'inactive@example.com',
                password: 'ValidPassword123!'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(credentials);

            TestAssertions.expectErrorResponse(response, 401, 'ACCOUNT_INACTIVE');
        });

        test('should reject login with missing fields', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});

            TestAssertions.expectErrorResponse(response, 400, 'MISSING_FIELDS');
        });
    });

    describe('GET /auth/me', () => {
        let testUser;
        let authToken;

        beforeEach(async () => {
            testUser = await dataFactory.createUser();
            const { signJWT } = await import('../middleware/auth.js');
            authToken = signJWT({
                id: testUser.id,
                email: testUser.email,
                role: testUser.role
            });
        });

        test('should return current user info with valid token', async () => {
            const response = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            TestAssertions.expectValidResponse(response);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.id).toBe(testUser.id);
            expect(response.body.user.email).toBe(testUser.email);
            expect(response.body.user.role).toBe(testUser.role);
        });

        test('should reject request without token', async () => {
            const response = await request(app)
                .get('/auth/me');

            TestAssertions.expectErrorResponse(response, 401, 'NO_TOKEN');
        });

        test('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            TestAssertions.expectErrorResponse(response, 401, 'INVALID_TOKEN');
        });
    });

    describe('POST /auth/change-password', () => {
        let testUser;
        let authToken;

        beforeEach(async () => {
            testUser = await dataFactory.createUser({
                password: 'CurrentPassword123!'
            });
            const { signJWT } = await import('../middleware/auth.js');
            authToken = signJWT({
                id: testUser.id,
                email: testUser.email,
                role: testUser.role
            });
        });

        test('should change password successfully', async () => {
            const passwordData = {
                currentPassword: 'CurrentPassword123!',
                newPassword: 'NewPassword123!'
            };

            const response = await request(app)
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData);

            TestAssertions.expectValidResponse(response);
            expect(response.body.message).toBe('Contraseña actualizada exitosamente');
        });

        test('should reject change with incorrect current password', async () => {
            const passwordData = {
                currentPassword: 'WrongPassword123!',
                newPassword: 'NewPassword123!'
            };

            const response = await request(app)
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData);

            TestAssertions.expectErrorResponse(response, 400, 'INVALID_CURRENT_PASSWORD');
        });

        test('should reject change with weak new password', async () => {
            const passwordData = {
                currentPassword: 'CurrentPassword123!',
                newPassword: 'weak'
            };

            const response = await request(app)
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
        });

        test('should reject change without authentication', async () => {
            const passwordData = {
                currentPassword: 'CurrentPassword123!',
                newPassword: 'NewPassword123!'
            };

            const response = await request(app)
                .post('/auth/change-password')
                .send(passwordData);

            TestAssertions.expectErrorResponse(response, 401, 'NO_TOKEN');
        });

        test('should reject change with missing fields', async () => {
            const response = await request(app)
                .post('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            TestAssertions.expectErrorResponse(response, 400, 'MISSING_FIELDS');
        });
    });
});