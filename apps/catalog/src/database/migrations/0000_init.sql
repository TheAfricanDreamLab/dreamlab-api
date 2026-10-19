GRANT USAGE ON SCHEMA public TO catalog_app, catalog_system;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO catalog_app, catalog_system;--> statement-breakpoint
CREATE TABLE "assessments" (
	"content_item_id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"pass_mark" numeric NOT NULL,
	"max_attempts" integer,
	"time_limit_s" integer,
	"shuffle" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_specs" (
	"content_item_id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"rubric_id" uuid,
	"practical_output" text,
	"peer_reviews_required" integer DEFAULT 0 NOT NULL,
	"accepted_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_listings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"item_id" uuid NOT NULL,
	"channel" text DEFAULT 'public' NOT NULL,
	"free_audit" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"listed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"module_id" uuid NOT NULL,
	"course_version_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL,
	"item_type" text NOT NULL,
	"title" text NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"grade_weight" numeric DEFAULT 0 NOT NULL,
	"media_asset_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"credit_hours" numeric NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"content_hash" text NOT NULL,
	"reviewed_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"description" text NOT NULL,
	"provider" text NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"level" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"credit_hours" numeric NOT NULL,
	"outcomes" jsonb NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"audience" text NOT NULL,
	"prerequisites" text NOT NULL,
	"practical_output" text,
	"cover" jsonb NOT NULL,
	"instructors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_version_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"week_no" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"assessment_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL,
	"question_type" text NOT NULL,
	"body" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubric_criteria" (
	"id" uuid PRIMARY KEY NOT NULL,
	"rubric_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL,
	"criterion" text NOT NULL,
	"description" text NOT NULL,
	"max_points" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capstone_stage_defs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"output_document" text NOT NULL,
	"credit_hours" numeric NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elective_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"phase_id" uuid,
	"owner_org_id" uuid NOT NULL,
	"choose_n" integer NOT NULL,
	"select_by_week" integer,
	"capacity_per_option" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graduation_requirements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"rule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_calendar_weeks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"phase_id" uuid,
	"owner_org_id" uuid NOT NULL,
	"week_no" integer NOT NULL,
	"focus" text NOT NULL,
	"major_output" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"phase_id" uuid,
	"elective_group_id" uuid,
	"owner_org_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"credit_hours" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_phases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"week_from" integer,
	"week_to" integer,
	"weight_pct" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"description" text NOT NULL,
	"provider" text NOT NULL,
	"program_type" text NOT NULL,
	"delivery_mode" text NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"credit_total" numeric NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox" (
	"consumer" text NOT NULL,
	"event_id" uuid NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inbox_consumer_event_id_pk" PRIMARY KEY("consumer","event_id")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"org_id" uuid,
	"envelope" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_specs" ADD CONSTRAINT "assignment_specs_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_specs" ADD CONSTRAINT "assignment_specs_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_assessment_id_assessments_content_item_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("content_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capstone_stage_defs" ADD CONSTRAINT "capstone_stage_defs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elective_groups" ADD CONSTRAINT "elective_groups_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elective_groups" ADD CONSTRAINT "elective_groups_phase_id_program_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."program_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graduation_requirements" ADD CONSTRAINT "graduation_requirements_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_calendar_weeks" ADD CONSTRAINT "program_calendar_weeks_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_calendar_weeks" ADD CONSTRAINT "program_calendar_weeks_phase_id_program_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."program_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_phase_id_program_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."program_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_elective_group_id_elective_groups_id_fk" FOREIGN KEY ("elective_group_id") REFERENCES "public"."elective_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_phases" ADD CONSTRAINT "program_phases_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_listings_item_channel" ON "catalog_listings" USING btree ("item_type","item_id","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "content_items_version_key" ON "content_items" USING btree ("course_version_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "course_versions_course_no_key" ON "course_versions" USING btree ("course_id","version_no");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_key" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "modules_version_key" ON "modules" USING btree ("course_version_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_assessment_key" ON "questions" USING btree ("assessment_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "rubric_criteria_rubric_key" ON "rubric_criteria" USING btree ("rubric_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "program_calendar_weeks_program_week" ON "program_calendar_weeks" USING btree ("program_id","week_no");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_slug_key" ON "programs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "outbox" USING btree ("available_at") WHERE published_at is null;