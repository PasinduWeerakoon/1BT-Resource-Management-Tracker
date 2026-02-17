-- Migration: 011_create_dashboard_stats
-- Daily snapshot table for dashboard statistics (calculated at midnight)

CREATE TABLE IF NOT EXISTS dashboard_stats (
    id SERIAL PRIMARY KEY,
    stats_date DATE NOT NULL,
    stats_type VARCHAR(50) NOT NULL, -- 'resource_counts', 'percentages', 'charts'
    
    -- Resource Counts (stored as JSONB for flexibility)
    resource_counts JSONB,
    
    -- Percentages
    percentages JSONB,
    
    -- Charts Data
    charts_data JSONB,
    
    -- Metadata
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculation_duration_ms INTEGER,
    source VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'manual', 'on_demand'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one record per date per stats_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_date_type ON dashboard_stats(stats_date, stats_type);

-- Index for quick lookups by date
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_date ON dashboard_stats(stats_date DESC);

-- Index for getting latest stats quickly
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_latest ON dashboard_stats(stats_type, stats_date DESC);

-- Cleanup: Keep only last 365 days of data (can be adjusted)
COMMENT ON TABLE dashboard_stats IS 'Daily dashboard statistics snapshots. Calculated at midnight UTC. Retention: 365 days.';
