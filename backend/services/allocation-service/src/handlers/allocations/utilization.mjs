/**
 * Allocation Utilization & History Handlers
 * 
 * Handles utilization-related operations:
 * - getResourceUtilization: Get utilization summary for a resource
 * - getHistory: Get allocation change history
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound } from '/opt/nodejs/utils/response.js';

/**
 * Get utilization summary for a resource
 */
export const getResourceUtilization = async (event) => {
    const log = logger.child({ handler: 'allocations.getResourceUtilization' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting resource utilization', { id });

        // Check if resource exists
        const resourceResult = await db.query(
            'SELECT id, name, email FROM employees WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resource = resourceResult.rows[0];

        // Get current active allocations
        const allocationsQuery = `
            SELECT 
                a.*,
                p.project_name
            FROM allocations a
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE a.employee_id = $1
            AND a.is_active = true
            AND (a.deallocated_date IS NULL OR a.deallocated_date >= CURRENT_DATE)
            AND a.allocated_date <= CURRENT_DATE
        `;

        const allocationsResult = await db.query(allocationsQuery, [id]);

        // Calculate total utilization
        const totalUtilization = allocationsResult.rows.reduce(
            (sum, a) => sum + parseInt(a.allocation_percentage),
            0
        );

        return success({
            resource_id: id,
            resource_name: resource.name,
            resource_email: resource.email,
            total_utilization: totalUtilization,
            available_capacity: 100 - totalUtilization,
            active_allocations: allocationsResult.rows.length,
            allocations: allocationsResult.rows
        });

    } catch (err) {
        log.error('Failed to get resource utilization', { id, error: err.message });
        return error('Failed to get resource utilization', err);
    }
};

/**
 * Get allocation history
 */
export const getHistory = async (event) => {
    const log = logger.child({ handler: 'allocations.getHistory' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting allocation history', { id });

        const query = `
            SELECT
                ah.*,
                u.username as changed_by_name
            FROM allocation_history ah
            LEFT JOIN users u ON ah.changed_by = u.id
            WHERE ah.allocation_id = $1
            ORDER BY ah.created_at DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            allocation_id: id,
            history: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to get allocation history', { id, error: err.message });
        return error('Failed to get allocation history', err);
    }
};

