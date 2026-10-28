CREATE TABLE "learner_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"course_enrollment_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"path" text NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learner_files" ADD CONSTRAINT "learner_files_course_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("course_enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learner_files_enrollment_item" ON "learner_files" USING btree ("course_enrollment_id","content_item_id");--> statement-breakpoint
-- A learner sees only their own files; learning_system checks access for graders and issues links.
--> statement-breakpoint
ALTER TABLE "learner_files" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "learner_files_own_records" ON "learner_files" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "learner_files_system" ON "learner_files" TO learning_system USING (true) WITH CHECK (true);
