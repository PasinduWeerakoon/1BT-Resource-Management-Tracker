/**
 * Migration: Create tiers table
 * 
 * This table stores tier information (Tier - 1, Tier - 2, Tier - 3, Tier - 4).
 * Default tiers are system-defined and cannot be modified or deleted.
 */

exports.up = async (pgm) => {
  // Create tiers table
  pgm.createTable('tiers', {
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
    level: {
      type: 'integer',
      notNull: false,
      comment: 'Numeric level for ordering (1, 2, 3, 4)',
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
      comment: 'System-defined tiers that cannot be modified or deleted',
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
  pgm.createIndex('tiers', 'name', { unique: true });

  // Add unique constraint on level (non-null values only)
  pgm.createIndex('tiers', 'level', { unique: true, where: 'level IS NOT NULL' });

  // Add updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_tiers_updated_at
    BEFORE UPDATE ON tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Insert default tiers
  pgm.sql(`
    INSERT INTO tiers (name, level, description, is_default, created_by)
    VALUES 
      ('Tier - 1', 1, 'Tier 1 employees', true, '00000000-0000-0000-0000-000000000000'),
      ('Tier - 2', 2, 'Tier 2 employees', true, '00000000-0000-0000-0000-000000000000'),
      ('Tier - 3', 3, 'Tier 3 employees', true, '00000000-0000-0000-0000-000000000000'),
      ('Tier - 4', 4, 'Tier 4 employees', true, '00000000-0000-0000-0000-000000000000');
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE tiers IS 'Stores tier information with default system-defined values';
  `);
};

exports.down = async (pgm) => {
  pgm.dropTable('tiers', { ifExists: true, cascade: true });
};
