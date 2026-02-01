/**
 * Migration: Create account_types table
 * 
 * This table stores account types for projects (Internal, External).
 * Default account types are system-defined and cannot be modified or deleted.
 */

exports.up = async (pgm) => {
  // Create account_types table
  pgm.createTable('account_types', {
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
      comment: 'System-defined account types that cannot be modified or deleted',
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
  pgm.createIndex('account_types', 'name', { unique: true });

  // Add updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_account_types_updated_at
    BEFORE UPDATE ON account_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Insert default account types
  pgm.sql(`
    INSERT INTO account_types (name, description, is_default, created_by)
    VALUES 
      ('Internal', 'Internal company projects', true, '00000000-0000-0000-0000-000000000000'),
      ('External', 'External client projects', true, '00000000-0000-0000-0000-000000000000');
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE account_types IS 'Stores account types for projects with default system-defined values';
  `);
};

exports.down = async (pgm) => {
  pgm.dropTable('account_types', { ifExists: true, cascade: true });
};
