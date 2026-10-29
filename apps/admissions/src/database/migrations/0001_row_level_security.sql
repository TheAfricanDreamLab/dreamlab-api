-- Row-level security: admissions_app sees the rows of the organisation set with set_config('app.org_id', ...);
--> statement-breakpoint
-- an applicant also sees their own applications (app.user_id). admissions_system has an explicit policy on every table.
--> statement-breakpoint
ALTER TABLE "admission_cycles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "admission_cycles_org_isolation" ON "admission_cycles" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "admission_cycles_system" ON "admission_cycles" TO admissions_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "applications_org_or_own" ON "applications" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid OR user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid OR user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "applications_system" ON "applications" TO admissions_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "stage_transitions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "stage_transitions_org_isolation" ON "stage_transitions" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "stage_transitions_system" ON "stage_transitions" TO admissions_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "application_reviews" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "application_reviews_org_isolation" ON "application_reviews" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "application_reviews_system" ON "application_reviews" TO admissions_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "ai_evaluations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "ai_evaluations_org_isolation" ON "ai_evaluations" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "ai_evaluations_system" ON "ai_evaluations" TO admissions_system USING (true) WITH CHECK (true);
--> statement-breakpoint
-- The pipeline's history is append-only for every role the service connects as: transitions, reviews
--> statement-breakpoint
-- and AI evaluations are never changed or removed (a changed mind is a new record).
--> statement-breakpoint
REVOKE UPDATE, DELETE ON "stage_transitions", "application_reviews", "ai_evaluations" FROM admissions_app, admissions_system;
