/**
 * Jest Setup File for Server Tests
 * Runs after test environment is set up but before tests run
 */

import 'dotenv/config';
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pushsaas_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.VAPID_SUBJECT = 'mailto:test@pushsaas.local';
process.env.VAPID_PUBLIC_KEY = 'test-vapid-public-key';
process.env.VAPID_PRIVATE_KEY = 'test-vapid-private-key';

// Mock external services globally
jest.mock('web-push', () => ({
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn().mockResolvedValue({ success: true }),
    generateVAPIDKeys: jest.fn().mockReturnValue({
        publicKey: 'test-public-key',
        privateKey: 'test-private-key'
    })
}));

// Global test utilities
global.testUtils = {
    // Helper to create test user
    createTestUser: async (pool, userData = {}) => {
        const { hashPassword } = await import('../src/middleware/auth.js');
        const hashedPassword = await hashPassword(userData.password || 'TestPassword123!');

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
            [
                userData.email || 'test@example.com',
                hashedPassword,
                userData.role || 'user',
                userData.isActive !== undefined ? userData.isActive : true
            ]
        );
        return result.rows[0];
    },

    // Helper to create test site
    createTestSite: async (pool, userId, siteData = {}) => {
        const result = await pool.query(
            'INSERT INTO sites (user_id, name, domain, description, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
                userId,
                siteData.name || 'Test Site',
                siteData.domain || 'test.example.com',
                siteData.description || 'Test site description',
                siteData.isActive !== undefined ? siteData.isActive : true
            ]
        );
        return result.rows[0];
    },

    // Helper to create test subscription
    createTestSubscription: async (pool, siteId, subscriptionData = {}) => {
        const result = await pool.query(
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
    },

    // Helper to create test campaign
    createTestCampaign: async (pool, userId, siteId, campaignData = {}) => {
        const result = await pool.query(
            `INSERT INTO campaigns (user_id, site_id, name, title, body, status, send_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                userId,
                siteId || null,
                campaignData.name || 'Test Campaign',
                campaignData.title || 'Test Title',
                campaignData.body || 'Test Body',
                campaignData.status || 'draft',
                campaignData.sendType || 'immediate'
            ]
        );
        return result.rows[0];
    },

    // Helper to clean up test data
    cleanupTestData: async (pool) => {
        // Delete in correct order due to foreign keys
        await pool.query('DELETE FROM campaign_executions');
        await pool.query('DELETE FROM campaign_actions');
        await pool.query('DELETE FROM campaigns');
        await pool.query('DELETE FROM audience_segments');
        await pool.query('DELETE FROM subscriptions');
        await pool.query('DELETE FROM sites');
        await pool.query('DELETE FROM users WHERE email LIKE \'%test%\' OR email LIKE \'%example%\'');
    },

    // Helper to generate auth token
    generateAuthToken: async (userId) => {
        const { signJWT } = await import('../src/middleware/auth.js');
        return signJWT({ id: userId, email: 'test@example.com', role: 'user' });
    }
};

// Console override for cleaner test output
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    // Always show logs in test mode for now
    originalLog(...args);
};

console.error = (...args) => {
    if (process.env.JEST_VERBOSE === 'true') {
        originalError(...args);
    }
};