-- Auto-generated seed from CSV
INSERT INTO employees (
    epf_no, emp_no, name, track_id, tech_stack_id, tier_id,
    designation_id, employee_type_id, university_id,
    joined_date, status, global_employee_id, is_external
) SELECT * FROM (
  VALUES
    ('LE00521', 'LE00521', 'Akeel Aliyar',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-06-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-2', false),
    ('LE00005', 'LE00005', 'Randika Swaris',
     10::integer, -- track_id
     2::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Delivery Architect / Head of Engineering and overall GDC Lead' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2014-04-09', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-3', false),
    ('LE00134', 'LE00134', 'Thusitha Dissanayake',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     1::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Architect' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2016-10-16', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-4', false),
    ('LE00161', 'LE00161', 'Chathuri Pemananda',
     8::integer, -- track_id
     14::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Senior UX Designer' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2017-01-15', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-5', false),
    ('LE00208', 'LE00208', 'Gihan Lakmal',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     1::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Architect' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2017-06-25', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-6', false),
    ('LE00209', 'LE00209', 'Dinithi Mudugamuwarachchi',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2017-07-02', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-7', false),
    ('LE00289', 'LE00289', 'Chamalka Gamaralalage',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ATL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2018-04-01', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-8', false),
    ('LE00320', 'LE00320', 'Nirmala Katupothage',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'QAL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2018-10-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-9', false),
    ('LE00337', 'LE00337', 'Indumini Wijedasa',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'TL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2019-01-20', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-10', false),
    ('LE00357', 'LE00357', 'Gayashan Galagedara',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'TL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2019-05-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-11', false),
    ('LE00373', 'LE00373', 'Selvarajah Arudkumaran',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'TL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2019-07-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-12', false),
    ('LE00376', 'LE00376', 'Harindu Meellage',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'TL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2019-08-11', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-13', false),
    ('LE00385', 'LE00385', 'Isuru Rodrigo',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2019-11-03', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-14', false),
    ('LE00395', 'LE00395', 'Kaweesha De Alwis',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2020-02-09', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-15', false),
    ('LE00398', 'LE00398', 'Mahen Jayasena',
     8::integer, -- track_id
     14::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Senior Lead - UI' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2020-03-01', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-16', false),
    ('LE00416', 'LE00416', 'Dilshan Wijesinghe',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2021-02-03', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-17', false),
    ('LE00430', 'LE00430', 'Danthila Dissanayake',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SSE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2021-09-14', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-18', false),
    ('LE00446', 'LE00446', 'Mahendra Thammita',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SSE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2021-11-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-19', false),
    ('LE00448', 'LE00448', 'Athula Chandrawansha',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SSE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2021-12-12', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-20', false),
    ('LE00453', 'LE00453', 'Odara Pathirana',
     4::integer, -- track_id
     15::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SBA' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-01-23', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-21', false),
    ('LE00454', 'LE00454', 'Sandeepa Fernando',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SSE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-01-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-22', false),
    ('EC0050', 'EC0050', 'Pravin Vishvanatharajah',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'STL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-03-01', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-23', false),
    ('LE00462', 'LE00462', 'Randika Madushan',
     3::integer, -- track_id
     16::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Senior UI/UX Designer' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-03-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-24', false),
    ('EC0045', 'EC0045', 'Chaminda Pragnarathne',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'STL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-03-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-25', false),
    ('LE00470', 'LE00470', 'Randika Padmashali',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-05-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-26', false),
    ('LE00471', 'LE00471', 'Disal Isurinda',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-05-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-27', false),
    ('LE00472', 'LE00472', 'Tharukshi Wickramasinghe',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-05-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-28', false),
    ('LE00474', 'LE00474', 'Chathurika Sandamali',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-05-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-29', false),
    ('LE00476', 'LE00476', 'Tamasha Bandara',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'QAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-05-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-30', false),
    ('LE00477', 'LE00477', 'Pasindu Weerakoon',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ATL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-06-14', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-31', false),
    ('LE00478', 'LE00478', 'Sithumini Jayasinghe',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-06-19', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-32', false),
    ('LE00479', 'LE00479', 'Charith Bandara',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'QAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-06-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-33', false),
    ('LE00480', 'LE00480', 'Tashila Kumara',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-06-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-34', false),
    ('LE00481', 'LE00481', 'Manoj Dharmawardhana',
     8::integer, -- track_id
     14::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'UI/UX Designer' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-06-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-35', false),
    ('LE00484', 'LE00484', 'Tilanga Pramith',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ATL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-08-07', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-36', false),
    ('LE00487', 'LE00487', 'Raveen Deemantha',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-09-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-37', false),
    ('LE00488', 'LE00488', 'Sandun Rajapaksha',
     8::integer, -- track_id
     14::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'UI/UX Designer' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-09-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-38', false),
    ('LE00493', 'LE00493', 'Sandunika Wasala',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-11-02', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-39', false),
    ('LE00497', 'LE00497', 'Tharindu Siriwardana',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-12-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-40', false),
    ('LE00501', 'LE00501', 'Srimali Ranawaka',
     3::integer, -- track_id
     7::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE - UI' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-01-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-41', false),
    ('LE00502', 'LE00502', 'Methmini Abeysekara',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-01-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-42', false),
    ('LE00503', 'LE00503', 'Shanka De Silva',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'QAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-01-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-43', false),
    ('EC0033', 'EC0033', 'Hiran Sirimanna',
     10::integer, -- track_id
     13::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Associate Director - Dynamics F&O' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-02-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-44', false),
    ('LE00504', 'LE00504', 'Vihanga Perera',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-02-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-45', false),
    ('LE00505', 'LE00505', 'Anudi Divarathne',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-02-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-46', false),
    ('LE00506', 'LE00506', 'Kalaru Pramudith',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-02-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-47', false),
    ('LE00507', 'LE00507', 'Prasad Rathnayake',
     2::integer, -- track_id
     9::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Senior Engineer - Analytics and Data Science' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-02-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-48', false),
    ('LE00508', 'LE00508', 'Sahan Kumarasiri',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-02-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-49', false),
    ('LE00509', 'LE00509', 'Navindu Seran',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-02-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-50', false),
    ('LE00511', 'LE00511', 'Amaniya Faizal',
     3::integer, -- track_id
     7::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE - UI' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-03-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-51', false),
    ('LE00513', 'LE00513', 'Rayaz Muthalif',
     10::integer, -- track_id
     2::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Principal Solutions Architect' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-03-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-52', false),
    ('LE00514', 'LE00514', 'Rashmika Rajapaksha',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-04-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-53', false),
    ('LE00515', 'LE00515', 'Murugesh Sujan',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-04-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-54', false),
    ('LE00518', 'LE00518', 'Thilini Pathirana',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'QAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-05-29', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-55', false),
    ('LE00520', 'LE00520', 'Hansi Thathsarani',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'QAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-06-14', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-56', false),
    ('LE00523', 'LE00523', 'Madushan Neelananda',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-07-10', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-57', false),
    ('LE00524', 'LE00524', 'Saavi Kalupahana',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-07-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-58', false),
    ('LE00526', 'LE00526', 'Suran Wijesekara',
     4::integer, -- track_id
     15::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Associate - Business Analyst' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-08-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-59', false),
    ('LE00527', 'LE00527', 'Bhagya Hettiarachchi',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'QAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-09-10', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-60', false),
    ('LE00529', 'LE00529', 'Kalika Ranasinghe',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ATL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-12-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-61', false),
    ('LE00536', 'LE00536', 'Lahiru Madusanka',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-02-29', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-62', false),
    ('LE00537', 'LE00537', 'Sankha Yapa',
     2::integer, -- track_id
     13::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-03-19', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-63', false),
    ('LE00539', 'LE00539', 'Amir Hafi',
     2::integer, -- track_id
     9::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Engineer - Analytics and Data Science' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-03-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-64', false),
    ('LE00540', 'LE00540', 'Avanthi Amunugama',
     10::integer, -- track_id
     15::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Associate Director – Project Management and Business Consulting' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-05-01', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-65', false),
    ('LE00001', 'LE00001', 'Prasath Nanayakkara',
     9::integer, -- track_id
     18::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'CEO' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2013-12-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-66', false),
    ('LE00341', 'LE00341', 'Thanuja Jayaweera',
     6::integer, -- track_id
     11::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Director - Finance' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2019-02-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-67', false),
    ('LE00386', 'LE00386', 'Dinusha Weerasinghe',
     6::integer, -- track_id
     19::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Associate Lead - IT & Administration' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2019-12-15', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-68', false),
    ('LE00409', 'LE00409', 'Melantha Perera',
     6::integer, -- track_id
     11::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Senior Accountant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2020-09-01', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-69', false),
    ('LE00489', 'LE00489', 'Thilina Dilshan',
     6::integer, -- track_id
     11::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Junior Executive - Finance' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2022-10-03', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-70', false),
    ('LE00525', 'LE00525', 'Hashini Samarasinghe',
     6::integer, -- track_id
     17::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Junior Executive - HR' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-08-12', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-71', false),
    ('LE00541', 'LE00541', 'Chathurika Fernando',
     6::integer, -- track_id
     11::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Accounts Assistant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-05-02', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-72', false),
    ('LE00542', 'LE00542', 'Maneesha Samarajeewa',
     6::integer, -- track_id
     17::integer, -- tech_stack_id
     7::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Director - People & Culture' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-06-02', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-73', false),
    ('EC0047', 'EC0047', 'Dilukshika Liyanage',
     6::integer, -- track_id
     17::integer, -- tech_stack_id
     6::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'External Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2023-12-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-74', false),
    ('LE00543', 'LE00543', 'Pulara Weerasinghe',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-06-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-75', false),
    ('LE4006', 'LE4006', 'Chanka Sonnadara',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-09-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-76', false),
    ('LE00545', 'LE00545', 'Vishmi Perera',
     6::integer, -- track_id
     20::integer, -- tech_stack_id
     1::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Senior Manager - Sales & Marketing' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-09-03', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-77', false),
    ('LE00547', 'LE00547', 'Kasun Mahaliyanaarachchi',
     2::integer, -- track_id
     9::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Technical Lead - Analytics & Data Science' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-10-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-78', false),
    ('LE00549', 'LE00549', 'Sapumal Thepulangoda',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     2::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'TL' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Permanent' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2024-11-24', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-79', false),
    ('LE4009', 'LE4009', 'Lahiru Nanayakkara',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-03-02', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-80', false),
    ('LE00552', 'LE00552', 'Dilshan Amarasinghe',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-03-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-81', false),
    ('LE1178', 'LE1178', 'Savindya Abeysingha',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-03-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-82', false),
    ('LE00567', 'LE00567', 'Minidu Arunasiri',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-03-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-83', false),
    ('LE00568', 'LE00568', 'Sakila Sanharsha',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-03-09', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-84', false),
    ('LE00569', 'LE00569', 'Tharani De Silva',
     5::integer, -- track_id
     5::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Associate - Project Management' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-03-09', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-85', false),
    ('LE1184', 'LE1184', 'Yevin Rajapakse',
     5::integer, -- track_id
     5::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - PM' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-03-09', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-86', false),
    ('LE4010', 'LE4010', 'Shakishnavi Murugan',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-03-09', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-87', false),
    ('LE1188', 'LE1188', 'Rishan Muyeen',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-03-23', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-88', false),
    ('LE00554', 'LE00554', 'Sherone Fernando',
     6::integer, -- track_id
     19::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Junior Executive -Admin/IT' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-04-06', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-89', false),
    ('LE00555', 'LE00555', 'Thilini Perera',
     5::integer, -- track_id
     15::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Associate - Project Management' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-04-14', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-90', false),
    ('LE1189', 'LE1189', 'Malith Jayasinghe',
     2::integer, -- track_id
     NULL::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-04-27', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-91', false),
    ('LE1190', 'LE1190', 'Umashini Silva',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-04-27', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-92', false),
    ('EC0084', 'EC0084', 'Senira Jayathilake',
     2::integer, -- track_id
     NULL::integer, -- tech_stack_id
     6::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'External Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-04-27', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-93', false),
    ('LE1191', 'LE1191', 'Hasini De Silva',
     2::integer, -- track_id
     NULL::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-05-01', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-94', false),
    ('LE1192', 'LE1192', 'Sasanka Gamage',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-06-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-95', false),
    ('LE1193', 'LE1193', 'Navoda Wijesingha',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - QA' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-06-10', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-96', false),
    ('LE1196', 'LE1196', 'Charith Jayasankha',
     2::integer, -- track_id
     NULL::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-15', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-97', false),
    ('LE1197', 'LE1197', 'Salini Wathsala',
     6::integer, -- track_id
     17::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - HR' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-20', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-98', false),
    ('LE1198', 'LE1198', 'Sriyan Abeynayake',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - QA' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-20', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-99', false),
    ('EC0086', 'EC0086', 'Chamath Randula',
     2::integer, -- track_id
     NULL::integer, -- tech_stack_id
     6::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'External Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-06', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-100', false),
    ('EC0085', 'EC0085', 'Sachini Ishanka',
     2::integer, -- track_id
     NULL::integer, -- tech_stack_id
     6::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'External Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-06', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-101', false),
    ('LE1200', 'LE1200', 'Chathuni Rathnathilake',
     2::integer, -- track_id
     9::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - Analytics & Data Science' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-08-03', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-102', false),
    ('LE00561', 'LE00561', 'Roshith De Silva',
     6::integer, -- track_id
     17::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Junior Executive - HR' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-08-04', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-103', false),
    ('LE00558', 'LE00558', 'Dumuthu Jayasinghe',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'ASE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-104', false),
    ('LE00559', 'LE00559', 'Dilshan Lakruwan',
     2::integer, -- track_id
     9::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Associate Engineer - Analytics and Data Science' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-105', false),
    ('LE00560', 'LE00560', 'Sandali Anjana',
     1::integer, -- track_id
     1::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'AQAE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-07-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-106', false),
    ('LE00562', 'LE00562', 'Ruhini Udawatte',
     11::integer, -- track_id
     24::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'BA - BC Functional Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-08-17', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-107', false),
    ('LE1201', 'LE1201', 'Gimhana Deshan',
     2::integer, -- track_id
     8::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-08-19', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-108', false),
    ('LE1203', 'LE1203', 'Laksitha Wijerathna',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-08-31', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-109', false),
    ('LE1204', 'LE1204', 'Isuru Ranasinghe',
     2::integer, -- track_id
     2::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-09-03', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-110', false),
    ('EC0090', 'EC0090', 'Sandali Hettikanda',
     11::integer, -- track_id
     24::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SBA - BC Functional Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-10-05', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-111', false),
    ('EC0091', 'EC0091', 'Ghulam Rasool',
     2::integer, -- track_id
     23::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'External Architect' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-10-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-112', false),
    ('LE00565', 'LE00565', 'Thilina Abeysirigunawardana',
     11::integer, -- track_id
     24::integer, -- tech_stack_id
     3::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SBA - BC Functional Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2025-11-30', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-113', false),
    ('LE00566', 'LE00566', 'Hirun De Alwis',
     2::integer, -- track_id
     3::integer, -- tech_stack_id
     4::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'SE' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Probation' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-01-28', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-114', false),
    ('LE1205', 'LE1205', 'Poojani Perera',
     6::integer, -- track_id
     22::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - Sales & Marketing' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-02-10', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-115', false),
    ('EC0094', 'EC0094', 'Nilhan De Mel',
     6::integer, -- track_id
     22::integer, -- tech_stack_id
     6::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'External Consultant' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Contract' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-02-01', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-116', false),
    ('LE1206', 'LE1206', 'Gagana Perera',
     5::integer, -- track_id
     5::integer, -- tech_stack_id
     5::integer, -- tier_id
     (SELECT id FROM designations WHERE name = 'Intern - PM' LIMIT 1),
     (SELECT id FROM employee_types WHERE name = 'Intern' LIMIT 1),
     (SELECT id FROM universities WHERE name = 'Unknown' LIMIT 1),
     COALESCE('2026-03-08', '2000-01-01')::DATE, 'Active'::employee_status, 'EMP0-117', false)
) AS v(epf_no, emp_no, name, track_id, tech_stack_id, tier_id, designation_id, employee_type_id, university_id, joined_date, status, global_employee_id, is_external)
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE emp_no = v.emp_no);

INSERT INTO tags (name, description, color, is_active, is_default)
VALUES ('Account Manager', 'Account Manager', '#D32F2F', true, false)
ON CONFLICT (name) DO NOTHING;
