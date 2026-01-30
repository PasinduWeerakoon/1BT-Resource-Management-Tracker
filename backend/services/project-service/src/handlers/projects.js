/**
 * Projects Handler
 * Lambda handlers for project management
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import { validate, projectSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'project-service';

/**
 * Enhancement 3.3: Auto-adjust allocation end dates when project end date is set/changed
 */
const autoAdjustAllocationEndDates = async (projectId, newEndDate, userId, log) => {
    try {
        if (!newEndDate) {
            return { adjusted: 0, message: 'No end date specified' };
        }

        const endDateStr = newEndDate instanceof Date ? newEndDate.toISOString().split('T')[0] : newEndDate;

        // Find all active allocations that need adjustment
        const query = `
            SELECT id, resource_id, end_date 
            FROM allocations 
            WHERE project_id = $1 
            AND is_active = true
            AND (end_date IS NULL OR end_date > $2::date)
        `;

        const result = await db.query(query, [projectId, endDateStr]);
        const allocationsToAdjust = result.rows;

        if (allocationsToAdjust.length === 0) {
            return { adjusted: 0, message: 'No allocations needed adjustment' };
        }

        // Update each allocation's end date
        const updateQuery = `
            UPDATE allocations 
            SET end_date = $1::date, 
                updated_by = $2, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `;

        let adjusted = 0;
        for (const allocation of allocationsToAdjust) {
            await db.query(updateQuery, [endDateStr, userId || '00000000-0000-0000-0000-000000000000', allocation.id]);

            // Log the auto-adjustment to allocation change history
            await db.query(`
                INSERT INTO allocation_change_history (
                    allocation_id, change_type, changed_by, changed_fields, old_values, new_values, notes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                allocation.id,
                'UPDATED',
                userId || '00000000-0000-0000-0000-000000000000',
                JSON.stringify(['end_date']),
                JSON.stringify({ end_date: allocation.end_date }),
                JSON.stringify({ end_date: endDateStr }),
                'Auto-adjusted: Project end date changed'
            ]);

            adjusted++;
        }

        log.info('Auto-adjusted allocation end dates', {
            projectId,
            newEndDate: endDateStr,
            adjustedCount: adjusted
        });

        return {
            adjusted,
            message: `Auto-adjusted ${adjusted} allocation(s) to match project end date`
        };
    } catch (err) {
        log.error('Failed to auto-adjust allocation end dates', { projectId, error: err.message });
        // Don't fail the project update if this fails
        return { adjusted: 0, error: err.message };
    }
};

/**
 * List projects with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'projects.list' });

    try {
        const queryParams = event.queryStringParameters || {};
        const { page = 1, limit = 20, search, client_id, status, project_type, is_billable } = queryParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        log.info('Listing projects', { page, limit, filters: { search, client_id, status } });

        // Build dynamic query
        let whereClause = 'WHERE p.deleted_at IS NULL';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (p.project_name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (client_id) {
            whereClause += ` AND p.client_id = $${paramIndex}`;
            params.push(client_id);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (project_type) {
            whereClause += ` AND p.project_type = $${paramIndex}`;
            params.push(project_type);
            paramIndex++;
        }

        if (is_billable !== undefined) {
            whereClause += ` AND p.is_billable = $${paramIndex}`;
            params.push(is_billable === 'true');
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM projects p ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with client join
        const dataQuery = `
            SELECT 
                p.*,
                c.client_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            ${whereClause}
            ORDER BY p.project_name ASC
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
        log.error('Failed to list projects', { error: err.message });
        return error('Failed to list projects', err);
    }
};

/**
 * Get a single project by ID
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'projects.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting project', { id });

        const query = `
            SELECT 
                p.*,
                c.client_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE p.id = $1 AND p.deleted_at IS NULL
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return notFound('Project not found');
        }

        return success(result.rows[0]);

    } catch (err) {
        log.error('Failed to get project', { id, error: err.message });
        return error('Failed to get project', err);
    }
};

/**
 * Create a new project
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'projects.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, projectSchemas.create);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        log.info('Creating project', { name: validated.project_name, userId });

        // For Internal projects, client_id is optional
        // For External (Client) projects, client_id is required
        const accountType = validated.account_type || (validated.client_id ? 'External' : 'Internal');
        if (accountType === 'External' && !validated.client_id) {
            return validationError([{ field: 'client_id', message: 'client_id is required for External projects' }]);
        }

        // Map billing_type to billing_status enum
        const billingStatus = validated.billing_type === 'Non-Billing' ? 'Non-Billing' : 'Billing';
        const isBillable = billingStatus === 'Billing';

        const query = `
            INSERT INTO projects (
                project_name, project_code, client_id, project_type, account_type,
                billing_status, is_billable, status, team_size, account_manager,
                account_reg_sales_owner, budget, start_date, end_date,
                description, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const params = [
            validated.project_name,
            validated.project_code || null,
            validated.client_id || null,
            validated.project_type || 'Client',
            accountType,
            billingStatus,
            isBillable,
            validated.status || 'Active',
            validated.team_size || 1,
            validated.account_manager,
            validated.account_reg_sales_owner || null,
            validated.budget || null,
            validated.start_date || null,
            validated.end_date || null,
            validated.description || null,
            userId
        ];

        const result = await db.query(query, params);
        const newProject = result.rows[0];

        // Send audit event for project creation
        await audit.create(
            event,
            'project',
            newProject.id,
            newProject.project_name,
            newProject,
            SERVICE_NAME,
            { project_code: newProject.project_code, account_type: newProject.account_type }
        );

        log.info('Project created', { id: newProject.id });

        return success(newProject, 201);

    } catch (err) {
        log.error('Failed to create project', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to create project', err);
    }
};

/**
 * Update an existing project
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'projects.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, projectSchemas.update);
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

        log.info('Updating project', { id, userId });

        // Check if project exists and get current data for audit
        const existingResult = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return notFound('Project not found');
        }

        const existing = existingResult.rows[0];

        // Optimistic locking check
        if (validated.version !== undefined && existing.version !== validated.version) {
            return conflict('Project has been modified by another user. Please refresh and try again.');
        }

        // Build dynamic update query
        const { version, ...updateData } = validated;
        const updates = [];
        const params = [id];
        let paramIndex = 2;

        // No field mapping needed - API field names match DB column names
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                // Handle billing_type -> also update is_billable
                if (key === 'billing_type') {
                    updates.push(`billing_status = $${paramIndex}`);
                    params.push(value === 'Non-Billing' ? 'Non-Billing' : 'Billing');
                    paramIndex++;
                    updates.push(`is_billable = $${paramIndex}`);
                    params.push(value !== 'Non-Billing');
                    paramIndex++;
                } else {
                    updates.push(`${key} = $${paramIndex}`);
                    params.push(value);
                    paramIndex++;
                }
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
            UPDATE projects 
            SET ${updates.join(', ')}
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedProject = result.rows[0];

        // Enhancement 3.3: Auto-adjust allocation end dates if project end_date was changed
        let allocationAdjustment = null;
        if (validated.end_date !== undefined && validated.end_date !== existing.end_date) {
            allocationAdjustment = await autoAdjustAllocationEndDates(id, validated.end_date, userId, log);
        }

        // Send audit event for project update
        await audit.update(
            event,
            'project',
            id,
            updatedProject.project_name,
            existing,
            updatedProject,
            SERVICE_NAME,
            { allocationAdjustment }
        );

        log.info('Project updated', { id, allocationAdjustment });

        // Include adjustment info in response
        const response = { ...updatedProject };
        if (allocationAdjustment && allocationAdjustment.adjusted > 0) {
            response.allocationAdjustment = allocationAdjustment;
        }

        return success(response);

    } catch (err) {
        log.error('Failed to update project', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update project', err);
    }
};

/**
 * Soft delete a project
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'projects.remove' });
    const { id } = event.pathParameters;
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        log.info('Deleting project', { id, userId });

        // Get project data for audit before deletion
        const existingResult = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return notFound('Project not found');
        }

        const existing = existingResult.rows[0];

        await db.query(
            `UPDATE projects 
             SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2 
             WHERE id = $1 AND deleted_at IS NULL`,
            [id, userId]
        );

        // Send audit event for project deletion
        await audit.delete(
            event,
            'project',
            id,
            existing.project_name,
            existing,
            SERVICE_NAME
        );

        log.info('Project deleted', { id });

        return success({ message: 'Project deleted successfully' });

    } catch (err) {
        log.error('Failed to delete project', { id, error: err.message });
        return error('Failed to delete project', err);
    }
};

/**
 * Get allocations for a project
 */
export const getAllocations = async (event) => {
    const log = logger.child({ handler: 'projects.getAllocations' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting project allocations', { id });

        // Check if project exists
        const projectCheck = await db.query(
            'SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (projectCheck.rows.length === 0) {
            return notFound('Project not found');
        }

        const query = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                d.name as designation_name
            FROM allocations a
            LEFT JOIN resources r ON a.resource_id = r.id
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE a.project_id = $1
            ORDER BY a.start_date DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            project_id: id,
            allocations: result.rows,
            total: result.rows.length
        });

    } catch (err) {
        log.error('Failed to get project allocations', { id, error: err.message });
        return error('Failed to get project allocations', err);
    }
};
