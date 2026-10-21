-- Cohort tables: staff of the host organisation manage them (app.org_id); learners read what they
--> statement-breakpoint
-- need through learning_system with explicit checks. Learner records are the learner's own.
--> statement-breakpoint
ALTER TABLE "cohorts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "cohorts_host_org" ON "cohorts" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "calendar_weeks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "calendar_weeks_host_org" ON "calendar_weeks" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "course_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "course_runs_host_org" ON "course_runs" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "class_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "class_sessions_host_org" ON "class_sessions" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "program_enrollments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "program_enrollments_own_records" ON "program_enrollments" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "elective_selections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "elective_selections_own_records" ON "elective_selections" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "attendance_own_or_host" ON "attendance" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid OR host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
