CREATE TYPE "public"."account_type" AS ENUM('Internal', 'External');--> statement-breakpoint
CREATE TYPE "public"."allocation_change_type" AS ENUM('NEW_ALLOCATION', 'MODIFY_PERCENTAGE', 'MODIFY_BILLING', 'DEALLOCATE', 'AUTO_BENCH_ADJUSTMENT', 'LEGACY');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'EXPORT', 'BULK_UPDATE', 'RESTORE');--> statement-breakpoint
CREATE TYPE "public"."change_type" AS ENUM('CREATED', 'UPDATED', 'DELETED', 'RESTORED');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('Active', 'Inactive', 'Serving Notice Period', 'On Leave', 'Terminated');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('Active', 'Inactive', 'Completed', 'On Hold');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('Super User', 'Admin', 'User');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('Active', 'Inactive', 'Suspended', 'Pending');--> statement-breakpoint
CREATE TABLE "allocation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allocation_id" uuid,
	"employee_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"allocation_percentage" smallint NOT NULL,
	"billing_percentage" smallint NOT NULL,
	"billing_status_id" integer,
	"is_critical_shadow" boolean DEFAULT false,
	"critical_shadow_percentage" smallint,
	"allocation_start_date" date,
	"allocation_end_date" date,
	"is_active" boolean,
	"notes" text,
	"change_type" varchar(20) NOT NULL,
	"change_reason" text,
	"previous_values" jsonb,
	"changed_fields" text[],
	"effective_date" date DEFAULT CURRENT_DATE NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" uuid,
	"changed_by_username" varchar(50),
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "allocation_history_archive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_allocation_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"allocation_percentage" smallint NOT NULL,
	"billing_status_id" integer,
	"is_billable" boolean NOT NULL,
	"effective_date" date,
	"allocated_date" date NOT NULL,
	"deallocated_date" date,
	"original_allocated_date" date,
	"change_type" "allocation_change_type",
	"notes" text,
	"original_created_by" uuid,
	"original_created_at" timestamp with time zone,
	"original_updated_at" timestamp with time zone,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archive_reason" varchar(50) NOT NULL,
	"archived_by" uuid
);
--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"allocation_percentage" smallint NOT NULL,
	"billing_percentage" smallint NOT NULL,
	"billing_status_id" integer,
	"is_billable" boolean DEFAULT true NOT NULL,
	"is_critical_shadow" boolean DEFAULT false NOT NULL,
	"critical_shadow_percentage" smallint,
	"allocated_date" date DEFAULT CURRENT_DATE NOT NULL,
	"deallocated_date" date,
	"effective_date" date DEFAULT CURRENT_DATE NOT NULL,
	"original_allocated_date" date,
	"allocation_changed_on" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"change_type" "allocation_change_type" DEFAULT 'NEW_ALLOCATION',
	"notes" text,
	"source_future_id" uuid,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255),
	"user_name" varchar(255),
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"entity_name" varchar(255),
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" text[],
	"ip_address" "inet",
	"user_agent" text,
	"request_id" varchar(100),
	"service_name" varchar(50) NOT NULL,
	"api_endpoint" varchar(255),
	"metadata" jsonb,
	"message_id" varchar(100),
	"processed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "billing_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_order" smallint DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" varchar(100) NOT NULL,
	"client_code" varchar(20),
	"contact_person" varchar(100),
	"contact_email" varchar(100),
	"contact_phone" varchar(50),
	"address" varchar(500),
	"billing_address" varchar(500),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "clients_client_name_unique" UNIQUE("client_name"),
	CONSTRAINT "clients_client_code_unique" UNIQUE("client_code")
);
--> statement-breakpoint
CREATE TABLE "designation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"previous_designation_id" integer,
	"new_designation_id" integer NOT NULL,
	"previous_track" varchar(100),
	"new_track" varchar(100) NOT NULL,
	"change_type" varchar(30) NOT NULL,
	"change_reason" text,
	"effective_from" date DEFAULT CURRENT_DATE NOT NULL,
	"effective_until" date,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" uuid,
	"changed_by_username" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"is_intern_role" boolean DEFAULT false NOT NULL,
	"category" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_order" smallint DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "designations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "employee_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" uuid NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "employee_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"epf_no" varchar(20) NOT NULL,
	"emp_no" varchar(20) NOT NULL,
	"global_employee_id" varchar(50),
	"name" varchar(100) NOT NULL,
	"email" varchar(100),
	"phone_number" varchar(20),
	"track" varchar(100),
	"tech_stack" varchar(100),
	"tier" varchar(50),
	"designation_id" integer,
	"employee_type_id" integer,
	"university_id" integer,
	"joined_date" date,
	"last_increment_date" date,
	"last_promotion_date" date,
	"internship_completion_target_date" date,
	"notice_period_end_date" date,
	"status" "employee_status" DEFAULT 'Active' NOT NULL,
	"total_allocation" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_resource_billing" numeric(5, 2) DEFAULT '0' NOT NULL,
	"helper_id" uuid,
	"helper_is_external" boolean DEFAULT false NOT NULL,
	"skills" text[] DEFAULT '{}',
	"is_account_manager" boolean DEFAULT false NOT NULL,
	"photo_url" varchar(500),
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "future_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"allocation_percentage" smallint NOT NULL,
	"billing_percentage" smallint DEFAULT 100 NOT NULL,
	"effective_date" date NOT NULL,
	"allocated_date" date NOT NULL,
	"deallocated_date" date,
	"change_type" "allocation_change_type" NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"linked_future_id" uuid,
	"target_allocation_id" uuid,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"module" varchar(50) NOT NULL,
	"can_view" boolean DEFAULT false NOT NULL,
	"can_create" boolean DEFAULT false NOT NULL,
	"can_update" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_order" smallint DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_name" varchar(200) NOT NULL,
	"project_code" varchar(50),
	"project_type_id" integer,
	"account_type" "account_type" NOT NULL,
	"team_size" smallint DEFAULT 1 NOT NULL,
	"account_manager_id" uuid,
	"account_reg_sales_owner" varchar(100),
	"client_id" uuid,
	"project_start_date" date,
	"project_end_date" date,
	"billing_status_id" integer,
	"budget" numeric(15, 2),
	"status" "project_status" DEFAULT 'Active' NOT NULL,
	"description" text,
	"is_bench_project" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"color" varchar(7),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"short_name" varchar(50),
	"country" varchar(100) DEFAULT 'Sri Lanka',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "universities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'User' NOT NULL,
	"employee_id" uuid,
	"failed_login_attempts" smallint DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login" timestamp with time zone,
	"password_changed_at" timestamp with time zone DEFAULT now(),
	"must_change_password" boolean DEFAULT false NOT NULL,
	"status" "user_status" DEFAULT 'Pending' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "allocation_history" ADD CONSTRAINT "allocation_history_allocation_id_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."allocations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history" ADD CONSTRAINT "allocation_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history" ADD CONSTRAINT "allocation_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history" ADD CONSTRAINT "allocation_history_billing_status_id_billing_statuses_id_fk" FOREIGN KEY ("billing_status_id") REFERENCES "public"."billing_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history" ADD CONSTRAINT "allocation_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history_archive" ADD CONSTRAINT "allocation_history_archive_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history_archive" ADD CONSTRAINT "allocation_history_archive_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history_archive" ADD CONSTRAINT "allocation_history_archive_billing_status_id_billing_statuses_id_fk" FOREIGN KEY ("billing_status_id") REFERENCES "public"."billing_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history_archive" ADD CONSTRAINT "allocation_history_archive_original_created_by_users_id_fk" FOREIGN KEY ("original_created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocation_history_archive" ADD CONSTRAINT "allocation_history_archive_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_billing_status_id_billing_statuses_id_fk" FOREIGN KEY ("billing_status_id") REFERENCES "public"."billing_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designation_history" ADD CONSTRAINT "designation_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designation_history" ADD CONSTRAINT "designation_history_previous_designation_id_designations_id_fk" FOREIGN KEY ("previous_designation_id") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designation_history" ADD CONSTRAINT "designation_history_new_designation_id_designations_id_fk" FOREIGN KEY ("new_designation_id") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designation_history" ADD CONSTRAINT "designation_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tags" ADD CONSTRAINT "employee_tags_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tags" ADD CONSTRAINT "employee_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_type_id_employee_types_id_fk" FOREIGN KEY ("employee_type_id") REFERENCES "public"."employee_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "future_allocations" ADD CONSTRAINT "future_allocations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "future_allocations" ADD CONSTRAINT "future_allocations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "future_allocations" ADD CONSTRAINT "future_allocations_target_allocation_id_allocations_id_fk" FOREIGN KEY ("target_allocation_id") REFERENCES "public"."allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_type_id_project_types_id_fk" FOREIGN KEY ("project_type_id") REFERENCES "public"."project_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_manager_id_employees_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_billing_status_id_billing_statuses_id_fk" FOREIGN KEY ("billing_status_id") REFERENCES "public"."billing_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_alloc_history_employee" ON "allocation_history" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_alloc_history_project" ON "allocation_history" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_alloc_history_allocation" ON "allocation_history" USING btree ("allocation_id");--> statement-breakpoint
CREATE INDEX "idx_alloc_history_changed" ON "allocation_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "idx_alloc_history_effective" ON "allocation_history" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "idx_archive_employee" ON "allocation_history_archive" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_archive_project" ON "allocation_history_archive" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_archive_archived_at" ON "allocation_history_archive" USING btree ("archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "allocations_employee_project_unique" ON "allocations" USING btree ("employee_id","project_id") WHERE deleted_at IS NULL AND is_active = true;--> statement-breakpoint
CREATE INDEX "idx_allocations_employee" ON "allocations" USING btree ("employee_id") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_allocations_project" ON "allocations" USING btree ("project_id") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_allocations_effective" ON "allocations" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "idx_allocations_dates" ON "allocations" USING btree ("allocated_date","deallocated_date") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_allocations_totals" ON "allocations" USING btree ("employee_id","allocation_percentage","billing_percentage") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_audit_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id") WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_composite" ON "audit_logs" USING btree ("timestamp","action","entity_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_audit_message_id" ON "audit_logs" USING btree ("message_id") WHERE message_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_billing_statuses_active" ON "billing_statuses" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "idx_clients_active" ON "clients" USING btree ("is_active") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_designation_history_employee" ON "designation_history" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_designation_history_employee_date" ON "designation_history" USING btree ("employee_id","effective_from");--> statement-breakpoint
CREATE INDEX "idx_designations_active" ON "designations" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "idx_designations_level" ON "designations" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_designations_category" ON "designations" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_tags_unique" ON "employee_tags" USING btree ("employee_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_employee_tags_employee" ON "employee_tags" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_employee_tags_tag" ON "employee_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_epf_no_unique" ON "employees" USING btree ("epf_no") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_emp_no_unique" ON "employees" USING btree ("emp_no") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_unique" ON "employees" USING btree ("email") WHERE deleted_at IS NULL AND email IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_status" ON "employees" USING btree ("status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_track" ON "employees" USING btree ("track") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_designation" ON "employees" USING btree ("designation_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_tier" ON "employees" USING btree ("tier") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_tech_stack" ON "employees" USING btree ("tech_stack") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_type" ON "employees" USING btree ("employee_type_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_allocation" ON "employees" USING btree ("total_allocation") WHERE status = 'Active' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_account_manager" ON "employees" USING btree ("is_account_manager") WHERE is_account_manager = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_employees_name" ON "employees" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_employees_active_list" ON "employees" USING btree ("status","track","designation_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_future_alloc_employee" ON "future_allocations" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_future_alloc_project" ON "future_allocations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_future_alloc_scheduled" ON "future_allocations" USING btree ("effective_date","status") WHERE status = 'scheduled';--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_user_module_unique" ON "permissions" USING btree ("user_id","module");--> statement-breakpoint
CREATE INDEX "idx_project_types_active" ON "project_types" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_name_unique" ON "projects" USING btree ("project_name") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_code_unique" ON "projects" USING btree ("project_code") WHERE deleted_at IS NULL AND project_code IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_projects_manager" ON "projects" USING btree ("account_manager_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_projects_client" ON "projects" USING btree ("client_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_projects_bench" ON "projects" USING btree ("is_bench_project") WHERE is_bench_project = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_projects_type" ON "projects" USING btree ("project_type_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_projects_billing" ON "projects" USING btree ("billing_status_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email") WHERE deleted_at IS NULL;