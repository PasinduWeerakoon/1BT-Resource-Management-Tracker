/**
 * Migration: Update projects table to use foreign keys
 * 
 * Converts project_type, account_type, and status from ENUMs to foreign keys
 * pointing to project_types, account_types, and project_statuses tables.
 * Also converts billing_type to reference billing_statuses table.
 */

exports.up = async (pgm) => {
  // Step 1: Add new foreign key columns (nullable initially for data migration)
  pgm.addColumns('projects', {
    project_type_id: {
      type: 'uuid',
      references: 'project_types',
      onDelete: 'RESTRICT',
    },
    account_type_id: {
      type: 'uuid',
      references: 'account_types',
      onDelete: 'RESTRICT',
    },
    status_id: {
      type: 'uuid',
      references: 'project_statuses',
      onDelete: 'RESTRICT',
    },
    billing_status_id: {
      type: 'uuid',
      references: 'billing_statuses',
      onDelete: 'RESTRICT',
    },
  });

  // Step 2: Migrate data from enum columns to FK columns
  pgm.sql(`
    -- Migrate project_type
    UPDATE projects p
    SET project_type_id = pt.id
    FROM project_types pt
    WHERE LOWER(p.project_type::text) = LOWER(pt.name);

    -- Migrate account_type
    UPDATE projects p
    SET account_type_id = at.id
    FROM account_types at
    WHERE LOWER(p.account_type::text) = LOWER(at.name);

    -- Migrate status
    UPDATE projects p
    SET status_id = ps.id
    FROM project_statuses ps
    WHERE LOWER(p.status::text) = LOWER(ps.name);

    -- Migrate billing_type to billing_status_id
    UPDATE projects p
    SET billing_status_id = bs.id
    FROM billing_statuses bs
    WHERE LOWER(p.billing_type) = LOWER(bs.name);
  `);

  // Step 3: Make FK columns NOT NULL
  pgm.alterColumn('projects', 'project_type_id', {
    notNull: true,
  });
  pgm.alterColumn('projects', 'account_type_id', {
    notNull: true,
  });
  pgm.alterColumn('projects', 'status_id', {
    notNull: true,
  });
  pgm.alterColumn('projects', 'billing_status_id', {
    notNull: true,
  });

  // Step 4: Drop old enum columns
  pgm.dropColumns('projects', ['project_type', 'account_type', 'status', 'billing_type']);

  // Step 5: Drop old constraints that referenced the enum columns
  pgm.dropConstraint('projects', 'projects_billing_type_valid', { ifExists: true });
  pgm.dropConstraint('projects', 'projects_client_required_for_external', { ifExists: true });
  pgm.dropConstraint('projects', 'projects_budget_disabled_for_non_billing', { ifExists: true });

  // Step 6: Add new constraints for FK columns
  // Note: We'll recreate the business logic constraints using the new FK columns
  pgm.sql(`
    -- Constraint: External projects must have a client
    ALTER TABLE projects
    ADD CONSTRAINT projects_client_required_for_external
    CHECK (
      (account_type_id IN (SELECT id FROM account_types WHERE name = 'External') AND client_id IS NOT NULL)
      OR
      (account_type_id IN (SELECT id FROM account_types WHERE name = 'Internal'))
    );

    -- Constraint: Non-Billing projects cannot have a budget
    ALTER TABLE projects
    ADD CONSTRAINT projects_budget_disabled_for_non_billing
    CHECK (
      (billing_status_id IN (SELECT id FROM billing_statuses WHERE name = 'Non-Billing') AND budget IS NULL)
      OR
      (billing_status_id NOT IN (SELECT id FROM billing_statuses WHERE name = 'Non-Billing'))
    );
  `);

  // Step 7: Add indexes for FK columns for better query performance
  pgm.createIndex('projects', 'project_type_id');
  pgm.createIndex('projects', 'account_type_id');
  pgm.createIndex('projects', 'status_id');
  pgm.createIndex('projects', 'billing_status_id');

  // Add comments for clarity
  pgm.sql(`
    COMMENT ON COLUMN projects.project_type_id IS 'Foreign key to project_types table';
    COMMENT ON COLUMN projects.account_type_id IS 'Foreign key to account_types table';
    COMMENT ON COLUMN projects.status_id IS 'Foreign key to project_statuses table';
    COMMENT ON COLUMN projects.billing_status_id IS 'Foreign key to billing_statuses table';
  `);
};

exports.down = async (pgm) => {
  // Step 1: Add back the old enum columns
  pgm.addColumns('projects', {
    project_type: {
      type: 'project_type',
      notNull: false,
    },
    account_type: {
      type: 'account_type',
      notNull: false,
    },
    status: {
      type: 'project_status',
      notNull: false,
      default: 'Active',
    },
    billing_type: {
      type: 'varchar(20)',
      default: 'Billing',
    },
  });

  // Step 2: Migrate data back from FK columns to enum columns
  pgm.sql(`
    -- Migrate back project_type
    UPDATE projects p
    SET project_type = pt.name::project_type
    FROM project_types pt
    WHERE p.project_type_id = pt.id;

    -- Migrate back account_type
    UPDATE projects p
    SET account_type = at.name::account_type
    FROM account_types at
    WHERE p.account_type_id = at.id;

    -- Migrate back status
    UPDATE projects p
    SET status = ps.name::project_status
    FROM project_statuses ps
    WHERE p.status_id = ps.id;

    -- Migrate back billing_type
    UPDATE projects p
    SET billing_type = bs.name
    FROM billing_statuses bs
    WHERE p.billing_status_id = bs.id;
  `);

  // Step 3: Make old columns NOT NULL
  pgm.alterColumn('projects', 'project_type', { notNull: true });
  pgm.alterColumn('projects', 'account_type', { notNull: true });
  pgm.alterColumn('projects', 'status', { notNull: true });

  // Step 4: Drop new FK columns
  pgm.dropColumns('projects', ['project_type_id', 'account_type_id', 'status_id', 'billing_status_id']);

  // Step 5: Restore old constraints
  pgm.addConstraint('projects', 'projects_billing_type_valid',
    `CHECK (billing_type IN ('Billing', 'Non-Billing'))`);
  pgm.addConstraint('projects', 'projects_client_required_for_external',
    `CHECK ((account_type = 'External' AND client_id IS NOT NULL) OR (account_type = 'Internal'))`);
  pgm.addConstraint('projects', 'projects_budget_disabled_for_non_billing',
    `CHECK ((billing_type = 'Non-Billing' AND budget IS NULL) OR (billing_type = 'Billing'))`);
};
