-- Grants. The roles admissions_app (RLS enforced) and admissions_system (relay, cross-organisation reads) are created by infra (docker/postgres/init.sql in development).
GRANT USAGE ON SCHEMA public TO admissions_app, admissions_system;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admissions_app, admissions_system;--> statement-breakpoint
CREATE TYPE "public"."cycle_status" AS ENUM('draft', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."review_recommendation" AS ENUM('advance', 'hold', 'decline');--> statement-breakpoint
CREATE TYPE "public"."admission_stage" AS ENUM('eligibility', 'application', 'dream_application', 'evidence', 'assessment', 'video', 'interview', 'scholarship', 'committee', 'decision');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('in_progress', 'under_review', 'admitted', 'waitlisted', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TABLE "admission_cycles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"program_slug" text NOT NULL,
	"program_title" text NOT NULL,
	"cohort_id" uuid,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"status" "cycle_status" DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_evaluations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"scores" jsonb NOT NULL,
	"dbpi" integer,
	"dsi" integer,
	"rationale" text NOT NULL,
	"input_digest" text NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"stage" "admission_stage" NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"scores" jsonb NOT NULL,
	"dbpi" integer,
	"dsi" integer,
	"recommendation" "review_recommendation" NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cycle_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"stage" "admission_stage" DEFAULT 'eligibility' NOT NULL,
	"status" "application_status" DEFAULT 'in_progress' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"interview" jsonb,
	"scholarship" jsonb,
	"decision" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_transitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"from_stage" "admission_stage",
	"to_stage" "admission_stage" NOT NULL,
	"status" "application_status" NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"by_applicant" boolean NOT NULL,
	"note" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_reviews" ADD CONSTRAINT "application_reviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_cycle_id_admission_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."admission_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_transitions" ADD CONSTRAINT "stage_transitions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admission_cycles_org_idx" ON "admission_cycles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "admission_cycles_program_idx" ON "admission_cycles" USING btree ("program_slug");--> statement-breakpoint
CREATE INDEX "ai_evaluations_application_idx" ON "ai_evaluations" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_reviews_application_idx" ON "application_reviews" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_cycle_user_uq" ON "applications" USING btree ("cycle_id","user_id");--> statement-breakpoint
CREATE INDEX "applications_user_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "applications_org_idx" ON "applications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "stage_transitions_application_idx" ON "stage_transitions" USING btree ("application_id","at");--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "outbox" USING btree ("available_at") WHERE published_at is null;