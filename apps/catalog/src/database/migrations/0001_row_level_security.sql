-- Row-level security: the catalog_app role only sees and writes rows owned by the organisation set
--> statement-breakpoint
-- with set_config('app.org_id', ...) (DatabaseService.tenant): authoring is per organisation.
--> statement-breakpoint
-- Cross-tenant reads (the public catalog, learners' content) go through catalog_system with explicit filters.
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "courses_owner_isolation" ON "courses" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "course_versions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "course_versions_owner_isolation" ON "course_versions" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "modules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "modules_owner_isolation" ON "modules" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "content_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "content_items_owner_isolation" ON "content_items" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "assessments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "assessments_owner_isolation" ON "assessments" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "questions_owner_isolation" ON "questions" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "rubrics" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "rubrics_owner_isolation" ON "rubrics" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "rubric_criteria" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "rubric_criteria_owner_isolation" ON "rubric_criteria" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "assignment_specs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "assignment_specs_owner_isolation" ON "assignment_specs" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "catalog_listings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "catalog_listings_owner_isolation" ON "catalog_listings" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "programs_owner_isolation" ON "programs" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "program_phases" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "program_phases_owner_isolation" ON "program_phases" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "elective_groups" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "elective_groups_owner_isolation" ON "elective_groups" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "program_courses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "program_courses_owner_isolation" ON "program_courses" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "graduation_requirements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "graduation_requirements_owner_isolation" ON "graduation_requirements" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "capstone_stage_defs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "capstone_stage_defs_owner_isolation" ON "capstone_stage_defs" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "program_calendar_weeks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "program_calendar_weeks_owner_isolation" ON "program_calendar_weeks" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
