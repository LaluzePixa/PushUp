/**
 * Global Teardown for Jest Tests
 * Runs once after all tests complete
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function globalTeardown() {
    console.log('🧹 Cleaning up test environment...');

    try {
        const pool = new Pool({
            connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pushsaas_test',
            max: 1
        });

        await pool.query('DELETE FROM campaign_executions WHERE id > 0');
        await pool.query('DELETE FROM campaign_actions WHERE id > 0');
        await pool.query('DELETE FROM campaigns WHERE id > 0');
        await pool.query('DELETE FROM audience_segments WHERE id > 0');
        await pool.query('DELETE FROM subscriptions WHERE id > 0');
        await pool.query('DELETE FROM optin_configurations WHERE id > 0');
        await pool.query('DELETE FROM sites WHERE id > 0');
        await pool.query('DELETE FROM users WHERE id > 0');

        console.log('✅ Test data cleaned');

        await pool.end();
        console.log('✅ Database connections closed');

    } catch (error) {
        console.error('❌ Test cleanup failed:', error.message);
    }

    console.log('✅ Global teardown completed');
}

export default globalTeardown;