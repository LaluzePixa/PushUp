import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
-- Primero eliminar las restricciones existentes si existen
ALTER TABLE IF EXISTS subscriptions DROP CONSTRAINT IF EXISTS subscriptions_site_id_fkey;
ALTER TABLE IF EXISTS campaigns DROP CONSTRAINT IF EXISTS campaigns_site_id_fkey;
ALTER TABLE IF EXISTS audience_segments DROP CONSTRAINT IF EXISTS audience_segments_site_id_fkey;

-- Eliminar datos existentes que podrían causar conflictos
DELETE FROM subscriptions WHERE site_id IS NOT NULL AND site_id !~ '^[0-9]+$';
DELETE FROM campaigns WHERE site_id IS NOT NULL AND site_id !~ '^[0-9]+$';
DELETE FROM audience_segments WHERE site_id IS NOT NULL AND site_id !~ '^[0-9]+$';

-- Cambiar el tipo de dato de site_id en subscriptions
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='site_id' AND data_type='character varying') THEN
    ALTER TABLE subscriptions ALTER COLUMN site_id TYPE INTEGER USING CASE WHEN site_id ~ '^[0-9]+$' THEN site_id::INTEGER ELSE NULL END;
  END IF;
END $$;

-- Cambiar el tipo de dato de site_id en campaigns
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='site_id' AND data_type='character varying') THEN
    ALTER TABLE campaigns ALTER COLUMN site_id TYPE INTEGER USING CASE WHEN site_id ~ '^[0-9]+$' THEN site_id::INTEGER ELSE NULL END;
  END IF;
END $$;

-- Cambiar el tipo de dato de site_id en audience_segments
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audience_segments' AND column_name='site_id' AND data_type='character varying') THEN
    ALTER TABLE audience_segments ALTER COLUMN site_id TYPE INTEGER USING CASE WHEN site_id ~ '^[0-9]+$' THEN site_id::INTEGER ELSE NULL END;
  END IF;
END $$;

-- Agregar las foreign keys de nuevo
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_site_id_fkey FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_site_id_fkey FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE audience_segments ADD CONSTRAINT audience_segments_site_id_fkey FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;
`;

(async () => {
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('Site ID types fixed ✅');
    } catch (error) {
        console.error('Error fixing site ID types:', error);
    } finally {
        client.release();
        await pool.end();
    }
})();