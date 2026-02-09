-- Seeder: 008_seed_bulk_employees
-- Bulk insert employees from Excel data and allocate to Bench project
-- Generated from CSV: RM Tracker Report as at 8th January 2026

DO $$
DECLARE
    v_bench_project_id INTEGER;
    v_system_user_id INTEGER := 1;
    v_permanent_type_id INTEGER;
    v_contract_type_id INTEGER;
    v_intern_type_id INTEGER;
    v_probation_type_id INTEGER;
    v_inserted_count INTEGER := 0;
    v_allocated_count INTEGER := 0;
BEGIN
    -- Get Bench project ID
    SELECT id INTO v_bench_project_id FROM projects WHERE project_name = 'Bench' AND is_default = true;
    
    IF v_bench_project_id IS NULL THEN
        RAISE EXCEPTION 'Bench project not found. Please run seeder 007 first.';
    END IF;

    -- Get employee type IDs
    SELECT id INTO v_permanent_type_id FROM employee_types WHERE name = 'Permanent';
    SELECT id INTO v_contract_type_id FROM employee_types WHERE name = 'Contract';
    SELECT id INTO v_intern_type_id FROM employee_types WHERE name = 'Intern';
    SELECT id INTO v_probation_type_id FROM employee_types WHERE name = 'Probation';

    -- Track mapping: Dev=2, QA=3, UI=4, UX=5, BA/PM=6, Delivery=7, Support=8, Execs=9
    -- Tech Stack mapping: .NET=1, Full Stack=3, QA=4, UX=5, UI=6, Dynamics=7, Data Science=8, Java=9, BA/PM=10
    -- Tier mapping: Tier-1=1, Tier-2=2, Tier-3=3, Tier-4=4, Synergy=5, Intern=6, None=7
    
    RAISE NOTICE 'Starting bulk employee insert...';
    
    -- Bulk insert all employees
    INSERT INTO employees (
        epf_no, emp_no, name, track_id, tech_stack_id, tier_id, 
        employee_type_id, joined_date, last_increment_date, last_promotion_date, 
        status, total_allocation, total_resource_billing, created_by, created_at
    )
    VALUES
    ('EPFEC0004', 'EC0004', 'Gayan Coomasaru', NULL, 1, 7, v_contract_type_id, '2024-01-01', NULL, NULL, 'Inactive', 0, 0.75, v_system_user_id, NOW()),
    ('EPFEC0017', 'EC0017', 'Srihan De Mel', NULL, 1, 7, v_contract_type_id, '2024-01-01', NULL, NULL, 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFEC0033', 'EC0033', 'Hiran Sirimanna', NULL, 7, 5, v_permanent_type_id, '2023-03-01', NULL, NULL, 'Active', 100, 2.15, v_system_user_id, NOW()),
    ('EPFEC0045', 'EC0045', 'Chaminda Pragnarathne', NULL, 1, 2, v_permanent_type_id, '2022-04-01', NULL, '2023-04-01', 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFEC0047', 'EC0047', 'Dilukshika Liyanage', NULL, NULL, 7, v_contract_type_id, '2024-01-01', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0050', 'EC0050', 'Pravin Vishvanatharajah', NULL, 1, 2, v_permanent_type_id, '2022-03-02', '2022-05-01', '2023-09-15', 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFEC0052', 'EC0052', 'Ismail Tunca', NULL, 7, 7, v_contract_type_id, '2024-01-01', NULL, NULL, 'Inactive', 0, 0.63, v_system_user_id, NOW()),
    ('EPFEC0054', 'EC0054', 'Sothivadivel Satheeshkuma', NULL, 7, 7, v_contract_type_id, '2024-01-01', NULL, NULL, 'Active', 0, 0.50, v_system_user_id, NOW()),
    ('EPFEC0056', 'EC0056', 'Yeshan Jayasooriya', NULL, NULL, 7, v_contract_type_id, '2025-04-28', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0057', 'EC0057', 'Gayan Wimalarathna', NULL, NULL, 7, v_contract_type_id, '2024-01-01', NULL, NULL, 'Inactive', 0, 0.35, v_system_user_id, NOW()),
    ('EPFEC0058', 'EC0058', 'Raj Rao', NULL, 7, 7, v_contract_type_id, '2024-01-01', NULL, NULL, 'Active', 0, 0.85, v_system_user_id, NOW()),
    ('EPFEC0059', 'EC0059', 'Hasith Wanniarachchi', NULL, 7, 7, v_contract_type_id, '2024-06-20', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0060', 'EC0060', 'Manoharalingam Muhunthan', NULL, 7, 7, v_contract_type_id, '2024-06-25', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0061', 'EC0061', 'Nuwan Sampath', NULL, 7, 7, v_contract_type_id, '2024-07-01', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0069', 'EC0069', 'Harshana Samaranayake', NULL, 9, 7, v_contract_type_id, '2024-08-15', NULL, NULL, 'Inactive', 100, 2.50, v_system_user_id, NOW()),
    ('EPFEC0070', 'EC0070', 'Sayuri Jayasooriya', NULL, NULL, 7, v_contract_type_id, '2024-09-01', NULL, NULL, 'Active', 100, 4.45, v_system_user_id, NOW()),
    ('EPFEC0075', 'EC0075', 'Burhanudheen Thassim', NULL, NULL, 7, v_contract_type_id, '2024-09-16', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0078', 'EC0078', 'Niraj Meegama', NULL, NULL, 7, v_contract_type_id, '2024-11-06', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0079', 'EC0079', 'Vinoth Kanna', NULL, 5, 7, v_contract_type_id, '2024-11-11', NULL, NULL, 'Active', 0, 3.25, v_system_user_id, NOW()),
    ('EPFEC0081', 'EC0081', 'Gayan Sanjeewa', NULL, 8, 7, v_contract_type_id, '2024-11-22', NULL, NULL, 'Inactive', 100, 1.25, v_system_user_id, NOW()),
    ('EPFEC0084', 'EC0084', 'Senira Jayathilake', NULL, NULL, 7, v_contract_type_id, '2025-04-28', NULL, NULL, 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFEC0085', 'EC0085', 'Sachini Ishanka', NULL, NULL, 7, v_contract_type_id, '2025-07-07', NULL, NULL, 'Active', 100, 0.50, v_system_user_id, NOW()),
    ('EPFEC0086', 'EC0086', 'Chamath Randula', NULL, NULL, 7, v_contract_type_id, '2025-07-07', NULL, NULL, 'Active', 100, 0.50, v_system_user_id, NOW()),
    ('EPFEC0087', 'EC0087', 'Shanilka Jayarathne', NULL, NULL, 7, v_contract_type_id, '2025-07-21', NULL, NULL, 'Active', 25, 0.00, v_system_user_id, NOW()),
    ('EPFEC0088', 'EC0088', 'Thilina Abeysirigunawardana', NULL, NULL, 7, v_contract_type_id, '2025-09-15', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFEC0090', 'EC0090', 'Sandali Hettikanda', NULL, NULL, 3, v_contract_type_id, '2025-10-06', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFEC0091', 'EC0091', 'Ghulam Rasool', NULL, NULL, 3, v_contract_type_id, '2025-10-31', NULL, NULL, 'Active', 50, 0.50, v_system_user_id, NOW()),
    ('EPFLE00001', 'LE00001', 'Prasath Nanayakkara', NULL, NULL, 5, v_permanent_type_id, '2014-01-01', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00005', 'LE00005', 'Randika Swaris', NULL, 1, 5, v_permanent_type_id, '2014-04-10', '2021-10-01', '2023-08-01', 'Active', 100, 1.30, v_system_user_id, NOW()),
    ('EPFLE00134', 'LE00134', 'Thusitha Dissanayake', NULL, 1, 1, v_permanent_type_id, '2016-10-17', '2023-10-01', '2023-10-01', 'Active', 100, 5.00, v_system_user_id, NOW()),
    ('EPFLE00161', 'LE00161', 'Chathuri Pemananda', NULL, 5, 3, v_permanent_type_id, '2017-01-16', NULL, '2023-04-01', 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00175', 'LE00175', 'Udeni Kandage', NULL, 4, 2, v_permanent_type_id, '2017-02-06', '2022-05-01', '2023-04-01', 'Inactive', 0, 2.00, v_system_user_id, NOW()),
    ('EPFLE00180', 'LE00180', 'Faideena Rasik', NULL, 4, 2, v_permanent_type_id, '2017-02-14', '2022-05-01', '2023-04-01', 'Inactive', 0, 1.00, v_system_user_id, NOW()),
    ('EPFLE00208', 'LE00208', 'Gihan Lakmal', NULL, 1, 1, v_permanent_type_id, '2017-06-26', '2023-10-01', '2023-10-01', 'Active', 100, 4.50, v_system_user_id, NOW()),
    ('EPFLE00209', 'LE00209', 'Dinithi Mudugamuwarachchi', NULL, 4, 2, v_permanent_type_id, '2017-07-03', '2022-05-01', '2023-04-01', 'Active', 100, 8.25, v_system_user_id, NOW()),
    ('EPFLE00282', 'LE00282', 'Burhanudheen Thassim', NULL, NULL, 5, v_permanent_type_id, '2018-02-19', '2021-10-01', '2023-08-01', 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00283', 'LE00283', 'Vinoth Kanna', NULL, 5, 2, v_permanent_type_id, '2018-02-19', '2023-04-01', '2023-04-01', 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00289', 'LE00289', 'Chamalka Gamaralalage', NULL, 3, 2, v_permanent_type_id, '2018-04-02', '2023-04-01', '2023-04-01', 'Active', 100, 9.50, v_system_user_id, NOW()),
    ('EPFLE00320', 'LE00320', 'Nirmala Katupothage', NULL, 4, 2, v_permanent_type_id, '2018-11-01', '2023-10-01', '2024-01-01', 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00337', 'LE00337', 'Indumini Wijedasa', NULL, 1, 2, v_permanent_type_id, '2019-01-21', '2023-10-01', '2024-01-01', 'Active', 100, 5.00, v_system_user_id, NOW()),
    ('EPFLE00341', 'LE00341', 'Thanuja Jayaweera', NULL, NULL, 5, v_permanent_type_id, '2019-02-05', NULL, '2024-03-01', 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00354', 'LE00354', 'Amith Mendis', NULL, 3, 5, v_permanent_type_id, '2019-05-02', '2022-06-01', '2023-08-01', 'Inactive', 0, 0.60, v_system_user_id, NOW()),
    ('EPFLE00357', 'LE00357', 'Gayashan Galagedara', NULL, 3, 2, v_permanent_type_id, '2019-06-01', '2023-04-01', '2024-01-01', 'Active', 100, 4.75, v_system_user_id, NOW()),
    ('EPFLE00373', 'LE00373', 'Selvarajah Arudkumaran', NULL, 3, 2, v_permanent_type_id, '2019-08-01', '2023-10-01', '2024-01-01', 'Active', 100, 6.00, v_system_user_id, NOW()),
    ('EPFLE00376', 'LE00376', 'Harindu Meellage', NULL, 1, 2, v_permanent_type_id, '2019-08-12', '2023-04-01', '2023-02-01', 'Active', 100, 6.75, v_system_user_id, NOW()),
    ('EPFLE00385', 'LE00385', 'Isuru Rodrigo', NULL, 4, 2, v_permanent_type_id, '2019-11-04', '2023-04-01', '2023-04-01', 'Active', 0, 2.00, v_system_user_id, NOW()),
    ('EPFLE00386', 'LE00386', 'Dinusha Weerasinghe', NULL, NULL, 2, v_permanent_type_id, '2019-12-16', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00389', 'LE00389', 'Tillinna Chary', NULL, NULL, 5, v_permanent_type_id, '2020-01-13', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00395', 'LE00395', 'Kaweesha De Alwis', NULL, 3, 4, v_permanent_type_id, '2020-02-10', '2021-07-01', '2023-04-01', 'Active', 100, 4.00, v_system_user_id, NOW()),
    ('EPFLE00398', 'LE00398', 'Mahen Jayasena', NULL, 5, 2, v_permanent_type_id, '2020-03-02', NULL, '2023-04-01', 'Active', 100, 5.00, v_system_user_id, NOW()),
    ('EPFLE00405', 'LE00405', 'Sooriyakumaran Subanemi', NULL, 6, 2, v_permanent_type_id, '2018-11-14', '2023-04-01', '2023-04-01', 'Active', 0, 2.50, v_system_user_id, NOW()),
    ('EPFLE00407', 'LE00407', 'Sayuri Jayasooriya', NULL, NULL, 2, v_permanent_type_id, '2020-08-11', '2023-04-01', '2023-09-01', 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00409', 'LE00409', 'Melantha Perera', NULL, NULL, 5, v_permanent_type_id, '2020-09-02', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00416', 'LE00416', 'Dilshan Wijesinghe', NULL, 3, 4, v_permanent_type_id, '2021-02-04', '2022-05-01', '2023-04-01', 'Active', 100, 1.25, v_system_user_id, NOW()),
    ('EPFLE00421', 'LE00421', 'Viraj Wickramasinghe', NULL, 4, 4, v_permanent_type_id, '2021-06-01', '2022-10-01', '2023-04-01', 'Inactive', 0, 1.40, v_system_user_id, NOW()),
    ('EPFLE00430', 'LE00430', 'Danthila Dissanayake', NULL, 3, 3, v_permanent_type_id, '2021-09-15', '2023-04-01', '2023-04-01', 'Active', 100, 3.25, v_system_user_id, NOW()),
    ('EPFLE00436', 'LE00436', 'Kavindu Dewpura', NULL, 4, 2, v_permanent_type_id, '2021-10-11', '2023-04-01', '2023-04-01', 'Inactive', 0, 0.50, v_system_user_id, NOW()),
    ('EPFLE00439', 'LE00439', 'Olitha Kalhara', NULL, NULL, 4, v_permanent_type_id, '2021-10-25', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00446', 'LE00446', 'Mahendra Thammita', NULL, 1, 3, v_permanent_type_id, '2021-12-01', '2023-10-01', '2024-04-01', 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00447', 'LE00447', 'Anushka Wickramaratne', NULL, 4, 5, v_permanent_type_id, '2021-12-06', NULL, '2023-02-01', 'Active', 100, 6.45, v_system_user_id, NOW()),
    ('EPFLE00448', 'LE00448', 'Athula Chandrawansha', NULL, 1, 3, v_permanent_type_id, '2021-12-13', '2023-01-01', '2023-01-01', 'Active', 100, 2.15, v_system_user_id, NOW()),
    ('EPFLE00453', 'LE00453', 'Odara Pathirana', NULL, NULL, 2, v_permanent_type_id, '2022-01-24', '2022-06-01', '2023-04-01', 'Active', 100, 0.80, v_system_user_id, NOW()),
    ('EPFLE00454', 'LE00454', 'Sandeepa Fernando', NULL, 1, 3, v_permanent_type_id, '2022-02-01', '2023-04-01', '2024-01-01', 'Active', 100, 2.00, v_system_user_id, NOW()),
    ('EPFLE00462', 'LE00462', 'Randika Madushan', NULL, NULL, 3, v_permanent_type_id, '2022-04-01', NULL, '2023-04-01', 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFLE00466', 'LE00466', 'Dehemi Weerakkody', NULL, 4, 4, v_permanent_type_id, '2022-05-01', '2023-10-01', '2024-01-01', 'Inactive', 0, 0.25, v_system_user_id, NOW()),
    ('EPFLE00470', 'LE00470', 'Randika Padmashali', NULL, 1, 4, v_permanent_type_id, '2022-06-01', '2023-10-01', '2024-03-01', 'Active', 0, 6.60, v_system_user_id, NOW()),
    ('EPFLE00471', 'LE00471', 'Disal Isurinda', NULL, 1, 4, v_permanent_type_id, '2022-06-01', '2023-10-01', '2024-01-01', 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFLE00472', 'LE00472', 'Tharukshi Wickramasinghe', NULL, 1, 4, v_permanent_type_id, '2022-06-01', '2023-10-01', '2024-01-01', 'Active', 100, 4.25, v_system_user_id, NOW()),
    ('EPFLE00473', 'LE00473', 'Kalhan Vithanage', NULL, 3, 4, v_permanent_type_id, '2022-06-01', '2023-04-01', '2023-04-01', 'Inactive', 0, 1.00, v_system_user_id, NOW()),
    ('EPFLE00474', 'LE00474', 'Chathurika Sandamali', NULL, 3, 4, v_permanent_type_id, '2022-06-01', NULL, '2023-04-01', 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00476', 'LE00476', 'Tamasha Bandara', NULL, 4, 4, v_permanent_type_id, '2022-06-01', '2023-10-01', '2024-01-01', 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00477', 'LE00477', 'Pasindu Weerakoon', NULL, 3, 2, v_permanent_type_id, '2022-06-15', '2023-04-01', '2023-04-01', 'Active', 100, 6.50, v_system_user_id, NOW()),
    ('EPFLE00478', 'LE00478', 'Sithumini Jayasinghe', NULL, 4, 2, v_permanent_type_id, '2022-06-20', NULL, '2023-04-01', 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFLE00479', 'LE00479', 'Charith Bandara', NULL, 4, 4, v_permanent_type_id, '2022-07-01', '2023-10-01', '2024-01-01', 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00480', 'LE00480', 'Tashila Kumara', NULL, 3, 4, v_permanent_type_id, '2022-07-01', NULL, '2023-04-01', 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00481', 'LE00481', 'Manoj Dharmawardhana', NULL, 5, 4, v_permanent_type_id, '2022-07-01', '2023-10-01', '2024-01-01', 'Active', 100, 2.40, v_system_user_id, NOW()),
    ('EPFLE00483', 'LE00483', 'Ishadi Ranaweera', NULL, 8, 4, v_permanent_type_id, '2022-07-05', NULL, NULL, 'Inactive', 0, 0.80, v_system_user_id, NOW()),
    ('EPFLE00484', 'LE00484', 'Tilanga Pramith', NULL, 3, 2, v_permanent_type_id, '2022-08-08', '2023-10-01', '2024-01-01', 'Active', 100, 4.75, v_system_user_id, NOW()),
    ('EPFLE00486', 'LE00486', 'Kaveesha Rupasinghe', NULL, 4, 4, v_permanent_type_id, '2022-08-18', NULL, NULL, 'Inactive', 0, 3.00, v_system_user_id, NOW()),
    ('EPFLE00487', 'LE00487', 'Raveen Deemantha', NULL, 4, 2, v_permanent_type_id, '2022-09-05', '2023-09-01', '2023-09-01', 'Active', 100, 3.75, v_system_user_id, NOW()),
    ('EPFLE00488', 'LE00488', 'Sandun Rajapaksha ', NULL, 5, 4, v_permanent_type_id, '2022-10-01', '2023-10-01', '2024-01-01', 'Active', 100, 3.80, v_system_user_id, NOW()),
    ('EPFLE00489', 'LE00489', 'Thilina Dilshan', NULL, NULL, 4, v_permanent_type_id, '2022-10-04', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00490', 'LE00490', 'Uvin Weththasinghe', NULL, 3, 3, v_permanent_type_id, '2022-10-17', NULL, '2023-04-01', 'Inactive', 0, 1.00, v_system_user_id, NOW()),
    ('EPFLE00493', 'LE00493', 'Sandunika Wasala', NULL, 1, 4, v_permanent_type_id, '2022-11-03', '2023-10-01', '2024-01-01', 'Active', 100, 5.00, v_system_user_id, NOW()),
    ('EPFLE00497', 'LE00497', 'Tharindu Siriwardana', NULL, 1, 4, v_permanent_type_id, '2023-01-01', '2023-10-01', '2024-01-01', 'Active', 100, 2.00, v_system_user_id, NOW()),
    ('EPFLE00499', 'LE00499', 'Umasa Mahathanthrige', NULL, NULL, 4, v_permanent_type_id, '2023-01-19', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00500', 'LE00500', 'Randunu Ranepura', NULL, 3, 4, v_permanent_type_id, '2023-02-01', '2023-10-01', '2024-01-01', 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00501', 'LE00501', 'Srimali Ranawaka', NULL, 6, 4, v_permanent_type_id, '2023-02-01', NULL, NULL, 'Active', 100, 1.25, v_system_user_id, NOW()),
    ('EPFLE00502', 'LE00502', 'Methmini Abeysekara', NULL, 1, 4, v_permanent_type_id, '2023-02-01', NULL, NULL, 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00503', 'LE00503', 'Shanka De Silva', NULL, 4, 4, v_permanent_type_id, '2023-02-01', NULL, '2024-01-01', 'Active', 100, 4.00, v_system_user_id, NOW()),
    ('EPFLE00504', 'LE00504', 'Vihanga Perera', NULL, 1, 4, v_permanent_type_id, '2023-03-01', NULL, NULL, 'Active', 100, 3.20, v_system_user_id, NOW()),
    ('EPFLE00505', 'LE00505', 'Anudi Divarathne', NULL, 1, 4, v_permanent_type_id, '2023-03-01', NULL, NULL, 'Active', 100, 4.50, v_system_user_id, NOW()),
    ('EPFLE00506', 'LE00506', 'Kalaru Pramudith', NULL, 1, 4, v_permanent_type_id, '2023-03-01', NULL, NULL, 'Active', 100, 5.25, v_system_user_id, NOW()),
    ('EPFLE00507', 'LE00507', 'Prasad Rathnayake', NULL, 8, 3, v_permanent_type_id, '2023-03-01', '2024-04-01', '2024-04-01', 'Active', 100, 4.50, v_system_user_id, NOW()),
    ('EPFLE00508', 'LE00508', 'Sahan Kumarasiri', NULL, 3, 4, v_permanent_type_id, '2023-03-01', NULL, NULL, 'Active', 100, 5.20, v_system_user_id, NOW()),
    ('EPFLE00509', 'LE00509', 'Navindu Seran', NULL, 1, 4, v_permanent_type_id, '2023-03-01', NULL, NULL, 'Active', 100, 3.20, v_system_user_id, NOW()),
    ('EPFLE00510', 'LE00510', 'Tharusha Amarasooriya', NULL, 1, 4, v_permanent_type_id, '2023-04-01', NULL, NULL, 'Inactive', 0, 3.00, v_system_user_id, NOW()),
    ('EPFLE00511', 'LE00511', 'Amaniya Faizal ', NULL, 6, 4, v_permanent_type_id, '2023-04-01', NULL, NULL, 'Active', 100, 2.70, v_system_user_id, NOW()),
    ('EPFLE00512', 'LE00512', 'Basidh Ahamed', NULL, 1, 4, v_permanent_type_id, '2023-04-01', NULL, NULL, 'Inactive', 0, 1.20, v_system_user_id, NOW()),
    ('EPFLE00513', 'LE00513', 'Rayaz Muthalif', NULL, 1, 5, v_permanent_type_id, '2023-04-01', NULL, '2023-10-01', 'Active', 100, 4.35, v_system_user_id, NOW()),
    ('EPFLE00514', 'LE00514', 'Rashmika Rajapaksha', NULL, 1, 4, v_permanent_type_id, '2023-05-01', NULL, NULL, 'Active', 100, 2.25, v_system_user_id, NOW()),
    ('EPFLE00515', 'LE00515', 'Murugesh Sujan', NULL, 1, 4, v_permanent_type_id, '2023-05-01', NULL, NULL, 'Active', 100, 2.20, v_system_user_id, NOW()),
    ('EPFLE00517', 'LE00517', 'Sachinthana Saranga', NULL, 1, 2, v_permanent_type_id, '2023-05-16', NULL, NULL, 'Inactive', 0, 2.00, v_system_user_id, NOW()),
    ('EPFLE00518', 'LE00518', 'Thilini Pathirana', NULL, 4, 4, v_permanent_type_id, '2023-05-30', NULL, NULL, 'Active', 100, 6.35, v_system_user_id, NOW()),
    ('EPFLE00519', 'LE00519', 'Vishnugaran Premananth ', NULL, 6, 4, v_permanent_type_id, '2023-06-01', NULL, NULL, 'Inactive', 0, 0.75, v_system_user_id, NOW()),
    ('EPFLE00520', 'LE00520', 'Hansi Thathsarani', NULL, 4, 4, v_permanent_type_id, '2023-06-15', NULL, NULL, 'Active', 100, 2.00, v_system_user_id, NOW()),
    ('EPFLE00521', 'LE00521', 'Akeel Aliyar', NULL, 3, 4, v_permanent_type_id, '2023-07-01', NULL, NULL, 'Active', 100, 6.00, v_system_user_id, NOW()),
    ('EPFLE00523', 'LE00523', 'Madushan Neelananda', NULL, 3, 4, v_permanent_type_id, '2023-07-11', NULL, NULL, 'Active', 100, 6.00, v_system_user_id, NOW()),
    ('EPFLE00524', 'LE00524', 'Saavi Kalupahana', NULL, 4, 4, v_permanent_type_id, '2023-08-01', NULL, NULL, 'Active', 100, 1.50, v_system_user_id, NOW()),
    ('EPFLE00525', 'LE00525', 'Hashini Samarasinghe', NULL, NULL, 4, v_permanent_type_id, '2023-08-13', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00526', 'LE00526', 'Suran Wijesekara', NULL, NULL, 4, v_permanent_type_id, '2023-09-01', NULL, NULL, 'Active', 100, 3.90, v_system_user_id, NOW()),
    ('EPFLE00527', 'LE00527', 'Bhagya Hettiarachchi', NULL, 4, 4, v_permanent_type_id, '2023-09-11', NULL, NULL, 'Active', 0, 4.50, v_system_user_id, NOW()),
    ('EPFLE00528', 'LE00528', 'Deshan Udupihilla', NULL, NULL, 4, v_probation_type_id, '2023-09-19', NULL, NULL, 'Inactive', 0, 0.20, v_system_user_id, NOW()),
    ('EPFLE00529', 'LE00529', 'Kalika Ranasinghe', NULL, 1, 2, v_permanent_type_id, '2024-01-01', NULL, NULL, 'Active', 100, 8.10, v_system_user_id, NOW()),
    ('EPFLE00530', 'LE00530', 'Nethmi Daranagama', NULL, NULL, 4, v_probation_type_id, '2024-01-16', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00531', 'LE00531', 'Dilshan Amarasinghe', NULL, 3, 4, v_probation_type_id, '2024-01-25', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00532', 'LE00532', 'Lahiru Dissanayake', NULL, 1, 4, v_probation_type_id, '2024-02-01', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00533', 'LE00533', 'Yasas Thondilage', NULL, NULL, 4, v_permanent_type_id, '2024-02-02', NULL, NULL, 'Inactive', 0, 0.50, v_system_user_id, NOW()),
    ('EPFLE00534', 'LE00534', 'Sasanie Rupasinghe', NULL, NULL, 4, v_permanent_type_id, '2024-02-21', NULL, NULL, 'Inactive', 0, 1.00, v_system_user_id, NOW()),
    ('EPFLE00535', 'LE00535', 'Shafwan Anwer', NULL, 1, 4, v_probation_type_id, '2024-03-01', NULL, NULL, 'Inactive', 0, 1.45, v_system_user_id, NOW()),
    ('EPFLE00536', 'LE00536', 'Lahiru Madusanka ', NULL, 1, 4, v_permanent_type_id, '2024-03-01', NULL, NULL, 'Active', 100, 3.70, v_system_user_id, NOW()),
    ('EPFLE00537', 'LE00537', 'Sankha Yapa', NULL, 7, 4, v_permanent_type_id, '2024-03-20', NULL, NULL, 'Active', 100, 7.55, v_system_user_id, NOW()),
    ('EPFLE00538', 'LE00538', 'Sanketh Gunasekara', NULL, 3, 4, v_permanent_type_id, '2024-03-20', NULL, NULL, 'Inactive', 0, 3.00, v_system_user_id, NOW()),
    ('EPFLE00539', 'LE00539', 'Amir Hafi', NULL, 8, 4, v_permanent_type_id, '2024-04-01', NULL, NULL, 'Active', 100, 3.00, v_system_user_id, NOW()),
    ('EPFLE00540', 'LE00540', 'Avanthi Amunugama', NULL, NULL, 5, v_permanent_type_id, '2024-05-02', NULL, NULL, 'Active', 100, 3.50, v_system_user_id, NOW()),
    ('EPFLE00541', 'LE00541', 'Chathurika Fernando', NULL, NULL, 4, v_permanent_type_id, '2024-05-03', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00542', 'LE00542', 'Maneesha Samarajeewa', NULL, NULL, 5, v_permanent_type_id, '2024-06-03', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00543', 'LE00543', 'Pulara Weerasinghe', NULL, 1, 4, v_permanent_type_id, '2024-07-01', NULL, NULL, 'Active', 100, 2.00, v_system_user_id, NOW()),
    ('EPFLE00544', 'LE00544', 'Sayuru Wanasinghe', NULL, 3, 4, v_permanent_type_id, '2024-08-01', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00545', 'LE00545', 'Vishmi Perera', NULL, NULL, 1, v_permanent_type_id, '2024-09-04', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00546', 'LE00546', 'Paramee Weerarathna', NULL, 4, 4, v_probation_type_id, '2024-09-25', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00547', 'LE00547', 'Kasun Mahaliyanaarachchi', NULL, 8, 2, v_permanent_type_id, '2024-11-01', NULL, NULL, 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFLE00549', 'LE00549', 'Sapumal Thepulangoda', NULL, 3, 2, v_permanent_type_id, '2024-11-25', NULL, NULL, 'Active', 100, 2.75, v_system_user_id, NOW()),
    ('EPFLE00550', 'LE00550', 'Ramuthu Senanayake', NULL, NULL, 2, v_permanent_type_id, '2024-12-02', NULL, NULL, 'Inactive', 100, 1.00, v_system_user_id, NOW()),
    ('EPFLE00551', 'LE00551', 'Miraj Menon', NULL, 3, 2, v_permanent_type_id, '2024-12-31', NULL, NULL, 'Inactive', 100, 4.00, v_system_user_id, NOW()),
    ('EPFLE00552', 'LE00552', 'Dilshan Amarasinghe', NULL, 3, 4, v_probation_type_id, '2025-03-05', NULL, NULL, 'Active', 100, 3.50, v_system_user_id, NOW()),
    ('EPFLE00553', 'LE00553', 'Himasha Rodrigo', NULL, 4, 4, v_probation_type_id, '2025-03-19', NULL, NULL, 'Active', 100, 2.00, v_system_user_id, NOW()),
    ('EPFLE00554', 'LE00554', 'Sherone Fernando', NULL, NULL, 4, v_probation_type_id, '2025-04-07', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00555', 'LE00555', 'Thilini Perera', NULL, NULL, 4, v_probation_type_id, '2025-04-15', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00556', 'LE00556', 'Ravichandran Sudharshan', NULL, NULL, 4, v_probation_type_id, '2025-05-14', NULL, NULL, 'Active', 100, 1.25, v_system_user_id, NOW()),
    ('EPFLE00557', 'LE00557', 'Madushi Bhagya', NULL, 4, 3, v_probation_type_id, '2025-06-25', NULL, NULL, 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFLE00558', 'LE00558', 'Dumuthu Jayasinghe', NULL, 3, 4, v_probation_type_id, '2025-08-01', NULL, NULL, 'Active', 100, 3.25, v_system_user_id, NOW()),
    ('EPFLE00559', 'LE00559', 'Dilshan Lakruwan', NULL, 8, 4, v_probation_type_id, '2025-08-01', NULL, NULL, 'Active', 100, 2.50, v_system_user_id, NOW()),
    ('EPFLE00560', 'LE00560', 'Sandali Anjana', NULL, 4, 4, v_probation_type_id, '2025-08-01', NULL, NULL, 'Active', 100, 2.25, v_system_user_id, NOW()),
    ('EPFLE00561', 'LE00561', 'Roshith De Silva', NULL, NULL, 4, v_probation_type_id, '2025-08-05', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE00562', 'LE00562', 'Ruhini Udawatte', NULL, NULL, 4, v_probation_type_id, '2025-08-18', NULL, NULL, 'Active', 100, 1.00, v_system_user_id, NOW()),
    ('EPFLE00563', 'LE00563', 'Kalani Senevirathna', NULL, 10, 3, v_probation_type_id, '2025-09-01', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE00565', 'LE00565', 'Thilina Abeysirigunawardana', NULL, NULL, 3, v_probation_type_id, '2025-12-01', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1146', 'LE1146', 'Chanka Sonnadara', NULL, 3, 6, v_intern_type_id, '2023-06-05', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1150', 'LE1150', 'Nihinsa Rusandi', NULL, NULL, 6, v_intern_type_id, '2023-09-06', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1151', 'LE1151', 'Paramee Weerarathna', NULL, 4, 6, v_intern_type_id, '2023-09-25', NULL, NULL, 'Inactive', 0, 2.25, v_system_user_id, NOW()),
    ('EPFLE1152', 'LE1152', 'Sayuru Wanasinghe', NULL, 3, 6, v_intern_type_id, '2023-10-02', NULL, NULL, 'Inactive', 0, 1.00, v_system_user_id, NOW()),
    ('EPFLE1154', 'LE1154', 'Pulara Weerasinghe', NULL, 1, 6, v_intern_type_id, '2023-11-13', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1155', 'LE1155', 'Thushan Vithana', NULL, 1, 6, v_intern_type_id, '2023-12-01', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1156', 'LE1156', 'Bhashini Wijesinghe', NULL, 4, 6, v_intern_type_id, '2023-12-27', NULL, NULL, 'Inactive', 0, 1.30, v_system_user_id, NOW()),
    ('EPFLE1157', 'LE1157', 'Himasha Rodrigo', NULL, 4, 6, v_intern_type_id, '2024-03-19', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1158', 'LE1158', 'Dinithi Rajapaksha', NULL, 4, 6, v_intern_type_id, '2024-04-08', NULL, NULL, 'Inactive', 0, 0.45, v_system_user_id, NOW()),
    ('EPFLE1160', 'LE1160', 'Thilini Perera', NULL, NULL, 6, v_intern_type_id, '2024-07-15', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1161', 'LE1161', 'Gehara Samarawickrema', NULL, NULL, 6, v_intern_type_id, '2024-07-15', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1162', 'LE1162', 'Chanumi Wijegunasinghe', NULL, 4, 6, v_intern_type_id, '2024-08-05', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1163', 'LE1163', 'Shifaur Rahman', NULL, 8, 6, v_intern_type_id, '2024-08-20', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1164', 'LE1164', 'Jazeel Ariff', NULL, 8, 6, v_intern_type_id, '2024-09-02', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1165', 'LE1165', 'Nuwanga Wijamuni', NULL, 8, 6, v_intern_type_id, '2024-10-01', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1166', 'LE1166', 'Sandali Anjana', NULL, 4, 6, v_intern_type_id, '2024-10-01', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1167', 'LE1167', 'Asela Hendavitharana', NULL, 4, 6, v_intern_type_id, '2024-10-21', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1168', 'LE1168', 'Dilshan Lakruwan', NULL, 8, 6, v_intern_type_id, '2024-10-23', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1169', 'LE1169', 'Miyuru Manakal', NULL, 4, 6, v_intern_type_id, '2024-10-29', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1170', 'LE1170', 'Dumuthu Jayasinghe', NULL, 3, 6, v_intern_type_id, '2024-11-27', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1171', 'LE1171', 'Gaveesha Wickrama', NULL, 3, 6, v_intern_type_id, '2024-12-10', NULL, NULL, 'Inactive', 100, 0.83, v_system_user_id, NOW()),
    ('EPFLE1172', 'LE1172', 'Wasundarani Samaranayaka', NULL, 4, 6, v_intern_type_id, '2024-12-16', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1173', 'LE1173', 'Kulani Karunaratne', NULL, NULL, 6, v_intern_type_id, '2025-01-20', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1174', 'LE1174', 'Anjana Silva', NULL, 3, 6, v_intern_type_id, '2025-01-20', NULL, NULL, 'Inactive', 100, 2.83, v_system_user_id, NOW()),
    ('EPFLE1175', 'LE1175', 'Hirun De Alwis', NULL, 3, 6, v_intern_type_id, '2025-02-03', NULL, NULL, 'Active', 100, 2.84, v_system_user_id, NOW()),
    ('EPFLE1176', 'LE1176', 'Upeka Silva', NULL, 3, 6, v_intern_type_id, '2025-02-10', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1177', 'LE1177', 'Lahiru Nanayakkara', NULL, 1, 6, v_intern_type_id, '2025-03-03', NULL, NULL, 'Active', 100, 0.50, v_system_user_id, NOW()),
    ('EPFLE1178', 'LE1178', 'Savindya Abeysingha', NULL, 1, 6, v_intern_type_id, '2025-03-05', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1179', 'LE1179', 'Minidu Arunasiri', NULL, 4, 6, v_intern_type_id, '2025-03-05', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1180', 'LE1180', 'Udula Sinhalage', NULL, NULL, 6, v_intern_type_id, '2025-03-10', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1181', 'LE1181', 'Sakila Sanharsha', NULL, 4, 6, v_intern_type_id, '2025-03-10', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1182', 'LE1182', 'Tharani De Silva', NULL, NULL, 6, v_intern_type_id, '2025-03-10', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1183', 'LE1183', 'Isuru Madhushan', NULL, NULL, 6, v_intern_type_id, '2025-03-10', NULL, NULL, 'Active', 100, 0.50, v_system_user_id, NOW()),
    ('EPFLE1184', 'LE1184', 'Yevin Rajapakse', NULL, NULL, 6, v_intern_type_id, '2025-03-10', NULL, NULL, 'Active', 100, 0.50, v_system_user_id, NOW()),
    ('EPFLE1185', 'LE1185', 'Tiyashi Pathiraja', NULL, NULL, 6, v_intern_type_id, '2025-03-10', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1186', 'LE1186', 'Shakishnavi Murugan', NULL, 1, 6, v_intern_type_id, '2025-03-10', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1187', 'LE1187', 'Rashmi Panditharathne', NULL, 4, 6, v_intern_type_id, '2025-03-24', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1188', 'LE1188', 'Rishan Muyeen', NULL, 1, 6, v_intern_type_id, '2025-03-24', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1189', 'LE1189', 'Malith Jayasinghe', NULL, NULL, 6, v_intern_type_id, '2025-04-28', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1190', 'LE1190', 'Umashini Silva', NULL, 1, 6, v_intern_type_id, '2025-04-28', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1191', 'LE1191', 'Hasini De Silva', NULL, NULL, 6, v_intern_type_id, '2025-05-02', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1192', 'LE1192', 'Sasanka Gamage', NULL, 1, 6, v_intern_type_id, '2025-06-05', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1193', 'LE1193', 'Navoda Wijesingha', NULL, 4, 6, v_intern_type_id, '2025-06-11', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1194', 'LE1194', 'Sandeepa Maddumage', NULL, NULL, 6, v_intern_type_id, '2025-06-25', NULL, NULL, 'Active', 100, 0.25, v_system_user_id, NOW()),
    ('EPFLE1195', 'LE1195', 'Abarni Jayarathnam ', NULL, NULL, 6, v_intern_type_id, '2025-07-07', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1196', 'LE1196', 'Charith Jayasankha', NULL, NULL, 6, v_intern_type_id, '2025-07-16', NULL, NULL, 'Active', 100, 0.75, v_system_user_id, NOW()),
    ('EPFLE1197', 'LE1197', 'Salini Wathsala', NULL, NULL, 6, v_intern_type_id, '2025-07-21', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1198', 'LE1198', 'Sriyan Abeynayake', NULL, 4, 6, v_intern_type_id, '2025-07-21', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1199', 'LE1199', 'Ishuwara Wedage', NULL, 9, 6, v_intern_type_id, '2025-07-21', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1200', 'LE1200', 'Chathuni Rathnathilake', NULL, 8, 6, v_intern_type_id, '2025-08-04', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE1201', 'LE1201', 'Gimhana Deshan', NULL, 9, 6, v_intern_type_id, '2025-08-20', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1202', 'LE1202', 'Mushahid Muzammir', NULL, 1, 6, v_intern_type_id, '2025-09-01', NULL, NULL, 'Inactive', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1203', 'LE1203', 'Laksitha Wijerathna', NULL, 1, 6, v_intern_type_id, '2025-09-01', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE1204', 'LE1204', 'Isuru Ranasinghe ', NULL, 1, 6, v_intern_type_id, '2025-09-04', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE4003', 'LE4003', 'Janaka Kumarasinghe', NULL, NULL, 5, v_permanent_type_id, '2019-09-24', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE4006', 'LE4006', 'Chanka Sonnadara', NULL, 3, 4, v_probation_type_id, '2024-09-05', NULL, NULL, 'Active', 100, 0.00, v_system_user_id, NOW()),
    ('EPFLE4007', 'LE4007', 'Dilshan Amarasinghe', NULL, 3, 4, v_probation_type_id, '2024-09-05', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFLE4008', 'LE4008', 'Nihinsa Rusandi', NULL, NULL, 4, v_probation_type_id, '2024-09-06', NULL, NULL, 'Inactive', 0, 0.00, v_system_user_id, NOW()),
    ('EPFMS0014', 'MS0014', 'Malishi Samarawickrema', NULL, NULL, 3, v_permanent_type_id, '2025-01-01', NULL, NULL, 'Active', 0, 0.00, v_system_user_id, NOW())
    ON CONFLICT (emp_no) WHERE deleted_at IS NULL DO UPDATE SET
        epf_no = EXCLUDED.epf_no,
        name = EXCLUDED.name,
        track_id = EXCLUDED.track_id,
        tech_stack_id = EXCLUDED.tech_stack_id,
        tier_id = EXCLUDED.tier_id,
        employee_type_id = EXCLUDED.employee_type_id,
        joined_date = EXCLUDED.joined_date,
        status = EXCLUDED.status,
        total_allocation = EXCLUDED.total_allocation,
        total_resource_billing = EXCLUDED.total_resource_billing,
        updated_by = v_system_user_id,
        updated_at = NOW();

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    RAISE NOTICE 'Inserted/Updated % employees', v_inserted_count;

    -- Allocate Active employees to Bench (excluding Synergy tier=5, Support track=8, Execs track=9)
    INSERT INTO allocations (
        employee_id, 
        project_id, 
        allocation_percentage,
        billing_percentage,
        allocated_date, 
        deallocated_date,
        created_by,
        created_at
    )
    SELECT 
        e.id,
        v_bench_project_id,
        100,
        0,
        COALESCE(e.joined_date, CURRENT_DATE),
        NULL,
        v_system_user_id,
        NOW()
    FROM employees e
    WHERE e.status = 'Active'
        AND (e.track_id IS NULL OR e.track_id NOT IN (8, 9))
        AND (e.tier_id IS NULL OR e.tier_id != 5)
        AND NOT EXISTS (
            SELECT 1 FROM allocations a 
            WHERE a.employee_id = e.id 
                AND a.project_id = v_bench_project_id
                AND a.deleted_at IS NULL
        );

    GET DIAGNOSTICS v_allocated_count = ROW_COUNT;
    RAISE NOTICE 'Allocated % employees to Bench project', v_allocated_count;
    RAISE NOTICE 'Bulk employee seeder completed successfully!';

END $$;