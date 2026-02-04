/**
 * Resource Totals Service
 * 
 * Handles updating resource total_allocation and total_billing fields
 */

import * as db from '/opt/nodejs/database/index.js';

/**
 * Update total_allocation and total_billing for a resource
 * Called after allocation changes to keep resource totals in sync
 */
export const updateResourceTotals = async (resourceId, log) => {
    try {
        const totalsQuery = `
            UPDATE employees
            SET 
                total_allocation = (
                    SELECT COALESCE(SUM(a.allocation_percentage), 0)
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    WHERE a.employee_id = $1
                    AND a.is_active = true
                    AND a.deleted_at IS NULL
                    AND p.is_bench_project = false
                ),
                total_billing = (
                    SELECT COALESCE(SUM(a.billing_percentage), 0)
                    FROM allocations a
                    JOIN projects p ON a.project_id = p.id
                    JOIN billing_statuses bs ON p.billing_status_id = bs.id
                    WHERE a.employee_id = $1
                    AND a.is_active = true
                    AND a.deleted_at IS NULL
                    AND bs.name = 'Billing'
                    AND p.is_bench_project = false
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING total_allocation, total_billing
        `;

        const result = await db.query(totalsQuery, [resourceId]);

        if (result.rows.length > 0) {
            log.info('Updated resource totals', {
                resourceId,
                totalAllocation: result.rows[0].total_allocation,
                totalBilling: result.rows[0].total_billing
            });
        }

        return result.rows[0];
    } catch (err) {
        log.error('Failed to update resource totals', {
            resourceId,
            error: err.message
        });
        // Don't throw - this is a background operation
        return null;
    }
};
