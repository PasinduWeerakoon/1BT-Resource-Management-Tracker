import * as db from '../lib/database/index.js';

export const reportsService = {
  /**
   * Get allocation report with aggregation
   * @param {Object} filters
   */
  async getAllocationReport({ startDate, endDate, projectType, department }) {
    console.log('reportsService: getAllocationReport called');
    const params = [];
    let query = `
      SELECT 
        p.project_name,
        c.client_name,
        r.name as resource_name,
        r.designation_id,
        d.name as designation_name,
        a.allocation_percentage,
        a.start_date,
        a.end_date,
        a.status
      FROM allocations a
      JOIN projects p ON a.project_id = p.id
      JOIN resources r ON a.resource_id = r.id
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN designations d ON r.designation_id = d.id
      WHERE a.deleted_at IS NULL
    `;

    // Add filters dynamically
    if (projectType) {
      params.push(projectType);
      query += ` AND p.project_type = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND (a.end_date IS NULL OR a.end_date >= $${params.length})`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND a.start_date <= $${params.length}`;
    }

    query += ` ORDER BY p.project_name, r.name`;

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Get bench report (resources with < 100% allocation)
   */
  async getBenchReport() {
    const query = `
      WITH resource_allocations AS (
        SELECT 
          resource_id,
          SUM(allocation_percentage) as total_allocation
        FROM allocations
        WHERE status = 'ACTIVE' 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND deleted_at IS NULL
        GROUP BY resource_id
      )
      SELECT 
        r.id,
        r.name,
        r.email,
        d.name as designation,
        t.name as track,
        COALESCE(ra.total_allocation, 0) as current_allocation,
        (100 - COALESCE(ra.total_allocation, 0)) as available_capacity,
        r.join_date,
        EXTRACT(DAY FROM (CURRENT_DATE - r.join_date)) as days_in_company
      FROM resources r
      LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
      LEFT JOIN designations d ON r.designation_id = d.id
      LEFT JOIN tracks t ON r.track_id = t.id
      WHERE r.status = 'ACTIVE'
      AND (ra.total_allocation IS NULL OR ra.total_allocation < 100)
      AND r.deleted_at IS NULL
      ORDER BY available_capacity DESC, r.join_date DESC
    `;

    const result = await db.query(query);
    return result.rows;
  },

  /**
   * Get utilization report (billable vs non-billable)
   */
  async getUtilizationReport() {
    // This assumes we have a way to distinguish billable vs non-billable.
    // Based on schema, projects have 'is_billable'.

    const query = `
      SELECT 
        t.name as track,
        COUNT(DISTINCT r.id) as total_resources,
        SUM(CASE WHEN p.is_billable = true THEN a.allocation_percentage ELSE 0 END) as billable_allocation_sum,
        SUM(CASE WHEN p.is_billable = false OR p.is_billable IS NULL THEN a.allocation_percentage ELSE 0 END) as non_billable_allocation_sum,
        COALESCE(SUM(a.allocation_percentage), 0) as total_allocated_sum
      FROM resources r
      LEFT JOIN tracks t ON r.track_id = t.id
      LEFT JOIN allocations a ON r.id = a.resource_id AND a.status = 'ACTIVE' AND a.deleted_at IS NULL
      LEFT JOIN projects p ON a.project_id = p.id
      WHERE r.status = 'ACTIVE' AND r.deleted_at IS NULL
      GROUP BY t.name
    `;

    const result = await db.query(query);

    // Calculate percentages
    return result.rows.map(row => {
      const totalCapacity = row.total_resources * 100;
      return {
        track: row.track || 'Unassigned',
        total_resources: parseInt(row.total_resources),
        billable_utilization: totalCapacity ? Math.round((row.billable_allocation_sum / totalCapacity) * 100) : 0,
        non_billable_utilization: totalCapacity ? Math.round((row.non_billable_allocation_sum / totalCapacity) * 100) : 0,
        overall_utilization: totalCapacity ? Math.round((row.total_allocated_sum / totalCapacity) * 100) : 0
      };
    });
  }
};

export default reportsService;
