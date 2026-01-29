/**
 * Allocations Handler
 * Lambda handlers for resource allocation management
 * 
 * Bench Auto-Allocation System:
 * - New resources are automatically allocated 100% to Bench
 * - When allocating to other projects, Bench allocation is automatically reduced
 * - Allocations exceeding 100% return a warning (not error)
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict, badRequest } from '/opt/nodejs/utils/response.js';
import { validate, allocationSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'allocation-service';

// Fixed Bench project ID - will be looked up by is_bench_project flag
let BENCH_PROJECT_ID = null;

/**
 * Get the Bench project ID (from database by is_bench_project flag)
 */
const getBenchProjectId = async () => {
    // Return cached value if available
    if (BENCH_PROJECT_ID) {
        return BENCH_PROJECT_ID;
    }

    try {
        const result = await db.query(
            "SELECT id FROM projects WHERE is_bench_project = true AND deleted_at IS NULL LIMIT 1"
        );
        if (result.rows.length > 0) {
            BENCH_PROJECT_ID = result.rows[0].id;
            return BENCH_PROJECT_ID;
        }

        // Fallback: try to find by project code
        const codeResult = await db.query(
            "SELECT id FROM projects WHERE project_code = 'BENCH' AND deleted_at IS NULL LIMIT 1"
        );
        if (codeResult.rows.length > 0) {
            BENCH_PROJECT_ID = codeResult.rows[0].id;
            return BENCH_PROJECT_ID;
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Calculate total allocation for a resource (excluding bench)
 */
const calculateNonBenchTotal = async (resourceId, excludeAllocationId, startDate, endDate) => {
    const benchProjectId = await getBenchProjectId();
    const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
    const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

    let query = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE resource_id = $1
        AND project_id != $2
        AND is_active = true
        AND (end_date IS NULL OR end_date >= $3::date)
        AND start_date <= COALESCE($4::date, '9999-12-31'::date)
    `;
    const params = [resourceId, benchProjectId, startDateStr, endDateStr];

    if (excludeAllocationId) {
        query += ` AND id != $5`;
        params.push(excludeAllocationId);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total, 10);
};

/**
 * Get the current bench allocation for a resource (including inactive)
 */
const getBenchAllocation = async (resourceId) => {
    const benchProjectId = await getBenchProjectId();
    // Get any bench allocation for this resource (active or inactive)
    const result = await db.query(`
        SELECT * FROM allocations 
        WHERE resource_id = $1 
        AND project_id = $2 
        ORDER BY is_active DESC, updated_at DESC
        LIMIT 1
    `, [resourceId, benchProjectId]);

    return result.rows[0] || null;
};

/**
 * Auto-adjust bench allocation based on other allocations
 * Returns the new bench percentage after adjustment
 */
const adjustBenchAllocation = async (resourceId, userId, log) => {
    const benchProjectId = await getBenchProjectId();
    const nonBenchTotal = await calculateNonBenchTotal(resourceId, null, new Date().toISOString().split('T')[0], null);
    const newBenchPercentage = Math.max(0, 100 - nonBenchTotal);

    const benchAllocation = await getBenchAllocation(resourceId);

    if (benchAllocation) {
        if (newBenchPercentage === 0) {
            // Deactivate bench allocation if 0%
            await db.query(`
                UPDATE allocations 
                SET is_active = false, allocation_percentage = 0, updated_by = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [benchAllocation.id, userId || '00000000-0000-0000-0000-000000000000']);
            log.info('Bench allocation deactivated', { resourceId, previousPercentage: benchAllocation.allocation_percentage });
        } else if (benchAllocation.allocation_percentage !== newBenchPercentage) {
            // Update bench allocation percentage
            await db.query(`
                UPDATE allocations 
                SET allocation_percentage = $2, is_active = true, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [benchAllocation.id, newBenchPercentage, userId || '00000000-0000-0000-0000-000000000000']);
            log.info('Bench allocation adjusted', {
                resourceId,
                previousPercentage: benchAllocation.allocation_percentage,
                newPercentage: newBenchPercentage
            });
        }
    } else if (newBenchPercentage > 0) {
        // Get 'Bench' billing status ID
        const benchStatusResult = await db.query(
            "SELECT id FROM billing_statuses WHERE name = 'Bench' AND is_active = true LIMIT 1"
        );
        const benchStatusId = benchStatusResult.rows.length > 0 
            ? benchStatusResult.rows[0].id 
            : null;

        if (!benchStatusId) {
            log.warn('Bench billing status not found, using default');
            // Fallback to first active status
            const fallbackResult = await db.query(
                "SELECT id FROM billing_statuses WHERE is_active = true ORDER BY display_order ASC LIMIT 1"
            );
            const fallbackStatusId = fallbackResult.rows.length > 0 ? fallbackResult.rows[0].id : null;
            
            await db.query(`
                INSERT INTO allocations (resource_id, project_id, allocation_percentage, billing_status_id, start_date, is_active, notes, created_by)
                VALUES ($1, $2, $3, $4, CURRENT_DATE, true, 'Auto-created bench allocation', $5)
            `, [resourceId, benchProjectId, newBenchPercentage, fallbackStatusId, userId || '00000000-0000-0000-0000-000000000000']);
        } else {
            await db.query(`
                INSERT INTO allocations (resource_id, project_id, allocation_percentage, billing_status_id, start_date, is_active, notes, created_by)
                VALUES ($1, $2, $3, $4, CURRENT_DATE, true, 'Auto-created bench allocation', $5)
            `, [resourceId, benchProjectId, newBenchPercentage, benchStatusId, userId || '00000000-0000-0000-0000-000000000000']);
        }
        log.info('Bench allocation created', { resourceId, percentage: newBenchPercentage });
    }

    return newBenchPercentage;
};

/**
 * Validate allocation and return warning if exceeds 100%
 * Returns { valid: true, warning?: string, ... } instead of blocking
 */
const validateAllocation = async (resourceId, newPercentage, excludeAllocationId, startDate, endDate) => {
    const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
    const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
    const benchProjectId = await getBenchProjectId();

    // Calculate total excluding bench and current allocation
    let query = `
        SELECT COALESCE(SUM(allocation_percentage), 0) as total
        FROM allocations
        WHERE resource_id = $1
        AND project_id != $2
        AND is_active = true
        AND (end_date IS NULL OR end_date >= $3::date)
        AND start_date <= COALESCE($4::date, '9999-12-31'::date)
    `;
    const params = [resourceId, benchProjectId, startDateStr, endDateStr];

    if (excludeAllocationId) {
        query += ` AND id != $5`;
        params.push(excludeAllocationId);
    }

    const result = await db.query(query, params);
    const currentNonBenchTotal = parseInt(result.rows[0].total, 10);
    const newTotal = currentNonBenchTotal + newPercentage;

    // Always valid, but return warning if exceeds 100%
    const response = {
        valid: true,
        currentTotal: currentNonBenchTotal,
        newTotal,
        benchWillBe: Math.max(0, 100 - newTotal)
    };

    if (newTotal > 100) {
        response.warning = `Total allocation exceeds 100%. Non-bench allocations: ${currentNonBenchTotal}% + new: ${newPercentage}% = ${newTotal}%. Resource may be over-allocated.`;
        response.overAllocated = true;
    }

    return response;
};

/**
 * Log allocation changes to history
 */
const logAllocationHistory = async (allocation, changeType, userId) => {
    const query = `
        INSERT INTO allocation_change_history (
            allocation_id, change_type, changed_by, changed_fields, new_values
        )
        VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [
        allocation.id,
        changeType,
        userId || '00000000-0000-0000-0000-000000000000',
        JSON.stringify(['allocation_percentage', 'start_date', 'end_date']),
        JSON.stringify(allocation)
    ]);
};

/**
 * List allocations with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'allocations.list' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { page = 1, limit = 20, resource_id, project_id, is_active } = queryParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        log.info('Listing allocations', { page, limit, filters: { resource_id, project_id, is_active } });

        // Build dynamic query
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (resource_id) {
            whereClause += ` AND a.resource_id = $${paramIndex}`;
            params.push(resource_id);
            paramIndex++;
        }

        if (project_id) {
            whereClause += ` AND a.project_id = $${paramIndex}`;
            params.push(project_id);
            paramIndex++;
        }

        if (is_active !== undefined) {
            whereClause += ` AND a.is_active = $${paramIndex}`;
            params.push(is_active === 'true' || is_active === true);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM allocations a ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with joins
        const dataQuery = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                p.project_name,
                c.client_name,
                bs.name as billing_status_name,
                bs.color as billing_status_color
            FROM allocations a
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
            ${whereClause}
            ORDER BY a.start_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(parseInt(limit), offset);

        const result = await db.query(dataQuery, params);

        return success({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        log.error('Failed to list allocations', { error: err.message });
        return error('Failed to list allocations', err);
    }
};

/**
 * Get a single allocation by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'allocations.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting allocation', { id });

        const query = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                p.project_name,
                c.client_name,
                bs.name as billing_status_name,
                bs.color as billing_status_color
            FROM allocations a
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
            WHERE a.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Allocation not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get allocation', { id, error: err.message });
        return error('Failed to get allocation', err);
    }
};

/**
 * Create a new allocation
 * Automatically adjusts Bench allocation after creating
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'allocations.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, allocationSchemas.create);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
        const benchProjectId = await getBenchProjectId();

        log.info('Creating allocation', { resource_id: validated.resource_id, project_id: validated.project_id });

        // Check if this is a bench allocation
        const isBenchAllocation = validated.project_id === benchProjectId;

        // Validate allocation (now returns warning instead of error for >100%)
        const validationResult = await validateAllocation(
            validated.resource_id,
            isBenchAllocation ? 0 : validated.allocation_percentage, // Don't count bench in validation
            null,
            validated.start_date,
            validated.end_date
        );

        // Get billing_status_id (use provided or default to 'Billing')
        let billingStatusId = validated.billing_status_id;
        if (!billingStatusId) {
            // Default to 'Billing' status if not provided
            const defaultStatusResult = await db.query(
                "SELECT id FROM billing_statuses WHERE name = 'Billing' AND is_active = true LIMIT 1"
            );
            if (defaultStatusResult.rows.length > 0) {
                billingStatusId = defaultStatusResult.rows[0].id;
            } else {
                // Fallback: get first active status
                const fallbackResult = await db.query(
                    "SELECT id FROM billing_statuses WHERE is_active = true ORDER BY display_order ASC LIMIT 1"
                );
                if (fallbackResult.rows.length > 0) {
                    billingStatusId = fallbackResult.rows[0].id;
                } else {
                    return error('No active billing statuses found. Please configure billing statuses first.', null, 400);
                }
            }
        }

        const query = `
            INSERT INTO allocations (
                resource_id, project_id, allocation_percentage, billing_status_id, start_date, end_date,
                is_active, notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8, $9)
            RETURNING *
        `;

        // Convert dates to ISO strings
        const startDateStr = validated.start_date instanceof Date
            ? validated.start_date.toISOString().split('T')[0]
            : validated.start_date;
        const endDateStr = validated.end_date
            ? (validated.end_date instanceof Date
                ? validated.end_date.toISOString().split('T')[0]
                : validated.end_date)
            : null;

        const params = [
            validated.resource_id,
            validated.project_id,
            validated.allocation_percentage,
            billingStatusId,
            startDateStr,
            endDateStr,
            true, // is_active
            validated.notes || null,
            userId || '00000000-0000-0000-0000-000000000000'
        ];

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'CREATED', userId);

        // Auto-adjust bench allocation if this is not a bench allocation
        let benchAdjustment = null;
        if (!isBenchAllocation) {
            const newBenchPercentage = await adjustBenchAllocation(validated.resource_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`
            };
        }

        // Send audit event for allocation creation
        await audit.create(
            event,
            'allocation',
            allocation.id,
            `${validated.resource_id} -> ${validated.project_id}`,
            allocation,
            SERVICE_NAME,
            {
                resource_id: validated.resource_id,
                project_id: validated.project_id,
                percentage: validated.allocation_percentage,
                benchAdjustment
            }
        );

        log.info('Allocation created', { id: allocation.id, warning: validationResult.warning });

        // Build response with optional warning
        const response = {
            ...allocation,
            benchAdjustment
        };

        if (validationResult.warning) {
            response.warning = validationResult.warning;
            response.totalAllocation = validationResult.newTotal;
            response.overAllocated = validationResult.overAllocated;
        }

        return success(response, 201);

    } catch (err) {
        log.error('Failed to create allocation', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        if (err.code === '23503') {
            return badRequest('Resource or Project not found');
        }

        return error('Failed to create allocation', err);
    }
};

/**
 * Update an existing allocation
 * Automatically adjusts Bench allocation after updating
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'allocations.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, allocationSchemas.update);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
        const benchProjectId = await getBenchProjectId();

        log.info('Updating allocation', { id, userId });

        // Get existing allocation
        const existingResult = await db.query('SELECT * FROM allocations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Allocation not found');
        }
        const existing = existingResult.rows[0];
        const isBenchAllocation = existing.project_id === benchProjectId;

        // Optimistic locking check
        if (validated.version !== undefined && existing.version !== validated.version) {
            return conflict('Allocation has been modified by another user. Please refresh and try again.');
        }

        // If updating percentage, validate (warnings instead of errors for >100%)
        let validationResult = null;
        if (validated.allocation_percentage !== undefined && !isBenchAllocation) {
            validationResult = await validateAllocation(
                existing.resource_id,
                validated.allocation_percentage,
                id,
                validated.start_date || existing.start_date,
                validated.end_date || existing.end_date
            );
        }

        // Build dynamic update query
        const { version, ...updateData } = validated;
        const updates = [];
        const params = [id];
        let paramIndex = 2;

        // Handle billing_status_id separately to validate it exists
        if (updateData.billing_status_id !== undefined) {
            // Validate billing status exists and is active
            const statusCheck = await db.query(
                'SELECT id FROM billing_statuses WHERE id = $1 AND is_active = true',
                [updateData.billing_status_id]
            );
            if (statusCheck.rows.length === 0) {
                return badRequest('Invalid or inactive billing status');
            }
            updates.push(`billing_status_id = $${paramIndex}`);
            params.push(updateData.billing_status_id);
            paramIndex++;
            delete updateData.billing_status_id;
        }

        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return success(existing);
        }

        // Add audit fields
        updates.push(`updated_by = $${paramIndex++}`);
        params.push(userId);
        updates.push(`version = version + 1`);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE allocations 
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'UPDATED', userId);

        // Auto-adjust bench allocation if this is not a bench allocation
        let benchAdjustment = null;
        if (!isBenchAllocation && validated.allocation_percentage !== undefined) {
            const newBenchPercentage = await adjustBenchAllocation(existing.resource_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`
            };
        }

        // Send audit event for allocation update
        await audit.update(
            event,
            'allocation',
            id,
            `${allocation.resource_id} -> ${allocation.project_id}`,
            existing,
            allocation,
            SERVICE_NAME,
            { benchAdjustment }
        );

        log.info('Allocation updated', { id, warning: validationResult?.warning });

        // Build response with optional warning
        const response = {
            ...allocation,
            benchAdjustment
        };

        if (validationResult?.warning) {
            response.warning = validationResult.warning;
            response.totalAllocation = validationResult.newTotal;
            response.overAllocated = validationResult.overAllocated;
        }

        return success(response);

    } catch (err) {
        log.error('Failed to update allocation', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update allocation', err);
    }
};

/**
 * Delete an allocation
 * Automatically adjusts Bench allocation after deleting (adds freed percentage back to bench)
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'allocations.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        log.info('Deleting allocation', { id, userId });
        const benchProjectId = await getBenchProjectId();

        // Get existing for history and bench adjustment
        const existingResult = await db.query('SELECT * FROM allocations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Allocation not found');
        }
        const existing = existingResult.rows[0];
        const isBenchAllocation = existing.project_id === benchProjectId;

        const result = await db.query('DELETE FROM allocations WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return notFound('Allocation not found');
        }

        // Log to history
        await logAllocationHistory(existing, 'DELETED', userId);

        // Auto-adjust bench allocation if this was not a bench allocation
        let benchAdjustment = null;
        if (!isBenchAllocation) {
            const newBenchPercentage = await adjustBenchAllocation(existing.resource_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`
            };
        }

        // Send audit event for allocation deletion
        await audit.delete(
            event,
            'allocation',
            id,
            `${existing.resource_id} -> ${existing.project_id}`,
            existing,
            SERVICE_NAME,
            { benchAdjustment }
        );

        log.info('Allocation deleted', { id, benchAdjustment });

        return success({
            message: 'Allocation deleted successfully',
            benchAdjustment
        });

    } catch (err) {
        log.error('Failed to delete allocation', { id, error: err.message });
        return error('Failed to delete allocation', err);
    }
};

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
            'SELECT id, name, email FROM resources WHERE id = $1 AND deleted_at IS NULL',
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
            WHERE a.resource_id = $1
            AND a.is_active = true
            AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
            AND a.start_date <= CURRENT_DATE
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
                u.name as changed_by_name
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
