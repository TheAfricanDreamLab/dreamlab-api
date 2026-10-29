CREATE TABLE "circle_members" (
	"circle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	CONSTRAINT "circle_members_circle_id_user_id_pk" PRIMARY KEY("circle_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "dream_circles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cohort_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"event" text NOT NULL,
	"room_name" text NOT NULL,
	"identity" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "mentor_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cohort_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"learner_user_id" uuid NOT NULL,
	"assigned_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mentor_meetings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"assignment_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"mode" text NOT NULL,
	"location" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"class_session_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"path" text NOT NULL,
	"content_type" text NOT NULL,
	"size" bigint NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circle_id_dream_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."dream_circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dream_circles" ADD CONSTRAINT "dream_circles_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_meetings" ADD CONSTRAINT "mentor_meetings_assignment_id_mentor_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."mentor_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_class_session_id_class_sessions_id_fk" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "circle_members_user" ON "circle_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dream_circles_cohort" ON "dream_circles" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "meeting_events_room_identity" ON "meeting_events" USING btree ("room_name","identity","occurred_at");--> statement-breakpoint
CREATE INDEX "mentor_assignments_mentor" ON "mentor_assignments" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX "mentor_assignments_learner" ON "mentor_assignments" USING btree ("learner_user_id");--> statement-breakpoint
CREATE INDEX "mentor_assignments_cohort" ON "mentor_assignments" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "mentor_meetings_assignment" ON "mentor_meetings" USING btree ("assignment_id","scheduled_at");
--> statement-breakpoint
-- Row-level security: organisation tables by host organisation; learning_system works across them through explicit policies.
--> statement-breakpoint
ALTER TABLE "recordings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "recordings_host_isolation" ON "recordings" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "recordings_system" ON "recordings" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "mentor_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "mentor_assignments_host_isolation" ON "mentor_assignments" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "mentor_assignments_system" ON "mentor_assignments" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "mentor_meetings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "mentor_meetings_host_isolation" ON "mentor_meetings" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "mentor_meetings_system" ON "mentor_meetings" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "dream_circles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "dream_circles_host_isolation" ON "dream_circles" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "dream_circles_system" ON "dream_circles" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "circle_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "circle_members_host_isolation" ON "circle_members" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "circle_members_system" ON "circle_members" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
-- Raw provider events: the system role only.
--> statement-breakpoint
ALTER TABLE "meeting_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "meeting_events_system" ON "meeting_events" TO learning_system USING (true) WITH CHECK (true);
