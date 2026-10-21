CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY NOT NULL,
	"class_session_id" uuid NOT NULL,
	"program_enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"status" text NOT NULL,
	"minutes" integer,
	"source" text DEFAULT 'override' NOT NULL,
	"marked_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_session_user" UNIQUE("class_session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_weeks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cohort_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"week_no" integer NOT NULL,
	"phase_name" text NOT NULL,
	"focus" text NOT NULL,
	"major_output" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cohort_id" uuid NOT NULL,
	"course_run_id" uuid,
	"host_org_id" uuid NOT NULL,
	"week_no" integer NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"mode" text NOT NULL,
	"location" text,
	"cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"program_slug" text NOT NULL,
	"program_title" text NOT NULL,
	"host_org_id" uuid NOT NULL,
	"host_org_name" text NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"weeks" integer NOT NULL,
	"time_zone" text NOT NULL,
	"capacity" integer,
	"enrollment_policy" text DEFAULT 'invite' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"rhythm" jsonb NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cohort_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"course_slug" text NOT NULL,
	"course_version_id" uuid,
	"phase_name" text NOT NULL,
	"required" boolean NOT NULL,
	"elective_group_key" text,
	"credit_hours" numeric NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elective_selections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"group_key" text NOT NULL,
	"course_id" uuid NOT NULL,
	"course_slug" text NOT NULL,
	"selected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "elective_selections_enrollment_course" UNIQUE("program_enrollment_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "program_enrollments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"program_slug" text NOT NULL,
	"cohort_id" uuid NOT NULL,
	"context_org_id" uuid NOT NULL,
	"access_grant_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_enrollments_user_cohort" UNIQUE("user_id","cohort_id")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_session_id_class_sessions_id_fk" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_program_enrollment_id_program_enrollments_id_fk" FOREIGN KEY ("program_enrollment_id") REFERENCES "public"."program_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_weeks" ADD CONSTRAINT "calendar_weeks_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_course_run_id_course_runs_id_fk" FOREIGN KEY ("course_run_id") REFERENCES "public"."course_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elective_selections" ADD CONSTRAINT "elective_selections_program_enrollment_id_program_enrollments_id_fk" FOREIGN KEY ("program_enrollment_id") REFERENCES "public"."program_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_weeks_cohort_week" ON "calendar_weeks" USING btree ("cohort_id","week_no");--> statement-breakpoint
CREATE INDEX "class_sessions_cohort_start" ON "class_sessions" USING btree ("cohort_id","starts_at");