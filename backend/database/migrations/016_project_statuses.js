/**
 * Migration: Create project_statuses table
 * 
 * This table stores project statuses (Active, Inactive, Completed, On Hold, etc.).
 * Default statuses are system-defined and cannot be modified or deleted.
 */

exports.up = async (pgm) => {
  // Create project_statuses table
  pgm.createTable('project_statuses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
      notNull: true,
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    is_default: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'System-defined project statuses that cannot be modified or deleted',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    created_by: {
      type: 'uuid',
      notNull: false,
    },
    updated_by: {
      type: 'uuid',
      notNull: false,
    },
  });

  // Add unique constraint on name
  pgm.createIndex('project_statuses', 'name', { unique: true });

  // Add updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_project_statuses_updated_at
    BEFORE UPDATE ON project_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Insert default project statuses
  pgm.sql(`
    INSERT INTO project_statuses (name, description, is_default, created_by)
    VALUES 
      ('Active', 'Project is currently active and ongoing', true, '00000000-0000-0000-0000-000000000000'),
      ('Inactive', 'Project is temporarily inactive', true, '00000000-0000-0000-0000-000000000000'),
      ('Completed', 'Project has been completed', true, '00000000-0000-0000-0000-000000000000'),
      ('On Hold', 'Project is on hold', true, '00000000-0000-0000-0000-000000000000'),
      ('Cancelled', 'Project has been cancelled', true, '00000000-0000-0000-0000-000000000000');
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE project_statuses IS 'Stores project statuses with default system-defined values';
  `);
};

exports.down = async (pgm) => {
  pgm.dropTable('project_statuses', { ifExists: true, cascade: true });
};
