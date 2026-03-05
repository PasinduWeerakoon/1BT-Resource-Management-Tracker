-- Migration: 025_update_hirun_role
-- Upgrades hirun.dealwis@1billiontech.com to Super User

UPDATE users SET role = 'Super User' WHERE email = 'hirun.dealwis@1billiontech.com';
