-- Migration: 026_grant_hirun_superadmin
-- Ensures the live account gets the Super User role

UPDATE users 
SET role = 'Super User' 
WHERE email = 'hirun.dealwis@1billiontech.com' 
   OR username = 'hirun.dealwis@1billiontech.com';