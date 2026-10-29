CREATE TABLE "learning_assignees" (
	"assignment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"course_enrollment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_assignees_assignment_id_user_id_pk" PRIMARY KEY("assignment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "learning_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"course_slug" text NOT NULL,
	"due_on" date,
	"note" text DEFAULT '' NOT NULL,
	"assigned_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "action_plans" (
	"program_enrollment_id" uuid PRIMARY KEY NOT NULL,
	"host_org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"decision" text,
	"feedback" text,
	"reviewer_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"kind" text NOT NULL,
	"user_id" uuid NOT NULL,
	"issuer_org_id" uuid,
	"program_enrollment_id" uuid,
	"course_enrollment_id" uuid,
	"recipient_name" text NOT NULL,
	"title" text NOT NULL,
	"issuer_name" text NOT NULL,
	"score_pct" numeric(5, 2),
	"credit_hours" numeric(6, 2),
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"revoked_by_user_id" uuid,
	CONSTRAINT "credentials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "graduation_confirmations" (
	"program_enrollment_id" uuid NOT NULL,
	"requirement_key" text NOT NULL,
	"host_org_id" uuid NOT NULL,
	"confirmed_by_user_id" uuid NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "graduation_confirmations_program_enrollment_id_requirement_key_pk" PRIMARY KEY("program_enrollment_id","requirement_key")
);
--> statement-breakpoint
CREATE TABLE "residency_stage_reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"residency_stage_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"decision" text NOT NULL,
	"score_pct" numeric(5, 2),
	"feedback" text NOT NULL,
	"reviewer_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "residency_stages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_enrollment_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone,
	"decision" text,
	"score_pct" numeric(5, 2),
	"feedback" text,
	"reviewer_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "residency_stages_enrollment_position" UNIQUE("program_enrollment_id","position")
);
--> statement-breakpoint
CREATE TABLE "competency_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_enrollment_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"dimension" text NOT NULL,
	"value" numeric(4, 2) NOT NULL,
	"source" text NOT NULL,
	"source_id" uuid NOT NULL,
	"label" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dream_score_snapshots" (
	"program_enrollment_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"week_no" integer NOT NULL,
	"learning" numeric(4, 2),
	"building" numeric(4, 2),
	"dream" numeric(4, 2),
	"dimensions" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dream_score_snapshots_program_enrollment_id_week_no_pk" PRIMARY KEY("program_enrollment_id","week_no")
);
--> statement-breakpoint
CREATE TABLE "dream_score_weights" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"weights" jsonb NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "program_enrollments" ADD COLUMN "graduated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "program_enrollments" ADD COLUMN "portfolio_token" text;--> statement-breakpoint
ALTER TABLE "learning_assignees" ADD CONSTRAINT "learning_assignees_assignment_id_learning_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."learning_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_program_enrollment_id_program_enrollments_id_fk" FOREIGN KEY ("program_enrollment_id") REFERENCES "public"."program_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graduation_confirmations" ADD CONSTRAINT "graduation_confirmations_program_enrollment_id_program_enrollments_id_fk" FOREIGN KEY ("program_enrollment_id") REFERENCES "public"."program_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residency_stage_reviews" ADD CONSTRAINT "residency_stage_reviews_residency_stage_id_residency_stages_id_fk" FOREIGN KEY ("residency_stage_id") REFERENCES "public"."residency_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residency_stages" ADD CONSTRAINT "residency_stages_program_enrollment_id_program_enrollments_id_fk" FOREIGN KEY ("program_enrollment_id") REFERENCES "public"."program_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_events" ADD CONSTRAINT "competency_events_program_enrollment_id_program_enrollments_id_fk" FOREIGN KEY ("program_enrollment_id") REFERENCES "public"."program_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dream_score_snapshots" ADD CONSTRAINT "dream_score_snapshots_program_enrollment_id_program_enrollments_id_fk" FOREIGN KEY ("program_enrollment_id") REFERENCES "public"."program_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_assignees_user_idx" ON "learning_assignees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_assignments_org_idx" ON "learning_assignments" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credentials_programme_once" ON "credentials" USING btree ("program_enrollment_id") WHERE kind = 'programme_graduation';--> statement-breakpoint
CREATE UNIQUE INDEX "credentials_course_once" ON "credentials" USING btree ("course_enrollment_id") WHERE kind = 'course_completion';--> statement-breakpoint
CREATE INDEX "credentials_user_idx" ON "credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "residency_stage_reviews_stage_idx" ON "residency_stage_reviews" USING btree ("residency_stage_id");--> statement-breakpoint
CREATE INDEX "residency_stages_host_idx" ON "residency_stages" USING btree ("host_org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competency_events_once" ON "competency_events" USING btree ("source","source_id","dimension");--> statement-breakpoint
CREATE INDEX "competency_events_enrollment_idx" ON "competency_events" USING btree ("program_enrollment_id","occurred_at");--> statement-breakpoint
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_portfolio_token_unique" UNIQUE("portfolio_token");