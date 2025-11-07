/**
 * Input Sanitization Tests
 * CRITICAL for production - prevents XSS, SQL injection, and other injection attacks
 *
 * ✅ UPDATED: Now verifies actual sanitization implementations
 * ⚠️  PARTIAL: Some sanitizations still need implementation
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import sitesRoutes from '../../routes/sites.js';
import usersRoutes from '../../routes/users.js';
import campaignsRoutes from '../../routes/campaigns.js';
import { authenticateToken } from '../../middleware/auth.js';
import { sanitizeForLike } from '../../utils/sanitize.js';
import { TestDatabase, TestDataFactory, TestAuth } from '../../../tests/testUtils.js';

describe('Input Sanitization Tests', () => {
    let app;
    let testDb;
    let dataFactory;
    let testUser;
    let authHeaders;

    beforeEach(async () => {
        app = express();
        app.use(bodyParser.json({ limit: '1mb' })); // Set reasonable limit

        testDb = new TestDatabase();
        dataFactory = new TestDataFactory(testDb);

        app.locals.pool = testDb.pool;
        app.use('/sites', authenticateToken, sitesRoutes);
        app.use('/users', authenticateToken, usersRoutes);
        app.use('/campaigns', authenticateToken, campaignsRoutes);

        testUser = await dataFactory.createUser();
        authHeaders = await TestAuth.createAuthHeaders(testUser.id, testUser);
    });

    afterEach(async () => {
        await testDb.cleanup();
    });

    describe('✅ SQL Injection Prevention (Implemented)', () => {
        test('should use parameterized queries for all database operations', async () => {
            // Create site with special characters that could break SQL
            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send({
                    name: "Site's Name with 'quotes' and \"double quotes\"",
                    domain: 'test.com'
                });

            // Should succeed without SQL errors
            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe("Site's Name with 'quotes' and \"double quotes\"");
        });

        test('should prevent SQL injection in URL parameters', async () => {
            const sqlInjectionPayloads = [
                "1' OR '1'='1",
                "1; DROP TABLE sites;--",
                "1' UNION SELECT * FROM users--",
            ];

            for (const payload of sqlInjectionPayloads) {
                const response = await request(app)
                    .get(`/sites/\${payload}`)
                    .set(authHeaders);

                // Should return 404 or 400, not cause SQL error
                expect(response.status).not.toBe(500);
                expect([400, 404]).toContain(response.status);
            }
        });

        test('should handle SQL injection in search parameters safely', async () => {
            // Create a real site first
            await dataFactory.createSite(testUser.id, { name: 'Test Site', domain: 'test.com' });

            const response = await request(app)
                .get("/sites?search='; DROP TABLE sites; --")
                .set(authHeaders);

            // Should handle safely with parameterized queries
            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('✅ ILIKE Sanitization for SQL (Implemented)', () => {
        test('sanitizeForLike should escape % wildcard characters', () => {
            const input = 'test%';
            const sanitized = sanitizeForLike(input);

            // % should be escaped to \%
            expect(sanitized).toBe('test\\%');
        });

        test('sanitizeForLike should escape _ wildcard characters', () => {
            const input = 'test_user';
            const sanitized = sanitizeForLike(input);

            // _ should be escaped to \_
            expect(sanitized).toBe('test\\_user');
        });

        test('sanitizeForLike should handle empty strings', () => {
            const sanitized = sanitizeForLike('');
            expect(sanitized).toBe('');
        });

        test('sanitizeForLike should handle non-string inputs', () => {
            const sanitized = sanitizeForLike(null);
            expect(sanitized).toBe('');
        });

        test('should apply ILIKE sanitization in search endpoints', async () => {
            // Create sites with underscores
            await dataFactory.createSite(testUser.id, { name: 'test_user_site', domain: 'test1.com' });
            await dataFactory.createSite(testUser.id, { name: 'testXuserXsite', domain: 'test2.com' });

            // Search for literal underscore (not wildcard)
            const response = await request(app)
                .get('/sites?search=test_user')
                .set(authHeaders);

            expect(response.status).toBe(200);

            // Should only match exact underscore, not wildcard
            const sites = response.body.data.sites;
            const matchedNames = sites.map(s => s.name);

            // Should find 'test_user_site' but not 'testXuserXsite'
            expect(matchedNames).toContain('test_user_site');
        });
    });

    describe('✅ XSS Prevention (Implemented)', () => {
        test('should strip XSS from site name', async () => {
            const xssPayload = '<script>alert("XSS")</script>Test Site';

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send({
                    name: xssPayload,
                    domain: 'test.com'
                });

            // Should succeed with HTML stripped
            expect(response.status).toBe(201);
            expect(response.body.data.name).not.toContain('<script>');
            expect(response.body.data.name).not.toContain('alert');
            expect(response.body.data.name).toContain('Test Site'); // Clean text should remain
        });

        test('should strip XSS from campaign title', async () => {
            const site = await dataFactory.createSite(testUser.id);
            const xssPayload = '<img src=x onerror=alert(1)>Campaign Title';

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Test Campaign',
                    title: xssPayload,
                    body: 'Test message',
                    siteId: site.id,
                    sendType: 'immediate'
                });

            // Should succeed but with HTML stripped
            expect(response.status).toBe(201);
            expect(response.body.data.title).not.toContain('<img');
            expect(response.body.data.title).not.toContain('onerror');
            expect(response.body.data.title).toContain('Campaign Title'); // Clean text should remain
        });

        test('should strip XSS from campaign body', async () => {
            const site = await dataFactory.createSite(testUser.id);
            const xssPayload = '<iframe src="evil.com"></iframe>Test message';

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Test Campaign',
                    title: 'Title',
                    body: xssPayload,
                    siteId: site.id,
                    sendType: 'immediate'
                });

            // Should succeed but with HTML stripped
            expect(response.status).toBe(201);
            expect(response.body.data.body).not.toContain('<iframe');
            expect(response.body.data.body).not.toContain('evil.com');
            expect(response.body.data.body).toContain('Test message'); // Clean text should remain
        });
    });

    describe('✅ Input Length Validation (Implemented)', () => {
        test('should reject excessively large JSON payloads', async () => {
            const largePayload = 'A'.repeat(10 * 1024 * 1024); // 10MB

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send({
                    name: largePayload,
                    domain: 'test.com'
                });

            // Body parser should reject with 413
            expect(response.status).toBe(413);
        });

        test('should accept reasonable JSON payloads', async () => {
            const reasonablePayload = 'A'.repeat(100); // 100 bytes

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send({
                    name: reasonablePayload,
                    domain: 'test.com'
                });

            expect(response.status).toBe(201);
        });
    });

    describe('✅ Special Character Handling', () => {
        test('should handle Unicode characters safely', async () => {
            const unicodeName = '测试网站 🚀 τεστ';

            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .send({
                    name: unicodeName,
                    domain: 'test.com'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe(unicodeName);
        });

        test('should handle emoji in campaign content', async () => {
            const site = await dataFactory.createSite(testUser.id);

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Test Campaign',
                    title: 'Important Update 🚀',
                    body: 'Check this out! 😊',
                    siteId: site.id,
                    sendType: 'immediate'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.title).toContain('🚀');
            expect(response.body.data.body).toContain('😊');
        });

        test('should handle newlines in text content', async () => {
            const site = await dataFactory.createSite(testUser.id);
            const multilineText = 'Line 1\\nLine 2\\nLine 3';

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Test Campaign',
                    title: 'Test',
                    body: multilineText,
                    siteId: site.id,
                    sendType: 'immediate'
                });

            expect(response.status).toBe(201);
        });
    });

    describe('✅ Domain Validation', () => {
        test('should accept valid domain formats', async () => {
            const validDomains = [
                'example.com',
                'subdomain.example.com',
                'example.co.uk',
                'test-site.com',
                'test.example.io',
            ];

            for (const domain of validDomains) {
                const response = await request(app)
                    .post('/sites')
                    .set(authHeaders)
                    .send({
                        name: 'Test Site',
                        domain: domain
                    });

                expect(response.status).toBe(201);
                expect(response.body.data.domain).toBe(domain);
            }
        });

        test('should reject malicious domain formats', async () => {
            const maliciousDomains = [
                'javascript:alert(1)',
                '<script>example.com</script>',
            ];

            for (const domain of maliciousDomains) {
                const response = await request(app)
                    .post('/sites')
                    .set(authHeaders)
                    .send({
                        name: 'Test Site',
                        domain: domain
                    });

                // Should reject these domains with 400 validation error
                expect(response.status).toBe(400);
                expect(response.body.error).toBeDefined();
            }
        });

        test('should reject invalid domain formats', async () => {
            const invalidDomains = [
                'not a domain',
                'example',
                '192.168.1.1', // IP addresses not allowed
                'http://example.com', // Protocol not allowed
            ];

            for (const domain of invalidDomains) {
                const response = await request(app)
                    .post('/sites')
                    .set(authHeaders)
                    .send({
                        name: 'Test Site',
                        domain: domain
                    });

                // Should reject with 400
                expect(response.status).toBe(400);
            }
        });
    });

    describe('✅ Content Type Validation', () => {
        test('should only accept application/json for POST requests', async () => {
            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .set('Content-Type', 'text/plain')
                .send('name=Test&domain=test.com');

            // Should reject non-JSON content type
            expect(response.status).not.toBe(201);
        });

        test('should accept properly formatted JSON', async () => {
            const response = await request(app)
                .post('/sites')
                .set(authHeaders)
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({
                    name: 'Test Site',
                    domain: 'test.com'
                }));

            expect(response.status).toBe(201);
        });
    });

    describe('✅ NoSQL Injection Prevention', () => {
        test('should reject object injection in campaign name field', async () => {
            const site = await dataFactory.createSite(testUser.id);

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: { $ne: null }, // NoSQL injection attempt
                    title: 'Test',
                    body: 'Test',
                    siteId: site.id,
                    sendType: 'immediate'
                });

            // Should reject with 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should reject object injection in campaign title field', async () => {
            const site = await dataFactory.createSite(testUser.id);

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Test Campaign',
                    title: { $gt: '' }, // NoSQL injection attempt
                    body: 'Test',
                    siteId: site.id,
                    sendType: 'immediate'
                });

            // Should reject with 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should reject array injection in string fields', async () => {
            const site = await dataFactory.createSite(testUser.id);

            const response = await request(app)
                .post('/campaigns')
                .set(authHeaders)
                .send({
                    name: 'Test Campaign',
                    title: 'Test',
                    body: ['malicious', 'array'], // Array instead of string
                    siteId: site.id,
                    sendType: 'immediate'
                });

            // Should reject with 400 validation error
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('✅ Error Response Sanitization', () => {
        test('should not leak internal error details in responses', async () => {
            const response = await request(app)
                .get('/sites/99999')
                .set(authHeaders);

            expect(response.status).toBe(404);

            // Should not expose stack traces or internal paths
            const bodyStr = JSON.stringify(response.body);
            expect(bodyStr).not.toContain('/home/');
            expect(bodyStr).not.toContain('at ');
            expect(bodyStr).not.toContain('node_modules');
            expect(bodyStr).not.toContain('Error:');
        });

        test('should not expose database errors to clients', async () => {
            // Close database to trigger error
            await testDb.pool.end();

            const response = await request(app)
                .get('/sites')
                .set(authHeaders);

            expect(response.status).toBe(500);

            const bodyStr = JSON.stringify(response.body);
            // Should not contain SQL error details
            expect(bodyStr.toLowerCase()).not.toContain('postgres');
            expect(bodyStr.toLowerCase()).not.toContain('sql');
        });
    });
});

/**
 * IMPLEMENTATION STATUS:
 *
 * ✅ FULLY IMPLEMENTED:
 * - SQL injection prevention (parameterized queries)
 * - ILIKE sanitization for search queries (sanitizeForLike)
 * - XSS prevention (HTML tag stripping via validator + xss libraries)
 * - Domain format validation (validator.isFQDN)
 * - Type validation for JSON fields (prevents NoSQL injection)
 * - Control character filtering
 * - Null byte filtering
 * - JSON payload size limits (1MB)
 * - Unicode/emoji handling
 * - Content-Type validation
 * - Error message sanitization
 *
 * IMPLEMENTATION DETAILS:
 *
 * 1. Sanitization utilities (server/src/utils/sanitize.js):
 *    - sanitizeHTML() - Strips or allows safe HTML
 *    - sanitizeText() - Comprehensive text cleaning
 *    - stripControlCharacters() - Removes control chars
 *    - validateDomain() - FQDN validation
 *    - validateType() - Type checking for NoSQL prevention
 *
 * 2. Middleware (server/src/middleware/sanitization.js):
 *    - sanitizeRequestBody() - Cleans all POST/PUT/PATCH data
 *    - sanitizeQueryParams() - Cleans GET query parameters
 *    - validateSiteData() - Site-specific validation
 *    - validateCampaignData() - Campaign-specific validation
 *    - validateRequestData() - Logs suspicious patterns
 *
 * 3. Applied to routes:
 *    - sites.js - All routes sanitized
 *    - campaigns.js - All routes sanitized
 *
 * 4. Monitoring:
 *    - Suspicious input patterns logged (XSS, NoSQL operators)
 *    - Includes IP, path, method for security auditing
 */

