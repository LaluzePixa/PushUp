/**
 * Campaign Million Users Load Tests
 * 
 * Tests to ensure campaigns work correctly with millions of subscribers
 * This test suite simulates high-scale production scenarios
 * 
 * Best Practices Applied:
 * - Database optimization (tmpfs, no fsync)
 * - Batch processing (100 users per batch)
 * - Memory leak detection
 * - Concurrent campaign handling
 * - Performance monitoring
 * 
 * Run these tests with:
 * - npm test -- campaign-million-users.test.js (runs all tests)
 * - npm test -- --testNamePattern="10000" (runs only 10k test)
 * - npm test -- --testNamePattern="million" (runs only million test)
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

describe('Campaign Million Users Load Tests', () => {
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
        testUser = await dataFactory.createUser({
            email: 'load-test@example.com',
            role: 'admin'
        });
        testSite = await dataFactory.createSite(testUser.id, {
            name: 'Million User Site',
            domain: 'millionusers.com'
        });
        authHeaders = await TestAuth.createAuthHeaders(testUser.id, testUser);
    });

    afterEach(async () => {
        // Truncate para mejor rendimiento en cleanup de datos masivos
        await testDb.pool.query('TRUNCATE campaign_executions, campaigns, subscriptions, sites, users CASCADE');
    }, 180000); // 3 minutos para cleanup de 1M+ registros

    describe('High-Scale Subscriber Handling', () => {
        /**
         * Test with 10,000 users
         * This simulates a medium-sized campaign
         */
        test('should handle campaign with 10,000 subscribers efficiently', async () => {
            console.log('📊 Creating 10,000 subscribers in batches...');

            const batchSize = 500; // Create 500 at a time
            const totalUsers = 10000;
            const batches = Math.ceil(totalUsers / batchSize);

            const startCreation = Date.now();

            // Create subscribers in batches
            for (let batch = 0; batch < batches; batch++) {
                const subscriptions = [];
                const usersInBatch = Math.min(batchSize, totalUsers - (batch * batchSize));

                for (let i = 0; i < usersInBatch; i++) {
                    const index = batch * batchSize + i;
                    subscriptions.push(
                        dataFactory.createSubscription(testSite.id, {
                            endpoint: `https://fcm.googleapis.com/fcm/send/user-${index}`,
                            userAgent: `Browser-${index % 10}` // Vary user agents
                        })
                    );
                }

                await Promise.all(subscriptions);

                if ((batch + 1) % 5 === 0) {
                    console.log(`  ✓ Created ${(batch + 1) * batchSize} / ${totalUsers} subscribers`);
                }
            }

            const creationTime = Date.now() - startCreation;
            console.log(`✓ Subscribers created in ${(creationTime / 1000).toFixed(2)}s`);

            // Mock web-push to be fast
            const webPush = await import('web-push');
            webPush.sendNotification.mockResolvedValue({ statusCode: 201 });

            // Create and send campaign
            console.log('📤 Sending campaign to 10,000 users...');
            const startTime = Date.now();

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign to 10K users',
                    title: 'Important Update',
                    body: 'Testing with 10,000 subscribers',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            const duration = Date.now() - startTime;

            // Assertions
            expect(response.status).toBe(201);
            expect(response.body.execution).toBeDefined();
            expect(response.body.execution.total).toBeGreaterThanOrEqual(10000);

            // Performance expectations
            expect(duration).toBeLessThan(120000); // Should complete within 2 minutes

            console.log(`✅ Campaign sent in ${(duration / 1000).toFixed(2)}s`);
            console.log(`   Average: ${(duration / totalUsers).toFixed(2)}ms per user`);
            console.log(`   Throughput: ${(totalUsers / (duration / 1000)).toFixed(2)} users/second`);

            // Verify execution stats
            const executionStats = response.body.execution;
            console.log(`   Sent: ${executionStats.sent}, Failed: ${executionStats.failed}`);

        }, 300000); // 5 minute timeout

        /**
         * Test with 50,000 users
         * This simulates a large-scale campaign
         */
        test.skip('should handle campaign with 50,000 subscribers', async () => {
            console.log('📊 Creating 50,000 subscribers in batches...');

            const batchSize = 1000; // Create 1000 at a time
            const totalUsers = 50000;
            const batches = Math.ceil(totalUsers / batchSize);

            const startCreation = Date.now();

            // Create subscribers in batches
            for (let batch = 0; batch < batches; batch++) {
                const subscriptions = [];

                for (let i = 0; i < batchSize; i++) {
                    const index = batch * batchSize + i;
                    subscriptions.push(
                        dataFactory.createSubscription(testSite.id, {
                            endpoint: `https://fcm.googleapis.com/fcm/send/user-${index}`,
                            userAgent: `Browser-${index % 10}`
                        })
                    );
                }

                await Promise.all(subscriptions);

                if ((batch + 1) % 10 === 0) {
                    console.log(`  ✓ Created ${(batch + 1) * batchSize} / ${totalUsers} subscribers`);
                }
            }

            const creationTime = Date.now() - startCreation;
            console.log(`✓ Subscribers created in ${(creationTime / 1000).toFixed(2)}s`);

            // Mock web-push
            const webPush = await import('web-push');
            webPush.sendNotification.mockResolvedValue({ statusCode: 201 });

            // Send campaign
            console.log('📤 Sending campaign to 50,000 users...');
            const startTime = Date.now();

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign to 50K users',
                    title: 'Major Announcement',
                    body: 'Testing with 50,000 subscribers',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            const duration = Date.now() - startTime;

            expect(response.status).toBe(201);
            expect(response.body.execution.total).toBeGreaterThanOrEqual(50000);
            expect(duration).toBeLessThan(600000); // 10 minutes max

            console.log(`✅ Campaign sent in ${(duration / 1000).toFixed(2)}s`);
            console.log(`   Throughput: ${(totalUsers / (duration / 1000)).toFixed(2)} users/second`);

        }, 900000); // 15 minute timeout

        /**
         * Test with 1,000,000 users
         * This simulates a mega-scale campaign
         * Run explicitly when needed for production validation
         */
        test('should handle campaign with 1,000,000 subscribers', async () => {
            console.log('🚀 Creating 1,000,000 subscribers using BULK INSERT...');
            console.log('⚠️  This will take several minutes...');

            const totalUsers = 1000000;
            const startCreation = Date.now();

            // Usar bulk insert en lugar de crear uno por uno (mucho más rápido)
            await dataFactory.bulkCreateSubscriptions(testSite.id, totalUsers, {
                batchSize: 5000, // 5000 registros por INSERT
                onProgress: (created, total) => {
                    const progress = ((created / total) * 100).toFixed(1);
                    const elapsed = (Date.now() - startCreation) / 1000;
                    console.log(`  ✓ Progress: ${progress}% (${created.toLocaleString()} users, ${elapsed.toFixed(0)}s)`);
                }
            });

            const creationTime = Date.now() - startCreation;
            console.log(`✓ All subscribers created in ${(creationTime / 1000 / 60).toFixed(2)} minutes`);

            // Mock web-push
            const webPush = await import('web-push');
            webPush.sendNotification.mockResolvedValue({ statusCode: 201 });

            // Memory before campaign
            const memoryBefore = process.memoryUsage();
            console.log(`📊 Memory before: ${(memoryBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);

            // Send campaign
            console.log('📤 Sending campaign to 1,000,000 users...');
            const startTime = Date.now();

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Campaign to 1M users',
                    title: 'Mega Announcement',
                    body: 'Testing with 1,000,000 subscribers',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            const duration = Date.now() - startTime;

            // Log error details if not successful
            if (response.status !== 201) {
                console.error('❌ Campaign creation failed:');
                console.error('Status:', response.status);
                console.error('Body:', JSON.stringify(response.body, null, 2));
            }

            // Memory after campaign
            const memoryAfter = process.memoryUsage();
            const memoryIncrease = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
            console.log(`📊 Memory after: ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📊 Memory increase: ${memoryIncrease.toFixed(2)} MB`);

            // Assertions
            expect(response.status).toBe(201);
            expect(response.body.execution.total).toBeGreaterThanOrEqual(1000000);

            // Should complete in less than 15 minutes for 1M users
            expect(duration).toBeLessThan(900000); // 15 minutes = 900,000 ms

            // Memory should not leak excessively (< 900MB increase for 1M users with worker threads)
            expect(memoryIncrease).toBeLessThan(900);

            console.log(`✅ Campaign sent in ${(duration / 1000 / 60).toFixed(2)} minutes`);
            console.log(`   Average: ${(duration / totalUsers).toFixed(2)}ms per user`);
            console.log(`   Throughput: ${(totalUsers / (duration / 1000)).toFixed(2)} users/second`);
            console.log(`   Target: Must be < 15 minutes (${duration < 900000 ? '✓ PASS' : '✗ FAIL'})`);

            const executionStats = response.body.execution;
            console.log(`   Sent: ${executionStats.sent}, Failed: ${executionStats.failed}`);

        }, 2400000); // 40 minute total timeout (includes DB creation time)
    });

    describe('Multiple Concurrent Campaigns at Scale', () => {
        /**
         * Test 5 concurrent campaigns with 5000 users each
         */
        test('should handle 5 concurrent campaigns with 5,000 users each', async () => {
            console.log('📊 Setting up 5 concurrent campaigns...');

            // Create 5 different sites
            const sites = await Promise.all([
                dataFactory.createSite(testUser.id, { name: 'Site 1', domain: 'site1.com' }),
                dataFactory.createSite(testUser.id, { name: 'Site 2', domain: 'site2.com' }),
                dataFactory.createSite(testUser.id, { name: 'Site 3', domain: 'site3.com' }),
                dataFactory.createSite(testUser.id, { name: 'Site 4', domain: 'site4.com' }),
                dataFactory.createSite(testUser.id, { name: 'Site 5', domain: 'site5.com' })
            ]);

            // Create 5000 subscribers for each site
            const usersPerSite = 5000;
            console.log(`📊 Creating ${usersPerSite} subscribers for each of 5 sites...`);

            for (let siteIndex = 0; siteIndex < sites.length; siteIndex++) {
                const site = sites[siteIndex];
                const batchSize = 500;
                const batches = Math.ceil(usersPerSite / batchSize);

                for (let batch = 0; batch < batches; batch++) {
                    const subscriptions = [];

                    for (let i = 0; i < batchSize; i++) {
                        const index = batch * batchSize + i;
                        subscriptions.push(
                            dataFactory.createSubscription(site.id, {
                                endpoint: `https://fcm.googleapis.com/site${siteIndex}-user-${index}`,
                                userAgent: `Browser-${index % 5}`
                            })
                        );
                    }

                    await Promise.all(subscriptions);
                }

                console.log(`  ✓ Site ${siteIndex + 1} ready with ${usersPerSite} subscribers`);
            }

            // Mock web-push
            const webPush = await import('web-push');
            webPush.sendNotification.mockResolvedValue({ statusCode: 201 });

            // Send 5 campaigns concurrently
            console.log('📤 Sending 5 concurrent campaigns...');
            const startTime = Date.now();

            const campaigns = await Promise.all(
                sites.map((site, index) =>
                    request(app)
                        .post('/campaigns')
                        .set(authHeaders)
                        .send({
                            name: `Concurrent Campaign ${index + 1}`,
                            title: `Update ${index + 1}`,
                            body: `Message for site ${index + 1}`,
                            siteId: site.id,
                            sendType: 'immediate'
                        })
                        .catch(err => {
                            console.error(`Campaign ${index + 1} request failed:`, err);
                            return { status: 500, body: { error: err.message } };
                        })
                )
            );

            const duration = Date.now() - startTime;

            // Check for errors and log them
            console.log('\n📋 Campaign Results:');
            campaigns.forEach((response, index) => {
                console.log(`Campaign ${index + 1}:`, {
                    status: response.status,
                    siteId: sites[index].id,
                    success: response.status === 201,
                    error: response.status !== 201 ? (response.body.error || response.body) : undefined
                });
            });

            // All should succeed
            campaigns.forEach((response, index) => {
                expect(response.status).toBe(201);
                expect(response.body.execution.total).toBeGreaterThanOrEqual(usersPerSite);
                console.log(`  ✓ Campaign ${index + 1}: ${response.body.execution.sent} sent`);
            });

            const totalUsers = usersPerSite * sites.length;
            console.log(`✅ All 5 campaigns completed in ${(duration / 1000).toFixed(2)}s`);
            console.log(`   Total users: ${totalUsers}`);
            console.log(`   Throughput: ${(totalUsers / (duration / 1000)).toFixed(2)} users/second`);

        }, 600000); // 10 minute timeout
    });

    describe('Performance Benchmarking', () => {
        /**
         * Measure performance degradation with increasing load
         */
        test('should measure performance degradation curve', async () => {
            const testSizes = [1000, 2500, 5000, 7500, 10000];
            const results = [];

            console.log('📊 Running performance degradation test...');

            for (const size of testSizes) {
                console.log(`\n🔄 Testing with ${size} users...`);

                // Create subscribers
                const batchSize = 500;
                const batches = Math.ceil(size / batchSize);

                for (let batch = 0; batch < batches; batch++) {
                    const subscriptions = [];
                    const usersInBatch = Math.min(batchSize, size - (batch * batchSize));

                    for (let i = 0; i < usersInBatch; i++) {
                        const index = batch * batchSize + i;
                        subscriptions.push(
                            dataFactory.createSubscription(testSite.id, {
                                endpoint: `https://fcm.googleapis.com/perf-test-${size}-${index}`,
                                userAgent: `Browser-${index % 5}`
                            })
                        );
                    }

                    await Promise.all(subscriptions);
                }

                // Mock web-push
                const webPush = await import('web-push');
                webPush.sendNotification.mockResolvedValue({ statusCode: 201 });

                // Send campaign and measure
                const startTime = Date.now();

                const response = await request(app)
                    .post('/campaigns')
                    .set(authHeaders)
                    .send({
                        name: `Performance test ${size} users`,
                        title: 'Test',
                        body: `Testing ${size} users`,
                        siteId: testSite.id,
                        sendType: 'immediate'
                    });

                const duration = Date.now() - startTime;

                const result = {
                    users: size,
                    duration: duration,
                    throughput: size / (duration / 1000),
                    avgTimePerUser: duration / size,
                    sent: response.body.execution.sent,
                    failed: response.body.execution.failed
                };

                results.push(result);

                console.log(`  ✓ Duration: ${(duration / 1000).toFixed(2)}s`);
                console.log(`  ✓ Throughput: ${result.throughput.toFixed(2)} users/s`);
                console.log(`  ✓ Avg per user: ${result.avgTimePerUser.toFixed(2)}ms`);

                // Clean up for next iteration
                await testDb.pool.query('DELETE FROM campaign_executions WHERE campaign_id IS NOT NULL');
                await testDb.pool.query('DELETE FROM campaigns WHERE user_id = $1', [testUser.id]);
                await testDb.pool.query('DELETE FROM subscriptions WHERE site_id = $1', [testSite.id]);
            }

            // Analyze results
            console.log('\n📈 Performance Summary:');
            console.log('Users\t\tDuration\tThroughput\tAvg/User');
            results.forEach(r => {
                console.log(`${r.users}\t\t${(r.duration / 1000).toFixed(2)}s\t\t${r.throughput.toFixed(2)}/s\t${r.avgTimePerUser.toFixed(2)}ms`);
            });

            // Check for linear or sub-linear scaling
            const firstThroughput = results[0].throughput;
            const lastThroughput = results[results.length - 1].throughput;
            const degradationPercent = ((firstThroughput - lastThroughput) / firstThroughput) * 100;

            console.log(`\n📊 Performance degradation: ${degradationPercent.toFixed(2)}%`);

            // Throughput should not degrade more than 50%
            expect(degradationPercent).toBeLessThan(50);

        }, 900000); // 15 minute timeout
    });

    describe('Memory and Resource Management at Scale', () => {
        /**
         * Test memory stability with multiple large campaigns
         */
        test('should maintain stable memory with multiple large campaigns', async () => {
            const campaignsCount = 3;
            const usersPerCampaign = 5000;
            const memorySnapshots = [];

            console.log(`📊 Testing memory stability with ${campaignsCount} campaigns of ${usersPerCampaign} users each`);

            const initialMemory = process.memoryUsage();
            memorySnapshots.push({
                stage: 'Initial',
                heapUsed: initialMemory.heapUsed / 1024 / 1024
            });

            for (let campaign = 0; campaign < campaignsCount; campaign++) {
                console.log(`\n🔄 Campaign ${campaign + 1}/${campaignsCount}`);

                // Create fresh site for this campaign
                const campaignSite = await dataFactory.createSite(testUser.id, {
                    name: `Memory Test Site ${campaign}`,
                    domain: `memtest${campaign}.com`
                });

                // Create subscribers
                const batchSize = 500;
                const batches = Math.ceil(usersPerCampaign / batchSize);

                for (let batch = 0; batch < batches; batch++) {
                    const subscriptions = [];

                    for (let i = 0; i < batchSize; i++) {
                        const index = batch * batchSize + i;
                        subscriptions.push(
                            dataFactory.createSubscription(campaignSite.id, {
                                endpoint: `https://fcm.googleapis.com/mem-test-c${campaign}-u${index}`,
                                userAgent: `Browser-${index % 5}`
                            })
                        );
                    }

                    await Promise.all(subscriptions);
                }

                // Mock web-push
                const webPush = await import('web-push');
                webPush.sendNotification.mockResolvedValue({ statusCode: 201 });

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

                const currentMemory = process.memoryUsage();
                memorySnapshots.push({
                    stage: `After Campaign ${campaign + 1}`,
                    heapUsed: currentMemory.heapUsed / 1024 / 1024
                });

                console.log(`  Memory: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
            }

            // Analyze memory progression
            console.log('\n📊 Memory Progression:');
            memorySnapshots.forEach(snapshot => {
                console.log(`  ${snapshot.stage}: ${snapshot.heapUsed.toFixed(2)} MB`);
            });

            const finalMemory = memorySnapshots[memorySnapshots.length - 1].heapUsed;
            const initialMem = memorySnapshots[0].heapUsed;
            const memoryIncrease = finalMemory - initialMem;

            console.log(`\n📈 Total memory increase: ${memoryIncrease.toFixed(2)} MB`);

            // Memory increase should be reasonable (< 200 MB for 3 x 5000 users)
            expect(memoryIncrease).toBeLessThan(200);

        }, 900000); // 15 minute timeout
    });

    describe('Error Handling at Scale', () => {
        /**
         * Test partial failures with large user base
         */
        test('should handle partial failures with 10,000 users gracefully', async () => {
            console.log('📊 Creating 10,000 subscribers...');

            const totalUsers = 10000;
            const batchSize = 500;
            const batches = Math.ceil(totalUsers / batchSize);

            for (let batch = 0; batch < batches; batch++) {
                const subscriptions = [];

                for (let i = 0; i < batchSize; i++) {
                    const index = batch * batchSize + i;
                    subscriptions.push(
                        dataFactory.createSubscription(testSite.id, {
                            endpoint: `https://fcm.googleapis.com/error-test-${index}`,
                            userAgent: `Browser-${index % 5}`
                        })
                    );
                }

                await Promise.all(subscriptions);
            }

            // Mock web-push with 10% failure rate
            const webPush = await import('web-push');
            let callCount = 0;
            webPush.sendNotification.mockImplementation(() => {
                callCount++;
                // Fail every 10th call
                if (callCount % 10 === 0) {
                    const error = new Error('Push service error');
                    error.statusCode = 500;
                    return Promise.reject(error);
                }
                return Promise.resolve({ statusCode: 201 });
            });

            console.log('📤 Sending campaign with simulated 10% failure rate...');

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Error handling test',
                    title: 'Test',
                    body: 'Testing error handling at scale',
                    siteId: testSite.id,
                    sendType: 'immediate'
                });

            expect(response.status).toBe(201);

            const execution = response.body.execution;
            const successRate = (execution.sent / execution.total) * 100;

            console.log(`✅ Results:`);
            console.log(`   Total: ${execution.total}`);
            console.log(`   Sent: ${execution.sent}`);
            console.log(`   Failed: ${execution.failed}`);
            console.log(`   Success rate: ${successRate.toFixed(2)}%`);

            // Should have roughly 90% success rate
            expect(successRate).toBeGreaterThan(85);
            expect(successRate).toBeLessThan(95);
            expect(execution.sent + execution.failed).toBe(execution.total);

        }, 300000); // 5 minute timeout
    });
});
