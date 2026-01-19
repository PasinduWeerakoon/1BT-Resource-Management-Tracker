/**
 * Migration: 001 - Initial Schema
 * Creates extensions, enums, and base tables
 */

export const shorthands = undefined;

export const up = (pgm) => {
    // =====================================================
    // EXTENSIONS
    // =====================================================
    pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    pgm.sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // =====================================================
    // CUSTOM ENUM TYPES
    // =====================================================
    pgm.createType('user_role', ['Super User', 'Admin', 'User']);
    pgm.createType('user_status', ['Active', 'Inactive', 'Suspended', 'Pending']);
    pgm.createType('resource_status', ['Active', 'Inactive', 'Serving Notice Period', 'On Leave']);
    pgm.createType('project_status', ['Active', 'Inactive', 'Completed', 'On Hold']);
    pgm.createType('project_type', ['Client', 'Bench', 'Training', 'POC', 'Presale', 'Research']);
    pgm.createType('account_type', ['Internal', 'External']);
    pgm.createType('billing_status', ['Billing', 'Non-Billing']);
    pgm.createType('change_type', ['CREATED', 'UPDATED', 'DELETED', 'RESTORED']);

    // =====================================================
    // UPDATE TIMESTAMP FUNCTION
    // =====================================================
    pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

    // =====================================================
    // TRACKS TABLE
    // =====================================================
    pgm.createTable('tracks', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        name: { type: 'varchar(50)', notNull: true, unique: true },
        description: { type: 'text' },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid' }, // Will add FK after users table
    });

    // =====================================================
    // DESIGNATIONS TABLE
    // =====================================================
    pgm.createTable('designations', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        name: { type: 'varchar(50)', notNull: true, unique: true },
        level: { type: 'integer' },
        is_intern_role: { type: 'boolean', default: false },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid' },
    });

    // =====================================================
    // RESOURCES TABLE (Employees)
    // =====================================================
    pgm.createTable('resources', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        employee_id: { type: 'varchar(20)', notNull: true },
        employee_number: { type: 'varchar(20)', notNull: true },
        name: { type: 'varchar(100)', notNull: true },
        phone_number: { type: 'varchar(100)', notNull: true },
        email: { type: 'varchar(100)' },
        address: { type: 'varchar(500)' },
        designation_id: { type: 'uuid', notNull: true, references: 'designations' },
        track_id: { type: 'uuid', notNull: true, references: 'tracks' },
        intern_classification: { type: 'varchar(20)' },
        skills: { type: 'text[]', default: pgm.func("'{}'") },
        date_of_joining: { type: 'date' },
        status: { type: 'resource_status', notNull: true, default: 'Active' },
        notice_period_end_date: { type: 'date' },
        deleted_at: { type: 'timestamptz' },
        version: { type: 'integer', notNull: true, default: 1 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid', notNull: true },
        updated_by: { type: 'uuid' },
    });

    // Partial unique indexes for soft delete
    pgm.sql(`CREATE UNIQUE INDEX resources_employee_id_unique ON resources(employee_id) WHERE deleted_at IS NULL`);
    pgm.sql(`CREATE UNIQUE INDEX resources_employee_number_unique ON resources(employee_number) WHERE deleted_at IS NULL`);

    // Resources constraints
    pgm.addConstraint('resources', 'resources_name_length', 'CHECK (length(name) >= 2)');
    pgm.addConstraint('resources', 'resources_intern_classification_valid',
        `CHECK (intern_classification IN ('Tech', 'Non-Tech') OR intern_classification IS NULL)`);
    pgm.addConstraint('resources', 'resources_notice_period_valid',
        `CHECK ((status = 'Serving Notice Period' AND notice_period_end_date IS NOT NULL) OR (status != 'Serving Notice Period'))`);

    // Resources trigger
    pgm.sql(`
    CREATE TRIGGER resources_updated_at 
    BEFORE UPDATE ON resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

    // =====================================================
    // USERS TABLE
    // =====================================================
    pgm.createTable('users', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        username: { type: 'varchar(50)', notNull: true },
        email: { type: 'varchar(100)', notNull: true },
        password_hash: { type: 'varchar(255)', notNull: true },
        role: { type: 'user_role', notNull: true, default: 'User' },
        resource_id: { type: 'uuid', unique: true, references: 'resources', onDelete: 'SET NULL' },
        failed_login_attempts: { type: 'integer', default: 0 },
        locked_until: { type: 'timestamptz' },
        last_login: { type: 'timestamptz' },
        password_changed_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        must_change_password: { type: 'boolean', default: false },
        status: { type: 'user_status', notNull: true, default: 'Pending' },
        deleted_at: { type: 'timestamptz' },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid' },
    });

    // Add self reference for created_by
    pgm.addConstraint('users', 'users_created_by_fk', {
        foreignKeys: { columns: 'created_by', references: 'users(id)' }
    });

    // Users partial unique indexes
    pgm.sql(`CREATE UNIQUE INDEX users_username_unique ON users(username) WHERE deleted_at IS NULL`);
    pgm.sql(`CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE deleted_at IS NULL`);

    // Users constraints
    pgm.addConstraint('users', 'users_email_format',
        `CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')`);
    pgm.addConstraint('users', 'users_username_format',
        `CHECK (username ~* '^[a-zA-Z0-9_]{3,50}$')`);
    pgm.addConstraint('users', 'users_failed_login_attempts_positive',
        `CHECK (failed_login_attempts >= 0)`);

    // Users trigger
    pgm.sql(`
    CREATE TRIGGER users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

    // Now add FK for tracks/designations created_by
    pgm.addConstraint('tracks', 'tracks_created_by_fk', {
        foreignKeys: { columns: 'created_by', references: 'users(id)' }
    });
    pgm.addConstraint('designations', 'designations_created_by_fk', {
        foreignKeys: { columns: 'created_by', references: 'users(id)' }
    });

    // Add FK for resources created_by/updated_by
    pgm.addConstraint('resources', 'resources_created_by_fk', {
        foreignKeys: { columns: 'created_by', references: 'users(id)' }
    });
    pgm.addConstraint('resources', 'resources_updated_by_fk', {
        foreignKeys: { columns: 'updated_by', references: 'users(id)' }
    });
};

export const down = (pgm) => {
    pgm.dropTable('users', { cascade: true });
    pgm.dropTable('resources', { cascade: true });
    pgm.dropTable('designations', { cascade: true });
    pgm.dropTable('tracks', { cascade: true });

    pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column()');

    pgm.dropType('change_type');
    pgm.dropType('billing_status');
    pgm.dropType('account_type');
    pgm.dropType('project_type');
    pgm.dropType('project_status');
    pgm.dropType('resource_status');
    pgm.dropType('user_status');
    pgm.dropType('user_role');
};
