/**
 * Migration: Create project_types table
 * This migration creates a table to manage project types for projects
 * instead of using an enum, allowing users to add custom project types
 */

export const up = (pgm) => {
    // Create project_types table
    pgm.createTable('project_types', {
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
    pgm.createIndex('project_types', 'name');

    // Insert default project types (marked as is_default = true)
    pgm.sql(`
        INSERT INTO project_types (name, description, is_active, is_default) VALUES
        ('Client', 'Client project', true, true),
        ('Bench', 'Bench project', true, true),
        ('POC', 'Proof of Concept project', true, true),
        ('Presale', 'Pre-sales project', true, true),
        ('Research', 'Research project', true, true)
        ON CONFLICT (name) DO NOTHING;
    `);

    // Add trigger to update updated_at
    pgm.sql(`
        CREATE TRIGGER update_project_types_updated_at
        BEFORE UPDATE ON project_types
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
};

export const down = (pgm) => {
    pgm.dropTrigger('project_types', 'update_project_types_updated_at');
    pgm.dropTable('project_types');
};
