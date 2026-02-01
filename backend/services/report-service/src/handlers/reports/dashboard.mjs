/**
 * Dashboard Report Handler
 * 
 * Provides the main dashboard summary data
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error } from '/opt/nodejs/utils/response.js';

/**
 * Get dashboard summary data
 */
export const getDashboard = async (event) => {
    const log = logger.child({ handler: 'reports.getDashboard' });

    try {
        log.info('Getting dashboard data');

        // Run all queries in parallel for performance
        const [
            resourceStats,
            projectStats,
            allocationStats,
            benchResources
        ] = await Promise.all([
            // Resource counts by status
            db.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM resources
                WHERE deleted_at IS NULL
                GROUP BY status
            `),

            // Project counts by status
            db.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM projects
                WHERE deleted_at IS NULL
                GROUP BY status
            `),

            // Allocation summary
            db.query(`
                SELECT 
                    COUNT(DISTINCT resource_id) as allocated_resources,
                    COUNT(*) as total_allocations,
                    AVG(allocation_percentage) as avg_allocation
                FROM allocations
                WHERE is_active = true
                AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
            `),

            // Bench resources count
            db.query(`
                WITH resource_allocations AS (
                    SELECT resource_id, SUM(allocation_percentage) as total
                    FROM allocations
                    WHERE is_active = true AND (deallocated_date IS NULL OR deallocated_date >= CURRENT_DATE)
                    GROUP BY resource_id
                )
                SELECT COUNT(*) as count
                FROM resources r
                LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
                WHERE r.status = 'Active' AND r.deleted_at IS NULL
                AND (ra.total IS NULL OR ra.total < 100)
            `)
        ]);

        // Format response
        const resourcesByStatus = {};
        resourceStats.rows.forEach(row => {
            resourcesByStatus[row.status] = parseInt(row.count);
        });

        const projectsByStatus = {};
        projectStats.rows.forEach(row => {
            projectsByStatus[row.status] = parseInt(row.count);
        });

        return success({
            resources: {
                total: Object.values(resourcesByStatus).reduce((a, b) => a + b, 0),
                byStatus: resourcesByStatus,
                onBench: parseInt(benchResources.rows[0]?.count || 0)
            },
            projects: {
                total: Object.values(projectsByStatus).reduce((a, b) => a + b, 0),
                byStatus: projectsByStatus
            },
            allocations: {
                allocatedResources: parseInt(allocationStats.rows[0]?.allocated_resources || 0),
                totalAllocations: parseInt(allocationStats.rows[0]?.total_allocations || 0),
                avgAllocation: Math.round(parseFloat(allocationStats.rows[0]?.avg_allocation || 0))
            },
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        log.error('Failed to get dashboard', { error: err.message });
        return error('Failed to get dashboard data', err);
    }
};
