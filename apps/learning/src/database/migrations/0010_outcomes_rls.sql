-- Row-level security for Slice 3 (residency, action plans, graduation, credentials, Dream Score,
--> statement-breakpoint
-- assigned learning): each organisation sees its own rows; learning_system has an explicit policy.
--> statement-breakpoint
ALTER TABLE "residency_stages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "residency_stages_host_isolation" ON "residency_stages" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "residency_stages_system" ON "residency_stages" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "residency_stage_reviews" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "residency_stage_reviews_host_isolation" ON "residency_stage_reviews" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "residency_stage_reviews_system" ON "residency_stage_reviews" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "action_plans" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "action_plans_host_isolation" ON "action_plans" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "action_plans_system" ON "action_plans" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "graduation_confirmations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "graduation_confirmations_host_isolation" ON "graduation_confirmations" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "graduation_confirmations_system" ON "graduation_confirmations" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "competency_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "competency_events_host_isolation" ON "competency_events" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "competency_events_system" ON "competency_events" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "dream_score_snapshots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "dream_score_snapshots_host_isolation" ON "dream_score_snapshots" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "dream_score_snapshots_system" ON "dream_score_snapshots" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "dream_score_weights" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "dream_score_weights_org_isolation" ON "dream_score_weights" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "dream_score_weights_system" ON "dream_score_weights" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "learning_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "learning_assignments_org_isolation" ON "learning_assignments" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "learning_assignments_system" ON "learning_assignments" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "learning_assignees" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "learning_assignees_org_isolation" ON "learning_assignees" USING (org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "learning_assignees_system" ON "learning_assignees" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "credentials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "credentials_own_or_issuer" ON "credentials" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid OR issuer_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (issuer_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "credentials_system" ON "credentials" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
-- Review history and Dream Score evidence are append-only for both service roles.
--> statement-breakpoint
REVOKE UPDATE, DELETE ON "residency_stage_reviews", "competency_events" FROM learning_app, learning_system;
