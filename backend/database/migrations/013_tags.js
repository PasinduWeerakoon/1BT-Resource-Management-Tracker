/**
 * Migration: Create tags table
 * This migration creates a table to manage tags for resources/projects
 * with default tags that cannot be edited or deleted
 */

export const up = (pgm) => {
    // Create tags table
    pgm.createTable('tags', {
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
    pgm.createIndex('tags', 'name');

    // Add trigger to update updated_at
    pgm.sql(`
        CREATE TRIGGER update_tags_updated_at
        BEFORE UPDATE ON tags
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert default tags (marked as is_default = true)
    pgm.sql(`
        INSERT INTO tags (name, description, is_active, is_default, created_by) VALUES
        ('Synergy', 'Default Synergy tag', true, true, '00000000-0000-0000-0000-000000000000'),
        ('GDC', 'Default GDC tag', true, true, '00000000-0000-0000-0000-000000000000'),
        ('Leaders league', 'Default Leaders league tag', true, true, '00000000-0000-0000-0000-000000000000')
        ON CONFLICT (name) DO NOTHING;
    `);
};

export const down = (pgm) => {
    pgm.dropTrigger('tags', 'update_tags_updated_at');
    pgm.dropTable('tags');
};
