import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para la tabla users
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- Tabla de sitios web
CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Índices para la tabla sites
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites (user_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites (domain);
CREATE INDEX IF NOT EXISTS idx_sites_is_active ON sites (is_active);
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON sites (created_at DESC);

-- Crear tabla subscriptions si no existe
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas nuevas a subscriptions si no existen
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='user_id') THEN
    ALTER TABLE subscriptions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='site_id') THEN
    ALTER TABLE subscriptions ADD COLUMN site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Índices para la tabla subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions (created_at DESC);

-- Crear índices solo si las columnas existen
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='site_id') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_site_id ON subscriptions (site_id);
  END IF;
END $$;

-- Tabla de segmentos de audiencia (debe crearse primero)
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

-- Tabla de campañas de notificaciones
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,
  click_url TEXT,
  badge_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  send_type VARCHAR(50) NOT NULL DEFAULT 'immediate' CHECK (send_type IN ('immediate', 'scheduled', 'draft')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna segment_id después de crear las tablas
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='segment_id') THEN
    ALTER TABLE campaigns ADD COLUMN segment_id INTEGER REFERENCES audience_segments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Tabla de acciones/botones de campañas
CREATE TABLE IF NOT EXISTS campaign_actions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  action_text VARCHAR(255) NOT NULL,
  action_url TEXT NOT NULL,
  action_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ejecuciones de campañas
CREATE TABLE IF NOT EXISTS campaign_executions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  endpoint TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de campañas programadas (para el scheduler)
CREATE TABLE IF NOT EXISTS scheduled_campaigns (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Índices para campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns (user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_site_id ON campaigns (site_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_send_type ON campaigns (send_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns (created_at DESC);

-- Crear índice para segment_id solo si la columna existe
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='segment_id') THEN
    CREATE INDEX IF NOT EXISTS idx_campaigns_segment_id ON campaigns (segment_id);
  END IF;
END $$;

-- Índices para campaign_actions
CREATE INDEX IF NOT EXISTS idx_campaign_actions_campaign_id ON campaign_actions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_actions_order ON campaign_actions (campaign_id, action_order);

-- Índices para audience_segments
CREATE INDEX IF NOT EXISTS idx_audience_segments_user_id ON audience_segments (user_id);
CREATE INDEX IF NOT EXISTS idx_audience_segments_site_id ON audience_segments (site_id);
CREATE INDEX IF NOT EXISTS idx_audience_segments_created_at ON audience_segments (created_at DESC);

-- Índices para campaign_executions
CREATE INDEX IF NOT EXISTS idx_campaign_executions_campaign_id ON campaign_executions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_subscription_id ON campaign_executions (subscription_id);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_status ON campaign_executions (status);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_sent_at ON campaign_executions (sent_at DESC);

-- Índices para scheduled_campaigns
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_campaign_id ON scheduled_campaigns (campaign_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_scheduled_at ON scheduled_campaigns (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_status ON scheduled_campaigns (status);

-- Actualizar constraint de send_type para incluir 'draft'
DO $$ 
BEGIN 
  -- Eliminar el constraint existente si existe
  IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name='campaigns_send_type_check') THEN
    ALTER TABLE campaigns DROP CONSTRAINT campaigns_send_type_check;
  END IF;
  
  -- Agregar el nuevo constraint con 'draft' incluido
  ALTER TABLE campaigns ADD CONSTRAINT campaigns_send_type_check CHECK (send_type IN ('immediate', 'scheduled', 'draft'));
END $$;

-- Tabla de configuraciones de opt-in prompts
CREATE TABLE IF NOT EXISTS optin_configurations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('lightbox1', 'lightbox2', 'bellIcon')),
  when_to_show VARCHAR(50) NOT NULL CHECK (when_to_show IN ('Show Immediately', 'After 5 seconds', 'On exit intent')),
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- Tabla de journeys de automatización
CREATE TABLE IF NOT EXISTS journeys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'subscription', 'segment', 'date')),
  trigger_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pasos de journey
CREATE TABLE IF NOT EXISTS journey_steps (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('notification', 'wait', 'condition', 'segment')),
  step_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journey_id, step_order)
);

-- Tabla de ejecuciones de journey
CREATE TABLE IF NOT EXISTS journey_executions (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  current_step_id INTEGER REFERENCES journey_steps(id) ON DELETE SET NULL,
  current_step_order INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_data JSONB
);

-- Índices para opt-ins
CREATE INDEX IF NOT EXISTS idx_optin_configurations_user_id ON optin_configurations (user_id);
CREATE INDEX IF NOT EXISTS idx_optin_configurations_site_id ON optin_configurations (site_id);
CREATE INDEX IF NOT EXISTS idx_optin_configurations_is_active ON optin_configurations (is_active);

-- Índices para journeys
CREATE INDEX IF NOT EXISTS idx_journeys_user_id ON journeys (user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_site_id ON journeys (site_id);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys (status);
CREATE INDEX IF NOT EXISTS idx_journeys_created_at ON journeys (created_at DESC);

-- Índices para journey_steps
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey_id ON journey_steps (journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_order ON journey_steps (journey_id, step_order);

-- Índices para journey_executions
CREATE INDEX IF NOT EXISTS idx_journey_executions_journey_id ON journey_executions (journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_executions_subscription_id ON journey_executions (subscription_id);
CREATE INDEX IF NOT EXISTS idx_journey_executions_status ON journey_executions (status);
CREATE INDEX IF NOT EXISTS idx_journey_executions_started_at ON journey_executions (started_at DESC);

-- Crear usuario superadmin por defecto si no existe (password: admin123)
INSERT INTO users (email, password_hash, role) 
SELECT 'admin@pushsaas.local', '$2b$10$jciPCX2Slquiealss9vpse.E7kXhEfhupPrk6CU9iTmr4lHDX4a2K', 'superadmin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@pushsaas.local');
`;

(async () => {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('DB migrated ✅');
  } finally {
    client.release();
    await pool.end();
  }
})();
