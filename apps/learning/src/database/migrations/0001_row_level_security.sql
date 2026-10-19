-- Row-level security: a learner's records are visible to that learner only. The app role runs with
--> statement-breakpoint
-- set_config('app.user_id', ...) for the transaction (DatabaseService.tenant). Peers' discussion
--> statement-breakpoint
-- posts, poll results and statistics are read deliberately through learning_system.
--> statement-breakpoint
ALTER TABLE "course_enrollments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "course_enrollments_own_records" ON "course_enrollments" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "item_progress" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "item_progress_own_records" ON "item_progress" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "submissions_own_records" ON "submissions" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "grades" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "grades_own_records" ON "grades" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
-- Submissions and grades are evidence: append-only for the app role (ERD §2, rule 6).
--> statement-breakpoint
REVOKE UPDATE, DELETE ON "submissions" FROM learning_app;
--> statement-breakpoint
REVOKE UPDATE, DELETE ON "grades" FROM learning_app;
