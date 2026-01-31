/**
 * Migration: 015 - Create future_allocations table
 * 
 * Part of the 3-Table Temporal Architecture:
 * - future_allocations (this table) - Scheduled allocations awaiting activation
 * - allocations - Active allocations
 * - allocation_history - Archived past allocations
 * 
 * This table stores allocation changes scheduled for future dates.
 * A scheduler job (1:00 AM UTC daily) moves records to the allocations table
 * when effective_date = TODAY.
 */

export const up = (pgm) => {
    // =====================================================
    // FUTURE_ALLOCATIONS TABLE
    // =====================================================
    pgm.createTable('future_allocations', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },

        // Core allocation fields
        resource_id: { type: 'uuid', notNull: true, references: 'resources', onDelete: 'RESTRICT' },
        project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'RESTRICT' },
        allocation_percentage: { type: 'integer', notNull: true },
        billing_status: { type: 'varchar(50)', notNull: true },
        is_billable: { type: 'boolean', notNull: true, default: true },

        // Date fields
        effective_date: { type: 'date', notNull: true },  // When this should activate (must be > today)
        allocated_date: { type: 'date', notNull: true },  // When allocation period starts
        deallocated_date: { type: 'date' },               // When allocation period ends (nullable)

        // Change tracking
        change_type: {
            type: 'varchar(50)',
            notNull: true,
            comment: 'NEW_ALLOCATION, MODIFY_PERCENTAGE, MODIFY_BILLING, DEALLOCATE, AUTO_BENCH_ADJUSTMENT'
        },
        status: {
            type: 'varchar(20)',
            notNull: true,
            default: 'scheduled',
            comment: 'scheduled, activated, cancelled'
        },

        // Link to related future allocation (e.g., bench adjustment linked to main allocation)
        linked_future_id: { type: 'uuid' },

        // For modifications: reference to existing allocation being modified
        target_allocation_id: { type: 'uuid', references: 'allocations' },

        // Additional fields
        notes: { type: 'text' },

        // Audit fields
        created_by: { type: 'uuid', notNull: true, references: 'users' },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    });

    // =====================================================
    // CONSTRAINTS
    // =====================================================

    // Allocation percentage must be 0-100
    pgm.addConstraint('future_allocations', 'future_allocations_percentage_range',
        'CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)');

    // Status must be valid
    pgm.addConstraint('future_allocations', 'future_allocations_status_valid',
        `CHECK (status IN ('scheduled', 'activated', 'cancelled'))`);

    // Change type must be valid
    pgm.addConstraint('future_allocations', 'future_allocations_change_type_valid',
        `CHECK (change_type IN ('NEW_ALLOCATION', 'MODIFY_PERCENTAGE', 'MODIFY_BILLING', 'DEALLOCATE', 'AUTO_BENCH_ADJUSTMENT'))`);

    // Deallocated date must be >= allocated date
    pgm.addConstraint('future_allocations', 'future_allocations_date_range',
        'CHECK (deallocated_date IS NULL OR deallocated_date >= allocated_date)');

    // Self-referential FK for linked_future_id
    pgm.addConstraint('future_allocations', 'future_allocations_linked_fk',
        'FOREIGN KEY (linked_future_id) REFERENCES future_allocations(id) ON DELETE SET NULL');

    // =====================================================
    // INDEXES
    // =====================================================

    // Primary query patterns
    pgm.createIndex('future_allocations', 'resource_id');
    pgm.createIndex('future_allocations', 'project_id');
    pgm.createIndex('future_allocations', 'effective_date');
    pgm.createIndex('future_allocations', 'status');

    // Composite indexes for common queries
    pgm.createIndex('future_allocations', ['effective_date', 'status'], {
        name: 'idx_future_allocations_scheduler',
        where: `status = 'scheduled'`
    });
    pgm.createIndex('future_allocations', ['resource_id', 'effective_date']);
    pgm.createIndex('future_allocations', ['resource_id', 'project_id', 'effective_date']);

    // =====================================================
    // TRIGGER
    // =====================================================
    pgm.sql(`
        CREATE TRIGGER future_allocations_updated_at 
        BEFORE UPDATE ON future_allocations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // =====================================================
    // COMMENTS
    // =====================================================
    pgm.sql(`COMMENT ON TABLE future_allocations IS 'Scheduled allocation changes awaiting activation by daily scheduler job'`);
    pgm.sql(`COMMENT ON COLUMN future_allocations.effective_date IS 'Date when this allocation should be activated (moved to allocations table)'`);
    pgm.sql(`COMMENT ON COLUMN future_allocations.change_type IS 'Type of change: NEW_ALLOCATION, MODIFY_PERCENTAGE, MODIFY_BILLING, DEALLOCATE, AUTO_BENCH_ADJUSTMENT'`);
    pgm.sql(`COMMENT ON COLUMN future_allocations.linked_future_id IS 'Links related future allocations (e.g., bench adjustment linked to main allocation)'`);
};

export const down = (pgm) => {
    pgm.dropTable('future_allocations');
};
