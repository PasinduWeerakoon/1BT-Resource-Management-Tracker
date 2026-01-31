/**
 * Migration: Seed default tracks
 * Inserts default tracks that cannot be edited or deleted
 */

export const up = (pgm) => {
  // First, update any existing tracks with matching names (case-insensitive) to be default
  pgm.sql(`
    UPDATE tracks 
    SET is_default = true, is_active = true
    WHERE LOWER(name) IN (
      LOWER('Dev'), LOWER('Delivery'), LOWER('UX'), LOWER('QA'), 
      LOWER('UI'), LOWER('PM'), LOWER('BA'), LOWER('Execs'), 
      LOWER('Support'), LOWER('Functional Consultant - MS Dynamics 365')
    );
  `);

  // Insert default tracks (marked as is_default = true)
  // Using ON CONFLICT to handle duplicates
  pgm.sql(`
    INSERT INTO tracks (name, description, is_active, is_default) VALUES
    ('Dev', 'Development', true, true),
    ('Delivery', 'Delivery', true, true),
    ('UX', 'User Experience', true, true),
    ('QA', 'Quality Assurance', true, true),
    ('UI', 'User Interface', true, true),
    ('PM', 'Project Management', true, true),
    ('BA', 'Business Analysis', true, true),
    ('Execs', 'Executives', true, true),
    ('Support', 'Support', true, true),
    ('Functional Consultant - MS Dynamics 365', 'Functional Consultant - MS Dynamics 365', true, true)
    ON CONFLICT (name) DO UPDATE 
    SET is_default = true, is_active = true, description = EXCLUDED.description;
  `);
};

export const down = (pgm) => {
  // Remove default tracks
  pgm.sql(`
    DELETE FROM tracks WHERE is_default = true;
  `);
};

