/**
 * Migration: 004 - Ensure Tables Exist
 * Forces recreation with IF NOT EXISTS
 */

export const shorthands = undefined;

export const up = (pgm) => {
    // This migration ensures all tables exist
    // All statements use IF NOT EXISTS so safe to run
    pgm.sql(`
        -- Ensure tracks table exists
        CREATE TABLE IF NOT EXISTS tracks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(50) NOT NULL,
          description VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create unique constraint if not exists
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'tracks_name_key'
          ) THEN
            ALTER TABLE tracks ADD CONSTRAINT tracks_name_key UNIQUE (name);
          END IF;
        END $$;

        -- Ensure designations table exists
        CREATE TABLE IF NOT EXISTS designations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
          is_intern_role BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create unique constraint if not exists
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'designations_name_key'
          ) THEN
            ALTER TABLE designations ADD CONSTRAINT designations_name_key UNIQUE (name);
          END IF;
        END $$;
    `);
};

export const down = (pgm) => {
    // No-op - we don't want to drop tables
};
