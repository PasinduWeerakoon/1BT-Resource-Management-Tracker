/**
 * Resource Service
 * Business logic for Resource (Employee) management
 * Aligned with migration handler schema
 */

import * as db from '../lib/database/index.js';
import logger from '../lib/logger/index.js';

/**
 * List resources with pagination and filtering
 */
const list = async ({ page = 1, limit = 20, search, track_id, designation_id, status, is_intern }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let paramIndex = 1;

  let whereClause = 'WHERE r.deleted_at IS NULL';

  if (search) {
    whereClause += ` AND (r.name ILIKE $${paramIndex} OR r.email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
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

  if (is_intern !== undefined) {
    whereClause += ` AND r.is_intern = $${paramIndex}`;
    params.push(is_intern);
    paramIndex++;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM resources r
    LEFT JOIN designations d ON r.designation_id = d.id
    ${whereClause}
  `;

  // Data query
  const dataQuery = `
    SELECT 
      r.id,
      r.name,
      r.email,
      r.mobile,
      r.nic,
      r.designation_id,
      d.name as designation_name,
      d.is_intern_role,
      r.track_id,
      t.name as track_name,
      r.join_date,
      r.status,
      r.is_intern,
      r.version,
      r.created_at,
      r.updated_at
    FROM resources r
    LEFT JOIN designations d ON r.designation_id = d.id
    LEFT JOIN tracks t ON r.track_id = t.id
    ${whereClause}
    ORDER BY r.name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const [countResult, dataResult] = await Promise.all([
    db.query(countQuery, params.slice(0, -2)),
    db.query(dataQuery, params),
  ]);

  return {
    items: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
};

/**
 * Get a single resource by ID
 */
const getById = async (id) => {
  const query = `
    SELECT 
      r.*,
      d.name as designation_name,
      d.is_intern_role,
      d.level as designation_level,
      t.name as track_name,
      t.description as track_description
    FROM resources r
    LEFT JOIN designations d ON r.designation_id = d.id
    LEFT JOIN tracks t ON r.track_id = t.id
    WHERE r.id = $1 AND r.deleted_at IS NULL
  `;

  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Create a new resource
 */
const create = async (data, userId) => {
  const query = `
    INSERT INTO resources (
      name,
      email,
      mobile,
      nic,
      designation_id,
      track_id,
      join_date,
      status,
      is_intern,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const params = [
    data.name,
    data.email,
    data.mobile || null,
    data.nic || null,
    data.designation_id,
    data.track_id,
    data.join_date || new Date().toISOString().split('T')[0],
    data.status || 'ACTIVE',
    data.is_intern || false,
    userId,
  ];

  const result = await db.query(query, params);
  logger.info('Resource created', { resourceId: result.rows[0].id, createdBy: userId });

  return getById(result.rows[0].id);
};

/**
 * Update a resource with optimistic locking
 */
const update = async (id, data, userId) => {
  const { version, ...updateData } = data;

  // Build dynamic update query
  const setClauses = [];
  const params = [id, version, userId];
  let paramIndex = 4;

  const fieldMappings = {
    name: 'name',
    email: 'email',
    mobile: 'mobile',
    nic: 'nic',
    designation_id: 'designation_id',
    track_id: 'track_id',
    join_date: 'join_date',
    status: 'status',
    is_intern: 'is_intern',
  };

  for (const [key, column] of Object.entries(fieldMappings)) {
    if (updateData[key] !== undefined) {
      setClauses.push(`${column} = $${paramIndex}`);
      params.push(updateData[key]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    // No fields to update, just return current
    return getById(id);
  }

  setClauses.push('updated_by = $3');
  setClauses.push('version = version + 1');

  const query = `
    UPDATE resources
    SET ${setClauses.join(', ')}
    WHERE id = $1 AND version = $2 AND deleted_at IS NULL
    RETURNING *
  `;

  const result = await db.query(query, params);

  if (result.rowCount === 0) {
    // Check if resource exists
    const existing = await getById(id);
    if (!existing) {
      return null;
    }
    // Version mismatch
    const error = new Error('VERSION_CONFLICT');
    throw error;
  }

  logger.info('Resource updated', { resourceId: id, updatedBy: userId });
  return getById(id);
};

/**
 * Soft delete a resource
 */
const softDelete = async (id, userId) => {
  const query = `
    UPDATE resources
    SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
  `;

  const result = await db.query(query, [id, userId]);

  if (result.rowCount === 0) {
    return false;
  }

  logger.info('Resource soft deleted', { resourceId: id, deletedBy: userId });
  return true;
};

/**
 * Get allocations for a resource
 */
const getAllocations = async (resourceId) => {
  const query = `
    SELECT 
      a.*,
      p.project_name,
      p.project_type
    FROM allocations a
    LEFT JOIN projects p ON a.project_id = p.id
    WHERE a.resource_id = $1
    ORDER BY a.start_date DESC
  `;

  const result = await db.query(query, [resourceId]);
  return result.rows;
};

/**
 * Get designation history for a resource
 */
const getDesignationHistory = async (resourceId) => {
  const query = `
    SELECT 
      dh.*,
      d.name as designation_name
    FROM designation_history dh
    LEFT JOIN designations d ON dh.designation_id = d.id
    WHERE dh.resource_id = $1
    ORDER BY dh.effective_date DESC
  `;

  const result = await db.query(query, [resourceId]);
  return result.rows;
};

export default {
  list,
  getById,
  create,
  update,
  softDelete,
  getAllocations,
  getDesignationHistory,
};
