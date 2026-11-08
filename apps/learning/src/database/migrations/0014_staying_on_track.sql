CREATE TABLE "circle_progress_sharing" (
	"circle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"share" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "circle_progress_sharing_circle_id_user_id_pk" PRIMARY KEY("circle_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "learning_goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"why" text NOT NULL,
	"success" text,
	"study_days" text[] NOT NULL,
	"study_time" text,
	"minutes_per_week" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_reminders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"lapse_from" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_by_user_id" uuid,
	"returned_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "circle_posts" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "circle_posts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "calendar_weeks" ADD COLUMN "kind" text DEFAULT 'learning' NOT NULL;--> statement-breakpoint
ALTER TABLE "circle_progress_sharing" ADD CONSTRAINT "circle_progress_sharing_circle_id_dream_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."dream_circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_goals_owner_enrollment" ON "learning_goals" USING btree ("user_id","scope","enrollment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_reminders_once" ON "progress_reminders" USING btree ("enrollment_id","kind","lapse_from");--> statement-breakpoint
CREATE INDEX "progress_reminders_user_sent" ON "progress_reminders" USING btree ("user_id","sent_at");--> statement-breakpoint
ALTER TABLE "learning_goals" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "learning_goals_own_records" ON "learning_goals" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "learning_goals_system" ON "learning_goals" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "progress_reminders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "progress_reminders_own_records" ON "progress_reminders" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "progress_reminders_system" ON "progress_reminders" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "circle_progress_sharing" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "circle_progress_sharing_host_isolation" ON "circle_progress_sharing" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "circle_progress_sharing_system" ON "circle_progress_sharing" TO learning_system USING (true) WITH CHECK (true);
