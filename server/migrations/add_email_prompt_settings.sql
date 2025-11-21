-- Tabla para configuración de email prompt por sitio
CREATE TABLE IF NOT EXISTS email_prompt_settings (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- General settings
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  animation VARCHAR(50) DEFAULT 'Slide-in',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text TEXT DEFAULT 'Opt-in for latest news and updates',
  icon_url TEXT,
  
  -- Button settings
  cancel_button_text VARCHAR(100) DEFAULT 'Not Yet',
  cancel_button_color VARCHAR(7) DEFAULT '#2563eb',
  cancel_button_show BOOLEAN DEFAULT true,
  
  submit_button_text VARCHAR(100) DEFAULT 'Subscribe',
  submit_button_color VARCHAR(7) DEFAULT '#2563eb',
  submit_button_show BOOLEAN DEFAULT true,
  
  -- Timing
  re_prompt_delay INTEGER DEFAULT 1,
  thank_you_message TEXT DEFAULT 'Thank You...',
  
  -- Email collection
  collect_email BOOLEAN DEFAULT true,
  email_label VARCHAR(100) DEFAULT 'Email Address',
  email_validation_error TEXT DEFAULT 'Please enter a valid e-mail address',
  email_required BOOLEAN DEFAULT true,
  
  -- Phone collection
  collect_phone BOOLEAN DEFAULT true,
  phone_label VARCHAR(100) DEFAULT 'Phone Number',
  phone_validation_error TEXT DEFAULT 'Please enter a valid phone number',
  default_country VARCHAR(50) DEFAULT 'United States',
  phone_required BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id)
);

-- Índice para búsqueda rápida por site_id
CREATE INDEX IF NOT EXISTS idx_email_prompt_settings_site_id ON email_prompt_settings (site_id);

-- Tabla para almacenar emails y teléfonos recolectados
CREATE TABLE IF NOT EXISTS collected_contacts (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  email VARCHAR(255),
  phone VARCHAR(50),
  country_code VARCHAR(10),
  
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Índices para la tabla collected_contacts
CREATE INDEX IF NOT EXISTS idx_collected_contacts_site_id ON collected_contacts (site_id);
CREATE INDEX IF NOT EXISTS idx_collected_contacts_subscription_id ON collected_contacts (subscription_id);
CREATE INDEX IF NOT EXISTS idx_collected_contacts_email ON collected_contacts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collected_contacts_phone ON collected_contacts (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collected_contacts_collected_at ON collected_contacts (collected_at DESC);
