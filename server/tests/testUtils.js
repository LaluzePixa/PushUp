/**
 * Test Utilities and Helpers
 * Common functions for database operations, mocking, and test data creation
 */

import pg from 'pg';

const { Pool } = pg;

// Global pool instance to avoid connection leaks
let globalTestPool = null;

/**
 * Database utilities for testing
 */
export class TestDatabase {
    constructor() {
        if (!globalTestPool) {
            globalTestPool = new Pool({
                connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pushsaas_test',
                max: 20, // Increased for concurrent operations
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000, // Increased timeout
            });
        }
        this.pool = globalTestPool;
    }

    async getClient() {
        return await this.pool.connect();
    }

    async query(text, params) {
        return await this.pool.query(text, params);
    }

    async cleanup() {
        // Clean all test data in correct order
        const tables = [
            'campaign_executions',
            'campaign_actions',
            'campaigns',
            'audience_segments',
            'subscriptions',
            'optin_configurations',
            'sites',
            'users'
        ];

        for (const table of tables) {
            await this.query(`DELETE FROM ${table} WHERE id > 0`);
        }
    }

    async close() {
        // Don't close the global pool, it will be closed in global teardown
        return Promise.resolve();
    }

    // Only close in global teardown
    static async closeGlobalPool() {
        if (globalTestPool) {
            await globalTestPool.end();
            globalTestPool = null;
        }
    }
}

/**
 * Factory functions for creating test data
 */
export class TestDataFactory {
    constructor(db) {
        this.db = db;
    }

    async createUser(userData = {}) {
        const { hashPassword } = await import('../src/middleware/auth.js');
        const hashedPassword = await hashPassword(userData.password || 'TestPassword123!');

        const result = await this.db.query(
            'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
            [
                userData.email || `test-${Date.now()}@example.com`,
                hashedPassword,
                userData.role || 'user',
                userData.isActive !== undefined ? userData.isActive : true
            ]
        );
        return result.rows[0];
    }

    async createSite(userId, siteData = {}) {
        const result = await this.db.query(
            'INSERT INTO sites (user_id, name, domain, description, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
                userId,
                siteData.name || `Test Site ${Date.now()}`,
                siteData.domain || `test-${Date.now()}.example.com`,
                siteData.description || 'Test site description',
                siteData.isActive !== undefined ? siteData.isActive : true
            ]
        );
        return result.rows[0];
    }

    async createSubscription(siteId, subscriptionData = {}) {
        const result = await this.db.query(
            'INSERT INTO subscriptions (endpoint, p256dh, auth, site_id, user_agent, ip) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
                subscriptionData.endpoint || `https://fcm.googleapis.com/fcm/send/test-${Date.now()}`,
                subscriptionData.p256dh || 'test-p256dh-key',
                subscriptionData.auth || 'test-auth-key',
                siteId,
                subscriptionData.userAgent || 'Test User Agent',
                subscriptionData.ip || '127.0.0.1'
            ]
        );
        return result.rows[0];
    }

    /**
     * Bulk insert de suscripciones para tests de alto volumen
     * Mucho más eficiente que createSubscription individual
     */
    async bulkCreateSubscriptions(siteId, count, options = {}) {
        const batchSize = options.batchSize || 5000; // Insertar 5000 a la vez
        const batches = Math.ceil(count / batchSize);
        let totalCreated = 0;

        for (let batch = 0; batch < batches; batch++) {
            const recordsInBatch = Math.min(batchSize, count - (batch * batchSize));
            const values = [];
            const params = [];
            let paramIndex = 1;

            for (let i = 0; i < recordsInBatch; i++) {
                const globalIndex = batch * batchSize + i; // Índice global único
                values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
                params.push(
                    `https://fcm.googleapis.com/fcm/send/user-${globalIndex}`,
                    'test-p256dh-key',
                    'test-auth-key',
                    siteId,
                    `Browser-${globalIndex % 20}`,
                    `192.168.${Math.floor(globalIndex / 256)}.${globalIndex % 256}`
                );
                paramIndex += 6;
            }

            await this.db.query(
                `INSERT INTO subscriptions (endpoint, p256dh, auth, site_id, user_agent, ip)
                 VALUES ${values.join(', ')}`,
                params
            );

            totalCreated += recordsInBatch;

            if (options.onProgress && (batch + 1) % 10 === 0) {
                options.onProgress(totalCreated, count);
            }
        }

        return totalCreated;
    }

    async createCampaign(userId, campaignData = {}) {
        const result = await this.db.query(
            `INSERT INTO campaigns (user_id, site_id, name, title, body, status, send_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                userId,
                campaignData.siteId || null,
                campaignData.name || `Test Campaign ${Date.now()}`,
                campaignData.title || 'Test Title',
                campaignData.body || 'Test Body',
                campaignData.status || 'draft',
                campaignData.sendType || 'immediate'
            ]
        );
        return result.rows[0];
    }

    async createSegment(userId, segmentData = {}) {
        const result = await this.db.query(
            'INSERT INTO audience_segments (user_id, site_id, name, description, conditions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
                userId,
                segmentData.siteId || null,
                segmentData.name || `Test Segment ${Date.now()}`,
                segmentData.description || 'Test segment description',
                JSON.stringify(segmentData.conditions || {})
            ]
        );
        return result.rows[0];
    }
}

/**
 * Authentication utilities for testing
 */
export class TestAuth {
    static async generateToken(userId, userData = {}) {
        const { signJWT } = await import('../src/middleware/auth.js');
        return signJWT({
            id: userId,
            email: userData.email || 'test@example.com',
            role: userData.role || 'user'
        });
    }

    static async createAuthHeaders(userId, userData = {}) {
        const token = await this.generateToken(userId, userData);
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

/**
 * Mock utilities
 */
export class TestMocks {
    static mockWebPush() {
        return {
            setVapidDetails: jest.fn(),
            sendNotification: jest.fn().mockResolvedValue({ success: true }),
            generateVAPIDKeys: jest.fn().mockReturnValue({
                publicKey: 'test-public-key',
                privateKey: 'test-private-key'
            })
        };
    }

    static mockEmail() {
        return {
            createTransport: jest.fn().mockReturnValue({
                sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
            })
        };
    }

    static mockCronJob() {
        return jest.fn().mockImplementation((time, callback) => ({
            start: jest.fn(),
            stop: jest.fn(),
            destroy: jest.fn()
        }));
    }
}

/**
 * Request/Response utilities
 */
export class TestRequest {
    static createMockReq(overrides = {}) {
        return {
            body: {},
            params: {},
            query: {},
            headers: {},
            user: null,
            app: {
                locals: {}
            },
            ...overrides
        };
    }

    static createMockRes() {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis()
        };
        return res;
    }

    static createMockNext() {
        return jest.fn();
    }
}

/**
 * Assertion helpers
 */
export class TestAssertions {
    static expectValidResponse(response, expectedStatus = 200) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toBeDefined();
    }

    static expectErrorResponse(response, expectedStatus = 400, expectedCode = null) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body.error).toBeDefined();
        if (expectedCode) {
            expect(response.body.code).toBe(expectedCode);
        }
    }

    static expectSuccessResponse(response, expectedStatus = 200) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body.success).toBe(true);
    }

    static expectPaginatedResponse(response) {
        this.expectValidResponse(response);
        expect(response.body.data).toBeDefined();
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.page).toBeDefined();
        expect(response.body.pagination.limit).toBeDefined();
        expect(response.body.pagination.total).toBeDefined();
    }
}