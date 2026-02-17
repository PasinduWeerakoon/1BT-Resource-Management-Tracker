-- Migration: 001_create_enums
-- Creates all PostgreSQL ENUM types for the application

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('Super User', 'Admin', 'User'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Suspended', 'Pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE employee_status AS ENUM ('Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE project_status AS ENUM ('Active', 'Inactive', 'Completed', 'On Hold'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_type AS ENUM ('Internal', 'External'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE change_type AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'RESTORED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE allocation_change_type AS ENUM ('NEW_ALLOCATION', 'MODIFY_PERCENTAGE', 'MODIFY_BILLING', 'DEALLOCATE', 'AUTO_BENCH_ADJUSTMENT', 'LEGACY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit_action AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'EXPORT', 'BULK_UPDATE', 'RESTORE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
