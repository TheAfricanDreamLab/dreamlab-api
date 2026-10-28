-- catalog_system reads and writes every row through an explicit policy, instead of bypassing RLS as
--> statement-breakpoint
-- a member of the table owner (Azure Database for PostgreSQL cannot grant BYPASSRLS). deploy.sh
--> statement-breakpoint
-- then takes the owner role away, so the system connection can no longer change the schema.
--> statement-breakpoint
CREATE POLICY "assessments_system" ON "assessments" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "assignment_specs_system" ON "assignment_specs" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "capstone_stage_defs_system" ON "capstone_stage_defs" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "catalog_listings_system" ON "catalog_listings" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "content_items_system" ON "content_items" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "course_drafts_system" ON "course_drafts" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "course_versions_system" ON "course_versions" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "courses_system" ON "courses" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "elective_groups_system" ON "elective_groups" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "graduation_requirements_system" ON "graduation_requirements" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "modules_system" ON "modules" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "program_calendar_weeks_system" ON "program_calendar_weeks" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "program_courses_system" ON "program_courses" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "program_phases_system" ON "program_phases" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "programs_system" ON "programs" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "questions_system" ON "questions" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "rubric_criteria_system" ON "rubric_criteria" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "rubrics_system" ON "rubrics" TO catalog_system USING (true) WITH CHECK (true);
