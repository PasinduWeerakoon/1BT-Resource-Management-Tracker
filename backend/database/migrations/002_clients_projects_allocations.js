/**
 * Migration: 002 - Clients, Projects, Allocations & History Tables
 * Creates remaining core tables and history tracking
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // =====================================================
    // CLIENTS TABLE
    // =====================================================
    pgm.createTable('clients', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        client_name: { type: 'varchar(100)', notNull: true, unique: true },
        client_code: { type: 'varchar(20)', unique: true },
        contact_person: { type: 'varchar(100)' },
        contact_email: { type: 'varchar(100)' },
        contact_phone: { type: 'varchar(50)' },
        address: { type: 'varchar(500)' },
        billing_address: { type: 'varchar(500)' },
        currency: { type: 'varchar(3)', default: 'USD' },
        status: { type: 'varchar(20)', default: 'Active' },
        created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid', references: 'users' },
    });

    // =====================================================
    // PROJECTS TABLE
    // =====================================================
    pgm.createTable('projects', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        project_name: { type: 'varchar(200)', notNull: true },
        project_code: { type: 'varchar(50)' },
        project_type: { type: 'project_type', notNull: true },
        account_type: { type: 'account_type', notNull: true },
        team_size: { type: 'integer', notNull: true, default: 1 },
        account_manager: { type: 'varchar(100)', notNull: true },
        account_reg_sales_owner: { type: 'varchar(100)' },
        client_id: { type: 'uuid', references: 'clients' },
        project_start_date: { type: 'date' },
        project_end_date: { type: 'date' },
        billing_type: { type: 'varchar(20)', default: 'Billing' },
        budget: { type: 'decimal(15,2)' },
        status: { type: 'project_status', notNull: true, default: 'Active' },
        description: { type: 'text' },
        deleted_at: { type: 'timestamptz' },
        version: { type: 'integer', notNull: true, default: 1 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid', notNull: true, references: 'users' },
        updated_by: { type: 'uuid', references: 'users' },
    });

    // Projects partial unique indexes
    pgm.sql(`CREATE UNIQUE INDEX projects_name_unique ON projects(project_name) WHERE deleted_at IS NULL`);
    pgm.sql(`CREATE UNIQUE INDEX projects_code_unique ON projects(project_code) WHERE deleted_at IS NULL AND project_code IS NOT NULL`);

    // Projects constraints
    pgm.addConstraint('projects', 'projects_team_size_positive', 'CHECK (team_size >= 1)');
    pgm.addConstraint('projects', 'projects_billing_type_valid',
        `CHECK (billing_type IN ('Billing', 'Non-Billing'))`);
    pgm.addConstraint('projects', 'projects_budget_positive', 'CHECK (budget IS NULL OR budget >= 0)');
    pgm.addConstraint('projects', 'projects_date_range',
        `CHECK (project_end_date IS NULL OR project_start_date IS NULL OR project_end_date >= project_start_date)`);
    pgm.addConstraint('projects', 'projects_client_required_for_external',
        `CHECK ((account_type = 'External' AND client_id IS NOT NULL) OR (account_type = 'Internal'))`);
    pgm.addConstraint('projects', 'projects_budget_disabled_for_non_billing',
        `CHECK ((billing_type = 'Non-Billing' AND budget IS NULL) OR (billing_type = 'Billing'))`);

    // Projects trigger
    pgm.sql(`
    CREATE TRIGGER projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

    // =====================================================
    // ALLOCATIONS TABLE
    // =====================================================
    pgm.createTable('allocations', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        resource_id: { type: 'uuid', notNull: true, references: 'resources', onDelete: 'RESTRICT' },
        project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'RESTRICT' },
        project_allocation: { type: 'decimal(5,2)', notNull: true },
        billing_percentage: { type: 'decimal(5,2)', notNull: true },
        billing_status: { type: 'billing_status', notNull: true },
        is_critical_shadow: { type: 'boolean', notNull: true, default: false },
        critical_shadow_percentage: { type: 'decimal(5,2)' },
        start_date: { type: 'date', notNull: true, default: pgm.func('CURRENT_DATE') },
        end_date: { type: 'date' },
        status: { type: 'varchar(20)', notNull: true, default: 'Active' },
        notes: { type: 'text' },
        deleted_at: { type: 'timestamptz' },
        version: { type: 'integer', notNull: true, default: 1 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        created_by: { type: 'uuid', notNull: true, references: 'users' },
        updated_by: { type: 'uuid', references: 'users' },
    });

    // Allocations partial unique index
    pgm.sql(`CREATE UNIQUE INDEX allocations_resource_project_unique ON allocations(resource_id, project_id) WHERE deleted_at IS NULL AND status = 'Active'`);

    // Allocations constraints
    pgm.addConstraint('allocations', 'allocations_status_valid',
        `CHECK (status IN ('Active', 'Inactive'))`);
    pgm.addConstraint('allocations', 'allocations_project_allocation_range',
        `CHECK (project_allocation >= 0 AND project_allocation <= 200)`);
    pgm.addConstraint('allocations', 'allocations_billing_percentage_range',
        `CHECK (billing_percentage >= 0 AND billing_percentage <= 100)`);
    pgm.addConstraint('allocations', 'allocations_date_range',
        `CHECK (end_date IS NULL OR end_date >= start_date)`);
    pgm.addConstraint('allocations', 'allocations_critical_shadow_percentage',
        `CHECK ((is_critical_shadow = TRUE AND critical_shadow_percentage IS NOT NULL AND 
             critical_shadow_percentage >= 0 AND critical_shadow_percentage <= 100) OR
            (is_critical_shadow = FALSE AND critical_shadow_percentage IS NULL))`);

    // Allocations trigger
    pgm.sql(`
    CREATE TRIGGER allocations_updated_at 
    BEFORE UPDATE ON allocations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

    // Allocations indexes
    pgm.createIndex('allocations', 'resource_id');
    pgm.createIndex('allocations', 'project_id');
    pgm.createIndex('allocations', ['resource_id', 'start_date']);

    // =====================================================
    // ALLOCATION HISTORY TABLE
    // =====================================================
    pgm.createTable('allocation_history', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        allocation_id: { type: 'uuid', references: 'allocations', onDelete: 'SET NULL' },
        resource_id: { type: 'uuid', notNull: true, references: 'resources' },
        project_id: { type: 'uuid', notNull: true, references: 'projects' },
        project_allocation: { type: 'decimal(5,2)', notNull: true },
        billing_percentage: { type: 'decimal(5,2)', notNull: true },
        billing_status: { type: 'varchar(20)', notNull: true },
        is_critical_shadow: { type: 'boolean', default: false },
        critical_shadow_percentage: { type: 'decimal(5,2)' },
        allocation_start_date: { type: 'date' },
        allocation_end_date: { type: 'date' },
        status: { type: 'varchar(20)' },
        notes: { type: 'text' },
        change_type: { type: 'varchar(20)', notNull: true },
        change_reason: { type: 'text' },
        previous_values: { type: 'jsonb' },
        changed_fields: { type: 'text[]' },
        effective_date: { type: 'date', notNull: true, default: pgm.func('CURRENT_DATE') },
        changed_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
        changed_by: { type: 'uuid', references: 'users' },
        changed_by_username: { type: 'varchar(50)' },
        ip_address: { type: 'inet' },
        user_agent: { type: 'text' },
    });

    // Allocation history indexes
    pgm.createIndex('allocation_history', 'resource_id');
    pgm.createIndex('allocation_history', 'project_id');
    pgm.createIndex('allocation_history', 'allocation_id');
    pgm.createIndex('allocation_history', ['changed_at', { order: 'DESC' }]);
    pgm.createIndex('allocation_history', 'effective_date');
    pgm.createIndex('allocation_history', ['resource_id', { name: 'changed_at', order: 'DESC' }], { name: 'idx_allocation_history_resource_date' });

    // =====================================================
    // DESIGNATION HISTORY TABLE
    // =====================================================
    pgm.createTable('designation_history', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        resource_id: { type: 'uuid', notNull: true, references: 'resources', onDelete: 'CASCADE' },
        previous_designation_id: { type: 'uuid', references: 'designations' },
        new_designation_id: { type: 'uuid', notNull: true, references: 'designations' },
        previous_track_id: { type: 'uuid', references: 'tracks' },
        new_track_id: { type: 'uuid', notNull: true, references: 'tracks' },
        change_type: { type: 'varchar(30)', notNull: true },
        change_reason: { type: 'text' },
        effective_from: { type: 'date', notNull: true, default: pgm.func('CURRENT_DATE') },
        effective_until: { type: 'date' },
        changed_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        changed_by: { type: 'uuid', references: 'users' },
        changed_by_username: { type: 'varchar(50)' },
    });

    // Designation history constraints
    pgm.addConstraint('designation_history', 'designation_history_change_type_valid',
        `CHECK (change_type IN ('INITIAL', 'PROMOTION', 'LATERAL_MOVE', 'TRACK_CHANGE', 'DEMOTION', 'CORRECTION'))`);
    pgm.addConstraint('designation_history', 'designation_history_dates_valid',
        `CHECK (effective_until IS NULL OR effective_until >= effective_from)`);

    // Designation history indexes
    pgm.createIndex('designation_history', 'resource_id');
    pgm.createIndex('designation_history', ['resource_id', { name: 'effective_from', order: 'DESC' }], { name: 'idx_designation_history_resource_date' });
    pgm.createIndex('designation_history', ['effective_from', 'effective_until'], { name: 'idx_designation_history_effective' });

    // =====================================================
    // PERMISSIONS TABLE
    // =====================================================
    pgm.createTable('permissions', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
        module: { type: 'varchar(50)', notNull: true },
        can_view: { type: 'boolean', default: false },
        can_create: { type: 'boolean', default: false },
        can_update: { type: 'boolean', default: false },
        can_delete: { type: 'boolean', default: false },
        created_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', default: pgm.func('CURRENT_TIMESTAMP') },
    });

    pgm.addConstraint('permissions', 'permissions_user_module_unique', {
        unique: ['user_id', 'module']
    });

    // =====================================================
    // TRIGGER: Auto-capture designation history
    // =====================================================
    pgm.sql(`
    CREATE OR REPLACE FUNCTION capture_designation_history()
    RETURNS TRIGGER AS $$
    DECLARE
      v_change_type VARCHAR(30);
    BEGIN
      IF TG_OP = 'INSERT' THEN
        v_change_type := 'INITIAL';
        
        INSERT INTO designation_history (
          resource_id, previous_designation_id, new_designation_id,
          previous_track_id, new_track_id, change_type, effective_from, changed_by
        ) VALUES (
          NEW.id, NULL, NEW.designation_id,
          NULL, NEW.track_id, v_change_type, COALESCE(NEW.date_of_joining, CURRENT_DATE), NEW.created_by
        );
        RETURN NEW;
        
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.designation_id != NEW.designation_id OR OLD.track_id != NEW.track_id THEN
          IF OLD.track_id != NEW.track_id THEN
            v_change_type := 'TRACK_CHANGE';
          ELSE
            v_change_type := 'LATERAL_MOVE';
          END IF;
          
          UPDATE designation_history
          SET effective_until = CURRENT_DATE - INTERVAL '1 day'
          WHERE resource_id = NEW.id 
            AND effective_until IS NULL;
          
          INSERT INTO designation_history (
            resource_id, previous_designation_id, new_designation_id,
            previous_track_id, new_track_id, change_type, effective_from, changed_by
          ) VALUES (
            NEW.id, OLD.designation_id, NEW.designation_id,
            OLD.track_id, NEW.track_id, v_change_type, CURRENT_DATE, NEW.updated_by
          );
        END IF;
        RETURN NEW;
      END IF;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_designation_history
    AFTER INSERT OR UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION capture_designation_history();
  `);
};

exports.down = (pgm) => {
    pgm.sql('DROP TRIGGER IF EXISTS trg_designation_history ON resources');
    pgm.sql('DROP FUNCTION IF EXISTS capture_designation_history()');

    pgm.dropTable('permissions', { cascade: true });
    pgm.dropTable('designation_history', { cascade: true });
    pgm.dropTable('allocation_history', { cascade: true });
    pgm.dropTable('allocations', { cascade: true });
    pgm.dropTable('projects', { cascade: true });
    pgm.dropTable('clients', { cascade: true });
};
