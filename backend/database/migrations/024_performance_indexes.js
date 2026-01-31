/**
 * Migration: 024 - Performance Indexes
 * Adds indexes to improve query performance based on common query patterns
 * 
 * Query patterns analyzed:
 * - Project list: JOIN on clients, resources (account_manager_id), filter by status, deleted_at
 * - Resource list: JOIN on tracks, designations, filter by status, track_id, deleted_at
 * - Allocation queries: filter by resource_id, project_id, is_active, allocated_date, deallocated_date
 * - Report queries: aggregations on allocations with date ranges
 */

export const shorthands = undefined;

export const up = (pgm) => {
    // =====================================================
    // PROJECTS TABLE INDEXES
    // =====================================================

    // Index for listing projects (filter by status, soft delete)
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_deleted 
             ON projects(status) WHERE deleted_at IS NULL`);

    // Index for account manager lookups
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_account_manager_id 
             ON projects(account_manager_id) WHERE deleted_at IS NULL`);

    // Index for client projects lookup
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_client_id 
             ON projects(client_id) WHERE deleted_at IS NULL`);

    // Index for bench project lookup
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_is_bench 
             ON projects(is_bench_project) WHERE deleted_at IS NULL AND is_bench_project = true`);

    // =====================================================
    // RESOURCES TABLE INDEXES
    // =====================================================

    // Index for listing resources (filter by status, soft delete)
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_status_deleted 
             ON resources(status) WHERE deleted_at IS NULL`);

    // Index for track-based filtering
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_track_id 
             ON resources(track_id) WHERE deleted_at IS NULL`);

    // Index for designation-based filtering
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_designation_id 
             ON resources(designation_id) WHERE deleted_at IS NULL`);

    // Index for account manager queries
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_is_account_manager 
             ON resources(is_account_manager) WHERE deleted_at IS NULL AND is_account_manager = true`);

    // Composite index for common resource list query
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_active_list 
             ON resources(status, track_id, designation_id) WHERE deleted_at IS NULL`);

    // =====================================================
    // ALLOCATIONS TABLE INDEXES
    // =====================================================

    // Index for active allocations by resource
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allocations_resource_active 
             ON allocations(resource_id) WHERE is_active = true AND deleted_at IS NULL`);

    // Index for active allocations by project
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allocations_project_active 
             ON allocations(project_id) WHERE is_active = true AND deleted_at IS NULL`);

    // Composite index for allocation date range queries
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allocations_date_range 
             ON allocations(allocated_date, deallocated_date) WHERE is_active = true AND deleted_at IS NULL`);

    // Index for total allocation calculations
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allocations_totals_calc 
             ON allocations(resource_id, allocation_percentage, billing_percentage) 
             WHERE is_active = true AND deleted_at IS NULL`);

    // =====================================================
    // FUTURE_ALLOCATIONS TABLE INDEXES
    // =====================================================

    // Index for effective date queries
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_future_allocations_effective_date 
             ON future_allocations(effective_date) WHERE status = 'pending'`);

    // Index for resource future allocations
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_future_allocations_resource 
             ON future_allocations(resource_id) WHERE status = 'pending'`);

    // =====================================================
    // CLIENTS TABLE INDEXES
    // =====================================================

    // Index for client status filter
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_status 
             ON clients(status)`);

    // =====================================================
    // TRACKS TABLE INDEXES
    // =====================================================

    // Index for billable track lookup
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_billable 
             ON tracks(is_billable_track) WHERE is_billable_track = true`);

    // =====================================================
    // DESIGNATIONS TABLE INDEXES  
    // =====================================================

    // Index for active designations
    pgm.sql(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_designations_active 
             ON designations(is_active) WHERE is_active = true`);
};

export const down = (pgm) => {
    // Drop all indexes created
    pgm.sql('DROP INDEX IF EXISTS idx_projects_status_deleted');
    pgm.sql('DROP INDEX IF EXISTS idx_projects_account_manager_id');
    pgm.sql('DROP INDEX IF EXISTS idx_projects_client_id');
    pgm.sql('DROP INDEX IF EXISTS idx_projects_is_bench');

    pgm.sql('DROP INDEX IF EXISTS idx_resources_status_deleted');
    pgm.sql('DROP INDEX IF EXISTS idx_resources_track_id');
    pgm.sql('DROP INDEX IF EXISTS idx_resources_designation_id');
    pgm.sql('DROP INDEX IF EXISTS idx_resources_is_account_manager');
    pgm.sql('DROP INDEX IF EXISTS idx_resources_active_list');

    pgm.sql('DROP INDEX IF EXISTS idx_allocations_resource_active');
    pgm.sql('DROP INDEX IF EXISTS idx_allocations_project_active');
    pgm.sql('DROP INDEX IF EXISTS idx_allocations_date_range');
    pgm.sql('DROP INDEX IF EXISTS idx_allocations_totals_calc');

    pgm.sql('DROP INDEX IF EXISTS idx_future_allocations_effective_date');
    pgm.sql('DROP INDEX IF EXISTS idx_future_allocations_resource');

    pgm.sql('DROP INDEX IF EXISTS idx_clients_status');
    pgm.sql('DROP INDEX IF EXISTS idx_tracks_billable');
    pgm.sql('DROP INDEX IF EXISTS idx_designations_active');
};
