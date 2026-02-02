-- Migration: Convert track, tier, tech_stack from VARCHAR to INTEGER IDs
-- These columns will now store integer IDs that map to the shared configs:
-- - track_id -> TRACKS config in /opt/nodejs/configs/index.js
-- - tier_id -> TIERS config in /opt/nodejs/configs/index.js  
-- - tech_stack_id -> TECH_STACKS config in /opt/nodejs/configs/index.js

-- Step 1: Add new integer columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'track_id') THEN
        ALTER TABLE "employees" ADD COLUMN "track_id" integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tier_id') THEN
        ALTER TABLE "employees" ADD COLUMN "tier_id" integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tech_stack_id') THEN
        ALTER TABLE "employees" ADD COLUMN "tech_stack_id" integer;
    END IF;
END $$;--> statement-breakpoint

-- Step 2: Migrate existing VARCHAR data to integer IDs (TRACKS mapping)
UPDATE "employees" SET "track_id" = CASE "track"
    WHEN 'QA' THEN 1
    WHEN 'Dev' THEN 2
    WHEN 'UI' THEN 3
    WHEN 'BA' THEN 4
    WHEN 'PM' THEN 5
    WHEN 'Support' THEN 6
    WHEN 'Synergy' THEN 7
    WHEN 'UX' THEN 8
    WHEN 'Execs' THEN 9
    WHEN 'Delivery' THEN 10
    WHEN 'Functional Consultant - MS Dynamics 365' THEN 11
    ELSE NULL
END WHERE "track" IS NOT NULL AND "track_id" IS NULL;--> statement-breakpoint

-- Step 3: Migrate TIERS data
UPDATE "employees" SET "tier_id" = CASE "tier"
    WHEN 'Tier - 1' THEN 1
    WHEN 'Tier - 2' THEN 2
    WHEN 'Tier - 3' THEN 3
    WHEN 'Tier - 4' THEN 4
    WHEN 'Intern' THEN 5
    WHEN 'None' THEN 6
    WHEN 'Synergy' THEN 7
    ELSE NULL
END WHERE "tier" IS NOT NULL AND "tier_id" IS NULL;--> statement-breakpoint

-- Step 4: Migrate TECH_STACKS data
UPDATE "employees" SET "tech_stack_id" = CASE "tech_stack"
    WHEN 'QA' THEN 1
    WHEN '.NET' THEN 2
    WHEN 'Full Stack' THEN 3
    WHEN 'Synergy' THEN 4
    WHEN 'PM' THEN 5
    WHEN 'BA' THEN 6
    WHEN 'UI' THEN 7
    WHEN 'Java' THEN 8
    WHEN 'Data Science' THEN 9
    WHEN 'Power Apps' THEN 10
    WHEN 'Finance' THEN 11
    WHEN 'React' THEN 12
    WHEN 'Dynamics' THEN 13
    WHEN 'UX' THEN 14
    WHEN 'BA/PM' THEN 15
    WHEN 'UI/UX' THEN 16
    WHEN 'HR' THEN 17
    WHEN 'Execs' THEN 18
    WHEN 'Admin' THEN 19
    WHEN 'Marketing' THEN 20
    WHEN 'Drupal' THEN 21
    WHEN 'Sales & Marketing' THEN 22
    WHEN 'BC' THEN 23
    WHEN 'Business Central (Functional)' THEN 24
    WHEN 'AI/ML' THEN 25
    WHEN 'Blockchain' THEN 26
    ELSE NULL
END WHERE "tech_stack" IS NOT NULL AND "tech_stack_id" IS NULL;--> statement-breakpoint

-- Step 5: Drop old VARCHAR columns (only if new columns have data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'track') THEN
        ALTER TABLE "employees" DROP COLUMN "track";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tier') THEN
        ALTER TABLE "employees" DROP COLUMN "tier";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tech_stack') THEN
        ALTER TABLE "employees" DROP COLUMN "tech_stack";
    END IF;
END $$;--> statement-breakpoint

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_employees_track_id" ON "employees" ("track_id") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employees_tier_id" ON "employees" ("tier_id") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_employees_tech_stack_id" ON "employees" ("tech_stack_id") WHERE "deleted_at" IS NULL;--> statement-breakpoint

-- Step 7: Update designation_history table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'previous_track_id') THEN
        ALTER TABLE "designation_history" ADD COLUMN "previous_track_id" integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'new_track_id') THEN
        ALTER TABLE "designation_history" ADD COLUMN "new_track_id" integer;
    END IF;
END $$;--> statement-breakpoint

-- Step 8: Migrate designation_history track data
UPDATE "designation_history" SET "previous_track_id" = CASE "previous_track"
    WHEN 'QA' THEN 1 WHEN 'Dev' THEN 2 WHEN 'UI' THEN 3 WHEN 'BA' THEN 4
    WHEN 'PM' THEN 5 WHEN 'Support' THEN 6 WHEN 'Synergy' THEN 7 WHEN 'UX' THEN 8
    WHEN 'Execs' THEN 9 WHEN 'Delivery' THEN 10 WHEN 'Functional Consultant - MS Dynamics 365' THEN 11
    ELSE NULL
END WHERE "previous_track" IS NOT NULL AND "previous_track_id" IS NULL;--> statement-breakpoint

UPDATE "designation_history" SET "new_track_id" = CASE "new_track"
    WHEN 'QA' THEN 1 WHEN 'Dev' THEN 2 WHEN 'UI' THEN 3 WHEN 'BA' THEN 4
    WHEN 'PM' THEN 5 WHEN 'Support' THEN 6 WHEN 'Synergy' THEN 7 WHEN 'UX' THEN 8
    WHEN 'Execs' THEN 9 WHEN 'Delivery' THEN 10 WHEN 'Functional Consultant - MS Dynamics 365' THEN 11
    ELSE NULL
END WHERE "new_track" IS NOT NULL AND "new_track_id" IS NULL;--> statement-breakpoint

-- Step 9: Drop old designation_history columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'previous_track') THEN
        ALTER TABLE "designation_history" DROP COLUMN "previous_track";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designation_history' AND column_name = 'new_track') THEN
        ALTER TABLE "designation_history" DROP COLUMN "new_track";
    END IF;
END $$;--> statement-breakpoint

-- Step 10: Drop old indexes that may reference removed columns
DROP INDEX IF EXISTS "idx_employees_track";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_employees_tier";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_employees_tech_stack";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_employees_active_list";--> statement-breakpoint

-- Step 11: Recreate composite index with new column names
CREATE INDEX IF NOT EXISTS "idx_employees_active_list" ON "employees" ("status", "track_id", "designation_id") WHERE "deleted_at" IS NULL;
