-- Migration: Create subscription_bell_configs table
-- Description: Store subscription bell widget configurations per site
-- Created: 2025-11-07

CREATE TABLE IF NOT EXISTS subscription_bell_configs (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

    -- Visual Style
    style VARCHAR(50) DEFAULT 'Rounded',  -- Rounded, Square, Circle
    position VARCHAR(50) DEFAULT 'Bottom Left',  -- Bottom Left, Bottom Right, Top Left, Top Right
    theme VARCHAR(50) DEFAULT 'Dark',  -- Dark, Light, Auto
    theme_color VARCHAR(20) DEFAULT '#4A90E2',
    popup_style VARCHAR(50) DEFAULT 'Standard',  -- Standard, Minimal, Compact
    x_axis INTEGER DEFAULT 15,  -- Horizontal offset in pixels
    y_axis INTEGER DEFAULT 15,  -- Vertical offset in pixels

    -- Text Content - Default State
    default_title TEXT DEFAULT 'Suscríbete para recibir notificaciones push sobre las últimas actualizaciones',
    default_button_text VARCHAR(100) DEFAULT 'SUSCRIBIRSE',

    -- Text Content - Subscribed State
    subscribed_title TEXT DEFAULT 'Estás suscrito a las notificaciones push',
    subscribed_button_text VARCHAR(100) DEFAULT 'DESUSCRIBIRSE',

    -- Text Content - Unsubscribed State
    unsubscribed_title TEXT DEFAULT 'No estás suscrito a las notificaciones push',
    unsubscribed_button_text VARCHAR(100) DEFAULT 'SUSCRIBIRSE',

    -- Last Notifications Feature
    show_last_notifications BOOLEAN DEFAULT true,
    default_heading TEXT DEFAULT 'Aquí hay algunas notificaciones que te perdiste:',
    subscribed_heading TEXT DEFAULT 'Notificaciones Recientes',

    -- Activation Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one config per site
    CONSTRAINT unique_site_bell_config UNIQUE (site_id)
);

-- Index for faster lookups
CREATE INDEX idx_subscription_bell_configs_site_id ON subscription_bell_configs(site_id);
CREATE INDEX idx_subscription_bell_configs_is_active ON subscription_bell_configs(is_active);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_bell_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_bell_configs_updated_at
    BEFORE UPDATE ON subscription_bell_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_bell_configs_updated_at();

-- Add comment for documentation
COMMENT ON TABLE subscription_bell_configs IS 'Configuration for subscription bell widget per site';
COMMENT ON COLUMN subscription_bell_configs.site_id IS 'Reference to the site this configuration belongs to';
COMMENT ON COLUMN subscription_bell_configs.is_active IS 'Whether the bell widget is currently active for the site';
