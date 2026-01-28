/**
 * Migration: 010 - Bench Project
 * Creates a default "Bench" project for automatic resource allocation
 * All new resources are allocated 100% to Bench by default
 */

export const shorthands = undefined;

export const up = async (pgm) => {
  // First, get the super admin user ID to use as created_by
  // We need to use raw SQL with a subquery since we can't do JS operations in migration

  pgm.sql(`
    -- Insert the Bench project (Internal, Non-Billing)
    -- Using a fixed UUID so we can reference it consistently
    INSERT INTO projects (
      id,
      project_name, 
      project_code, 
      project_type, 
      account_type,
      team_size,
      account_manager,
      billing_type,
      status,
      description,
      created_by
    ) VALUES (
      'b3nch000-0000-0000-0000-000000000001',
      'Bench',
      'BENCH',
      'Internal',
      'Internal',
      100,
      'System',
      'Non-Billing',
      'Active',
      'Default bench allocation for unassigned resources. Resources are automatically allocated 100% to Bench when created.',
      (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)
    )
    ON CONFLICT (project_name) WHERE deleted_at IS NULL DO NOTHING;
  `);

  // Also create additional internal projects commonly needed
  pgm.sql(`
    -- Pre-Sales project for resources working on pre-sales activities
    INSERT INTO projects (
      id,
      project_name,
      project_code,
      project_type,
      account_type,
      team_size,
      account_manager,
      billing_type,
      status,
      description,
      created_by
    ) VALUES (
      'pr3sal3s-0000-0000-0000-000000000002',
      'Pre-Sales',
      'PRESALES',
      'Internal',
      'Internal',
      50,
      'System',
      'Non-Billing',
      'Active',
      'Pre-sales activities including demos, proposals, and client presentations',
      (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)
    )
    ON CONFLICT (project_name) WHERE deleted_at IS NULL DO NOTHING;
  `);

  pgm.sql(`
    -- Leave/PTO project for tracking leave allocations
    INSERT INTO projects (
      id,
      project_name,
      project_code,
      project_type,
      account_type,
      team_size,
      account_manager,
      billing_type,
      status,
      description,
      created_by
    ) VALUES (
      'l3av3000-0000-0000-0000-000000000003',
      'Leave/PTO',
      'LEAVE',
      'Internal',
      'Internal',
      100,
      'System',
      'Non-Billing',
      'Active',
      'Leave, PTO, and time-off allocations',
      (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)
    )
    ON CONFLICT (project_name) WHERE deleted_at IS NULL DO NOTHING;
  `);

  pgm.sql(`
    -- Training project for resources in training
    INSERT INTO projects (
      id,
      project_name,
      project_code,
      project_type,
      account_type,
      team_size,
      account_manager,
      billing_type,
      status,
      description,
      created_by
    ) VALUES (
      'tra1n1ng-0000-0000-0000-000000000004',
      'Training',
      'TRAINING',
      'Internal',
      'Internal',
      100,
      'System',
      'Non-Billing',
      'Active',
      'Training and skill development activities',
      (SELECT id FROM users WHERE username = 'superadmin' LIMIT 1)
    )
    ON CONFLICT (project_name) WHERE deleted_at IS NULL DO NOTHING;
  `);

  // Add is_bench_project column to projects table
  pgm.addColumn('projects', {
    is_bench_project: {
      type: 'boolean',
      notNull: true,
      default: false
    }
  });

  // Mark the Bench project
  pgm.sql(`
    UPDATE projects SET is_bench_project = true WHERE project_code = 'BENCH';
  `);
};

export const down = (pgm) => {
  // Remove is_bench_project column
  pgm.dropColumn('projects', 'is_bench_project');

  // Remove the seeded projects
  pgm.sql(`DELETE FROM projects WHERE project_code IN ('BENCH', 'PRESALES', 'LEAVE', 'TRAINING')`);
};
