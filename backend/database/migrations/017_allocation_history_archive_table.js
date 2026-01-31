/**
 * Migration: 017 - Create allocation_history_archive table
 * 
 * Part of the 3-Table Temporal Architecture:
 * - future_allocations - Scheduled allocations awaiting activation
 * - allocations - Active allocations
 * - allocation_history_archive (this table) - Archived past allocations
 * 
 * Note: We use allocation_history_archive to avoid conflict with existing 
 * allocation_history table (from migration 002) which tracks changes.
 * This new table stores COMPLETED allocations that have ended.
 * 
 * A scheduler job (3:00 AM UTC daily) moves ended allocations here.
 */

export const up = (pgm) => {
    // =====================================================
    // ALLOCATION_HISTORY_ARCHIVE TABLE
    // =====================================================
    pgm.createTable('allocation_history_archive', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },

        // Reference to original allocation
        original_allocation_id: { type: 'uuid', notNull: true },

        // Core allocation fields (snapshot at time of archive)
        resource_id: { type: 'uuid', notNull: true, references: 'resources', onDelete: 'RESTRICT' },
        project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'RESTRICT' },
        allocation_percentage: { type: 'integer', notNull: true },
        billing_status: { type: 'varchar(50)', notNull: true },
        is_billable: { type: 'boolean', notNull: true },

        // Date fields
        effective_date: { type: 'date' },
        allocated_date: { type: 'date', notNull: true },
        deallocated_date: { type: 'date' },
        original_allocated_date: { type: 'date' },

        // Change tracking
        change_type: { type: 'varchar(50)' },

        // Additional fields from original allocation
        notes: { type: 'text' },

        // Original audit fields
        original_created_by: { type: 'uuid', references: 'users' },
        original_created_at: { type: 'timestamptz' },
        original_updated_at: { type: 'timestamptz' },

        // Archive metadata
        archived_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
        archive_reason: {
            type: 'varchar(50)',
            notNull: true,
            comment: 'ALLOCATION_ENDED, DEALLOCATED, RESOURCE_TERMINATED, PROJECT_CLOSED, MANUAL_ARCHIVE'
        },
        archived_by: { type: 'uuid', references: 'users' },  // null for scheduler
    });

    // =====================================================
    // CONSTRAINTS
    // =====================================================

    // Archive reason must be valid
    pgm.addConstraint('allocation_history_archive', 'allocation_history_archive_reason_valid',
        `CHECK (archive_reason IN ('ALLOCATION_ENDED', 'DEALLOCATED', 'RESOURCE_TERMINATED', 'PROJECT_CLOSED', 'MANUAL_ARCHIVE'))`);

    // =====================================================
    // INDEXES
    // =====================================================

    // Primary query patterns
    pgm.createIndex('allocation_history_archive', 'resource_id');
    pgm.createIndex('allocation_history_archive', 'project_id');
    pgm.createIndex('allocation_history_archive', 'archived_at');
    pgm.createIndex('allocation_history_archive', 'original_allocation_id');

    // Composite indexes for common queries
    pgm.createIndex('allocation_history_archive', ['resource_id', 'archived_at']);
    pgm.createIndex('allocation_history_archive', ['resource_id', 'allocated_date', 'deallocated_date']);
    pgm.createIndex('allocation_history_archive', ['project_id', 'archived_at']);

    // =====================================================
    // COMMENTS
    // =====================================================
    pgm.sql(`COMMENT ON TABLE allocation_history_archive IS 'Archive of completed/ended allocations moved from allocations table by scheduler'`);
    pgm.sql(`COMMENT ON COLUMN allocation_history_archive.original_allocation_id IS 'ID of the allocation record before it was archived'`);
    pgm.sql(`COMMENT ON COLUMN allocation_history_archive.archive_reason IS 'Reason for archiving: ALLOCATION_ENDED, DEALLOCATED, RESOURCE_TERMINATED, PROJECT_CLOSED, MANUAL_ARCHIVE'`);
    pgm.sql(`COMMENT ON COLUMN allocation_history_archive.archived_by IS 'User who triggered archive, null for scheduler-initiated archives'`);
};

export const down = (pgm) => {
    pgm.dropTable('allocation_history_archive');
};
