/**
 * Migration: Create billing_statuses table
 * This migration creates a table to manage billing statuses for projects
 * instead of using an enum, allowing users to add custom billing statuses
 */

export const up = (pgm) => {
    // Create billing_statuses table
    pgm.createTable('billing_statuses', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        name: { type: 'varchar(50)', notNull: true, unique: true },
        description: { type: 'text' },
        is_active: { type: 'boolean', default: true },
        is_default: { type: 'boolean', default: false, notNull: true },
        created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid' },
        updated_by: { type: 'uuid' },
    });

    // Create index on name for faster lookups
    pgm.createIndex('billing_statuses', 'name');

    // Insert default billing statuses (marked as is_default = true)
    pgm.sql(`
        INSERT INTO billing_statuses (name, description, is_active, is_default) VALUES
        ('Billing', 'Project is billable', true, true),
        ('Non-Billing', 'Project is not billable', true, true),
        ('Presales', 'Pre-sales project', true, true),
        ('Training', 'Training project', true, true),
        ('POC', 'Proof of Concept project', true, true),
        ('Preparation', 'Project in preparation phase', true, true)
        ON CONFLICT (name) DO NOTHING;
    `);

    // Add trigger to update updated_at
    pgm.sql(`
        CREATE TRIGGER update_billing_statuses_updated_at
        BEFORE UPDATE ON billing_statuses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
};

export const down = (pgm) => {
    pgm.dropTrigger('billing_statuses', 'update_billing_statuses_updated_at');
    pgm.dropTable('billing_statuses');
};
