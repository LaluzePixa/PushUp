/**
 * Sites Routes Tests
 * Integration tests for sites management endpoints
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import sitesRoutes from '../routes/sites.js';
import { authenticateToken } from '../middleware/auth.js';
import { TestDatabase, TestDataFactory, TestAuth, TestAssertions } from '../../tests/testUtils.js';

describe('Sites Routes', () => {
    let app;
    let testDb;
    let dataFactory;
    let testUser;
    let authHeaders;

    beforeEach(async () => {
        // Setup test app
        app = express();
        app.use(bodyParser.json());

        // Setup test database
        testDb = new TestDatabase();
        dataFactory = new TestDataFactory(testDb);

        // Add database to app locals
        app.locals.pool = testDb.pool;

        // Setup routes with authentication
        app.use('/sites', authenticateToken, sitesRoutes);

        // Create test user and auth headers
        testUser = await dataFactory.createUser();
        authHeaders = await TestAuth.createAuthHeaders(testUser.id, testUser);
    });

    afterEach(async () => {
        await testDb.cleanup();
    });

    describe('GET /sites', () => {
        test('should return user sites with pagination', async () => {
            // Create test sites
            await dataFactory.createSite(testUser.id, { name: 'Site 1' });
            await dataFactory.createSite(testUser.id, { name: 'Site 2' });

            const response = await request(app)
                .get('/sites')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            TestAssertions.expectPaginatedResponse(response);
            expect(response.body.data.sites).toHaveLength(2);
            expect(response.body.data.sites[0].subscribersCount).toBeDefined();
            expect(response.body.data.sites[0].campaignsCount).toBeDefined();
        });

        test('should return empty list for user with no sites', async () => {
            const response = await request(app)
                .get('/sites')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.sites).toHaveLength(0);
            expect(response.body.data.pagination.total).toBe(0);
        });

        test('should filter sites by search query', async () => {
            await dataFactory.createSite(testUser.id, {
                name: 'Test Blog',
                domain: 'blog.test.com'
            });
            await dataFactory.createSite(testUser.id, {
                name: 'My Shop',
                domain: 'shop.example.com'
            });

            const response = await request(app)
                .get('/sites?search=blog')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.sites).toHaveLength(1);
            expect(response.body.data.sites[0].name).toBe('Test Blog');
        });

        test('should filter sites by active status', async () => {
            await dataFactory.createSite(testUser.id, {
                name: 'Active Site',
                isActive: true
            });
            await dataFactory.createSite(testUser.id, {
                name: 'Inactive Site',
                isActive: false
            });

            const response = await request(app)
                .get('/sites?isActive=true')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.sites).toHaveLength(1);
            expect(response.body.data.sites[0].name).toBe('Active Site');
        });

        test('should paginate sites correctly', async () => {
            // Create 5 sites
            for (let i = 1; i <= 5; i++) {
                await dataFactory.createSite(testUser.id, { name: `Site ${i}` });
            }

            const response = await request(app)
                .get('/sites?page=1&limit=3')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.sites).toHaveLength(3);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(3);
            expect(response.body.data.pagination.total).toBe(5);
            expect(response.body.data.pagination.totalPages).toBe(2);
        });
    });

    describe('POST /sites', () => {
        test('should create new site successfully', async () => {
            const siteData = {
                name: 'My New Site',
                domain: 'mynewsite.com',
                description: 'A test site'
            };

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send(siteData);

            TestAssertions.expectSuccessResponse(response, 201);
            expect(response.body.data.name).toBe(siteData.name);
            expect(response.body.data.domain).toBe(siteData.domain);
            expect(response.body.data.description).toBe(siteData.description);
            expect(response.body.data.isActive).toBe(true);
            expect(response.body.data.subscribersCount).toBe(0);
        });

        test('should reject site creation with invalid data', async () => {
            const siteData = {
                name: '',
                domain: 'invalid-domain'
            };

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send(siteData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
            expect(response.body.details).toContain('El nombre es requerido');
            expect(response.body.details).toContain('El formato del dominio no es válido');
        });

        test('should reject duplicate domain for same user', async () => {
            const domain = 'duplicate.com';

            // Create first site
            await dataFactory.createSite(testUser.id, { domain });

            // Try to create second site with same domain
            const siteData = {
                name: 'Duplicate Site',
                domain: domain
            };

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send(siteData);

            TestAssertions.expectErrorResponse(response, 409, 'DOMAIN_EXISTS');
        });

        test('should enforce site limit for regular users', async () => {
            // Create maximum allowed sites (5 for regular users)
            for (let i = 1; i <= 5; i++) {
                await dataFactory.createSite(testUser.id, {
                    name: `Site ${i}`,
                    domain: `site${i}.com`
                });
            }

            // Try to create one more
            const siteData = {
                name: 'Exceeding Limit',
                domain: 'exceeding.com'
            };

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send(siteData);

            TestAssertions.expectErrorResponse(response, 403, 'SITES_LIMIT_EXCEEDED');
        });

        test('should allow admin users to exceed site limit', async () => {
            // Create admin user
            const adminUser = await dataFactory.createUser({ role: 'admin' });
            const adminHeaders = await TestAuth.createAuthHeaders(adminUser.id, adminUser);

            // Create more than 5 sites
            for (let i = 1; i <= 6; i++) {
                const siteData = {
                    name: `Admin Site ${i}`,
                    domain: `adminsite${i}.com`
                };

                const response = await request(app)
                    .post('/sites')
                    .set(adminHeaders)
                    .send(siteData);

                TestAssertions.expectSuccessResponse(response, 201);
            }
        });
    });

    describe('GET /sites/:id', () => {
        let testSite;

        beforeEach(async () => {
            testSite = await dataFactory.createSite(testUser.id);
            // Create some subscriptions and campaigns for the site
            await dataFactory.createSubscription(testSite.id);
            await dataFactory.createCampaign(testUser.id, { siteId: testSite.id });
        });

        test('should return site details with metrics', async () => {
            const response = await request(app)
                .get(`/sites/${testSite.id}`)
                .set(authHeaders);

            TestAssertions.expectValidResponse(response);
            expect(response.body.site.id).toBe(testSite.id);
            expect(response.body.site.name).toBe(testSite.name);
            expect(response.body.site.subscribersCount).toBe(1);
            expect(response.body.site.campaignsCount).toBe(1);
        });

        test('should return 404 for non-existent site', async () => {
            const response = await request(app)
                .get('/sites/999')
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'SITE_NOT_FOUND');
        });

        test('should return 404 for site owned by another user', async () => {
            const otherUser = await dataFactory.createUser({ email: 'other@example.com' });
            const otherSite = await dataFactory.createSite(otherUser.id);

            const response = await request(app)
                .get(`/sites/${otherSite.id}`)
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'SITE_NOT_FOUND');
        });
    });

    describe('PUT /sites/:id', () => {
        let testSite;

        beforeEach(async () => {
            testSite = await dataFactory.createSite(testUser.id);
        });

        test('should update site successfully', async () => {
            const updateData = {
                name: 'Updated Site Name',
                domain: 'updated.com',
                description: 'Updated description',
                isActive: false
            };

            const response = await request(app)
                .put(`/sites/${testSite.id}`)
                .set(authHeaders)
                .send(updateData);

            TestAssertions.expectValidResponse(response);
            expect(response.body.site.name).toBe(updateData.name);
            expect(response.body.site.domain).toBe(updateData.domain);
            expect(response.body.site.description).toBe(updateData.description);
            expect(response.body.site.isActive).toBe(updateData.isActive);
        });

        test('should reject update with invalid data', async () => {
            const updateData = {
                name: '',
                domain: 'invalid-domain'
            };

            const response = await request(app)
                .put(`/sites/${testSite.id}`)
                .set(authHeaders)
                .send(updateData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
        });

        test('should reject domain conflict with other user site', async () => {
            const conflictDomain = 'conflict.com';
            await dataFactory.createSite(testUser.id, { domain: conflictDomain });

            const updateData = {
                name: 'Test Site',
                domain: conflictDomain
            };

            const response = await request(app)
                .put(`/sites/${testSite.id}`)
                .set(authHeaders)
                .send(updateData);

            TestAssertions.expectErrorResponse(response, 409, 'DOMAIN_EXISTS');
        });
    });

    describe('DELETE /sites/:id', () => {
        let testSite;

        beforeEach(async () => {
            testSite = await dataFactory.createSite(testUser.id);
        });

        test('should delete site successfully when no subscriptions', async () => {
            const response = await request(app)
                .delete(`/sites/${testSite.id}`)
                .set(authHeaders);

            TestAssertions.expectValidResponse(response);
            expect(response.body.deletedSite.id).toBe(testSite.id);
        });

        test('should reject deletion when site has subscriptions', async () => {
            // Add subscription to site
            await dataFactory.createSubscription(testSite.id);

            const response = await request(app)
                .delete(`/sites/${testSite.id}`)
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 400, 'SITE_HAS_SUBSCRIPTIONS');
            expect(response.body.subscriptionsCount).toBe(1);
        });

        test('should return 404 for non-existent site', async () => {
            const response = await request(app)
                .delete('/sites/999')
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'SITE_NOT_FOUND');
        });
    });

    describe('GET /sites/:id/subscriptions', () => {
        let testSite;

        beforeEach(async () => {
            testSite = await dataFactory.createSite(testUser.id);
            // Create multiple subscriptions
            for (let i = 1; i <= 3; i++) {
                await dataFactory.createSubscription(testSite.id, {
                    endpoint: `https://fcm.googleapis.com/fcm/send/test-${i}`,
                    userAgent: `Test Agent ${i}`
                });
            }
        });

        test('should return site subscriptions with pagination', async () => {
            const response = await request(app)
                .get(`/sites/${testSite.id}/subscriptions`)
                .set(authHeaders);

            TestAssertions.expectValidResponse(response);
            expect(response.body.subscriptions).toHaveLength(3);
            expect(response.body.pagination.total).toBe(3);
            expect(response.body.site.id).toBe(testSite.id);
        });

        test('should paginate subscriptions correctly', async () => {
            const response = await request(app)
                .get(`/sites/${testSite.id}/subscriptions?page=1&limit=2`)
                .set(authHeaders);

            TestAssertions.expectValidResponse(response);
            expect(response.body.subscriptions).toHaveLength(2);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
            expect(response.body.pagination.total).toBe(3);
        });

        test('should return 404 for non-existent site', async () => {
            const response = await request(app)
                .get('/sites/999/subscriptions')
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'SITE_NOT_FOUND');
        });
    });
});