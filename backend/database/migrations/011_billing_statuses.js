/**
 * Migration: 011 - Billing Statuses Configuration
 * Creates configurable billing_statuses table and migrates from enum to table-based
 */

export const shorthands = undefined;

export const up = async (pgm) => {
  // =====================================================
  // BILLING STATUSES TABLE
  // =====================================================
  pgm.createTable('billing_statuses', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(50)', notNull: true, unique: true },
    description: { type: 'text' },
    color: { type: 'varchar(20)', default: '#1890ff' }, // For UI display
    display_order: { type: 'integer', notNull: true, default: 0 },
    is_active: { type: 'boolean', notNull: true, default: true },
    is_system: { type: 'boolean', notNull: true, default: false }, // System statuses cannot be deleted
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    created_by: { type: 'uuid', references: 'users' },
    updated_by: { type: 'uuid', references: 'users' },
  });

  // Create index for active statuses
  pgm.createIndex('billing_statuses', 'is_active');
  pgm.createIndex('billing_statuses', 'display_order');

  // Insert default billing statuses
  pgm.sql(`
    INSERT INTO billing_statuses (id, name, description, color, display_order, is_active, is_system, created_by)
    VALUES
      (gen_random_uuid(), 'Billing', 'Billable allocation', '#52c41a', 1, true, true, (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)),
      (gen_random_uuid(), 'Non-Billing', 'Non-billable allocation', '#faad14', 2, true, true, (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)),
      (gen_random_uuid(), 'Bench', 'Bench allocation', '#1890ff', 3, true, true, (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)),
      (gen_random_uuid(), 'Training', 'Training allocation', '#722ed1', 4, true, true, (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)),
      (gen_random_uuid(), 'Presale', 'Pre-sales allocation', '#eb2f96', 5, true, true, (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1))
    ON CONFLICT (name) DO NOTHING;
  `);

  // Add billing_status_id column to allocations table
  pgm.addColumn('allocations', {
    billing_status_id: { type: 'uuid', references: 'billing_statuses' },
  });

  // Migrate existing data: Map enum values to billing_statuses
  pgm.sql(`
    UPDATE allocations a
    SET billing_status_id = (
      SELECT bs.id 
      FROM billing_statuses bs 
      WHERE bs.name = CASE 
        WHEN a.billing_status::text = 'Billing' THEN 'Billing'
        WHEN a.billing_status::text = 'Non-Billing' THEN 'Non-Billing'
        ELSE 'Billing' -- Default fallback
      END
      LIMIT 1
    )
    WHERE a.billing_status_id IS NULL;
  `);

  // For allocations that might have other values (if enum was extended), set to 'Billing' as default
  pgm.sql(`
    UPDATE allocations
    SET billing_status_id = (SELECT id FROM billing_statuses WHERE name = 'Billing' LIMIT 1)
    WHERE billing_status_id IS NULL;
  `);

  // Make billing_status_id NOT NULL after migration
  pgm.sql(`
    ALTER TABLE allocations 
    ALTER COLUMN billing_status_id SET NOT NULL;
  `);

  // Create index on billing_status_id
  pgm.createIndex('allocations', 'billing_status_id');

  // Add trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER billing_statuses_updated_at 
    BEFORE UPDATE ON billing_statuses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);
};

export const down = async (pgm) => {
  // Remove billing_status_id column from allocations
  pgm.dropColumn('allocations', 'billing_status_id');
  
  // Drop billing_statuses table
  pgm.dropTable('billing_statuses', { cascade: true });
};

