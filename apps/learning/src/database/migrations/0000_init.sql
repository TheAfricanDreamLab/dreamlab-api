-- Grants. The roles learning_app (RLS enforced) and learning_system (BYPASSRLS) are created by infra (docker/postgres/init.sql in development).
GRANT USAGE ON SCHEMA public TO learning_app, learning_system;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO learning_app, learning_system;--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"course_slug" text NOT NULL,
	"course_version_id" uuid NOT NULL,
	"course_run_id" uuid,
	"program_enrollment_id" uuid,
	"context_org_id" uuid,
	"access_grant_id" uuid,
	"access_source" text NOT NULL,
	"mode" text DEFAULT 'full' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"progress_pct" integer DEFAULT 0 NOT NULL,
	"completed_items" integer DEFAULT 0 NOT NULL,
	"total_items" integer NOT NULL,
	"final_score" numeric,
	"passed" boolean,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_enrollments_user_course_context" UNIQUE NULLS NOT DISTINCT("user_id","course_id","context_org_id")
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" uuid PRIMARY KEY NOT NULL,
	"submission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"grader_user_id" uuid,
	"ai_evaluation_id" uuid,
	"score" numeric NOT NULL,
	"rubric_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feedback" text,
	"supersedes_grade_id" uuid,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"item_key" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"progress_pct" numeric DEFAULT 0 NOT NULL,
	"position_s" integer,
	"step_index" integer DEFAULT 0 NOT NULL,
	"state" jsonb DEFAULT '{"stepIndex":0,"results":{},"responses":{}}'::jsonb NOT NULL,
	"row_version" bigint DEFAULT 1 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_enrollment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"item_key" text NOT NULL,
	"context_org_id" uuid,
	"kind" text NOT NULL,
	"block_id" text,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"body" text,
	"parent_id" uuid,
	"file_asset_ids" uuid[] DEFAULT '{}' NOT NULL,
	"client_command_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "grades" ADD CONSTRAINT "grades_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_progress" ADD CONSTRAINT "item_progress_course_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("course_enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_course_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("course_enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "item_progress_enrollment_item" ON "item_progress" USING btree ("course_enrollment_id","content_item_id");--> statement-breakpoint
CREATE INDEX "submissions_enrollment_item" ON "submissions" USING btree ("course_enrollment_id","content_item_id");--> statement-breakpoint
CREATE INDEX "submissions_course_item_block" ON "submissions" USING btree ("course_id","item_key","block_id");--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "outbox" USING btree ("available_at") WHERE published_at is null;