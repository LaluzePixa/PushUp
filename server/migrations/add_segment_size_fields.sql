-- Migration: Add segment size management fields to audience_segments table
-- Date: 2025-11-20
-- Description: Adds max_size, materialized_count, and last_materialized_at columns
--              to support segment size limits and caching optimization

-- Add max_size column (maximum number of subscribers in segment)
ALTER TABLE audience_segments 
ADD COLUMN IF NOT EXISTS max_size INTEGER DEFAULT 10000;

-- Add materialized_count column (cached count of matching subscribers)
ALTER TABLE audience_segments 
ADD COLUMN IF NOT EXISTS materialized_count INTEGER DEFAULT 0;

-- Add last_materialized_at column (timestamp of last cache update)
ALTER TABLE audience_segments 
ADD COLUMN IF NOT EXISTS last_materialized_at TIMESTAMPTZ;

-- Add constraints
ALTER TABLE audience_segments 
ADD CONSTRAINT check_max_size_positive 
CHECK (max_size > 0 AND max_size <= 100000);

ALTER TABLE audience_segments 
ADD CONSTRAINT check_materialized_count_non_negative 
CHECK (materialized_count >= 0);

-- Add index for performance queries
CREATE INDEX IF NOT EXISTS idx_audience_segments_last_materialized 
ON audience_segments (last_materialized_at DESC) 
WHERE last_materialized_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN audience_segments.max_size IS 'Maximum number of subscribers this segment can contain (1-100000)';
COMMENT ON COLUMN audience_segments.materialized_count IS 'Cached count of subscribers matching segment conditions';
COMMENT ON COLUMN audience_segments.last_materialized_at IS 'Timestamp of last materialized count calculation';
