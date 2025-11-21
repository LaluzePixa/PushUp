-- Add geolocation fields to subscriptions table
DO $$ 
BEGIN 
  -- Add country field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='country') THEN
    ALTER TABLE subscriptions ADD COLUMN country VARCHAR(100);
  END IF;
  
  -- Add state/region field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='state') THEN
    ALTER TABLE subscriptions ADD COLUMN state VARCHAR(100);
  END IF;
  
  -- Add city field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='city') THEN
    ALTER TABLE subscriptions ADD COLUMN city VARCHAR(100);
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_country ON subscriptions (country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_state ON subscriptions (state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_city ON subscriptions (city) WHERE city IS NOT NULL;
