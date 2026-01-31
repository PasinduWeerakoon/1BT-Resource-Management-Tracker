/**
 * Allocation History Archive Service
 * 
 * Manages archived/historical allocations.
 * Part of the 3-Table Temporal Architecture:
 * - future_allocations → allocations → allocation_history_archive (this service)
 * 
 * Records are moved here when allocations end (deallocated_date < today).
 * A scheduler job (3:00 AM UTC) moves ended allocations to this archive.
 */

import * as db from '/opt/nodejs/database/index.js';
import logger from '/opt/nodejs/logger/index.js';

const SERVICE_NAME = 'allocation-history-archive-service';

/**
 * Archive an allocation (move from allocations to history)
 * @param {Object} allocation - The allocation to archive
 * @param {string} archiveReason - Reason for archiving
 * @param {string} [archivedBy] - User UUID who triggered the archive (null for scheduler)
 * @returns {Promise<Object>} Archived allocation record
 */
export const archiveAllocation = async (allocation, archiveReason, archivedBy = null) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'archiveAllocation' });

    log.info('Archiving allocation', {
        allocationId: allocation.id,
        reason: archiveReason
    });

    const insertQuery = `
        INSERT INTO allocation_history_archive (
            original_allocation_id, resource_id, project_id,
            allocation_percentage, billing_percentage,
            effective_date, allocated_date, deallocated_date, original_allocated_date,
            change_type, notes, is_active,
            original_created_by, original_created_at, original_updated_at,
            archive_reason, archived_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
    `;

    const params = [
        allocation.id,
        allocation.resource_id,
        allocation.project_id,
        allocation.allocation_percentage,
        allocation.billing_percentage,
        allocation.effective_date,
        allocation.allocated_date,
        allocation.deallocated_date,
        allocation.original_allocated_date,
        allocation.change_type,
        allocation.notes,
        allocation.is_active,
        allocation.created_by,
        allocation.created_at,
        allocation.updated_at,
        archiveReason,
        archivedBy
    ];

    const result = await db.query(insertQuery, params);
    const archived = result.rows[0];

    // Mark original allocation as inactive (or delete if preferred)
    await db.query(`
        UPDATE allocations 
        SET is_active = false, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `, [allocation.id]);

    log.info('Allocation archived', {
        archiveId: archived.id,
        originalId: allocation.id
    });

    return archived;
};

/**
 * Archive all allocations that have ended (deallocated_date < today)
 * @returns {Promise<Object>} Summary of archived allocations
 */
export const archiveEndedAllocations = async () => {
    const log = logger.child({ service: SERVICE_NAME, method: 'archiveEndedAllocations' });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    log.info('Archiving ended allocations', { asOfDate: yesterdayStr });

    // Find allocations that ended yesterday or before
    const endedQuery = `
        SELECT * FROM allocations 
        WHERE deallocated_date IS NOT NULL 
        AND deallocated_date <= $1::date
        AND is_active = true
    `;

    const endedResult = await db.query(endedQuery, [yesterdayStr]);
    const allocationsToArchive = endedResult.rows;

    log.info('Found allocations to archive', { count: allocationsToArchive.length });

    const archived = [];
    const errors = [];

    for (const allocation of allocationsToArchive) {
        try {
            const archivedRecord = await archiveAllocation(allocation, 'ALLOCATION_ENDED', null);
            archived.push({
                id: archivedRecord.id,
                originalId: allocation.id,
                resourceId: allocation.resource_id
            });
        } catch (err) {
            log.error('Failed to archive allocation', {
                allocationId: allocation.id,
                error: err.message
            });
            errors.push({
                allocationId: allocation.id,
                error: err.message
            });
        }
    }

    const summary = {
        totalFound: allocationsToArchive.length,
        archived: archived.length,
        failed: errors.length,
        archivedIds: archived,
        errors
    };

    log.info('Archive ended allocations complete', summary);
    return summary;
};

/**
 * Get allocation history for a resource
 * @param {string} resourceId - Resource UUID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Limit results
 * @param {number} [options.offset] - Offset for pagination
 * @param {string} [options.startDate] - Filter by allocated_date >= startDate
 * @param {string} [options.endDate] - Filter by deallocated_date <= endDate
 * @returns {Promise<Object>} { history: Array, total: number }
 */
export const getHistoryByResource = async (resourceId, options = {}) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'getHistoryByResource' });

    let whereClause = 'WHERE aha.resource_id = $1';
    const params = [resourceId];
    let paramIndex = 2;

    if (options.startDate) {
        whereClause += ` AND aha.allocated_date >= $${paramIndex}::date`;
        params.push(options.startDate);
        paramIndex++;
    }

    if (options.endDate) {
        whereClause += ` AND (aha.deallocated_date IS NULL OR aha.deallocated_date <= $${paramIndex}::date)`;
        params.push(options.endDate);
        paramIndex++;
    }

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM allocation_history_archive aha
        ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get history records
    let query = `
        SELECT aha.*, 
               r.name as resource_name,
               p.name as project_name,
               p.project_code
        FROM allocation_history_archive aha
        JOIN resources r ON aha.resource_id = r.id
        JOIN projects p ON aha.project_id = p.id
        ${whereClause}
        ORDER BY aha.archived_at DESC, aha.deallocated_date DESC
    `;

    if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.limit);
        paramIndex++;
    }

    if (options.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(options.offset);
    }

    const result = await db.query(query, params);

    log.info('Retrieved allocation history', {
        resourceId,
        count: result.rows.length,
        total
    });

    return {
        history: result.rows,
        total
    };
};

/**
 * Get allocation history for a project
 * @param {string} projectId - Project UUID
 * @param {Object} [options] - Query options
 * @returns {Promise<Object>} { history: Array, total: number }
 */
export const getHistoryByProject = async (projectId, options = {}) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'getHistoryByProject' });

    let whereClause = 'WHERE aha.project_id = $1';
    const params = [projectId];
    let paramIndex = 2;

    if (options.startDate) {
        whereClause += ` AND aha.allocated_date >= $${paramIndex}::date`;
        params.push(options.startDate);
        paramIndex++;
    }

    if (options.endDate) {
        whereClause += ` AND (aha.deallocated_date IS NULL OR aha.deallocated_date <= $${paramIndex}::date)`;
        params.push(options.endDate);
        paramIndex++;
    }

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM allocation_history_archive aha
        ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get history records
    let query = `
        SELECT aha.*, 
               r.name as resource_name,
               r.employee_id,
               p.name as project_name,
               p.project_code
        FROM allocation_history_archive aha
        JOIN resources r ON aha.resource_id = r.id
        JOIN projects p ON aha.project_id = p.id
        ${whereClause}
        ORDER BY aha.archived_at DESC
    `;

    if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.limit);
        paramIndex++;
    }

    if (options.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(options.offset);
    }

    const result = await db.query(query, params);

    log.info('Retrieved project allocation history', {
        projectId,
        count: result.rows.length,
        total
    });

    return {
        history: result.rows,
        total
    };
};

/**
 * Search allocation history
 * @param {Object} filters - Search filters
 * @param {string} [filters.resourceId] - Filter by resource
 * @param {string} [filters.projectId] - Filter by project
 * @param {string} [filters.archiveReason] - Filter by archive reason
 * @param {string} [filters.startDate] - Filter by date range
 * @param {string} [filters.endDate] - Filter by date range
 * @param {number} [filters.limit] - Limit results
 * @param {number} [filters.offset] - Offset for pagination
 * @returns {Promise<Object>} { history: Array, total: number }
 */
export const searchHistory = async (filters = {}) => {
    const log = logger.child({ service: SERVICE_NAME, method: 'searchHistory' });

    let whereConditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.resourceId) {
        whereConditions.push(`aha.resource_id = $${paramIndex}`);
        params.push(filters.resourceId);
        paramIndex++;
    }

    if (filters.projectId) {
        whereConditions.push(`aha.project_id = $${paramIndex}`);
        params.push(filters.projectId);
        paramIndex++;
    }

    if (filters.archiveReason) {
        whereConditions.push(`aha.archive_reason = $${paramIndex}`);
        params.push(filters.archiveReason);
        paramIndex++;
    }

    if (filters.startDate) {
        whereConditions.push(`aha.archived_at >= $${paramIndex}::timestamptz`);
        params.push(filters.startDate);
        paramIndex++;
    }

    if (filters.endDate) {
        whereConditions.push(`aha.archived_at <= $${paramIndex}::timestamptz`);
        params.push(filters.endDate);
        paramIndex++;
    }

    const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM allocation_history_archive aha
        ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get history records
    let query = `
        SELECT aha.*, 
               r.name as resource_name,
               r.employee_id,
               p.name as project_name,
               p.project_code
        FROM allocation_history_archive aha
        JOIN resources r ON aha.resource_id = r.id
        JOIN projects p ON aha.project_id = p.id
        ${whereClause}
        ORDER BY aha.archived_at DESC
    `;

    if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
    }

    if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
    }

    const result = await db.query(query, params);

    log.info('Search allocation history', {
        filters,
        count: result.rows.length,
        total
    });

    return {
        history: result.rows,
        total
    };
};

/**
 * Get archive statistics
 * @returns {Promise<Object>} Archive statistics
 */
export const getArchiveStats = async () => {
    const log = logger.child({ service: SERVICE_NAME, method: 'getArchiveStats' });

    const query = `
        SELECT 
            COUNT(*) as total_archived,
            COUNT(DISTINCT resource_id) as unique_resources,
            COUNT(DISTINCT project_id) as unique_projects,
            MIN(archived_at) as earliest_archive,
            MAX(archived_at) as latest_archive,
            archive_reason,
            COUNT(*) as count_by_reason
        FROM allocation_history_archive
        GROUP BY archive_reason
    `;

    const result = await db.query(query);

    const stats = {
        totalArchived: 0,
        uniqueResources: 0,
        uniqueProjects: 0,
        earliestArchive: null,
        latestArchive: null,
        byReason: {}
    };

    for (const row of result.rows) {
        stats.totalArchived = parseInt(row.total_archived, 10);
        stats.uniqueResources = parseInt(row.unique_resources, 10);
        stats.uniqueProjects = parseInt(row.unique_projects, 10);
        stats.earliestArchive = stats.earliestArchive || row.earliest_archive;
        stats.latestArchive = row.latest_archive;
        stats.byReason[row.archive_reason] = parseInt(row.count_by_reason, 10);
    }

    log.info('Retrieved archive stats', stats);
    return stats;
};

export default {
    archiveAllocation,
    archiveEndedAllocations,
    getHistoryByResource,
    getHistoryByProject,
    searchHistory,
    getArchiveStats
};
