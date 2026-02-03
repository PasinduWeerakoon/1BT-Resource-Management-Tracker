// Deployment: 2026-02-03 14:57:48
/**
 * Resources Handler
 * Lambda handlers for resource (employee) management
 * Uses shared layer for database, logger, and utilities
 * 
 * Bench Auto-Allocation:
 * - New resources are automatically allocated 100% to Bench project
 * 
 * Uses Drizzle ORM with transaction support for data integrity
 * 
 * Config ID Mapping:
 * - track_id: Maps to TRACKS config (1=QA, 2=Dev, etc.)
 * - tier_id: Maps to TIERS config (1=Tier-1, 2=Tier-2, etc.)
 * - tech_stack_id: Maps to TECH_STACKS config (1=QA, 2=.NET, etc.)
 */

// Import from Lambda Layer (mounted at /opt/nodejs)
import * as db from '/opt/nodejs/database/index.js';
import { getDrizzle, withTransaction } from '/opt/nodejs/database/drizzle.js';
import schema from '/opt/nodejs/database/schema.js';
// Alias 'employees' as 'resources' to maintain backward compatibility in handlers
const { employees: resources, allocations, projects, designations, users, clients, tags, employeeTags } = schema;
import { eq, and, isNull, ilike, or, sql, desc, inArray } from 'drizzle-orm';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, validationError, conflict } from '/opt/nodejs/utils/response.js';
import { validate, resourceSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';
// Import shared configs for ID-to-label mapping
import { TRACKS, TIERS, TECH_STACKS, getConfigById } from '/opt/nodejs/configs/index.js';

const SERVICE_NAME = 'resource-service';

// Fixed Bench project ID - will be looked up by is_bench_project flag
let BENCH_PROJECT_ID = null;

/**
 * Enhancement 3.6: Auto-end all allocations when resource becomes inactive
 */
const autoEndAllocationsOnInactive = async (resourceId, userId, log) => {
    try {
        // Find all active allocations for this resource
        const activeAllocations = await db.query(`
            SELECT id, project_id, allocation_percentage, end_date 
            FROM allocations 
            WHERE resource_id = $1 
            AND is_active = true
        `, [resourceId]);

        if (activeAllocations.rows.length === 0) {
            return { ended: 0, message: 'No active allocations to end' };
        }

        const today = new Date().toISOString().split('T')[0];
        let ended = 0;

        for (const allocation of activeAllocations.rows) {
            // Set end date to today and deactivate
            await db.query(`
                UPDATE allocations 
                SET end_date = $1::date,
                    is_active = false,
                    updated_by = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [today, userId, allocation.id]);

            // Log to allocation change history
            await db.query(`
                INSERT INTO allocation_change_history (
                    allocation_id, change_type, changed_by, changed_fields, old_values, new_values, notes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                allocation.id,
                'UPDATED',
                userId,
                JSON.stringify(['end_date', 'is_active']),
                JSON.stringify({ end_date: allocation.end_date, is_active: true }),
                JSON.stringify({ end_date: today, is_active: false }),
                'Auto-ended: Resource became inactive'
            ]);

            ended++;
        }

        log.info('Auto-ended allocations due to resource inactive status', {
            resourceId,
            endedCount: ended
        });

        return {
            ended,
            message: `Auto-ended ${ended} allocation(s) due to resource becoming inactive`
        };
    } catch (err) {
        log.error('Failed to auto-end allocations on inactive', { resourceId, error: err.message });
        // Don't fail the resource update if this fails
        return { ended: 0, error: err.message };
    }
};

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
 * Uses shared TRACKS config for lookup
 * @param {number} trackId - The track ID to check (maps to TRACKS config)
 * @returns {boolean} - Whether the track is billable
 */
const isBillableTrack = (trackId) => {
    if (!trackId) return false;

    // Get track from shared config
    const track = getConfigById(TRACKS, trackId);
    if (!track) return false;

    // Billable tracks: QA, Dev, UI, BA, PM, UX
    const billableTrackLabels = ['QA', 'Dev', 'UI', 'BA', 'PM', 'UX'];
    return billableTrackLabels.includes(track.label);
};

/**
 * Create initial bench allocation for a new resource at 100%
 * Only applies to billable tracks (Dev, QA, PM/BA)
 * Uses Drizzle ORM - can accept transaction context (tx) for atomic operations
 * @param {object} tx - Drizzle transaction context (or regular drizzle instance)
 * @param {string} resourceId - The resource ID to allocate
 * @param {number} trackId - The track ID of the resource (maps to TRACKS config)
 * @param {string} userId - The user creating the allocation
 * @param {object} log - Logger instance
 */
const createInitialBenchAllocation = async (tx, resourceId, trackId, userId, log) => {
    try {
        // Check if this track should have auto-bench allocation (now sync, uses config)
        const shouldAutoBench = isBillableTrack(trackId);
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
                employeeId: resourceId,  // employeeId in schema, resourceId is the employee ID passed in
                projectId: benchProjectId,
                allocationPercentage: 100,
                billingPercentage: 0, // Bench is non-billing
                allocatedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
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
        const { page, limit, search, track_id, designation_id, status, tier, employee_number, name } = validated;
        const offset = (page - 1) * limit;

        log.info('Listing resources', { page, limit, filters: { search, track_id, designation_id, status, tier, employee_number, name } });

        // Build dynamic query
        let whereClause = 'WHERE r.deleted_at IS NULL';
        const params = [];
        let paramIndex = 1;

        if (search) {
            // Case-insensitive search across name, email, employee_id, and employee_number
            // ILIKE is PostgreSQL's case-insensitive LIKE operator
            // Convert search to lowercase for consistency (frontend also sends lowercase)
            const searchTerm = search.toLowerCase().trim();
            whereClause += ` AND (r.name ILIKE $${paramIndex} OR r.email ILIKE $${paramIndex} OR r.epf_no ILIKE $${paramIndex} OR r.emp_no ILIKE $${paramIndex})`;
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

        if (tier) {
            whereClause += ` AND r.tier_id = $${paramIndex}`;
            params.push(tier);
            paramIndex++;
        }

        if (employee_number) {
            whereClause += ` AND r.emp_no ILIKE $${paramIndex}`;
            params.push(`%${employee_number}%`);
            paramIndex++;
        }

        if (name) {
            whereClause += ` AND r.name ILIKE $${paramIndex}`;
            params.push(`%${name}%`);
            paramIndex++;
        }

        // Optimized: Combined query using CTE and window function for count
        // This avoids two separate round-trips to the database
        // Note: track_id, tier_id, tech_stack_id are INTEGER IDs mapping to shared configs
        const dataQuery = `
            WITH filtered_resources AS (
                SELECT 
                    r.*,
                    d.name as designation_name,
                    d.level as designation_level,
                    COUNT(*) OVER() as total_count
                FROM employees r
                LEFT JOIN designations d ON r.designation_id = d.id
                ${whereClause}
                ORDER BY r.name ASC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            )
            SELECT 
                fr.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', tg.id,
                            'name', tg.name,
                            'description', tg.description
                        )
                    ) FILTER (WHERE tg.id IS NOT NULL),
                    '[]'::json
                ) as tags
            FROM filtered_resources fr
            LEFT JOIN employee_tags rt ON fr.id = rt.employee_id
            LEFT JOIN tags tg ON rt.tag_id = tg.id
            GROUP BY fr.id, fr.epf_no, fr.emp_no, fr.global_employee_id, fr.name, fr.phone_number, 
                     fr.email, fr.designation_id, fr.track_id, fr.tech_stack_id, fr.tier_id,
                     fr.skills, fr.joined_date, fr.date_of_birth, fr.status, fr.notice_period_end_date, 
                     fr.deleted_at, fr.version, fr.created_at, fr.updated_at, fr.created_by, 
                     fr.updated_by, fr.is_account_manager, fr.photo_url, fr.total_allocation, 
                     fr.total_resource_billing, fr.employee_type_id, fr.university_id,
                     fr.last_increment_date, fr.last_promotion_date, fr.internship_completion_target_date,
                     fr.helper_id, fr.helper_is_external, fr.nic_passport, fr.is_external,
                     fr.designation_name, fr.designation_level, fr.total_count
            ORDER BY fr.name ASC
        `;
        params.push(limit, offset);

        const result = await db.query(dataQuery, params);

        // Extract total from first row (or 0 if no results)
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

        // Transform result: resolve config IDs to labels
        // Remove total_count from response, ensure employee_type and tags are included
        const transformedData = result.rows.map(({ total_count, ...row }) => {
            let tagsArray = [];
            try {
                if (row.tags && typeof row.tags === 'string') {
                    tagsArray = JSON.parse(row.tags);
                } else if (Array.isArray(row.tags)) {
                    tagsArray = row.tags;
                }
            } catch (e) {
                log.warn('Failed to parse tags', { error: e.message });
            }

            // Resolve config IDs to labels for API response
            const trackConfig = row.track_id ? getConfigById(TRACKS, row.track_id) : null;
            const tierConfig = row.tier_id ? getConfigById(TIERS, row.tier_id) : null;
            const techStackConfig = row.tech_stack_id ? getConfigById(TECH_STACKS, row.tech_stack_id) : null;

            // Include both IDs and resolved labels for frontend flexibility
            return {
                ...row,
                // Config IDs (for forms/updates)
                track_id: row.track_id,
                tier_id: row.tier_id,
                tech_stack_id: row.tech_stack_id,
                // Resolved labels (for display)
                track: trackConfig?.label || null,
                tier: tierConfig?.label || null,
                tech_stack: techStackConfig?.label || null,
                employee_type: row.employee_type || 'Internal',
                tags: tagsArray.filter(tag => tag && tag.id)
            };
        });

        return success({
            data: transformedData,
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

        // Get resource with tags using raw SQL for better control
        // track_id, tier_id, tech_stack_id are INTEGER IDs - will resolve to labels
        const resourceQuery = `
            SELECT 
                r.*,
                d.name as designation_name,
                d.level as designation_level,
                COALESCE(
                    (
                        SELECT jsonb_agg(jsonb_build_object(
                            'id', tg.id,
                            'name', tg.name,
                            'description', tg.description
                        ))
                        FROM employee_tags rt
                        JOIN tags tg ON rt.tag_id = tg.id
                        WHERE rt.employee_id = r.id
                    ),
                    '[]'::jsonb
                ) as tags
            FROM employees r
            LEFT JOIN designations d ON r.designation_id = d.id
            WHERE r.id = $1 AND r.deleted_at IS NULL
            LIMIT 1
        `;

        const result = await db.query(resourceQuery, [id]);

        if (result.rows.length === 0) {
            return notFound('Resource not found');
        }

        const row = result.rows[0];

        // Parse tags
        let tagsArray = [];
        try {
            if (row.tags && typeof row.tags === 'string') {
                tagsArray = JSON.parse(row.tags);
            } else if (Array.isArray(row.tags)) {
                tagsArray = row.tags;
            }
        } catch (e) {
            log.warn('Failed to parse tags', { error: e.message });
        }

        // Resolve config IDs to labels
        const trackConfig = row.track_id ? getConfigById(TRACKS, row.track_id) : null;
        const tierConfig = row.tier_id ? getConfigById(TIERS, row.tier_id) : null;
        const techStackConfig = row.tech_stack_id ? getConfigById(TECH_STACKS, row.tech_stack_id) : null;

        const resourceData = {
            ...row,
            // Config IDs (for forms/updates)
            track_id: row.track_id,
            tier_id: row.tier_id,
            tech_stack_id: row.tech_stack_id,
            // Resolved labels (for display)
            track: trackConfig?.label || null,
            tier: tierConfig?.label || null,
            tech_stack: techStackConfig?.label || null,
            tags: tagsArray.filter(tag => tag && tag.id)
        };

        return success(resourceData);

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

        log.info('Creating resource', {
            email: validated.email,
            epf_no: validated.epf_no,
            emp_no: validated.emp_no,
            validated_data: validated
        });

        const drizzle = await getDrizzle();

        // Check for duplicate EPF number using Drizzle
        const existingEpfNo = await drizzle
            .select({ id: resources.id })
            .from(resources)
            .where(and(
                eq(resources.epfNo, validated.epf_no),
                isNull(resources.deletedAt)
            ));

        if (existingEpfNo.length > 0) {
            return conflict('A resource with this EPF number already exists');
        }

        // Check for duplicate employee number using Drizzle
        const existingEmpNo = await drizzle
            .select({ id: resources.id })
            .from(resources)
            .where(and(
                eq(resources.empNo, validated.emp_no),
                isNull(resources.deletedAt)
            ));

        if (existingEmpNo.length > 0) {
            return conflict('A resource with this employee number already exists');
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
            userId = 1; // System user ID (INTEGER, not UUID)
        }

        // Use transaction to ensure resource creation, tags, and bench allocation are atomic
        // If any fails, all are rolled back
        const result = await withTransaction(async (tx) => {
            log.info('Inserting resource', {
                epf_no: validated.epf_no,
                emp_no: validated.emp_no,
                name: validated.name,
                track_id: validated.track_id,
                tier_id: validated.tier_id,
                designation_id: validated.designation_id,
                employee_type_id: validated.employee_type_id,
                is_external: validated.is_external
            });

            // Insert resource using Drizzle (use camelCase properties from schema)
            // track_id, tier_id, tech_stack_id are INTEGER IDs mapping to shared configs
            // designation_id, employee_type_id, university_id are INTEGER IDs referencing lookup tables
            const [newResource] = await tx
                .insert(resources)
                .values({
                    epfNo: validated.epf_no,
                    empNo: validated.emp_no,
                    globalEmployeeId: validated.global_employee_id || null,
                    name: validated.name,
                    email: validated.email || null,
                    phoneNumber: validated.phone_number || null,
                    // Config-based INTEGER IDs
                    trackId: validated.track_id,
                    tierId: validated.tier_id,
                    techStackId: validated.tech_stack_id || null,
                    // Lookup table INTEGER IDs
                    designationId: validated.designation_id,
                    employeeTypeId: validated.employee_type_id,
                    universityId: validated.university_id || null,
                    // Dates
                    joinedDate: validated.joined_date || null,
                    dateOfBirth: validated.date_of_birth || null,
                    lastIncrementDate: validated.last_increment_date || null,
                    lastPromotionDate: validated.last_promotion_date || null,
                    internshipCompletionTargetDate: validated.internship_completion_target_date || null,
                    // Personal info
                    nicPassport: validated.nic_passport || null,
                    isExternal: validated.is_external ?? false,
                    // Other fields
                    skills: validated.skills && validated.skills.length > 0 ? validated.skills : null,
                    photoUrl: validated.photo_url || null,
                    status: validated.status || 'Active',
                    totalAllocation: validated.total_allocation || 0,
                    totalResourceBilling: validated.total_resource_billing || 0,
                    helperId: validated.helper_id || null,
                    helperIsExternal: validated.helper_is_external || false,
                    createdBy: userId
                })
                .returning();

            log.info('Resource created in transaction', {
                id: newResource.id,
                epfNo: newResource.epfNo,
                empNo: newResource.empNo
            });

            // Handle tags if provided
            if (validated.tag_ids && Array.isArray(validated.tag_ids) && validated.tag_ids.length > 0) {
                // Validate that all tag IDs exist
                const existingTags = await tx
                    .select({ id: tags.id })
                    .from(tags)
                    .where(inArray(tags.id, validated.tag_ids));

                if (existingTags.length !== validated.tag_ids.length) {
                    throw new Error('One or more tag IDs are invalid');
                }

                // Insert resource tags (employeeTags table)
                const tagInserts = validated.tag_ids.map(tagId => ({
                    employeeId: newResource.id,
                    tagId: tagId,
                    createdBy: userId
                }));

                await tx.insert(employeeTags).values(tagInserts);
                log.info('Resource tags created', { resourceId: newResource.id, tagCount: tagInserts.length });
            }

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
            { epf_no: newResource.epfNo, benchAllocation: benchAllocation?.id }
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

        log.info('Updating resource', {
            id,
            raw_body: body,
            validated: validated,
            employee_type_in_body: body.employee_type,
            employee_type_in_validated: validated.employee_type
        });

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

        // Get user info for updated_by - use null as fallback (updated_by is nullable integer)
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
        // userId remains null if not found - updated_by is a nullable integer column

        // Map API snake_case to Drizzle schema camelCase
        // Note: track_id, tier_id, tech_stack_id are INTEGER IDs mapping to shared configs
        const fieldMapping = {
            employee_id: 'employeeId',
            employee_number: 'employeeNumber',
            phone_number: 'phoneNumber',
            designation_id: 'designationId',
            track_id: 'trackId',
            tier_id: 'tierId',
            tech_stack_id: 'techStackId',
            intern_classification: 'internClassification',
            date_of_joining: 'dateOfJoining',
            date_of_birth: 'dateOfBirth',
            nic_passport: 'nicPassport',
            is_intern: 'isIntern',
            is_external: 'isExternal',
            employee_type: 'employeeType',
            photo_url: 'photoUrl',
            // Direct mappings (same name)
            name: 'name',
            email: 'email',
            address: 'address',
            skills: 'skills',
            status: 'status'
        };

        // Build update object for Drizzle (exclude version and tag_ids from update)
        const { version, tag_ids, ...updateData } = validated;

        // Filter out undefined values and map to camelCase
        const updateValues = {};
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                const drizzleKey = fieldMapping[key] || key;
                updateValues[drizzleKey] = value;
            }
        }

        log.info('Update values prepared', {
            originalKeys: Object.keys(updateData),
            updateKeys: Object.keys(updateValues),
            updateValues: updateValues,
            employee_type_raw: updateData.employee_type,
            employeeType_mapped: updateValues.employeeType,
            has_employee_type: 'employee_type' in updateData,
            employee_type_value: updateData.employee_type,
            employee_type_undefined: updateData.employee_type === undefined
        });

        // Perform update using transaction for atomicity (includes tags update)
        const [updatedResource] = await withTransaction(async (tx) => {
            // Update resource if there are fields to update
            if (Object.keys(updateValues).length > 0) {
                // Add version increment and updated_by
                updateValues.version = sql`${resources.version} + 1`;
                updateValues.updatedAt = new Date();
                updateValues.updatedBy = userId;

                await tx
                    .update(resources)
                    .set(updateValues)
                    .where(and(
                        eq(resources.id, id),
                        isNull(resources.deletedAt)
                    ));
            }

            // Handle tags update if provided
            if (tag_ids !== undefined) {
                // Delete existing tags
                await tx
                    .delete(employeeTags)
                    .where(eq(employeeTags.employeeId, id));

                // Insert new tags if provided
                if (Array.isArray(tag_ids) && tag_ids.length > 0) {
                    // Validate that all tag IDs exist
                    const existingTags = await tx
                        .select({ id: tags.id })
                        .from(tags)
                        .where(inArray(tags.id, tag_ids));

                    if (existingTags.length !== tag_ids.length) {
                        throw new Error('One or more tag IDs are invalid');
                    }

                    // Insert employee tags
                    const tagInserts = tag_ids.map(tagId => ({
                        employeeId: parseInt(id),
                        tagId: tagId,
                        createdBy: userId
                    }));

                    await tx.insert(employeeTags).values(tagInserts);
                    log.info('Employee tags updated', { employeeId: id, tagCount: tagInserts.length });
                } else {
                    log.info('Employee tags cleared', { employeeId: id });
                }
            }

            // Fetch updated resource with tags
            const result = await tx
                .select()
                .from(resources)
                .where(and(
                    eq(resources.id, id),
                    isNull(resources.deletedAt)
                ));

            log.info('Resource updated in DB', {
                resourceId: id,
                employeeType: result[0]?.employeeType,
                employee_type_in_db: result[0]?.employeeType
            });

            return result;
        });

        // Enhancement 3.6: Auto-end all allocations if status changed to Inactive
        let allocationEnded = null;
        if (validated.status === 'Inactive' && existing.status !== 'Inactive') {
            allocationEnded = await autoEndAllocationsOnInactive(id, userId, log);
        }

        // Send audit event for resource update (outside transaction)
        await audit.update(
            event,
            'resource',
            id,
            updatedResource.name,
            existing,
            updatedResource,
            SERVICE_NAME,
            { allocationEnded }
        );

        log.info('Resource updated', { id, allocationEnded });

        // Include allocation ended info in response
        const response = { ...updatedResource };
        if (allocationEnded && allocationEnded.ended > 0) {
            response.allocationEnded = allocationEnded;
        }

        return success(response);

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
    const includeFuture = queryParams.includeFuture !== 'false'; // Include future by default

    try {
        log.info('Getting resource allocations', { id, includeHistory, includeFuture });

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

        // Build where conditions for active allocations
        // Use raw SQL to avoid Drizzle issues with undefined schema fields
        let whereClause = `a.employee_id = $1`;
        if (!includeHistory) {
            whereClause += ` AND a.is_active = true`;
        }

        // Get active/historical allocations with joins using raw SQL
        const activeAllocationsQuery = await db.query(`
            SELECT 
                a.id,
                a.employee_id as resource_id,
                a.project_id,
                a.allocation_percentage,
                a.allocated_date,
                a.deallocated_date,
                a.is_active,
                a.notes,
                a.created_at,
                a.updated_at,
                a.created_by,
                a.billing_percentage,
                p.project_name,
                p.project_code,
                pt.name as project_type,
                c.client_name,
                'active' as allocation_status
            FROM allocations a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN project_types pt ON p.project_type_id = pt.id
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE ${whereClause}
            ORDER BY a.allocated_date DESC
        `, [id]);

        let result = activeAllocationsQuery.rows;

        // Fetch future allocations if requested
        if (includeFuture) {
            const futureAllocations = await db.query(`
                SELECT 
                    fa.id,
                    fa.employee_id,
                    fa.project_id,
                    fa.allocation_percentage,
                    fa.billing_percentage,
                    fa.allocated_date,
                    fa.deallocated_date,
                    fa.effective_date,
                    fa.status as future_status,
                    fa.change_type,
                    fa.notes,
                    fa.created_at,
                    fa.updated_at,
                    fa.created_by,
                    false as is_active,
                    p.project_name,
                    p.project_code,
                    pt.name as project_type,
                    c.client_name,
                    'future' as allocation_status
                FROM future_allocations fa
                LEFT JOIN projects p ON fa.project_id = p.id
                LEFT JOIN project_types pt ON p.project_type_id = pt.id
                LEFT JOIN clients c ON p.client_id = c.id
                WHERE fa.employee_id = $1
                AND fa.status = 'scheduled'
                ORDER BY fa.effective_date ASC
            `, [id]);

            // Combine active and future allocations
            result = [...result, ...futureAllocations.rows];
        }

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
            'SELECT id, name FROM employees WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        const query = `
            SELECT 
                dh.id,
                dh.employee_id,
                dh.previous_designation_id,
                dh.new_designation_id,
                dh.previous_track_id,
                dh.new_track_id,
                dh.change_type,
                dh.change_reason,
                dh.effective_from,
                dh.effective_until,
                dh.changed_at,
                dh.changed_by,
                dh.changed_by_username,
                pd.name as previous_designation_name,
                pd.level as previous_designation_level,
                nd.name as new_designation_name,
                nd.level as new_designation_level
            FROM designation_history dh
            LEFT JOIN designations pd ON dh.previous_designation_id = pd.id
            LEFT JOIN designations nd ON dh.new_designation_id = nd.id
            WHERE dh.employee_id = $1
            ORDER BY dh.effective_from DESC
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
            'SELECT id, name, is_account_manager FROM employees WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resource = resourceCheck.rows[0];
        const newStatus = is_account_manager !== undefined ? is_account_manager : !resource.is_account_manager;

        // Update resource
        const updateQuery = `
            UPDATE employees 
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

        const validTiers = TIERS.map(t => t.label);
        if (!tier || !validTiers.includes(tier)) {
            return validationError(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
        }

        // Convert tier label to ID
        const tierConfig = TIERS.find(t => t.label === tier);
        const tierId = tierConfig?.id;

        log.info('Updating resource tier', { id, tier, tierId });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, tier_id FROM employees WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Update resource
        const updateQuery = `
            UPDATE employees 
            SET tier_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, tier_id
        `;

        const result = await db.query(updateQuery, [tierId, id]);

        log.info('Resource tier updated', { id, tier, tierId });

        return success({
            message: 'Resource tier updated successfully',
            data: {
                ...result.rows[0],
                tier: tier // Include the label for convenience
            }
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

        const validTechStacks = TECH_STACKS.map(t => t.label);
        if (!tech_stack || !validTechStacks.includes(tech_stack)) {
            return validationError(`Invalid tech stack. Must be one of: ${validTechStacks.join(', ')}`);
        }

        // Convert tech_stack label to ID
        const techStackConfig = TECH_STACKS.find(t => t.label === tech_stack);
        const techStackId = techStackConfig?.id;

        log.info('Updating resource tech stack', { id, tech_stack, techStackId });

        // Check if resource exists
        const resourceCheck = await db.query(
            'SELECT id, name, tech_stack_id FROM employees WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return notFound('Resource not found');
        }

        // Update resource
        const updateQuery = `
            UPDATE employees 
            SET tech_stack_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, name, tech_stack_id
        `;

        const result = await db.query(updateQuery, [techStackId, id]);

        log.info('Resource tech stack updated', { id, tech_stack, techStackId });

        return success({
            message: 'Resource tech stack updated successfully',
            data: {
                ...result.rows[0],
                tech_stack: tech_stack // Include the label for convenience
            }
        });

    } catch (err) {
        log.error('Failed to update resource tech stack', { id, error: err.message });
        return error('Failed to update resource tech stack', err);
    }
};

