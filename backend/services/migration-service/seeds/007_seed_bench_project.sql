-- Seed: 007_seed_bench_project
-- Creates system user and Bench project

-- Create system user if not exists
INSERT INTO users (username, email, password_hash, role, status)
VALUES ('system', 'system@onebt.com', '$2b$10$placeholder', 'Super User', 'Active')
ON CONFLICT DO NOTHING;

-- Create Bench project if not exists
INSERT INTO projects (project_name, project_code, account_type, status, is_bench_project, description, team_size, created_by)
SELECT 'Bench', 'BENCH', 'Internal', 'Active', true, 'Default bench project for unallocated resources', 0, 
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE is_bench_project = true AND deleted_at IS NULL);
