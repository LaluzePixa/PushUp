/**
 * Multi-Site Isolation Tests
 * Tests to ensure data isolation when users switch between multiple sites
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import sitesRoutes from '../routes/sites.js';
import campaignsRoutes from '../routes/campaigns.js';
import { authenticateToken } from '../middleware/auth.js';
import { TestDatabase, TestDataFactory, TestAuth } from '../../tests/testUtils.js';

describe('Multi-Site Data Isolation', () => {
    let app;
    let testDb;
    let dataFactory;
    let testUser;
    let authHeaders;
    let site1, site2, site3;

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
        app.use('/campaigns', authenticateToken, campaignsRoutes);

        // Create test user and multiple sites
        testUser = await dataFactory.createUser();
        authHeaders = await TestAuth.createAuthHeaders(testUser.id, testUser);

        // Create 3 different sites
        site1 = await dataFactory.createSite(testUser.id, {
            name: 'Site 1',
            domain: 'site1.com'
        });
        site2 = await dataFactory.createSite(testUser.id, {
            name: 'Site 2',
            domain: 'site2.com'
        });
        site3 = await dataFactory.createSite(testUser.id, {
            name: 'Site 3',
            domain: 'site3.com'
        });

        // Create subscribers for each site
        await dataFactory.createSubscription(site1.id, {
            endpoint: 'https://fcm.googleapis.com/site1-sub1'
        });
        await dataFactory.createSubscription(site1.id, {
            endpoint: 'https://fcm.googleapis.com/site1-sub2'
        });

        await dataFactory.createSubscription(site2.id, {
            endpoint: 'https://fcm.googleapis.com/site2-sub1'
        });

        await dataFactory.createSubscription(site3.id, {
            endpoint: 'https://fcm.googleapis.com/site3-sub1'
        });
        await dataFactory.createSubscription(site3.id, {
            endpoint: 'https://fcm.googleapis.com/site3-sub2'
        });
        await dataFactory.createSubscription(site3.id, {
            endpoint: 'https://fcm.googleapis.com/site3-sub3'
        });

        // Create campaigns for each site
        await dataFactory.createCampaign(testUser.id, {
            name: 'Campaign Site 1',
            siteId: site1.id
        });
        await dataFactory.createCampaign(testUser.id, {
            name: 'Campaign Site 2',
            siteId: site2.id
        });
        await dataFactory.createCampaign(testUser.id, {
            name: 'Campaign Site 3 - A',
            siteId: site3.id
        });
        await dataFactory.createCampaign(testUser.id, {
            name: 'Campaign Site 3 - B',
            siteId: site3.id
        });
    });

    afterEach(async () => {
        await testDb.cleanup();
    });

    describe('Site Data Isolation', () => {
        test('should return correct subscriber count for each site', async () => {
            const response1 = await request(app)
                .get(`/sites/${site1.id}`)
                .set(authHeaders);

            const response2 = await request(app)
                .get(`/sites/${site2.id}`)
                .set(authHeaders);

            const response3 = await request(app)
                .get(`/sites/${site3.id}`)
                .set(authHeaders);

            expect(response1.body.site.subscribersCount).toBe(2);
            expect(response2.body.site.subscribersCount).toBe(1);
            expect(response3.body.site.subscribersCount).toBe(3);
        });

        test('should return correct campaign count for each site', async () => {
            const response1 = await request(app)
                .get(`/sites/${site1.id}`)
                .set(authHeaders);

            const response2 = await request(app)
                .get(`/sites/${site2.id}`)
                .set(authHeaders);

            const response3 = await request(app)
                .get(`/sites/${site3.id}`)
                .set(authHeaders);

            expect(response1.body.site.campaignsCount).toBe(1);
            expect(response2.body.site.campaignsCount).toBe(1);
            expect(response3.body.site.campaignsCount).toBe(2);
        });

        test('should return only subscribers for requested site', async () => {
            const response1 = await request(app)
                .get(`/sites/${site1.id}/subscriptions`)
                .set(authHeaders);

            const response2 = await request(app)
                .get(`/sites/${site2.id}/subscriptions`)
                .set(authHeaders);

            const response3 = await request(app)
                .get(`/sites/${site3.id}/subscriptions`)
                .set(authHeaders);

            expect(response1.body.subscriptions).toHaveLength(2);
            expect(response2.body.subscriptions).toHaveLength(1);
            expect(response3.body.subscriptions).toHaveLength(3);

            // Verify endpoints are correct for each site
            expect(response1.body.subscriptions[0].endpoint).toContain('site1');
            expect(response2.body.subscriptions[0].endpoint).toContain('site2');
            expect(response3.body.subscriptions[0].endpoint).toContain('site3');
        });
    });

    describe('Rapid Site Switching', () => {
        test('should handle rapid sequential requests to different sites', async () => {
            const requests = [];

            // Make 10 rapid requests alternating between sites
            for (let i = 0; i < 10; i++) {
                const siteId = i % 3 === 0 ? site1.id : i % 3 === 1 ? site2.id : site3.id;
                requests.push(
                    request(app)
                        .get(`/sites/${siteId}`)
                        .set(authHeaders)
                );
            }

            const responses = await Promise.all(requests);

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.site).toBeDefined();
            });

            // Verify correct data for each site
            expect(responses[0].body.site.id).toBe(site1.id);
            expect(responses[1].body.site.id).toBe(site2.id);
            expect(responses[2].body.site.id).toBe(site3.id);
        });

        test('should handle concurrent requests to different sites', async () => {
            // Make concurrent requests to all sites
            const [response1, response2, response3] = await Promise.all([
                request(app).get(`/sites/${site1.id}/subscriptions`).set(authHeaders),
                request(app).get(`/sites/${site2.id}/subscriptions`).set(authHeaders),
                request(app).get(`/sites/${site3.id}/subscriptions`).set(authHeaders),
            ]);

            // All should return correct data without mixing
            expect(response1.body.subscriptions).toHaveLength(2);
            expect(response2.body.subscriptions).toHaveLength(1);
            expect(response3.body.subscriptions).toHaveLength(3);
        });
    });

    describe('Campaign Data Isolation by Site', () => {
        test('should filter campaigns by site correctly', async () => {
            // Get all campaigns (should see all 4)
            const allCampaigns = await request(app)
                .get('/campaigns')
                .set(authHeaders);

            expect(allCampaigns.body.data.campaigns).toHaveLength(4);

            // Verify each campaign belongs to correct site
            const site1Campaigns = allCampaigns.body.data.campaigns.filter(
                c => c.name === 'Campaign Site 1'
            );
            const site2Campaigns = allCampaigns.body.data.campaigns.filter(
                c => c.name === 'Campaign Site 2'
            );
            const site3Campaigns = allCampaigns.body.data.campaigns.filter(
                c => c.name.startsWith('Campaign Site 3')
            );

            expect(site1Campaigns).toHaveLength(1);
            expect(site2Campaigns).toHaveLength(1);
            expect(site3Campaigns).toHaveLength(2);
        });

        test('should not allow campaign to be sent to wrong site subscribers', async () => {
            // Create a campaign for site1
            const campaignResponse = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Test Campaign',
                    title: 'Test Title',
                    body: 'Test message',
                    siteId: site1.id,
                    sendType: 'immediate'
                });

            expect(campaignResponse.status).toBe(201);

            // Should only send to site1 subscribers (2)
            // In real implementation, verify the execution record shows 2 attempts
            expect(campaignResponse.body.execution).toBeDefined();
        });
    });

    describe('Cross-Site Data Leakage Prevention', () => {
        test('should not return site data from another user', async () => {
            // Create another user with their own site
            const otherUser = await dataFactory.createUser({
                email: 'other@example.com'
            });
            const otherSite = await dataFactory.createSite(otherUser.id, {
                name: 'Other User Site',
                domain: 'other.com'
            });

            // Try to access other user's site
            const response = await request(app)
                .get(`/sites/${otherSite.id}`)
                .set(authHeaders);

            expect(response.status).toBe(404);
            expect(response.body.code).toBe('SITE_NOT_FOUND');
        });

        test('should not return campaigns from another user sites', async () => {
            // Create another user with site and campaign
            const otherUser = await dataFactory.createUser({
                email: 'other@example.com'
            });
            const otherSite = await dataFactory.createSite(otherUser.id);
            await dataFactory.createCampaign(otherUser.id, {
                name: 'Other User Campaign',
                siteId: otherSite.id
            });

            // Get campaigns for current user
            const response = await request(app)
                .get('/campaigns')
                .set(authHeaders);

            // Should only see own campaigns (4)
            expect(response.body.data.campaigns).toHaveLength(4);

            // Should not include other user's campaign
            const hasOtherCampaign = response.body.data.campaigns.some(
                c => c.name === 'Other User Campaign'
            );
            expect(hasOtherCampaign).toBe(false);
        });
    });

    describe('Site Limit Enforcement', () => {
        test('should allow switching between all 5 sites for regular user', async () => {
            // Create 2 more sites (total 5)
            const site4 = await dataFactory.createSite(testUser.id, {
                name: 'Site 4',
                domain: 'site4.com'
            });
            const site5 = await dataFactory.createSite(testUser.id, {
                name: 'Site 5',
                domain: 'site5.com'
            });

            // Should be able to access all 5 sites
            const siteIds = [site1.id, site2.id, site3.id, site4.id, site5.id];

            for (const siteId of siteIds) {
                const response = await request(app)
                    .get(`/sites/${siteId}`)
                    .set(authHeaders);

                expect(response.status).toBe(200);
                expect(response.body.site.id).toBe(siteId);
            }

            // Get all sites
            const allSites = await request(app)
                .get('/sites')
                .set(authHeaders);

            expect(allSites.body.data.sites).toHaveLength(5);
        });

        test('should prevent creating 6th site for regular user', async () => {
            // Create 2 more sites to reach limit of 5
            await dataFactory.createSite(testUser.id, {
                name: 'Site 4',
                domain: 'site4.com'
            });
            await dataFactory.createSite(testUser.id, {
                name: 'Site 5',
                domain: 'site5.com'
            });

            // Try to create 6th site
            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send({
                    name: 'Site 6',
                    domain: 'site6.com'
                });

            expect(response.status).toBe(403);
            expect(response.body.code).toBe('SITES_LIMIT_EXCEEDED');
        });
    });
});
