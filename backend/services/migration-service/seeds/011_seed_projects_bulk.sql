-- Auto-generated seed: Projects from project data
-- Generated at: 2026-03-03T20:32:46.513186

-- ============ CLIENTS ============
INSERT INTO clients (client_name, is_active) VALUES ('1BT', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('1HR', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('ADL', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Aepoch', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Akoustis', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Antium', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Aswat', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Aurora', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Auxillium', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Axion', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('BC Reporting', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Book Road', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('CE', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('City Dynamics', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Clearly Cloudy', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Com Bank', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('DXC', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Domain.lk', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Eairwoman', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Edit Group', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Excubed', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Extrensica Global', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Getganas', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Healthfinder', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Hillendale', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Ideapoint', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Igesia', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Infinity Group', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Lynear Wealth', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Mega Website', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('MillionSpaces', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Mint', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('NEA', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Oxford', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Power BI', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Power Intel', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Precision Point', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Quintessential Technologies', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('React', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Seer 365', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Shailan', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Villa Primatice', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Wealth OS', TRUE) ON CONFLICT (client_name) DO NOTHING;
INSERT INTO clients (client_name, is_active) VALUES ('Zamplo', TRUE) ON CONFLICT (client_name) DO NOTHING;

-- ============ PROJECT TYPES ============
INSERT INTO project_types (name, is_active) VALUES ('Bench', TRUE) ON CONFLICT (name) DO NOTHING;
INSERT INTO project_types (name, is_active) VALUES ('Client', TRUE) ON CONFLICT (name) DO NOTHING;
INSERT INTO project_types (name, is_active) VALUES ('Execs', TRUE) ON CONFLICT (name) DO NOTHING;
INSERT INTO project_types (name, is_active) VALUES ('Pre-sales', TRUE) ON CONFLICT (name) DO NOTHING;
INSERT INTO project_types (name, is_active) VALUES ('Research', TRUE) ON CONFLICT (name) DO NOTHING;
INSERT INTO project_types (name, is_active) VALUES ('Support', TRUE) ON CONFLICT (name) DO NOTHING;
INSERT INTO project_types (name, is_active) VALUES ('Training', TRUE) ON CONFLICT (name) DO NOTHING;

-- ============ MARK ACCOUNT MANAGERS ============
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Amith Mendis' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Anushka Wickramaratne' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Avanthi Amunugama' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Burhanudheen Thassim' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Janaka Kumarasinghe' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Maneesha Samarajeewa' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Prasath Nanayakkara' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Randika Swaris' AND deleted_at IS NULL;
UPDATE employees SET is_account_manager = TRUE, updated_at = NOW() WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL;

-- ============ PROJECTS ============
INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    '1BT Website', 'pid-1',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Burhanudheen Thassim' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = '1BT Website' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'DXC Technology', 'pid-2',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'DXC' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'DXC Technology' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'ADL', 'pid-3',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'ADL' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'ADL' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Bench', 'pid-4',
    (SELECT id FROM project_types WHERE name = 'Bench' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    TRUE,
    TRUE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Bench' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - BI Data Mapping', 'pid-5',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - BI Data Mapping' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'City Dynamics', 'pid-6',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'City Dynamics' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'City Dynamics' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Clearly Cloudy', 'pid-7',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Clearly Cloudy' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Clearly Cloudy' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Com Bank (Staff Aug)', 'pid-8',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Com Bank' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Com Bank (Staff Aug)' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Eairwoman', 'pid-9',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Eairwoman' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Eairwoman' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - Electronic Reporter Development', 'pid-10',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - Electronic Reporter Development' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Excubed', 'pid-11',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Excubed' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Excubed' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'F&O Technical Training', 'pid-12',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'F&O Technical Training' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Ideapoint', 'pid-13',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Ideapoint' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Ideapoint' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'MillionSpaces', 'pid-14',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'MillionSpaces' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'MillionSpaces' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Precision Point', 'pid-15',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Precision Point' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Precision Point' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Insights', 'pid-16',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Insights' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer BVA', 'pid-17',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer BVA' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Discover', 'pid-18',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Discover' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Dox 42 POC', 'pid-19',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Dox 42 POC' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Qualify', 'pid-20',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Qualify' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer RFP', 'pid-21',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer RFP' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer V1', 'pid-22',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer V1' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer V2', 'pid-23',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer V2' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Training', 'pid-24',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Training' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Training - FullStack', 'pid-25',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Training - FullStack' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'WealthOS', 'pid-26',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Wealth OS' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'WealthOS' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Zamplo', 'pid-27',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Zamplo' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Zamplo' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - Astec AX2012', 'pid-28',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - Astec AX2012' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Aswat', 'pid-29',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Aswat' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Aswat' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Business Central Reporting', 'pid-30',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    '2024-05-02',
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Avanthi Amunugama' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Business Central Reporting' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - CFP Testing', 'pid-31',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - CFP Testing' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'HR Solution', 'pid-32',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    '2024-05-02',
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Avanthi Amunugama' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'HR Solution' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Extrensica Global', 'pid-33',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Extrensica Global' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Extrensica Global' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'F&O Update Project', 'pid-34',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'F&O Update Project' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'RSAT Training', 'pid-35',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'RSAT Training' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Support', 'pid-36',
    (SELECT id FROM project_types WHERE name = 'Support' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Janaka Kumarasinghe' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Support' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Executives', 'pid-37',
    (SELECT id FROM project_types WHERE name = 'Execs' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Prasath Nanayakkara' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Executives' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint -CR248', 'pid-38',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint -CR248' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - Power Intel', 'pid-39',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Prasath Nanayakkara' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - Power Intel' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - Support', 'pid-40',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - Support' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Odotime', 'pid-41',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Odotime' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - David Lloyd', 'pid-42',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - David Lloyd' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Happiness Tracking App', 'pid-43',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Avanthi Amunugama' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Happiness Tracking App' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - CF Development', 'pid-44',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - CF Development' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - JHU', 'pid-45',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Burhanudheen Thassim' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - JHU' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'BC AP Automation', 'pid-46',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Quintessential Technologies' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'BC AP Automation' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Purple Bricks F&O Support', 'pid-47',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Extrensica Global' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Purple Bricks F&O Support' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - AER', 'pid-48',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - AER' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mega Website', 'pid-49',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mega Website' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mega Website' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Power Intel', 'pid-50',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Power Intel' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Power Intel' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - Book Road', 'pid-51',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Book Road' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - Book Road' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint UK RSAT', 'pid-52',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint UK RSAT' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Mint - ECIC', 'pid-53',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Mint - ECIC' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Marketing', 'pid-54',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Maneesha Samarajeewa' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Marketing' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    '.NET React Training', 'pid-55',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = '.NET React Training' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Clearly Reporting BC Dashboard', 'pid-56',
    (SELECT id FROM project_types WHERE name = 'Pre-sales' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Shailan' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Prasath Nanayakkara' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Clearly Reporting BC Dashboard' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Book Road', 'pid-57',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Book Road' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Avanthi Amunugama' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Book Road' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Igesia', 'pid-58',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Igesia' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Amith Mendis' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Igesia' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'WACO CFD Development', 'pid-59',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'WACO CFD Development' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer UI', 'pid-60',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer UI' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Sinch', 'pid-61',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'DXC' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Sinch' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'LifeSearchSupport', 'pid-62',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Edit Group' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'LifeSearchSupport' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - Oxford', 'pid-63',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Oxford' LIMIT 1),
    '2024-10-30',
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - Oxford' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - Akoustis F&O', 'pid-64',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Akoustis' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - Akoustis F&O' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - Mint', 'pid-65',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Mint' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - Mint' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Insights V2', 'pid-66',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Insights V2' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Antium', 'pid-67',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Antium' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Antium' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Power BI Training', 'pid-68',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Power BI' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Power BI Training' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'React Training', 'pid-69',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'React' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'React Training' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Discover Keith', 'pid-70',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Discover Keith' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Discover Dox42', 'pid-71',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Discover Dox42' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Villa Primatice', 'pid-72',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Villa Primatice' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Villa Primatice' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - NEA', 'pid-73',
    (SELECT id FROM project_types WHERE name = 'Pre-sales' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'NEA' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - NEA' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'IGCE Support', 'pid-74',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Infinity Group' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'IGCE Support' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'IGCR', 'pid-75',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Infinity Group' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'IGCR' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Healthfinder', 'pid-76',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Healthfinder' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Healthfinder' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - Getganas', 'pid-77',
    (SELECT id FROM project_types WHERE name = 'Pre-sales' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Getganas' LIMIT 1),
    NULL,
    NULL,
    'Inactive',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - Getganas' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Training - CE', 'pid-78',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'CE' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Training - CE' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Auxilium', 'pid-79',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Auxillium' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Auxilium' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale - Hillendale', 'pid-80',
    (SELECT id FROM project_types WHERE name = 'Pre-sales' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Hillendale' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale - Hillendale' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'IGBC Support', 'pid-81',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Infinity Group' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'IGBC Support' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    '1HR React App', 'pid-82',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1HR' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Avanthi Amunugama' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = '1HR React App' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Common', 'pid-83',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Common' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Axion Group', 'pid-84',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Axion' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Axion Group' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Microsoft Licensing', 'pid-85',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Microsoft Licensing' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Microsoft', 'pid-86',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Microsoft' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'BC Training Project', 'pid-87',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'BC Reporting' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'BC Training Project' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Rom In Port', 'pid-88',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Rom In Port' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer AI Agent', 'pid-89',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer AI Agent' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Auxilium - Phase 02', 'pid-90',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Auxillium' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Auxilium - Phase 02' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Auxilium BI', 'pid-91',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Auxillium' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Auxilium BI' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Home Page', 'pid-92',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Home Page' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer Planner', 'pid-93',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer Planner' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Presale', 'pid-94',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Presale' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Support AI Model', 'pid-95',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Support AI Model' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'QA AI Framework Development', 'pid-96',
    (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Anushka Wickramaratne' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'QA AI Framework Development' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Aurora', 'pid-97',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Aurora' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Aurora' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'RM Project', 'pid-98',
    (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = '1BT' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'Internal',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'RM Project' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Lynear Wealth - Presale', 'pid-99',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Lynear Wealth' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Lynear Wealth - Presale' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Aepoch - Presale', 'pid-100',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Aepoch' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Aepoch - Presale' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Seer QA', 'pid-101',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Seer 365' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Seer QA' AND deleted_at IS NULL
);

INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT
    'Domain.lk - Presale', 'pid-102',
    (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
    (SELECT id FROM clients WHERE client_name = 'Domain.lk' LIMIT 1),
    NULL,
    NULL,
    'Active',
    (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1),
    'External',
    FALSE,
    FALSE,
    (SELECT id FROM users WHERE username = 'system' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE project_name = 'Domain.lk - Presale' AND deleted_at IS NULL
);

-- Set Randika as Bench Project Account Manager
UPDATE projects SET account_manager_id = (SELECT id FROM employees WHERE name = 'Randika Swaris' AND deleted_at IS NULL LIMIT 1) WHERE is_bench_project = true;
