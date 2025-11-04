/**
 * Campaigns Routes Tests
 * Integration tests for campaign management endpoints
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import campaignsRoutes from '../routes/campaigns.js';
import { authenticateToken } from '../middleware/auth.js';
import { TestDatabase, TestDataFactory, TestAuth, TestAssertions } from '../../tests/testUtils.js';

// Mock web-push for campaign tests
jest.mock('web-push');

describe('Campaigns Routes', () => {
    let app;
    let testDb;
    let dataFactory;
    let testUser;
    let testSite;
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
        app.use('/campaigns', authenticateToken, campaignsRoutes);

        // Create test user, site and auth headers
        testUser = await dataFactory.createUser();
        testSite = await dataFactory.createSite(testUser.id);
        authHeaders = await TestAuth.createAuthHeaders(testUser.id, testUser);
    });

    afterEach(async () => {
        await testDb.cleanup();
        jest.clearAllMocks();
    });

    describe('GET /campaigns', () => {
        test('should return user campaigns with pagination', async () => {
            // Create test campaigns
            await dataFactory.createCampaign(testUser.id, {
                name: 'Campaign 1',
                siteId: testSite.id
            });
            await dataFactory.createCampaign(testUser.id, {
                name: 'Campaign 2',
                siteId: testSite.id
            });

            const response = await request(app)
                .get('/campaigns')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.campaigns).toHaveLength(2);
            expect(response.body.data.pagination).toBeDefined();

            // Check campaign format
            const campaign = response.body.data.campaigns[0];
            expect(campaign.id).toBeDefined();
            expect(campaign.name).toBeDefined();
            expect(campaign.status).toBeDefined();
            expect(campaign.dateCreated).toBeDefined();
            expect(campaign.totalAttempts).toBeDefined();
        });

        test('should filter campaigns by status', async () => {
            await dataFactory.createCampaign(testUser.id, {
                name: 'Draft Campaign',
                status: 'draft'
            });
            await dataFactory.createCampaign(testUser.id, {
                name: 'Sent Campaign',
                status: 'sent'
            });

            const response = await request(app)
                .get('/campaigns?status=draft')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.campaigns).toHaveLength(1);
            expect(response.body.data.campaigns[0].name).toBe('Draft Campaign');
        });

        test('should search campaigns by name/title/body', async () => {
            await dataFactory.createCampaign(testUser.id, {
                name: 'Newsletter Campaign',
                title: 'Weekly Newsletter'
            });
            await dataFactory.createCampaign(testUser.id, {
                name: 'Promotion Campaign',
                title: 'Special Offer'
            });

            const response = await request(app)
                .get('/campaigns?search=newsletter')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.campaigns).toHaveLength(1);
            expect(response.body.data.campaigns[0].name).toBe('Newsletter Campaign');
        });

        test('should paginate campaigns correctly', async () => {
            // Create 5 campaigns
            for (let i = 1; i <= 5; i++) {
                await dataFactory.createCampaign(testUser.id, { name: `Campaign ${i}` });
            }

            const response = await request(app)
                .get('/campaigns?page=1&limit=3')
                .set(authHeaders);

            TestAssertions.expectSuccessResponse(response);
            expect(response.body.data.campaigns).toHaveLength(3);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(3);
            expect(response.body.data.pagination.total).toBe(5);
        });
    });

    describe('POST /campaigns', () => {
        beforeEach(async () => {
            // Create subscriptions for testing
            await dataFactory.createSubscription(testSite.id);
            await dataFactory.createSubscription(testSite.id);
        });

        test('should create and send immediate campaign successfully', async () => {
            const campaignData = {
                name: 'Test Campaign',
                title: 'Test Title',
                body: 'Test message body',
                iconUrl: 'https://example.com/icon.png',
                clickUrl: 'https://example.com',
                siteId: testSite.id,
                sendType: 'immediate'
            };

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send(campaignData);

            TestAssertions.expectSuccessResponse(response, 201);
            expect(response.body.message).toContain('enviada exitosamente');
            expect(response.body.data.name).toBe(campaignData.name);
            expect(response.body.execution).toBeDefined();
            expect(response.body.execution.sent).toBeDefined();
        });

        test('should create draft campaign successfully', async () => {
            const campaignData = {
                name: 'Draft Campaign',
                title: 'Draft Title',
                body: 'Draft message body',
                sendType: 'draft'
            };

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send(campaignData);

            TestAssertions.expectSuccessResponse(response, 201);
            expect(response.body.message).toContain('creada exitosamente');
            expect(response.body.data.status).toBe('draft');
        });

        test('should create scheduled campaign successfully', async () => {
            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 1);

            const campaignData = {
                name: 'Scheduled Campaign',
                title: 'Scheduled Title',
                body: 'Scheduled message body',
                sendType: 'scheduled',
                scheduledAt: futureDate.toISOString()
            };

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send(campaignData);

            TestAssertions.expectSuccessResponse(response, 201);
            expect(response.body.message).toContain('programada exitosamente');
            expect(response.body.data.status).toBe('scheduled');
        });

        test('should create campaign with action buttons', async () => {
            const campaignData = {
                name: 'Campaign with Actions',
                title: 'Test Title',
                body: 'Test message body',
                sendType: 'draft',
                actions: [
                    { text: 'View Offer', url: 'https://example.com/offer' },
                    { text: 'Learn More', url: 'https://example.com/learn' }
                ]
            };

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send(campaignData);

            TestAssertions.expectSuccessResponse(response, 201);
            expect(response.body.data.name).toBe(campaignData.name);
        });

        test('should reject campaign with invalid data', async () => {
            const campaignData = {
                name: '',
                title: '',
                body: ''
            };

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send(campaignData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
            expect(response.body.details).toContain('El nombre es requerido');
            expect(response.body.details).toContain('El título es requerido');
            expect(response.body.details).toContain('El cuerpo del mensaje es requerido');
        });

        test('should reject scheduled campaign with past date', async () => {
            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 1);

            const campaignData = {
                name: 'Invalid Scheduled Campaign',
                title: 'Test Title',
                body: 'Test message body',
                sendType: 'scheduled',
                scheduledAt: pastDate.toISOString()
            };

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send(campaignData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
            expect(response.body.details).toContain('La fecha de programación debe ser futura');
        });
    });

    describe('GET /campaigns/:id', () => {
        let testCampaign;

        beforeEach(async () => {
            testCampaign = await dataFactory.createCampaign(testUser.id, {
                siteId: testSite.id
            });
        });

        test('should return campaign details with stats', async () => {
            const response = await request(app)
                .get(`/campaigns/${testCampaign.id}`)
                .set(authHeaders);

            TestAssertions.expectValidResponse(response);
            expect(response.body.campaign.id).toBe(testCampaign.id);
            expect(response.body.campaign.name).toBe(testCampaign.name);
            expect(response.body.campaign.title).toBe(testCampaign.title);
            expect(response.body.campaign.body).toBe(testCampaign.body);
            expect(response.body.executionStats).toBeDefined();
        });

        test('should return 404 for non-existent campaign', async () => {
            const response = await request(app)
                .get('/campaigns/999')
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'CAMPAIGN_NOT_FOUND');
        });

        test('should return 404 for campaign owned by another user', async () => {
            const otherUser = await dataFactory.createUser({ email: 'other@example.com' });
            const otherCampaign = await dataFactory.createCampaign(otherUser.id);

            const response = await request(app)
                .get(`/campaigns/${otherCampaign.id}`)
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'CAMPAIGN_NOT_FOUND');
        });
    });

    describe('PUT /campaigns/:id', () => {
        let draftCampaign;
        let sentCampaign;

        beforeEach(async () => {
            draftCampaign = await dataFactory.createCampaign(testUser.id, {
                status: 'draft'
            });
            sentCampaign = await dataFactory.createCampaign(testUser.id, {
                status: 'sent'
            });
        });

        test('should update draft campaign successfully', async () => {
            const updateData = {
                name: 'Updated Campaign Name',
                title: 'Updated Title',
                body: 'Updated message body',
                sendType: 'draft'
            };

            const response = await request(app)
                .put(`/campaigns/${draftCampaign.id}`)
                .set(authHeaders)
                .send(updateData);

            TestAssertions.expectValidResponse(response);
            expect(response.body.campaign.name).toBe(updateData.name);
            expect(response.body.campaign.title).toBe(updateData.title);
            expect(response.body.campaign.body).toBe(updateData.body);
        });

        test('should reject update of sent campaign', async () => {
            const updateData = {
                name: 'Updated Campaign Name',
                title: 'Updated Title',
                body: 'Updated message body'
            };

            const response = await request(app)
                .put(`/campaigns/${sentCampaign.id}`)
                .set(authHeaders)
                .send(updateData);

            TestAssertions.expectErrorResponse(response, 400, 'CAMPAIGN_NOT_EDITABLE');
        });

        test('should reject update with invalid data', async () => {
            const updateData = {
                name: '',
                title: '',
                body: ''
            };

            const response = await request(app)
                .put(`/campaigns/${draftCampaign.id}`)
                .set(authHeaders)
                .send(updateData);

            TestAssertions.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
        });
    });

    describe('DELETE /campaigns/:id', () => {
        let testCampaign;

        beforeEach(async () => {
            testCampaign = await dataFactory.createCampaign(testUser.id);
        });

        test('should delete campaign successfully', async () => {
            const response = await request(app)
                .delete(`/campaigns/${testCampaign.id}`)
                .set(authHeaders);

            TestAssertions.expectValidResponse(response);
            expect(response.body.deletedCampaign.id).toBe(testCampaign.id);
        });

        test('should return 404 for non-existent campaign', async () => {
            const response = await request(app)
                .delete('/campaigns/999')
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'CAMPAIGN_NOT_FOUND');
        });
    });

    describe('POST /campaigns/:id/send', () => {
        let draftCampaign;
        let sentCampaign;

        beforeEach(async () => {
            // Create subscriptions for testing
            await dataFactory.createSubscription(testSite.id);

            draftCampaign = await dataFactory.createCampaign(testUser.id, {
                status: 'draft',
                siteId: testSite.id
            });
            sentCampaign = await dataFactory.createCampaign(testUser.id, {
                status: 'sent'
            });
        });

        test('should send draft campaign successfully', async () => {
            const response = await request(app)
                .post(`/campaigns/${draftCampaign.id}/send`)
                .set(authHeaders);

            TestAssertions.expectValidResponse(response);
            expect(response.body.message).toContain('enviada exitosamente');
            expect(response.body.campaign.status).toBe('sent');
            expect(response.body.execution).toBeDefined();
        });

        test('should reject sending already sent campaign', async () => {
            const response = await request(app)
                .post(`/campaigns/${sentCampaign.id}/send`)
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 400, 'CAMPAIGN_NOT_SENDABLE');
        });

        test('should return 404 for non-existent campaign', async () => {
            const response = await request(app)
                .post('/campaigns/999/send')
                .set(authHeaders);

            TestAssertions.expectErrorResponse(response, 404, 'CAMPAIGN_NOT_FOUND');
        });
    });
});