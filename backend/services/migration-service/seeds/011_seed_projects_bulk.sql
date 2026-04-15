-- Auto-generated seed from CSV
INSERT INTO projects (
    project_name, project_code, project_type_id, client_id,
    project_start_date, project_end_date, status,
    account_manager_id, account_type, is_bench_project, is_default,
    created_by
) SELECT * FROM (
  VALUES
    ('DXC Technology', 'pid-25',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('ADL', 'pid-4',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Bench', 'pid-15',
     (SELECT id FROM project_types WHERE name = 'Bench' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Ideapoint', 'pid-35',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('MillionSpaces', 'pid-45',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer Insights', 'pid-82',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer Discover', 'pid-79',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer Qualify', 'pid-87',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer RFP', 'pid-88',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer V2', 'pid-92',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('HR Solution', 'pid-34',
     (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Avanthi Amunugama' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Support', 'pid-94',
     (SELECT id FROM project_types WHERE name = 'Support' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Janaka Kumarasinghe' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Executives', 'pid-28',
     (SELECT id FROM project_types WHERE name = 'Execs' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Prasath Nanayakkara' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Marketing', 'pid-42',
     (SELECT id FROM project_types WHERE name = 'Research' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Maneesha Samarajeewa' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Discover Dox42', 'pid-22',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('IGCE Support', 'pid-37',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('IGCR', 'pid-38',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Healthfinder', 'pid-33',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('IGBC Support', 'pid-36',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer Common', 'pid-78',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Microsoft Licensing', 'pid-44',
     (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer AI Agent', 'pid-76',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer Home Page', 'pid-81',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer Planner', 'pid-85',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Aurora', 'pid-8',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Lynear Wealth - Presale', 'pid-41',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Aepoch - Presale', 'pid-5',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Seer QA', 'pid-86',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Rayaz Muthalif' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Domain.lk - Presale', 'pid-24',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('99x', 'pid-103',
     (SELECT id FROM project_types WHERE name = 'Client' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1)),
    ('Blockchain Traning', 'pid-104',
     (SELECT id FROM project_types WHERE name = 'Training' LIMIT 1),
     NULL::integer, -- client_id
     COALESCE(NULL, '2000-01-01')::DATE, NULL::DATE,
     'Active'::project_status,
     (SELECT id FROM employees WHERE name = 'Hiran Sirimanna' LIMIT 1), -- account_manager_id
     'External'::account_type, false, false, (SELECT id FROM users WHERE username = 'system' LIMIT 1))
) AS v(project_name, project_code, project_type_id, client_id, project_start_date, project_end_date, status, account_manager_id, account_type, is_bench_project, is_default, created_by)
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_name = v.project_name);

-- Assign Bench project to Randika Swaris
UPDATE projects 
SET account_manager_id = (SELECT id FROM employees WHERE name = 'Randika Swaris' LIMIT 1) 
WHERE project_name = 'Bench';

-- Assure account managers get the tag
INSERT INTO employee_tags (employee_id, tag_id)
SELECT DISTINCT p.account_manager_id, t.id
FROM projects p
JOIN tags t ON t.name = 'Account Manager'
WHERE p.account_manager_id IS NOT NULL
ON CONFLICT (employee_id, tag_id) DO NOTHING;
