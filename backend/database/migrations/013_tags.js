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

    // Insert default tags (marked as is_default = true)
    pgm.sql(`
        INSERT INTO tags (name, description, is_active, is_default) VALUES
        ('Synergy', 'Synergy tag', true, true),
        ('GDC', 'GDC tag', true, true),
        ('Leaders league', 'Leaders league tag', true, true)
        ON CONFLICT (name) DO NOTHING;
    `);

    // Add trigger to update updated_at
    pgm.sql(`
        CREATE TRIGGER update_tags_updated_at
        BEFORE UPDATE ON tags
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
};

export const down = (pgm) => {
    pgm.dropTrigger('tags', 'update_tags_updated_at');
    pgm.dropTable('tags');
};
