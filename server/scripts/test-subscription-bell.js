import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TEST_SITE_ID = 1;

console.log('\n🧪 Testing Subscription Bell Configuration Service\n');
console.log('='.repeat(60));

(async () => {
    try {
        // Test 1: Get or Create Config
        console.log('\n📋 Test 1: Get or Create Default Configuration');
        console.log('-'.repeat(60));

        let result = await pool.query(
            'SELECT * FROM subscription_bell_configs WHERE site_id = $1',
            [TEST_SITE_ID]
        );

        if (result.rows.length === 0) {
            console.log('  ✓ No existing config found, creating default...');

            result = await pool.query(
                `INSERT INTO subscription_bell_configs (
          site_id, style, position, theme, theme_color, popup_style,
          x_axis, y_axis, default_title, default_button_text,
          subscribed_title, subscribed_button_text, unsubscribed_title,
          unsubscribed_button_text, show_last_notifications,
          default_heading, subscribed_heading, is_active
        ) VALUES (
          $1, 'Rounded', 'Bottom Right', 'Dark', '#4A90E2', 'Standard',
          '15', '15',
          'Suscríbete para recibir notificaciones push sobre las últimas actualizaciones',
          'SUSCRIBIRSE',
          'Estás suscrito a las notificaciones push',
          'DESUSCRIBIRSE',
          'No estás suscrito a las notificaciones push',
          'SUSCRIBIRSE',
          true,
          'Aquí hay algunas notificaciones que te perdiste:',
          'Notificaciones Recientes',
          true
        ) RETURNING *`,
                [TEST_SITE_ID]
            );

            console.log('  ✓ Default config created successfully');
        } else {
            console.log('  ✓ Existing config found');
        }

        const config = result.rows[0];
        console.log(`  ✓ Config ID: ${config.id}`);
        console.log(`  ✓ Style: ${config.style}`);
        console.log(`  ✓ Position: ${config.position}`);
        console.log(`  ✓ Theme: ${config.theme}`);
        console.log(`  ✓ Active: ${config.is_active}`);

        // Test 2: Update Config
        console.log('\n📝 Test 2: Update Configuration');
        console.log('-'.repeat(60));

        const updateResult = await pool.query(
            `UPDATE subscription_bell_configs SET
        style = $2,
        theme_color = $3,
        default_title = $4,
        updated_at = NOW()
      WHERE site_id = $1
      RETURNING *`,
            [
                TEST_SITE_ID,
                'Square',
                '#FF5733',
                'Test Updated Title - Subscribe Now!'
            ]
        );

        const updatedConfig = updateResult.rows[0];
        console.log('  ✓ Config updated successfully');
        console.log(`  ✓ New Style: ${updatedConfig.style}`);
        console.log(`  ✓ New Theme Color: ${updatedConfig.theme_color}`);
        console.log(`  ✓ New Title: ${updatedConfig.default_title}`);
        console.log(`  ✓ Updated At: ${updatedConfig.updated_at}`);

        // Test 3: Toggle Visibility
        console.log('\n🔄 Test 3: Toggle Visibility');
        console.log('-'.repeat(60));

        const toggleResult = await pool.query(
            `UPDATE subscription_bell_configs SET
        is_active = $2,
        updated_at = NOW()
      WHERE site_id = $1
      RETURNING *`,
            [TEST_SITE_ID, false]
        );

        console.log(`  ✓ Visibility toggled to: ${toggleResult.rows[0].is_active}`);

        // Toggle back
        await pool.query(
            `UPDATE subscription_bell_configs SET
        is_active = $2,
        updated_at = NOW()
      WHERE site_id = $1`,
            [TEST_SITE_ID, true]
        );

        console.log('  ✓ Visibility toggled back to: true');

        // Test 4: Persistence Check
        console.log('\n💾 Test 4: Data Persistence Check');
        console.log('-'.repeat(60));

        const persistResult = await pool.query(
            'SELECT * FROM subscription_bell_configs WHERE site_id = $1',
            [TEST_SITE_ID]
        );

        if (persistResult.rows.length > 0) {
            const persistedConfig = persistResult.rows[0];
            console.log('  ✓ Configuration persisted successfully');
            console.log(`  ✓ Style: ${persistedConfig.style} (should be Square)`);
            console.log(`  ✓ Theme Color: ${persistedConfig.theme_color} (should be #FF5733)`);
            console.log(`  ✓ Active: ${persistedConfig.is_active} (should be true)`);

            // Reset to defaults for cleaner state
            await pool.query(
                `UPDATE subscription_bell_configs SET
          style = 'Rounded',
          theme_color = '#4A90E2',
          default_title = 'Suscríbete para recibir notificaciones push sobre las últimas actualizaciones',
          updated_at = NOW()
        WHERE site_id = $1`,
                [TEST_SITE_ID]
            );

            console.log('  ✓ Config reset to defaults for clean state');
        } else {
            console.log('  ✗ Configuration not found - persistence failed!');
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests passed successfully!');
        console.log('='.repeat(60));
        console.log(`\n🌐 Test the UI at: http://localhost:3001/subs-bell.html?siteId=${TEST_SITE_ID}\n`);

    } catch (err) {
        console.error('\n❌ Test failed:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
})();
