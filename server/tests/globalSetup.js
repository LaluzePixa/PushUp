/**
 * Global Setup for Jest Tests
 * Runs once before all tests
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function globalSetup() {
    console.log('🚀 Setting up test environment...');

    // Setup test database connection
    const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pushsaas_test';

    try {
        const pool = new Pool({ connectionString: testDatabaseUrl });

        // Test database connection
        const client = await pool.connect();
        console.log('✅ Test database connection established');

        // Run migrations for test database
        const migrationSql = `
      -- Create test database schema (simplified version of main migration)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        ip TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audience_segments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        conditions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        segment_id INTEGER REFERENCES audience_segments(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        icon_url TEXT,
        image_url TEXT,
        click_url TEXT,
        badge_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        send_type VARCHAR(50) NOT NULL DEFAULT 'immediate',
        scheduled_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        total_sent INTEGER DEFAULT 0,
        total_delivered INTEGER DEFAULT 0,
        total_failed INTEGER DEFAULT 0,
        total_clicked INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaign_actions (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        action_text VARCHAR(255) NOT NULL,
        action_url TEXT NOT NULL,
        action_order INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaign_executions (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
        endpoint TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        clicked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS optin_configurations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        when_to_show VARCHAR(50) NOT NULL,
        animation VARCHAR(100) NOT NULL DEFAULT 'Drop-in',
        background_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
        headline VARCHAR(255),
        headline_enabled BOOLEAN NOT NULL DEFAULT false,
        text VARCHAR(500) NOT NULL DEFAULT 'Would you like to receive notifications on latest updates?',
        text_enabled BOOLEAN NOT NULL DEFAULT true,
        cancel_button VARCHAR(100) NOT NULL DEFAULT 'NOT YET',
        cancel_bg_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
        cancel_text_color VARCHAR(20) NOT NULL DEFAULT '#000000',
        approve_button VARCHAR(100) NOT NULL DEFAULT 'YES',
        approve_bg_color VARCHAR(20) NOT NULL DEFAULT '#2563eb',
        approve_text_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
        re_prompt_delay VARCHAR(50) NOT NULL DEFAULT '0',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

        await client.query(migrationSql);
        console.log('✅ Test database schema created');

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Test database setup failed:', error.message);
        console.error('Make sure PostgreSQL is running and TEST_DATABASE_URL is correct');
        process.exit(1);
    }

    console.log('✅ Global setup completed');
}

export default globalSetup;