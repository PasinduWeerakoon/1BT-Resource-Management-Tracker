/**
 * Migration: Add employee_type to resources and create resource_tags junction table
 * This migration adds support for:
 * - Employee type (Internal/External)
 * - Many-to-many relationship between resources and tags
 */

export const up = (pgm) => {
    // Add employee_type column to resources table
    pgm.addColumn('resources', {
        employee_type: {
            type: 'varchar(20)',
            notNull: false,
            default: 'Internal',
        },
    });

    // Add constraint for employee_type values
    pgm.addConstraint('resources', 'resources_employee_type_valid',
        `CHECK (employee_type IN ('Internal', 'External') OR employee_type IS NULL)`);

    // Create resource_tags junction table for many-to-many relationship
    pgm.createTable('resource_tags', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        resource_id: { type: 'uuid', notNull: true, references: 'resources(id)' },
        tag_id: { type: 'uuid', notNull: true, references: 'tags(id)' },
        created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid' },
    });

    // Create unique index to prevent duplicate tag assignments
    pgm.createIndex('resource_tags', ['resource_id', 'tag_id'], { unique: true });

    // Create indexes for faster lookups
    pgm.createIndex('resource_tags', 'resource_id');
    pgm.createIndex('resource_tags', 'tag_id');

    // Add foreign key constraints with ON DELETE CASCADE
    pgm.addConstraint('resource_tags', 'resource_tags_resource_fk',
        'FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE');
    pgm.addConstraint('resource_tags', 'resource_tags_tag_fk',
        'FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE');
};

export const down = (pgm) => {
    pgm.dropTable('resource_tags');
    pgm.dropConstraint('resources', 'resources_employee_type_valid');
    pgm.dropColumn('resources', 'employee_type');
};
