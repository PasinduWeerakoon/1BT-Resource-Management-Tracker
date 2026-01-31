/**
 * Migration: 016 - Modify allocations table for 3-table architecture
 * 
 * Part of the 3-Table Temporal Architecture:
 * - future_allocations - Scheduled allocations awaiting activation
 * - allocations (this table) - Active allocations (MODIFIED)
 * - allocation_history - Archived past allocations
 * 
 * Changes:
 * 1. Rename start_date → allocated_date
 * 2. Rename end_date → deallocated_date
 * 3. Add effective_date column
 * 4. Add allocation_changed_on column
 * 5. Add original_allocated_date column
 * 6. Add change_type column
 * 7. Rename project_allocation → allocation_percentage (for consistency)
 * 8. Add is_billable column
 */

export const up = (pgm) => {
    // =====================================================
    // RENAME EXISTING COLUMNS
    // =====================================================

    // Rename start_date to allocated_date
    pgm.renameColumn('allocations', 'start_date', 'allocated_date');

    // Rename end_date to deallocated_date  
    pgm.renameColumn('allocations', 'end_date', 'deallocated_date');

    // Rename project_allocation to allocation_percentage for consistency
    pgm.renameColumn('allocations', 'project_allocation', 'allocation_percentage');

    // =====================================================
    // ADD NEW COLUMNS
    // =====================================================

    // effective_date: When this allocation change became effective
    pgm.addColumn('allocations', {
        effective_date: {
            type: 'date',
            notNull: false,  // Allow null initially for backfill
        }
    });

    // allocation_changed_on: Timestamp when this record was created/modified
    pgm.addColumn('allocations', {
        allocation_changed_on: {
            type: 'timestamptz',
            notNull: false,  // Allow null initially for backfill
        }
    });

    // original_allocated_date: Preserves original start date through modifications
    pgm.addColumn('allocations', {
        original_allocated_date: {
            type: 'date',
            notNull: false,  // Allow null initially for backfill
        }
    });

    // change_type: Type of change that created/modified this record
    pgm.addColumn('allocations', {
        change_type: {
            type: 'varchar(50)',
            notNull: false,  // Allow null initially for backfill
        }
    });

    // is_billable: Boolean flag derived from billing_status
    pgm.addColumn('allocations', {
        is_billable: {
            type: 'boolean',
            notNull: false,  // Allow null initially for backfill
        }
    });

    // source_future_id: Reference to future_allocations record that created this
    pgm.addColumn('allocations', {
        source_future_id: {
            type: 'uuid',
            notNull: false,
        }
    });

    // =====================================================
    // BACKFILL DATA
    // =====================================================

    // Set effective_date = allocated_date for existing records
    pgm.sql(`UPDATE allocations SET effective_date = allocated_date WHERE effective_date IS NULL`);

    // Set allocation_changed_on = created_at for existing records
    pgm.sql(`UPDATE allocations SET allocation_changed_on = created_at WHERE allocation_changed_on IS NULL`);

    // Set original_allocated_date = allocated_date for existing records
    pgm.sql(`UPDATE allocations SET original_allocated_date = allocated_date WHERE original_allocated_date IS NULL`);

    // Set change_type = 'LEGACY' for existing records
    pgm.sql(`UPDATE allocations SET change_type = 'LEGACY' WHERE change_type IS NULL`);

    // Set is_billable based on billing_status
    pgm.sql(`
        UPDATE allocations 
        SET is_billable = CASE 
            WHEN billing_status::text = 'Billable' THEN true 
            ELSE false 
        END 
        WHERE is_billable IS NULL
    `);

    // =====================================================
    // UPDATE CONSTRAINTS - Drop old ones first
    // =====================================================

    // Drop old date range constraint (references old column names)
    pgm.sql(`ALTER TABLE allocations DROP CONSTRAINT IF EXISTS allocations_date_range`);

    // Add new date range constraint with new column names
    pgm.addConstraint('allocations', 'allocations_date_range_new',
        'CHECK (deallocated_date IS NULL OR deallocated_date >= allocated_date)');

    // Add change_type constraint
    pgm.addConstraint('allocations', 'allocations_change_type_valid',
        `CHECK (change_type IN ('NEW_ALLOCATION', 'MODIFY_PERCENTAGE', 'MODIFY_BILLING', 'DEALLOCATE', 'AUTO_BENCH_ADJUSTMENT', 'LEGACY'))`);

    // =====================================================
    // ADD NEW INDEXES
    // =====================================================

    pgm.createIndex('allocations', 'effective_date');
    pgm.createIndex('allocations', 'allocation_changed_on');
    pgm.createIndex('allocations', ['resource_id', 'effective_date']);
    pgm.createIndex('allocations', ['resource_id', 'is_billable'], {
        where: `status = 'Active' AND deleted_at IS NULL`
    });

    // =====================================================
    // COMMENTS
    // =====================================================
    pgm.sql(`COMMENT ON COLUMN allocations.effective_date IS 'Date when this allocation change became effective'`);
    pgm.sql(`COMMENT ON COLUMN allocations.allocated_date IS 'When the allocation period starts (renamed from start_date)'`);
    pgm.sql(`COMMENT ON COLUMN allocations.deallocated_date IS 'When the allocation period ends (renamed from end_date)'`);
    pgm.sql(`COMMENT ON COLUMN allocations.allocation_changed_on IS 'Timestamp when this record was created or last modified'`);
    pgm.sql(`COMMENT ON COLUMN allocations.original_allocated_date IS 'Original start date preserved through modifications'`);
    pgm.sql(`COMMENT ON COLUMN allocations.change_type IS 'Type of change: NEW_ALLOCATION, MODIFY_PERCENTAGE, MODIFY_BILLING, DEALLOCATE, AUTO_BENCH_ADJUSTMENT, LEGACY'`);
    pgm.sql(`COMMENT ON COLUMN allocations.is_billable IS 'Boolean flag indicating if this allocation is billable'`);
    pgm.sql(`COMMENT ON COLUMN allocations.source_future_id IS 'Reference to future_allocations record that created this allocation'`);
};

export const down = (pgm) => {
    // Drop new indexes
    pgm.dropIndex('allocations', 'effective_date');
    pgm.dropIndex('allocations', 'allocation_changed_on');
    pgm.dropIndex('allocations', ['resource_id', 'effective_date']);
    pgm.dropIndex('allocations', ['resource_id', 'is_billable']);

    // Drop new constraints
    pgm.dropConstraint('allocations', 'allocations_change_type_valid');
    pgm.dropConstraint('allocations', 'allocations_date_range_new');

    // Restore old date range constraint
    pgm.addConstraint('allocations', 'allocations_date_range',
        'CHECK (end_date IS NULL OR end_date >= start_date)');

    // Drop new columns
    pgm.dropColumn('allocations', 'source_future_id');
    pgm.dropColumn('allocations', 'is_billable');
    pgm.dropColumn('allocations', 'change_type');
    pgm.dropColumn('allocations', 'original_allocated_date');
    pgm.dropColumn('allocations', 'allocation_changed_on');
    pgm.dropColumn('allocations', 'effective_date');

    // Rename columns back
    pgm.renameColumn('allocations', 'allocation_percentage', 'project_allocation');
    pgm.renameColumn('allocations', 'deallocated_date', 'end_date');
    pgm.renameColumn('allocations', 'allocated_date', 'start_date');
};
