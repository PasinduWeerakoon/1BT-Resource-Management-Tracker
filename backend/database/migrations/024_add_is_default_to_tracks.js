/**
 * Migration: Add is_default column to tracks table
 * This allows marking default tracks that cannot be edited or deleted
 */

export const up = (pgm) => {
  // Add is_default column to tracks table
  pgm.sql(`
    ALTER TABLE tracks 
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false NOT NULL;
  `);

  // Create index on is_default for faster lookups
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS tracks_is_default_idx ON tracks(is_default);
  `);
};

export const down = (pgm) => {
  // Remove index
  pgm.sql(`DROP INDEX IF EXISTS tracks_is_default_idx;`);
  
  // Remove column
  pgm.sql(`ALTER TABLE tracks DROP COLUMN IF EXISTS is_default;`);
};

