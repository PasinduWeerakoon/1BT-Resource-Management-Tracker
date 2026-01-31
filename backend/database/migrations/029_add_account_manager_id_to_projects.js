/**
 * Migration: Add account_manager_id to projects table
 * 
 * This migration adds a foreign key field to reference the resources table
 * for account managers. The existing account_manager text field is kept
 * for backward compatibility or as a display name override.
 */

export const shorthands = undefined;

export const up = (pgm) => {
  // Add account_manager_id column as foreign key to resources
  pgm.addColumns('projects', {
    account_manager_id: {
      type: 'uuid',
      references: 'resources(id)',
      onDelete: 'SET NULL',
    },
  });

  // Add index for better query performance
  pgm.createIndex('projects', 'account_manager_id', {
    name: 'idx_projects_account_manager_id',
  });

  // Make account_manager nullable since we now have account_manager_id
  pgm.alterColumn('projects', 'account_manager', {
    notNull: false,
  });

  // Try to populate account_manager_id by matching account_manager names with resource names
  // This is a best-effort migration for existing data
  pgm.sql(`
    UPDATE projects p
    SET account_manager_id = r.id
    FROM resources r
    WHERE p.account_manager IS NOT NULL
      AND LOWER(TRIM(p.account_manager)) = LOWER(TRIM(r.name))
      AND r.deleted_at IS NULL
      AND r.is_account_manager = true
  `);

  pgm.sql(`
    COMMENT ON COLUMN projects.account_manager_id IS 'Foreign key reference to resources table for the account manager';
  `);
  
  pgm.sql(`
    COMMENT ON COLUMN projects.account_manager IS 'Account manager name (deprecated - use account_manager_id)';
  `);
};

export const down = (pgm) => {
  // Drop the index first
  pgm.dropIndex('projects', 'account_manager_id', {
    name: 'idx_projects_account_manager_id',
    ifExists: true,
  });

  // Drop the column
  pgm.dropColumns('projects', ['account_manager_id']);

  // Restore account_manager as NOT NULL
  pgm.alterColumn('projects', 'account_manager', {
    notNull: true,
  });
};

