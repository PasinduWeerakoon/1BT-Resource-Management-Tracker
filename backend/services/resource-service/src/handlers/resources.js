/**
 * Resources Handler
 * Lambda handlers for resource (employee) management
 * Uses shared layer for database, logger, and utilities
 * 
 * Bench Auto-Allocation:
 * - New resources are automatically allocated 100% to Bench project
 * 
 * Uses Drizzle ORM with transaction support for data integrity
 */

// Import from Lambda Layer (mounted at /opt/nodejs)
import * as db from '/opt/nodejs/database/index.js';
import { getDrizzle, withTransaction } from '/opt/nodejs/database/drizzle.js';
import { resources, allocations, projects, designations, tracks, users, clients } from '/opt/nodejs/database/schema.js';
import { eq, and, isNull, ilike, or, sql, desc } from 'drizzle-orm';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import { validate, resourceSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';

const SERVICE_NAME = 'resource-service';

// Fixed Bench project ID - will be looked up by is_bench_project flag
let BENCH_PROJECT_ID = null;

/**
 * Get the Bench project ID (from database by is_bench_project flag)
 * Uses Drizzle ORM for type-safe queries
 */
const getBenchProjectId = async () => {
    // Return cached value if available
    if (BENCH_PROJECT_ID) {
        return BENCH_PROJECT_ID;
    }

    try {
        const drizzle = await getDrizzle();

        // First try by is_bench_project flag
        const result = await drizzle
            .select({ id: projects.id })
            .from(projects)
            .where(and(
                eq(projects.isBenchProject, true),
                isNull(projects.deletedAt)
            ))
            .limit(1);

        if (result.length > 0) {
            BENCH_PROJECT_ID = result[0].id;
            return BENCH_PROJECT_ID;
        }

        // Fallback: try to find by project code
        const codeResult = await drizzle
            .select({ id: projects.id })
            .from(projects)
            .where(and(
                eq(projects.projectCode, 'BENCH'),
                isNull(projects.deletedAt)
            ))
            .limit(1);

        if (codeResult.length > 0) {
            BENCH_PROJECT_ID = codeResult[0].id;
            return BENCH_PROJECT_ID;
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Check if a track is a billable track (should have auto-bench allocation)
 * Only Dev (FS, .Net, DS, UI/UX), QA, and PM/BA tracks should auto-bench
 * @param {object} tx - Drizzle transaction context
 * @param {string} trackId - The track ID to check
 * @returns {boolean} - Whether the track is billable
 */
const isBillableTrack = async (tx, trackId) => {
    try {
        const result = await tx
            .select({ isBillableTrack: tracks.isBillableTrack, name: tracks.name })
            .from(tracks)
            .where(eq(tracks.id, trackId));

        if (result.length === 0) {
            return false;
        }

        // If is_billable_track column is set, use it
        if (result[0].isBillableTrack !== null) {
            return result[0].isBillableTrack;
        }

        // Fallback: check track name for backwards compatibility
        const billableTracks = ['FS', '.Net', 'DS', 'UI/UX', 'QA', 'PM/BA'];
        return billableTracks.includes(result[0].name);
    } catch {
        return false;
    }
};

/**
 * Create initial bench allocation for a new resource at 100%
 * Only applies to billable tracks (Dev, QA, PM/BA)
 * Uses Drizzle ORM - can accept transaction context (tx) for atomic operations
 * @param {object} tx - Drizzle transaction context (or regular drizzle instance)
 * @param {string} resourceId - The resource ID to allocate
 * @param {string} trackId - The track ID of the resource
 * @param {string} userId - The user creating the allocation
 * @param {object} log - Logger instance
 */
const createInitialBenchAllocation = async (tx, resourceId, trackId, userId, log) => {
    try {
        // Check if this track should have auto-bench allocation
        const shouldAutoBench = await isBillableTrack(tx, trackId);
        if (!shouldAutoBench) {
            log.info('Track is not billable, skipping auto-bench allocation', { resourceId, trackId });
            return null;
        }

        const benchProjectId = await getBenchProjectId();

        if (!benchProjectId) {
            log.warn('Bench project not found, skipping auto-allocation');
            return null;
        }

        // Check if Bench project exists
        const benchExists = await tx
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.id, benchProjectId));

        if (benchExists.length === 0) {
            log.warn('Bench project not found, skipping auto-allocation', { benchProjectId });
            return null;
        }

        // Insert bench allocation using Drizzle (use camelCase properties from schema)
        const result = await tx
            .insert(allocations)
            .values({
                resourceId: resourceId,
                projectId: benchProjectId,
                allocationPercentage: '100',
                billingPercentage: '0', // Bench is non-billing
                startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                isActive: true,
                notes: 'Auto-created bench allocation for new resource',
                createdBy: userId
            })
            .returning();

        log.info('Initial bench allocation created', { resourceId, allocationId: result[0].id });
        return result[0];
    } catch (err) {
        log.error('Failed to create initial bench allocation', { resourceId, error: err.message });
        // Re-throw to trigger transaction rollback
        throw err;
    }
};

/**
 * List resources with pagination and filters
 */
export const list = async (event) => {
    const log = logger.child({ handler: 'resources.list' });

    try {
        const queryParams = event.queryStringParameters || {};

        // Validate query parameters
        const validated = validate(queryParams, resourceSchemas.list);
        const { page, limit, search, track_id, designation_id, status, intern_classification } = validated;
        const offset = (page - 1) * limit;

        log.info('Listing resources', { page, limit, filters: { search, track_id, status } });

        // Build dynamic query
        let whereClause = 'WHERE r.deleted_at IS NULL';
        const params = [];
        let paramIndex = 1;

        if (search) {
            // Case-insensitive search across name, email, employee_id, and employee_number
            // ILIKE is PostgreSQL's case-insensitive LIKE operator
            // Convert search to lowercase for consistency (frontend also sends lowercase)
            const searchTerm = search.toLowerCase().trim();
            whereClause += ` AND (r.name ILIKE $${paramIndex} OR r.email ILIKE $${paramIndex} OR r.employee_id ILIKE $${paramIndex} OR r.employee_number ILIKE $${paramIndex})`;
            params.push(`%${searchTerm}%`);
            paramIndex++;
        }

        if (track_id) {
            whereClause += ` AND r.track_id = $${paramIndex}`;
            params.push(track_id);
            paramIndex++;
        }

        if (designation_id) {
            whereClause += ` AND r.designation_id = $${paramIndex}`;
            params.push(designation_id);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND r.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (intern_classification) {
            whereClause += ` AND r.intern_classification = $${paramIndex}`;
            params.push(intern_classification);
            paramIndex++;
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM resources r 
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated results with joins
        const dataQuery = `
            SELECT 
                r.*,
                d.name as designation_name,
                d.level as designation_level,
                t.name as track_name
            FROM resources r
            LEFT JOIN designations d ON r.designation_id = d.id
            LEFT JOIN tracks t ON r.track_id = t.id
            ${whereClause}
            ORDER BY r.name ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit, offset);

        const result = await db.query(dataQuery, params);

        return success({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        log.error('Failed to list resources', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to list resources', err);
    }
};

/**
 * Get a single resource by ID
 * Uses Drizzle ORM for type-safe queries
 */
export const getById = async (event) => {
    const log = logger.child({ handler: 'resources.getById' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting resource', { id });

        const drizzle = await getDrizzle();

        // Using Drizzle with leftJoin for related data
        // Map to snake_case for API response consistency
        const result = await drizzle
            .select({
                // Resource fields (map schema camelCase to API snake_case)
                id: resources.id,
                employee_id: resources.employeeId,
                employee_number: resources.employeeNumber,
                name: resources.name,
                phone_number: resources.phoneNumber,
                email: resources.email,
                address: resources.address,
                designation_id: resources.designationId,
                track_id: resources.trackId,
                intern_classification: resources.internClassification,
                skills: resources.skills,
                date_of_joining: resources.dateOfJoining,
                date_of_birth: resources.dateOfBirth,
                nic_passport: resources.nicPassport,
                is_intern: resources.isIntern,
                tier: resources.tier,
                tech_stack: resources.techStack,
                photo_url: resources.photoUrl,
                status: resources.status,
                total_allocation: resources.totalAllocation,
                total_billing: resources.totalBilling,
                version: resources.version,
                created_at: resources.createdAt,
                updated_at: resources.updatedAt,
                created_by: resources.createdBy,
                updated_by: resources.updatedBy,
                deleted_at: resources.deletedAt,
                // Joined fields
                designation_name: designations.name,
                designation_level: designations.level,
                track_name: tracks.name
            })
            .from(resources)
            .leftJoin(designations, eq(resources.designationId, designations.id))
            .leftJoin(tracks, eq(resources.trackId, tracks.id))
            .where(and(
                eq(resources.id, id),
                isNull(resources.deletedAt)
            ));

        if (result.length === 0) {
            return notFound('Resource not found');
        }

        return success(result[0]);

    } catch (err) {
        log.error('Failed to get resource', { id, error: err.message });
        return error('Failed to get resource', err);
    }
};

/**
 * Create a new resource
 * Automatically assigns 100% to Bench project
 * Uses Drizzle ORM with transaction - if bench allocation fails, resource creation is rolled back
 */
export const create = async (event) => {
    const log = logger.child({ handler: 'resources.create' });

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, resourceSchemas.create);

        log.info('Creating resource', { email: validated.email, employee_id: validated.employee_id });

        const drizzle = await getDrizzle();

        // Check for duplicate employee_id using Drizzle
        const existingEmployeeId = await drizzle
            .select({ id: resources.id })
            .from(resources)
            .where(and(
                eq(resources.employeeId, validated.employee_id),
                isNull(resources.deletedAt)
            ));

        if (existingEmployeeId.length > 0) {
            return conflict('A resource with this employee_id already exists');
        }

        // Check for duplicate employee_number using Drizzle
        const existingEmployeeNumber = await drizzle
            .select({ id: resources.id })
            .from(resources)
            .where(and(
                eq(resources.employeeNumber, validated.employee_number),
                isNull(resources.deletedAt)
            ));

        if (existingEmployeeNumber.length > 0) {
            return conflict('A resource with this employee_number already exists');
        }

        // Get user info from auth context for created_by
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub
            || event.requestContext?.authorizer?.claims?.sub;

        let userId = null;
        if (cognitoSub) {
            const userResult = await drizzle
                .select({ id: users.id })
                .from(users)
                .where(eq(users.cognitoUserId, cognitoSub));

            if (userResult.length > 0) {
                userId = userResult[0].id;
            }
        }
        // Use a system UUID if no user found
        if (!userId) {
            userId = '00000000-0000-0000-0000-000000000000';
        }

        // Use transaction to ensure resource creation and bench allocation are atomic
        // If either fails, both are rolled back
        const result = await withTransaction(async (tx) => {
            // Insert resource using Drizzle (use camelCase properties from schema)
            const [newResource] = await tx
                .insert(resources)
                .values({
                    employeeId: validated.employee_id,
                    employeeNumber: validated.employee_number,
                    name: validated.name,
                    phoneNumber: validated.phone_number,
                    email: validated.email || null,
                    address: validated.address || null,
                    designationId: validated.designation_id,
                    trackId: validated.track_id,
                    internClassification: validated.intern_classification || null,
                    skills: validated.skills || [],
                    dateOfJoining: validated.date_of_joining || null,
                    dateOfBirth: validated.date_of_birth || null,
                    nicPassport: validated.nic_passport || null,
                    isIntern: validated.is_intern || false,
                    tier: validated.tier || null,
                    techStack: validated.tech_stack || null,
                    photoUrl: validated.photo_url || null,
                    status: validated.status || 'Active',
                    createdBy: userId
                })
                .returning();

            log.info('Resource created in transaction', { id: newResource.id });

            // Auto-assign 100% to Bench project (within same transaction)
            // Only creates bench allocation for billable tracks (FS, .Net, DS, UI/UX, QA, PM/BA)
            const benchAllocation = await createInitialBenchAllocation(tx, newResource.id, validated.track_id, userId, log);

            return { newResource, benchAllocation };
        });

        const { newResource, benchAllocation } = result;

        // Send audit event for resource creation (outside transaction - audit is non-critical)
        await audit.create(
            event,
            'resource',
            newResource.id,
            newResource.name,
            newResource,
            SERVICE_NAME,
            { employee_id: newResource.employee_id, benchAllocation: benchAllocation?.id }
        );

        // Include bench allocation info in response
        const response = {
            ...newResource,
            benchAllocation: benchAllocation ? {
                id: benchAllocation.id,
                percentage: benchAllocation.allocation_percentage,
                message: 'Automatically allocated 100% to Bench'
            } : null
        };

        return success(response, 201);

    } catch (err) {
        log.error('Failed to create resource', { error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to create resource', err);
    }
};

/**
 * Update an existing resource
 * Uses Drizzle ORM with transaction for atomic updates
 */
export const update = async (event) => {
    const log = logger.child({ handler: 'resources.update' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const validated = validate(body, resourceSchemas.update);

        log.info('Updating resource', { id });

        const drizzle = await getDrizzle();

        // Check if resource exists and get current data for audit
        const existingResult = await drizzle
            .select()
            .from(resources)
            .where(and(
                eq(resources.id, id),
                isNull(resources.deletedAt)
            ));

        if (existingResult.length === 0) {
            return notFound('Resource not found');
        }

        const existing = existingResult[0];

        // Optimistic locking check (only if version is provided)
        if (validated.version !== undefined && existing.version !== validated.version) {
            return conflict('Resource has been modified by another user. Please refresh and try again.');
        }

        // Get user info for updated_by - use system UUID as fallback
        const cognitoSub = event.requestContext?.authorizer?.jwt?.claims?.sub
            || event.requestContext?.authorizer?.claims?.sub;

        let userId = null;
        if (cognitoSub) {
            const userResult = await drizzle
                .select({ id: users.id })
                .from(users)
                .where(eq(users.cognitoUserId, cognitoSub));

            if (userResult.length > 0) {
                userId = userResult[0].id;
            }
        }
        if (!userId) {
            userId = '00000000-0000-0000-0000-000000000000';
        }

        // Map API snake_case to Drizzle schema camelCase
        const fieldMapping = {
            employee_id: 'employeeId',
            employee_number: 'employeeNumber',
            phone_number: 'phoneNumber',
            designation_id: 'designationId',
            track_id: 'trackId',
            intern_classification: 'internClassification',
            date_of_joining: 'dateOfJoining',
            date_of_birth: 'dateOfBirth',
            nic_passport: 'nicPassport',
            is_intern: 'isIntern',
            tech_stack: 'techStack',
            photo_url: 'photoUrl',
            // Direct mappings (same name)
            name: 'name',
            email: 'email',
            address: 'address',
            skills: 'skills',
            tier: 'tier',
            status: 'status'
        };

        // Build update object for Drizzle (exclude version from update)
        const { version, ...updateData } = validated;

        // Filter out undefined values and map to camelCase
        const updateValues = {};
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                const drizzleKey = fieldMapping[key] || key;
                updateValues[drizzleKey] = value;
            }
        }

        if (Object.keys(updateValues).length === 0) {
            return success(existing);
        }

        // Add version increment and updated_by
        updateValues.version = sql`${resources.version} + 1`;
        updateValues.updatedAt = new Date();
        updateValues.updatedBy = userId;

        // Perform update using transaction for atomicity
        const [updatedResource] = await withTransaction(async (tx) => {
            return tx
                .update(resources)
                .set(updateValues)
                .where(and(
                    eq(resources.id, id),
                    isNull(resources.deletedAt)
                ))
                .returning();
        });

        // Send audit event for resource update (outside transaction)
        await audit.update(
            event,
            'resource',
            id,
            updatedResource.name,
            existing,
            updatedResource,
            SERVICE_NAME
        );

        log.info('Resource updated', { id });

        return success(updatedResource);

    } catch (err) {
        log.error('Failed to update resource', { id, error: err.message });

        if (err.name === 'ValidationError') {
            return validationError(err.details);
        }

        return error('Failed to update resource', err);
    }
};

/**
 * Soft delete a resource
 * Uses Drizzle ORM with transaction for atomic deletion
 */
export const remove = async (event) => {
    const log = logger.child({ handler: 'resources.remove' });
    const { id } = event.pathParameters;

    try {
        log.info('Deleting resource', { id });

        const drizzle = await getDrizzle();

        // Check if resource exists and get data for audit
        const existingResult = await drizzle
            .select()
            .from(resources)
            .where(and(
                eq(resources.id, id),
                isNull(resources.deletedAt)
            ));

        if (existingResult.length === 0) {
            return notFound('Resource not found');
        }

        const existing = existingResult[0];

        // Soft delete using transaction
        await withTransaction(async (tx) => {
            await tx
                .update(resources)
                .set({ deletedAt: new Date() })
                .where(eq(resources.id, id));
        });

        // Send audit event for resource deletion (outside transaction)
        await audit.delete(
            event,
            'resource',
            id,
            existing.name,
            existing,
            SERVICE_NAME
        );

        log.info('Resource deleted', { id });

        return success({ message: 'Resource deleted successfully' });

    } catch (err) {
        log.error('Failed to delete resource', { id, error: err.message });
        return error('Failed to delete resource', err);
    }
};

/**
 * Get allocations for a resource
 * Uses Drizzle ORM for type-safe queries
 */
export const getAllocations = async (event) => {
    const log = logger.child({ handler: 'resources.getAllocations' });
    const { id } = event.pathParameters;
    const queryParams = event.queryStringParameters || {};
    const includeHistory = queryParams.includeHistory === 'true';

    try {
        log.info('Getting resource allocations', { id, includeHistory });

        const drizzle = await getDrizzle();

        // Check if resource exists using Drizzle
        const resourceCheck = await drizzle
            .select({ id: resources.id })
            .from(resources)
            .where(and(
                eq(resources.id, id),
                isNull(resources.deletedAt)
            ));

        if (resourceCheck.length === 0) {
            return notFound('Resource not found');
        }

        // Build where conditions
        const conditions = [eq(allocations.resourceId, id)];
        if (!includeHistory) {
            conditions.push(eq(allocations.isActive, true));
        }

        // Get allocations with joins using Drizzle (map to snake_case for API)
        const result = await drizzle
            .select({
                id: allocations.id,
                resource_id: allocations.resourceId,
                project_id: allocations.projectId,
                allocation_percentage: allocations.allocationPercentage,
                start_date: allocations.startDate,
                end_date: allocations.endDate,
                is_active: allocations.isActive,
                notes: allocations.notes,
                created_at: allocations.createdAt,
                updated_at: allocations.updatedAt,
                created_by: allocations.createdBy,
                // Joined fields from projects
                project_name: projects.projectName,
                project_code: projects.projectCode,
                project_type: projects.projectType,
                // Joined field from clients
                client_name: clients.clientName
            })
            .from(allocations)
            .leftJoin(projects, eq(allocations.projectId, projects.id))
            .leftJoin(clients, eq(projects.clientId, clients.id))
            .where(and(...conditions))
            .orderBy(desc(allocations.startDate));

        return success({
            resource_id: id,
            allocations: result,
            total: result.length
        });

    } catch (err) {
        log.error('Failed to get resource allocations', { id, error: err.message });
        return error('Failed to get resource allocations', err);
    }
};

/**
 * Get designation history for a resource
 */
export const getDesignationHistory = async (event) => {
    const log = logger.child({ handler: 'resources.getDesignationHistory' });
    const { id } = event.pathParameters;

    try {
        log.info('Getting designation history', { id });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        const query = `
            SELECT 
                dh.*,
                d.name as designation_name,
                d.level as designation_level
            FROM designation_history dh
            LEFT JOIN designations d ON dh.designation_id = d.id
            WHERE dh.resource_id = $1
            ORDER BY dh.effective_date DESC
        `;

        const result = await db.query(query, [id]);

        return success({
            resource_id: id,
            resource_name: resourceCheck.rows[0].name,
            history: result.rows
        });

    } catch (err) {
        log.error('Failed to get designation history', { id, error: err.message });
        return error('Failed to get designation history', err);
    }
};

/**
 * Toggle account manager status for a resource
 */
export const toggleAccountManager = async (event) => {
    const log = logger.child({ handler: 'resources.toggleAccountManager' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const { is_account_manager } = body;

        log.info('Toggling account manager status', { id, is_account_manager });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, is_account_manager FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resource = resourceCheck.rows[0];
        const newStatus = is_account_manager !== undefined ? is_account_manager : !resource.is_account_manager;

        // Update resource
        const updateQuery = `
            UPDATE resources 
            SET is_account_manager = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, email, is_account_manager
        `;

        const result = await db.query(updateQuery, [newStatus, id]);

        log.info('Account manager status updated', { id, is_account_manager: newStatus });

        return success({
            message: `Resource ${newStatus ? 'assigned as' : 'removed from'} account manager`,
            data: result.rows[0]
        });

    } catch (err) {
        log.error('Failed to toggle account manager status', { id, error: err.message });
        return error('Failed to toggle account manager status', err);
    }
};

/**
 * Update resource tier
 */
export const updateTier = async (event) => {
    const log = logger.child({ handler: 'resources.updateTier' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const { tier } = body;

        const validTiers = ['Synergy', 'Tier - 1', 'Tier - 2', 'Tier - 3', 'Tier - 4', 'Intern'];
        if (!tier || !validTiers.includes(tier)) {
            return validationError(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
        }

        log.info('Updating resource tier', { id, tier });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, tier FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Update resource
        const updateQuery = `
            UPDATE resources 
            SET tier = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, tier
        `;

        const result = await db.query(updateQuery, [tier, id]);

        log.info('Resource tier updated', { id, tier });

        return success({
            message: 'Resource tier updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        log.error('Failed to update resource tier', { id, error: err.message });
        return error('Failed to update resource tier', err);
    }
};

/**
 * Update resource tech stack
 */
export const updateTechStack = async (event) => {
    const log = logger.child({ handler: 'resources.updateTechStack' });
    const { id } = event.pathParameters;

    try {
        const body = JSON.parse(event.body || '{}');
        const { tech_stack } = body;

        if (!tech_stack || typeof tech_stack !== 'string') {
            return validationError('Tech stack is required and must be a string');
        }

        log.info('Updating resource tech stack', { id, tech_stack });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, tech_stack FROM resources WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Update resource
        const updateQuery = `
            UPDATE resources 
            SET tech_stack = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, tech_stack
        `;

        const result = await db.query(updateQuery, [tech_stack, id]);

        log.info('Resource tech stack updated', { id, tech_stack });

        return success({
            message: 'Resource tech stack updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        log.error('Failed to update resource tech stack', { id, error: err.message });
        return error('Failed to update resource tech stack', err);
    }
};
