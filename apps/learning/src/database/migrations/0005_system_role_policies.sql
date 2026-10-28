-- learning_system reads and writes every row through an explicit policy, instead of bypassing RLS as
--> statement-breakpoint
-- a member of the table owner (Azure Database for PostgreSQL cannot grant BYPASSRLS). deploy.sh
--> statement-breakpoint
-- then takes the owner role away, so the system connection can no longer change the schema.
--> statement-breakpoint
CREATE POLICY "attendance_system" ON "attendance" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "calendar_weeks_system" ON "calendar_weeks" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "class_sessions_system" ON "class_sessions" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "cohorts_system" ON "cohorts" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "course_enrollments_system" ON "course_enrollments" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "course_runs_system" ON "course_runs" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "elective_selections_system" ON "elective_selections" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "grades_system" ON "grades" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "item_progress_system" ON "item_progress" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "program_enrollments_system" ON "program_enrollments" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "submissions_system" ON "submissions" TO learning_system USING (true) WITH CHECK (true);
