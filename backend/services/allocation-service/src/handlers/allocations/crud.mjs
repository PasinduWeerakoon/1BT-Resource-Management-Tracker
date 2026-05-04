/**
 * Allocation CRUD Handlers
 * 
 * Handles the core CRUD operations for allocations:
 * - list: List allocations with pagination and filters
 * - getById: Get a single allocation by ID
 * - create: Create a new allocation
 * - update: Update an existing allocation
 * - remove: Delete an allocation
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';
import { validate, allocationSchemas } from '/opt/nodejs/validation/index.js';
import audit from '/opt/nodejs/lib/audit/index.js';
import {
    success,
    error,
    notFound,
    badRequest,
    validationError,
    conflict
} from '/opt/nodejs/utils/response.js';
import * as futureAllocationService from '../../services/futureAllocationService.js';
import {
    getBenchProjectId,
    getBenchAllocation,
    adjustBenchAllocation,
    isShortStayBench,
    cleanupShortStayBench,
    detectAndFillGaps
} from '../../services/benchService.js';
import {
    ALLOCATION_CONFIG,
    validateAllocation,
    validateMinimumAllocation,
    checkProjectCapacity,
    validateAllocationDuration,
    checkOverlappingAllocation,
    checkResourceStatus,
    validateBillingEligibility
} from '../../services/allocationValidationService.js';
import { updateResourceTotals } from '../../services/resourceTotalsService.js';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({ region: process.env.AWS_REGION });

const triggerDashboardRefresh = async (log) => {
    try {
        const stage = process.env.NODE_ENV || 'dev';
        const functionName = `onebt-report-service-${stage}-calculateDailyStats`;
        const command = new InvokeCommand({
            FunctionName: functionName,
            InvocationType: 'Event', // Async execution
            Payload: JSON.stringify({ source: 'allocation-service-trigger' }),
        });
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Lambda invoke timeout')), 2000));
        await Promise.race([lambda.send(command), timeout]);
        log.info('Triggered dashboard stats refresh', { functionName });
    } catch (err) {
        log.error('Failed to trigger dashboard refresh', { error: err.message });
        // Non-blocking error
    }
};

const SERVICE_NAME = 'allocation-service';

/**
 * Get the user ID from Cognito sub (looks up in users table)
 * Returns 1 (system user) if not found
 */
const getUserIdFromCognitoSub = async (event) => {
    const cognitoSub = event?.requestContext?.authorizer?.jwt?.claims?.sub
        || event?.requestContext?.authorizer?.claims?.sub;

    if (!cognitoSub) {
        return 1; // System user ID
    }

    try {
        const result = await db.query(
            'SELECT id FROM users WHERE cognito_user_id = $1',
            [cognitoSub]
        );

        if (result.rows.length > 0) {
            return result.rows[0].id;
        }
    } catch (err) {
        // Log but don't fail - use system user instead
    }

    return 1; // Default to system user
};

/**
 * Log allocation changes to history
 * Gracefully handles missing allocation_change_history table
 */
const logAllocationHistory = async (allocation, changeType, userId) => {
    try {
        const query = `
            INSERT INTO allocation_change_history (
                allocation_id, change_type, changed_by, changed_fields, new_values
            )
            VALUES ($1, $2, $3, $4, $5)
        `;
        await db.query(query, [
            allocation.id,
            changeType,
            userId || 1,
            JSON.stringify(['allocation_percentage', 'allocated_date', 'deallocated_date']),
            JSON.stringify(allocation)
        ]);
    } catch (err) {
        // Log error but don't fail the operation - history logging is non-critical
        console.warn('Failed to log allocation history (table may not exist):', err.message);
    }
};

/**
 * 3-Table Architecture: Determine routing based on effective_date
 * - If effective_date > TODAY: Route to future_allocations table
 * - If effective_date <= TODAY: Route directly to allocations table
 * 
 * @param {string|Date} effectiveDate - The effective/start date of the allocation
 * @returns {Object} { isFuture: boolean, todayStr: string, effectiveDateStr: string }
 */
const determineAllocationRouting = (effectiveDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const effectiveDateObj = effectiveDate instanceof Date
        ? effectiveDate
        : new Date(effectiveDate);
    effectiveDateObj.setHours(0, 0, 0, 0);
    const effectiveDateStr = effectiveDateObj.toISOString().split('T')[0];

    const isFuture = effectiveDateObj > today;

    return {
        isFuture,
        todayStr,
        effectiveDateStr
    };
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
            whereClause += ` AND a.employee_id = $${paramIndex}`;
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

        // Optimized: Combined query using window function for count (single round-trip)
        const dataQuery = `
            SELECT 
                a.*,
                r.name as resource_name,
                r.email as resource_email,
                r.total_allocation,
                r.total_resource_billing,
                p.project_name,
                c.client_name,
                bs.name as billing_status_name,
                COUNT(*) OVER() as total_count
            FROM allocations a
            LEFT JOIN employees r ON a.employee_id = r.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN billing_statuses bs ON a.billing_status_id = bs.id
            ${whereClause}
            ORDER BY a.allocated_date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(parseInt(limit), offset);

        const result = await db.query(dataQuery, params);

        // Extract total from first row (or 0 if no results)
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

        // Remove total_count from each row
        const data = result.rows.map(({ total_count, ...row }) => row);

        return success({
            data,
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
                bs.name as billing_status_name
            FROM allocations a
            LEFT JOIN employees r ON a.employee_id = r.id
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
        const userId = await getUserIdFromCognitoSub(event);
        const benchProjectId = await getBenchProjectId();

        log.info('Creating allocation', { resource_id: validated.resource_id, project_id: validated.project_id });

        // Check if this is a bench allocation
        const isBenchAllocation = validated.project_id === benchProjectId;

        // Enhancement 3.6: Check resource status before creating allocation
        const resourceCheck = await checkResourceStatus(validated.resource_id, isBenchAllocation);
        if (!resourceCheck.allowed) {
            log.warn('Blocked allocation creation - resource status check failed', {
                resourceId: validated.resource_id,
                resourceStatus: resourceCheck.resourceStatus
            });
            return badRequest(resourceCheck.error, {
                resourceStatus: resourceCheck.resourceStatus,
                allowedOperations: resourceCheck.allowedOperations
            });
        }

        // Enhancement 3.5: Check for overlapping date conflicts
        if (!isBenchAllocation) {
            const overlappingAllocation = await checkOverlappingAllocation(
                validated.resource_id,
                validated.project_id,
                validated.start_date,
                validated.end_date
            );

            if (overlappingAllocation) {
                log.warn('Overlapping allocation detected', {
                    resourceId: validated.resource_id,
                    projectId: validated.project_id,
                    existingAllocationId: overlappingAllocation.id
                });
                return conflict('Conflicting allocation exists for this resource and project with overlapping dates', {
                    existingAllocationId: overlappingAllocation.id,
                    existingDateRange: {
                        start: overlappingAllocation.allocated_date,
                        end: overlappingAllocation.deallocated_date
                    },
                    requestedDateRange: {
                        start: validated.start_date,
                        end: validated.end_date
                    }
                });
            }
        }

        // Validate allocation (now returns warning instead of error for >100%)
        const validationResult = await validateAllocation(
            validated.resource_id,
            isBenchAllocation ? 0 : validated.allocation_percentage, // Don't count bench in validation
            null,
            validated.start_date,
            validated.end_date
        );

        // Enhancement 3.2: Block CRITICAL overallocation unless force flag is provided
        if (validationResult.requiresForce && !validated.forceOverallocation) {
            log.warn('CRITICAL overallocation blocked - force flag required', {
                resourceId: validated.resource_id,
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity
            });
            return badRequest('CRITICAL overallocation detected. This allocation would result in ' + validationResult.newTotal + '% total allocation. ' +
                'This requires manager approval. Include "forceOverallocation": true in the request to proceed.', {
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity,
                requiresForce: true
            });
        }

        // Enhancement 3.2: Require notes for HIGH severity
        if (validationResult.requiresNotes && (!validated.notes || validated.notes.trim().length === 0)) {
            log.warn('HIGH overallocation requires notes', {
                resourceId: validated.resource_id,
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity
            });
            return badRequest('HIGH overallocation detected. Notes are required to explain the business reason for ' + validationResult.newTotal + '% allocation.', {
                totalAllocation: validationResult.newTotal,
                severity: validationResult.overallocationSeverity,
                requiresNotes: true
            });
        }

        // Enhancement 3.7: Validate minimum allocation threshold
        if (!isBenchAllocation) {
            const minValidation = await validateMinimumAllocation(validated.allocation_percentage, validated.project_id);
            if (!minValidation.valid) {
                log.warn('Allocation below minimum threshold', {
                    resourceId: validated.resource_id,
                    projectId: validated.project_id,
                    percentage: validated.allocation_percentage,
                    error: minValidation.error
                });
                return badRequest(minValidation.error, {
                    minimumThreshold: ALLOCATION_CONFIG.MINIMUM_ALLOCATION_PERCENTAGE,
                    currentPercentage: validated.allocation_percentage
                });
            }
        }

        // Enhancement 3.8: Check project capacity (warning only)
        let capacityCheck = { capacityWarning: null };

        // Enhancement: Validate billing status and enforce Non-Billing = 0% billing
        if (!isBenchAllocation && validated.billing_status_id) {
            const billingStatusResult = await db.query(
                'SELECT name FROM billing_statuses WHERE id = $1',
                [validated.billing_status_id]
            );
            
            if (billingStatusResult.rows.length > 0) {
                const billingStatusName = billingStatusResult.rows[0].name;
                
                // If billing status is "Non-Billing", force billing percentage to 0
                if (billingStatusName === 'Non-Billing' && validated.billing_percentage > 0) {
                    log.warn('Forcing billing percentage to 0 for Non-Billing status', {
                        resourceId: validated.resource_id,
                        projectId: validated.project_id,
                        originalBillingPercentage: validated.billing_percentage
                    });
                    validated.billing_percentage = 0;
                }
            }
        }

        // Enhancement: Validate billing eligibility for non-client projects
        if (!isBenchAllocation && validated.billing_percentage > 0) {
            const billingValidation = await validateBillingEligibility(validated.project_id, validated.billing_percentage);
            if (!billingValidation.valid) {
                log.warn('Billing eligibility check failed', {
                    resourceId: validated.resource_id,
                    projectId: validated.project_id,
                    billingPercentage: validated.billing_percentage,
                    error: billingValidation.error
                });
                return badRequest(billingValidation.error);
            }
        }

        // Guard: allocation% and billing% cannot both be 0% (defence-in-depth; Joi schema also checks this)
        if (!isBenchAllocation && validated.allocation_percentage === 0 && validated.billing_percentage === 0) {
            log.warn('Rejected create - both allocation and billing are 0%', {
                resourceId: validated.resource_id,
                projectId: validated.project_id
            });
            return badRequest(
                'Allocation percentage and Billing percentage cannot both be 0%. At least one must be greater than 0%.',
                { allocationPercentage: 0, billingPercentage: 0 }
            );
        }

        if (!isBenchAllocation) {
            capacityCheck = await checkProjectCapacity(validated.project_id);
        }

        // Enhancement 3.9: Validate duration (warnings only)
        const projectResult = await db.query(`
            SELECT bs.name as billing_status 
            FROM projects p
            LEFT JOIN billing_statuses bs ON p.billing_status_id = bs.id
            WHERE p.id = $1
        `, [validated.project_id]);
        const projectBillingStatus = projectResult.rows.length > 0 ? projectResult.rows[0].billing_status : null;
        const durationValidation = validateAllocationDuration(validated.start_date, validated.end_date, projectBillingStatus);

        // =================================================================
        // 3-TABLE TEMPORAL ARCHITECTURE: Route based on effective_date
        // =================================================================
        // Use effective_date if provided, otherwise fall back to start_date
        const effectiveDate = validated.effective_date || validated.start_date;
        const { isFuture, todayStr, effectiveDateStr } = determineAllocationRouting(effectiveDate);

        // If effective_date is in the FUTURE, route to future_allocations table
        if (isFuture && !isBenchAllocation) {
            log.info('Routing to future_allocations table (effective_date > today)', {
                resource_id: validated.resource_id,
                project_id: validated.project_id,
                effective_date: effectiveDateStr,
                today: todayStr
            });

            try {
                // Check for conflicting future allocations for same resource+project
                const existingFuture = await futureAllocationService.checkConflictingFuture(
                    validated.resource_id,
                    validated.project_id,
                    effectiveDateStr
                );

                if (existingFuture) {
                    return conflict('A scheduled allocation already exists for this resource and project on the same effective date', {
                        existingFutureAllocationId: existingFuture.id,
                        existingEffectiveDate: existingFuture.effective_date,
                        existingChangeType: existingFuture.change_type
                    });
                }

                // Create future allocation record (billing_status_id required for non-bench)
                const futureAllocation = await futureAllocationService.createFutureAllocation({
                    resourceId: validated.resource_id,
                    projectId: validated.project_id,
                    effectiveDate: effectiveDateStr,
                    changeType: 'NEW_ALLOCATION',
                    newAllocationPercentage: validated.allocation_percentage,
                    newBillingPercentage: validated.billing_percentage ?? 100,
                    billingStatusId: validated.billing_status_id,
                    notes: validated.notes,
                    createdBy: userId
                });

                // Send audit event for future allocation creation
                await audit.create(
                    event,
                    'future_allocation',
                    futureAllocation.id,
                    `Scheduled: ${validated.resource_id} -> ${validated.project_id} on ${effectiveDateStr}`,
                    futureAllocation,
                    SERVICE_NAME,
                    {
                        resource_id: validated.resource_id,
                        project_id: validated.project_id,
                        effective_date: effectiveDateStr,
                        change_type: 'NEW_ALLOCATION',
                        billing_status_id: validated.billing_status_id
                    }
                );

                log.info('Future allocation created', { id: futureAllocation.id, effective_date: effectiveDateStr });

                return success({
                    ...futureAllocation,
                    isFutureAllocation: true,
                    message: `Allocation scheduled for ${effectiveDateStr}. It will be activated automatically on that date.`,
                    activationInfo: {
                        scheduledDate: effectiveDateStr,
                        currentDate: todayStr,
                        daysUntilActivation: Math.ceil((new Date(effectiveDateStr) - new Date(todayStr)) / (1000 * 60 * 60 * 24))
                    },
                    // Include validation warnings if any
                    warning: validationResult.warning,
                    capacityWarning: capacityCheck.capacityWarning,
                    durationWarnings: durationValidation.durationWarnings
                }, 201);

            } catch (futureErr) {
                log.error('Failed to create future allocation', { error: futureErr.message });
                return error('Failed to schedule future allocation: ' + futureErr.message, 500, 'FUTURE_ALLOCATION_ERROR');
            }
        }
        // =================================================================
        // END 3-TABLE ROUTING - Continue with immediate allocation below
        // =================================================================

        const query = `
            INSERT INTO allocations (
                employee_id, project_id, allocation_percentage, billing_percentage, billing_status_id,
                allocated_date, deallocated_date, is_active, notes, created_by, change_type
            )
            VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, $10, $11)
            RETURNING *, 
                (SELECT name FROM billing_statuses WHERE id = billing_status_id) as billing_status_name
        `;

        // Convert dates to ISO strings (using effective_date for allocated_date)
        const allocatedDateStr = effectiveDateStr;
        const deallocatedDateStr = validated.end_date
            ? (validated.end_date instanceof Date
                ? validated.end_date.toISOString().split('T')[0]
                : validated.end_date)
            : null;

        // Bench allocations have 0% billing and no billing status, default 100% for project allocations
        const billingPercentage = isBenchAllocation ? 0 : (validated.billing_percentage ?? 100);
        // Bench allocations don't require billing_status_id
        const billingStatusId = isBenchAllocation ? null : validated.billing_status_id;

        // Determine change_type: LEGACY for backdated, NEW_ALLOCATION for same-day
        const changeType = effectiveDateStr < todayStr ? 'LEGACY' : 'NEW_ALLOCATION';

        const params = [
            validated.resource_id,
            validated.project_id,
            validated.allocation_percentage,
            billingPercentage,
            billingStatusId,
            allocatedDateStr,
            deallocatedDateStr,
            true, // is_active
            validated.notes || null,
            userId,
            changeType
        ];

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'CREATED', userId);

        // Auto-adjust bench allocation if this is not a bench allocation
        let benchAdjustment = null;
        let shortStayCleanup = null;
        if (!isBenchAllocation) {
            // Enhancement 3.1: Check if bench is a short-stay that can be cleaned up
            const { isShortStay, benchAllocationId } = await isShortStayBench(
                validated.resource_id,
                ALLOCATION_CONFIG.BENCH_CLEANUP_THRESHOLD_HOURS,
                log
            );

            if (isShortStay && benchAllocationId) {
                // Hard delete the short-stay bench allocation (don't log to history)
                await cleanupShortStayBench(benchAllocationId, log);
                shortStayCleanup = {
                    cleaned: true,
                    message: 'Short-stay bench allocation removed (< 24 hours)'
                };
                // Re-adjust bench (will create new one or leave as is based on total allocation)
            }

            const newBenchPercentage = await adjustBenchAllocation(validated.resource_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`,
                shortStayCleanup
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

        // Update resource total_allocation and total_billing
        await updateResourceTotals(validated.resource_id, log);

        // Build response with optional warning and severity information
        const response = {
            ...allocation,
            benchAdjustment
        };

        // Enhancement 3.2: Include severity information in response
        if (validationResult.warning) {
            response.warning = validationResult.warning;
            response.totalAllocation = validationResult.newTotal;
            response.overAllocated = validationResult.overAllocated;
            response.overallocationSeverity = validationResult.overallocationSeverity;
            response.requiresReview = validationResult.requiresReview;
        }

        // Enhancement 3.8: Include capacity warning
        if (capacityCheck.capacityWarning) {
            response.capacityWarning = capacityCheck.capacityWarning;
            response.currentTeamSize = capacityCheck.currentTeamSize;
            response.maxTeamSize = capacityCheck.maxTeamSize;
            response.overCapacity = capacityCheck.overCapacity;
        }

        // Enhancement 3.9: Include duration warnings
        if (durationValidation.durationWarnings) {
            response.durationWarnings = durationValidation.durationWarnings;
        }



        // Enhancement: Trigger dashboard stats refresh
        await triggerDashboardRefresh(log);

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
        const userId = await getUserIdFromCognitoSub(event);
        const benchProjectId = await getBenchProjectId();

        log.info('Updating allocation', { id, userId });

        // Get existing allocation
        const existingResult = await db.query('SELECT * FROM allocations WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return notFound('Allocation not found');
        }
        const existing = existingResult.rows[0];
        const isBenchAllocation = existing.project_id === benchProjectId;

        // Enhancement 3.6: Check resource status before updating allocation
        const resourceResult = await db.query('SELECT status FROM employees WHERE id = $1', [existing.employee_id]);
        if (resourceResult.rows.length === 0) {
            return notFound('Resource not found');
        }

        const resourceStatus = resourceResult.rows[0].status;

        // During notice period, only allow reductions in allocation percentage
        if (resourceStatus === 'Serving Notice Period' && !isBenchAllocation && validated.allocation_percentage !== undefined) {
            if (validated.allocation_percentage > existing.allocation_percentage) {
                log.warn('Blocked allocation increase - resource is serving notice period', {
                    allocationId: id,
                    resourceId: existing.employee_id,
                    resourceStatus,
                    currentPercentage: existing.allocation_percentage,
                    requestedPercentage: validated.allocation_percentage
                });
                return badRequest('Cannot increase allocations for resources serving notice period. Only reductions or deletions are allowed.', {
                    resourceStatus,
                    currentAllocation: existing.allocation_percentage,
                    allowedOperations: ['reduce', 'delete']
                });
            }
        }

        // Block updates for inactive resources
        if (resourceStatus === 'Inactive') {
            log.warn('Blocked allocation update - resource is inactive', {
                allocationId: id,
                resourceId: existing.employee_id,
                resourceStatus
            });
            return badRequest('Cannot update allocations for inactive resources.', {
                resourceStatus
            });
        }

        // Optimistic locking check
        if (validated.version !== undefined && existing.version !== validated.version) {
            return conflict('Allocation has been modified by another user. Please refresh and try again.');
        }

        // Enhancement 3.5: Check for overlapping date conflicts when dates are being changed
        if (!isBenchAllocation && (validated.start_date || validated.end_date)) {
            const overlappingAllocation = await checkOverlappingAllocation(
                existing.employee_id,
                existing.project_id,
                validated.start_date || existing.allocated_date,
                validated.end_date !== undefined ? validated.end_date : existing.deallocated_date,
                id // Exclude current allocation from check
            );

            if (overlappingAllocation) {
                log.warn('Overlapping allocation detected on update', {
                    allocationId: id,
                    resourceId: existing.employee_id,
                    projectId: existing.project_id,
                    existingAllocationId: overlappingAllocation.id
                });
                return conflict('Conflicting allocation exists for this resource and project with overlapping dates', {
                    existingAllocationId: overlappingAllocation.id,
                    existingDateRange: {
                        start: overlappingAllocation.allocated_date,
                        end: overlappingAllocation.deallocated_date
                    },
                    requestedDateRange: {
                        start: validated.start_date || existing.allocated_date,
                        end: validated.end_date !== undefined ? validated.end_date : existing.deallocated_date
                    }
                });
            }
        }

        // If updating percentage, validate (warnings instead of errors for >100%)
        let validationResult = null;
        if (validated.allocation_percentage !== undefined && !isBenchAllocation) {
            validationResult = await validateAllocation(
                existing.employee_id,
                validated.allocation_percentage,
                id,
                validated.start_date || existing.allocated_date,
                validated.end_date || existing.deallocated_date
            );

            // Enhancement 3.2: Block CRITICAL overallocation unless force flag is provided
            if (validationResult.requiresForce && !validated.forceOverallocation) {
                log.warn('CRITICAL overallocation blocked on update - force flag required', {
                    allocationId: id,
                    resourceId: existing.employee_id,
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity
                });
                return badRequest('CRITICAL overallocation detected. This update would result in ' + validationResult.newTotal + '% total allocation. ' +
                    'This requires manager approval. Include "forceOverallocation": true in the request to proceed.', {
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity,
                    requiresForce: true
                });
            }

            // Enhancement 3.2: Require notes for HIGH severity
            if (validationResult.requiresNotes && (!validated.notes || validated.notes.trim().length === 0) && (!existing.notes || existing.notes.trim().length === 0)) {
                log.warn('HIGH overallocation requires notes on update', {
                    allocationId: id,
                    resourceId: existing.employee_id,
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity
                });
                return badRequest('HIGH overallocation detected. Notes are required to explain the business reason for ' + validationResult.newTotal + '% allocation.', {
                    totalAllocation: validationResult.newTotal,
                    severity: validationResult.overallocationSeverity,
                    requiresNotes: true
                });
            }

            // Enhancement 3.7: Validate minimum allocation threshold
            const minValidation = await validateMinimumAllocation(validated.allocation_percentage, existing.project_id);
            if (!minValidation.valid) {
                log.warn('Allocation update below minimum threshold', {
                    allocationId: id,
                    resourceId: existing.employee_id,
                    projectId: existing.project_id,
                    percentage: validated.allocation_percentage,
                    error: minValidation.error
                });
                return badRequest(minValidation.error, {
                    minimumThreshold: ALLOCATION_CONFIG.MINIMUM_ALLOCATION_PERCENTAGE,
                    currentPercentage: validated.allocation_percentage
                });
            }
        }

        // Enhancement: Validate billing status and enforce Non-Billing = 0% billing on update
        if (!isBenchAllocation && validated.billing_status_id) {
            const billingStatusResult = await db.query(
                'SELECT name FROM billing_statuses WHERE id = $1',
                [validated.billing_status_id]
            );
            
            if (billingStatusResult.rows.length > 0) {
                const billingStatusName = billingStatusResult.rows[0].name;
                
                // If billing status is "Non-Billing", force billing percentage to 0
                if (billingStatusName === 'Non-Billing') {
                    if (validated.billing_percentage === undefined || validated.billing_percentage > 0) {
                        log.warn('Forcing billing percentage to 0 for Non-Billing status on update', {
                            allocationId: id,
                            projectId: existing.project_id,
                            originalBillingPercentage: validated.billing_percentage
                        });
                        validated.billing_percentage = 0;
                    }
                }
            }
        }

        // Enhancement: Validate billing eligibility on update if billing_percentage is provided
        if (!isBenchAllocation && validated.billing_percentage !== undefined && validated.billing_percentage > 0) {
            const billingValidation = await validateBillingEligibility(existing.project_id, validated.billing_percentage);
            if (!billingValidation.valid) {
                log.warn('Billing eligibility check failed on update', {
                    allocationId: id,
                    projectId: existing.project_id,
                    billingPercentage: validated.billing_percentage,
                    error: billingValidation.error
                });
                return badRequest(billingValidation.error);
            }
        }


        // Guard: allocation% and billing% cannot both be 0% (checked against effective values,
        // i.e. the combination of the incoming update and the existing stored values)
        if (!isBenchAllocation) {
            const effectiveAllocation = validated.allocation_percentage !== undefined
                ? validated.allocation_percentage
                : Number(existing.allocation_percentage);

            // billing_percentage may have been forced to 0 above by the Non-Billing status check
            const effectiveBilling = validated.billing_percentage !== undefined
                ? validated.billing_percentage
                : Number(existing.billing_percentage);

            if (effectiveAllocation === 0 && effectiveBilling === 0) {
                log.warn('Rejected update - both allocation and billing cannot be 0%', {
                    id,
                    effectiveAllocation,
                    effectiveBilling
                });
                return badRequest(
                    'Allocation percentage and Billing percentage cannot both be 0%. At least one must be greater than 0%.',
                    { allocationPercentage: effectiveAllocation, billingPercentage: effectiveBilling }
                );
            }

            // allocation=0 with billing>0 is a valid billing-only record — keep is_active=true
            // (no forced deactivation, no forced billing=0, no end_date requirement)
            if (effectiveAllocation === 0 && effectiveBilling > 0) {
                log.info('Allocation set to 0% with active billing (billing-only record)', {
                    id,
                    billingPercentage: effectiveBilling
                });
            }
        }

        // Enhancement 3.8: Check project capacity (warning only, if project changed or for info)
        let capacityCheck = { capacityWarning: null };
        if (!isBenchAllocation && (validated.project_id || validated.allocation_percentage !== undefined)) {
            const projectId = validated.project_id || existing.project_id;
            capacityCheck = await checkProjectCapacity(projectId, existing.employee_id);
        }

        // Enhancement 3.9: Validate duration (warnings only, if dates changed)
        let durationValidation = { durationWarnings: null };
        if (validated.start_date || validated.end_date !== undefined) {
            const projectResult = await db.query(`
                SELECT bs.name as billing_status 
                FROM projects p
                LEFT JOIN billing_statuses bs ON p.billing_status_id = bs.id
                WHERE p.id = $1
            `, [existing.project_id]);
            const projectBillingStatus = projectResult.rows.length > 0 ? projectResult.rows[0].billing_status : null;
            durationValidation = validateAllocationDuration(
                validated.start_date || existing.allocated_date,
                validated.end_date !== undefined ? validated.end_date : existing.deallocated_date,
                projectBillingStatus
            );
        }

        // Build dynamic update query - map start_date/end_date to allocated_date/deallocated_date
        const { version, ...updateData } = validated;
        const updates = [];
        const params = [id];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
                // Map frontend field names to database column names
                let dbColumn = key;
                if (key === 'start_date') dbColumn = 'allocated_date';
                if (key === 'end_date') dbColumn = 'deallocated_date';

                updates.push(`${dbColumn} = $${paramIndex}`);
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
            RETURNING *, 
                (SELECT name FROM billing_statuses WHERE id = billing_status_id) as billing_status_name
        `;

        const result = await db.query(query, params);
        const allocation = result.rows[0];

        // Log to history
        await logAllocationHistory(allocation, 'UPDATED', userId);

        // Auto-adjust bench allocation if this is not a bench allocation
        let benchAdjustment = null;
        if (!isBenchAllocation && validated.allocation_percentage !== undefined) {
            const newBenchPercentage = await adjustBenchAllocation(existing.employee_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`
            };

            // Enhancement 3.4: After update, check for gaps and fill with bench
            try {
                await detectAndFillGaps(existing.employee_id, userId, log);
            } catch (gapErr) {
                log.warn('Failed to detect/fill gaps after update', {
                    resourceId: existing.employee_id,
                    error: gapErr.message
                });
            }
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

        // Update resource total_allocation and total_billing
        await updateResourceTotals(existing.employee_id, log);

        // Build response with optional warning and severity information
        const response = {
            ...allocation,
            benchAdjustment
        };

        // Enhancement 3.2: Include severity information in response
        if (validationResult?.warning) {
            response.warning = validationResult.warning;
            response.totalAllocation = validationResult.newTotal;
            response.overAllocated = validationResult.overAllocated;
            response.overallocationSeverity = validationResult.overallocationSeverity;
            response.requiresReview = validationResult.requiresReview;
        }

        // Enhancement 3.8: Include capacity warning
        if (capacityCheck.capacityWarning) {
            response.capacityWarning = capacityCheck.capacityWarning;
            response.currentTeamSize = capacityCheck.currentTeamSize;
            response.maxTeamSize = capacityCheck.maxTeamSize;
            response.overCapacity = capacityCheck.overCapacity;
        }

        // Enhancement 3.9: Include duration warnings
        if (durationValidation.durationWarnings) {
            response.durationWarnings = durationValidation.durationWarnings;
        }



        // Enhancement: Trigger dashboard stats refresh
        await triggerDashboardRefresh(log);

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
    const userId = await getUserIdFromCognitoSub(event);

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
            const newBenchPercentage = await adjustBenchAllocation(existing.employee_id, userId, log);
            benchAdjustment = {
                benchPercentage: newBenchPercentage,
                message: `Bench allocation adjusted to ${newBenchPercentage}%`
            };

            // Enhancement 3.4: After deletion, check for gaps and fill with bench
            try {
                await detectAndFillGaps(existing.employee_id, userId, log);
            } catch (gapErr) {
                log.warn('Failed to detect/fill gaps after deletion', {
                    resourceId: existing.employee_id,
                    error: gapErr.message
                });
            }
        }

        // Send audit event for allocation deletion
        await audit.delete(
            event,
            'allocation',
            id,
            `${existing.employee_id} -> ${existing.project_id}`,
            existing,
            SERVICE_NAME,
            { benchAdjustment }
        );

        log.info('Allocation deleted', { id, benchAdjustment });

        // Update resource total_allocation and total_billing
        await updateResourceTotals(existing.employee_id, log);

        // Enhancement: Trigger dashboard stats refresh
        await triggerDashboardRefresh(log);

        return success({
            message: 'Allocation deleted successfully',
            benchAdjustment
        });

    } catch (err) {
        log.error('Failed to delete allocation', { id, error: err.message });
        return error('Failed to delete allocation', err);
    }
};

