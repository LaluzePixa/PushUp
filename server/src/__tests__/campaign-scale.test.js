/**
 * Campaign Scale and Performance Tests
 * Tests to ensure campaigns work correctly with thousands of subscribers
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import campaignsRoutes from '../routes/campaigns.js';
import { authenticateToken } from '../middleware/auth.js';
import { TestDatabase, TestDataFactory, TestAuth } from '../../tests/testUtils.js';

// Mock web-push for performance testing
jest.mock('web-push');

describe('Campaign Scale Tests', () => {
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

        // Create test user and site
        testUser = await dataFactory.createUser();
        testSite = await dataFactory.createSite(testUser.id, {
            name: 'High Traffic Site',
            domain: 'hightraffic.com'
        });
        authHeaders = await TestAuth.createAuthHeaders(testUser.id, testUser);
    });

    afterEach(async () => {
        await testDb.cleanup();
    });

    describe('Large Scale Subscriber Handling', () => {
        test('should handle campaign with 100 subscribers', async () => {
            // Create 100 subscribers
            const subscriptions = [];
            for (let i = 0; i < 100; i++) {
                subscriptions.push(
                    dataFactory.createSubscription(testSite.id, {
                        endpoint: `https://fcm.googleapis.com/fcm/send/subscriber-${i}`,
                        userAgent: `Browser ${i}`
                    })
                );
            }
            await Promise.all(subscriptions);

            // Create and send campaign
            const startTime = Date.now();
            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign to 100 users',
                    title: 'Test Notification',
                    body: 'Testing with 100 subscribers',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            const duration = Date.now() - startTime;

            expect(response.status).toBe(201);
            expect(response.body.execution).toBeDefined();

            // Should complete within reasonable time (< 5 seconds for 100 users)
            expect(duration).toBeLessThan(5000);

            // Verify execution stats
            const executionStats = response.body.execution;
            expect(executionStats.total).toBeGreaterThanOrEqual(100);
        }, 10000); // 10 second timeout

        test('should handle campaign with 500 subscribers', async () => {
            // Create 500 subscribers in batches
            const batchSize = 50;
            for (let batch = 0; batch < 10; batch++) {
                const subscriptions = [];
                for (let i = 0; i < batchSize; i++) {
                    const index = batch * batchSize + i;
                    subscriptions.push(
                        dataFactory.createSubscription(testSite.id, {
                            endpoint: `https://fcm.googleapis.com/fcm/send/subscriber-${index}`,
                            userAgent: `Browser ${index}`
                        })
                    );
                }
                await Promise.all(subscriptions);
            }

            // Create and send campaign
            const startTime = Date.now();
            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign to 500 users',
                    title: 'Test Notification',
                    body: 'Testing with 500 subscribers',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            const duration = Date.now() - startTime;

            expect(response.status).toBe(201);
            expect(response.body.execution).toBeDefined();

            // Should complete within reasonable time (< 15 seconds for 500 users)
            expect(duration).toBeLessThan(15000);

            console.log(`✓ Campaign to 500 users completed in ${duration}ms`);
        }, 30000); // 30 second timeout

        test.skip('should handle campaign with 1000+ subscribers', async () => {
            // SKIP by default - takes 1-2 minutes
            // Enable with: npm test -- --testNamePattern="1000"

            // Create 1000 subscribers
            console.log('Creating 1000 subscribers...');
            const batchSize = 100;
            for (let batch = 0; batch < 10; batch++) {
                const subscriptions = [];
                for (let i = 0; i < batchSize; i++) {
                    const index = batch * batchSize + i;
                    subscriptions.push(
                        dataFactory.createSubscription(testSite.id, {
                            endpoint: `https://fcm.googleapis.com/fcm/send/subscriber-${index}`,
                            userAgent: `Browser ${index}`
                        })
                    );
                }
                await Promise.all(subscriptions);
                console.log(`  Batch ${batch + 1}/10 complete`);
            }

            console.log('Sending campaign to 1000 subscribers...');
            const startTime = Date.now();
            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign to 1000 users',
                    title: 'Test Notification',
                    body: 'Testing with 1000 subscribers',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            const duration = Date.now() - startTime;

            expect(response.status).toBe(201);
            expect(response.body.execution).toBeDefined();

            console.log(`✓ Campaign to 1000 users completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
            console.log(`  Average: ${(duration / 1000).toFixed(2)}ms per user`);

            // Should complete within reasonable time (< 60 seconds for 1000 users)
            expect(duration).toBeLessThan(60000);
        }, 120000); // 2 minute timeout
    });

    describe('Error Handling at Scale', () => {
        test('should handle partial failures in large batch', async () => {
            // Create 50 subscribers
            for (let i = 0; i < 50; i++) {
                await dataFactory.createSubscription(testSite.id, {
                    endpoint: `https://fcm.googleapis.com/fcm/send/subscriber-${i}`,
                    userAgent: `Browser ${i}`
                });
            }

            // Mock web-push to simulate some failures
            const webPush = await import('web-push');
            let callCount = 0;
            webPush.sendNotification.mockImplementation(() => {
                callCount++;
                // Fail every 5th call
                if (callCount % 5 === 0) {
                    return Promise.reject(new Error('Push service error'));
                }
                return Promise.resolve({ statusCode: 201 });
            });

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign with partial failures',
                    title: 'Test',
                    body: 'Testing error handling',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            expect(response.status).toBe(201);

            // Should track both successful and failed sends
            const execution = response.body.execution;
            expect(execution.sent).toBeGreaterThan(0);
            expect(execution.failed).toBeGreaterThan(0);
            expect(execution.total).toBe(execution.sent + execution.failed);
        });

        test('should not crash with invalid subscription data', async () => {
            // Create mix of valid and potentially problematic subscriptions
            const subscriptions = [
                // Valid
                {
                    endpoint: 'https://fcm.googleapis.com/fcm/send/valid-1',
                    userAgent: 'Chrome'
                },
                // Missing keys (edge case)
                {
                    endpoint: 'https://fcm.googleapis.com/fcm/send/edge-1',
                    userAgent: null
                },
                // Valid
                {
                    endpoint: 'https://fcm.googleapis.com/fcm/send/valid-2',
                    userAgent: 'Firefox'
                }
            ];

            for (const sub of subscriptions) {
                await dataFactory.createSubscription(testSite.id, sub);
            }

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign with edge cases',
                    title: 'Test',
                    body: 'Testing resilience',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            // Should handle gracefully
            expect(response.status).toBe(201);
            expect(response.body.execution).toBeDefined();
        });
    });

    describe('Performance Monitoring', () => {
        test('should provide accurate execution statistics', async () => {
            // Create 20 subscribers
            for (let i = 0; i < 20; i++) {
                await dataFactory.createSubscription(testSite.id, {
                    endpoint: `https://fcm.googleapis.com/fcm/send/sub-${i}`
                });
            }

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Stats Test Campaign',
                    title: 'Test',
                    body: 'Testing statistics',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            expect(response.status).toBe(201);

            const execution = response.body.execution;

            // Verify all expected fields
            expect(execution).toHaveProperty('total');
            expect(execution).toHaveProperty('sent');
            expect(execution).toHaveProperty('failed');

            // Total should match subscriber count
            expect(execution.total).toBeGreaterThanOrEqual(20);

            // Sent + Failed should equal Total
            expect(execution.sent + execution.failed).toBe(execution.total);
        });

        test('should track campaign execution time', async () => {
            // Create 10 subscribers
            for (let i = 0; i < 10; i++) {
                await dataFactory.createSubscription(testSite.id, {
                    endpoint: `https://fcm.googleapis.com/fcm/send/time-test-${i}`
                });
            }

            const beforeTime = new Date();

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Timing Test Campaign',
                    title: 'Test',
                    body: 'Testing execution time',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            const afterTime = new Date();
            const executionDuration = afterTime - beforeTime;

            expect(response.status).toBe(201);

            // Should complete quickly for small batch
            expect(executionDuration).toBeLessThan(5000);

            console.log(`  Execution time for 10 users: ${executionDuration}ms`);
        });
    });

    describe('Concurrent Campaign Handling', () => {
        test('should handle multiple concurrent campaigns', async () => {
            // Create subscribers for multiple sites
            const site2 = await dataFactory.createSite(testUser.id, {
                name: 'Site 2',
                domain: 'site2.com'
            });
            const site3 = await dataFactory.createSite(testUser.id, {
                name: 'Site 3',
                domain: 'site3.com'
            });

            // Add 10 subscribers to each site
            for (let i = 0; i < 10; i++) {
                await Promise.all([
                    dataFactory.createSubscription(testSite.id, {
                        endpoint: `https://fcm.googleapis.com/site1-${i}`
                    }),
                    dataFactory.createSubscription(site2.id, {
                        endpoint: `https://fcm.googleapis.com/site2-${i}`
                    }),
                    dataFactory.createSubscription(site3.id, {
                        endpoint: `https://fcm.googleapis.com/site3-${i}`
                    })
                ]);
            }

            // Send 3 campaigns concurrently
            const campaigns = await Promise.all([
                request(app)
                    .post('/campaigns')
                    .set(authHeaders)
                    .send({
                        name: 'Concurrent Campaign 1',
                        title: 'Test 1',
                        body: 'Campaign 1',
                        siteId: testSite.id,
                        sendType: 'immediate'
                    }),
                request(app)
                    .post('/campaigns')
                    .set(authHeaders)
                    .send({
                        name: 'Concurrent Campaign 2',
                        title: 'Test 2',
                        body: 'Campaign 2',
                        siteId: site2.id,
                        sendType: 'immediate'
                    }),
                request(app)
                    .post('/campaigns')
                    .set(authHeaders)
                    .send({
                        name: 'Concurrent Campaign 3',
                        title: 'Test 3',
                        body: 'Campaign 3',
                        siteId: site3.id,
                        sendType: 'immediate'
                    })
            ]);

            // All should succeed
            campaigns.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.execution).toBeDefined();
                expect(response.body.execution.total).toBeGreaterThanOrEqual(10);
            });
        });
    });

    describe('Memory and Resource Management', () => {
        test('should not leak memory with large datasets', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Create and send 3 campaigns with 50 subscribers each
            for (let campaign = 0; campaign < 3; campaign++) {
                // Create a fresh site for this campaign iteration
                const campaignSite = await dataFactory.createSite(testUser.id, {
                    name: `Memory Test Site ${campaign}`,
                    domain: `memtest${campaign}.com`
                });

                // Create 50 subscribers
                const subs = [];
                for (let i = 0; i < 50; i++) {
                    subs.push(
                        dataFactory.createSubscription(campaignSite.id, {
                            endpoint: `https://fcm.googleapis.com/campaign${campaign}-sub${i}`
                        })
                    );
                }
                await Promise.all(subs);

                // Send campaign
                await request(app)
                    .post('/campaigns')
                    .set(authHeaders)
                    .send({
                        name: `Memory Test Campaign ${campaign}`,
                        title: 'Test',
                        body: 'Testing memory',
                        siteId: campaignSite.id,
                        sendType: 'immediate'
                    });

                // Clean up subscribers for next iteration
                await testDb.cleanup();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

            console.log(`  Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`);

            // Memory increase should be reasonable (< 50 MB for this test)
            expect(memoryIncreaseMB).toBeLessThan(50);
        }, 60000);
    });
});
