/**
 * Migration: 013 - Allocation Totals on Resources
 * 
 * Adds denormalized total_allocation and total_billing columns to resources table
 * for instant access to resource allocation summaries without calculating from allocations table.
 * 
 * Also adds is_billable_track column to tracks table to identify which tracks
 * should have auto-bench allocation (Dev, QA, BA/PM tracks only).
 */

export const shorthands = undefined;

export const up = async (pgm) => {
    // =====================================================
    // ADD ALLOCATION TOTALS TO RESOURCES
    // =====================================================
    pgm.addColumns('resources', {
        total_allocation: {
            type: 'decimal(5,2)',
            notNull: true,
            default: 0,
            comment: 'Sum of all active non-bench allocation percentages'
        },
        total_billing: {
            type: 'decimal(5,2)',
            notNull: true,
            default: 0,
            comment: 'Sum of all active billing percentages (excluding bench)'
        }
    });

    // Index for quick overallocation queries
    pgm.createIndex('resources', 'total_allocation', {
        name: 'idx_resources_total_allocation',
        where: "status = 'Active'"
    });

    // =====================================================
    // ADD IS_BILLABLE_TRACK TO TRACKS
    // =====================================================
    // This identifies tracks that should have auto-bench allocation
    // Only Dev (FS, .Net, DS, UI/UX), QA, and PM/BA tracks should auto-bench
    pgm.addColumns('tracks', {
        is_billable_track: {
            type: 'boolean',
            notNull: true,
            default: false,
            comment: 'Whether resources in this track should have auto-bench allocation'
        }
    });

    // Update existing tracks to set is_billable_track
    // Dev tracks (FS, .Net, DS, UI/UX), QA, and PM/BA should be true
    pgm.sql(`
    UPDATE tracks 
    SET is_billable_track = true 
    WHERE name IN ('FS', '.Net', 'DS', 'UI/UX', 'QA', 'PM/BA');
  `);

    // =====================================================
    // BACKFILL EXISTING RESOURCE TOTALS
    // =====================================================
    // Calculate and update totals for all existing resources
    pgm.sql(`
    WITH allocation_totals AS (
      SELECT 
        a.resource_id,
        COALESCE(SUM(CASE WHEN p.is_bench_project = false THEN a.allocation_percentage ELSE 0 END), 0) as total_alloc,
        COALESCE(SUM(CASE WHEN p.is_bench_project = false THEN a.billing_percentage ELSE 0 END), 0) as total_bill
      FROM allocations a
      JOIN projects p ON a.project_id = p.id
      WHERE a.is_active = true
        AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
        AND a.start_date <= CURRENT_DATE
      GROUP BY a.resource_id
    )
    UPDATE resources r
    SET 
      total_allocation = COALESCE(at.total_alloc, 0),
      total_billing = COALESCE(at.total_bill, 0)
    FROM allocation_totals at
    WHERE r.id = at.resource_id;
  `);

    // =====================================================
    // CREATE FUNCTION TO UPDATE RESOURCE TOTALS
    // =====================================================
    // This function can be called after allocation changes
    pgm.sql(`
    CREATE OR REPLACE FUNCTION update_resource_allocation_totals(p_resource_id UUID)
    RETURNS void AS $$
    BEGIN
      UPDATE resources
      SET 
        total_allocation = COALESCE((
          SELECT SUM(a.allocation_percentage)
          FROM allocations a
          JOIN projects p ON a.project_id = p.id
          WHERE a.resource_id = p_resource_id
            AND a.is_active = true
            AND p.is_bench_project = false
            AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            AND a.start_date <= CURRENT_DATE
        ), 0),
        total_billing = COALESCE((
          SELECT SUM(a.billing_percentage)
          FROM allocations a
          JOIN projects p ON a.project_id = p.id
          WHERE a.resource_id = p_resource_id
            AND a.is_active = true
            AND p.is_bench_project = false
            AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            AND a.start_date <= CURRENT_DATE
        ), 0),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = p_resource_id;
    END;
    $$ LANGUAGE plpgsql;
  `);

    // =====================================================
    // CREATE TRIGGER FOR AUTO-UPDATE (Optional)
    // =====================================================
    // Note: We'll primarily update via application code for better control,
    // but this trigger serves as a safety net
    pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_update_resource_totals()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update for INSERT/UPDATE
      IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        PERFORM update_resource_allocation_totals(NEW.resource_id);
        RETURN NEW;
      END IF;
      
      -- Update for DELETE
      IF (TG_OP = 'DELETE') THEN
        PERFORM update_resource_allocation_totals(OLD.resource_id);
        RETURN OLD;
      END IF;
      
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

    // Create the trigger on allocations table
    pgm.sql(`
    CREATE TRIGGER allocations_update_resource_totals
    AFTER INSERT OR UPDATE OR DELETE ON allocations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_resource_totals();
  `);
};

export const down = async (pgm) => {
    // Drop trigger first
    pgm.sql(`DROP TRIGGER IF EXISTS allocations_update_resource_totals ON allocations;`);

    // Drop functions
    pgm.sql(`DROP FUNCTION IF EXISTS trigger_update_resource_totals();`);
    pgm.sql(`DROP FUNCTION IF EXISTS update_resource_allocation_totals(UUID);`);

    // Drop index
    pgm.dropIndex('resources', 'total_allocation', { name: 'idx_resources_total_allocation' });

    // Drop columns from tracks
    pgm.dropColumns('tracks', ['is_billable_track']);

    // Drop columns from resources
    pgm.dropColumns('resources', ['total_allocation', 'total_billing']);
};
