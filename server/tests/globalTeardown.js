/**
 * Global Teardown for Jest Tests
 * Runs once after all tests complete
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function globalTeardown() {
    console.log('🧹 Cleaning up test environment...');

    const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pushsaas_test';

    try {
        const pool = new Pool({ connectionString: testDatabaseUrl });
        const client = await pool.connect();

        // Clean up test data
        await client.query(`
      DROP TABLE IF EXISTS campaign_executions CASCADE;
      DROP TABLE IF EXISTS campaign_actions CASCADE;
      DROP TABLE IF EXISTS campaigns CASCADE;
      DROP TABLE IF EXISTS audience_segments CASCADE;
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS optin_configurations CASCADE;
      DROP TABLE IF EXISTS sites CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

        console.log('✅ Test database cleaned up');

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Test cleanup failed:', error.message);
    }

    console.log('✅ Global teardown completed');
}

export default globalTeardown;