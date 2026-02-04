-- Migration: 012_add_is_default_to_projects
-- Adds is_default column to projects table for system default projects like Bench

-- Add is_default column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- Mark the bench project as default
UPDATE projects SET is_default = true WHERE is_bench_project = true;

-- Add index for quick lookup of default projects
CREATE INDEX IF NOT EXISTS idx_projects_default ON projects(is_default) WHERE is_default = true AND deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN projects.is_default IS 'System default project that cannot be deleted (e.g., Bench project)';
