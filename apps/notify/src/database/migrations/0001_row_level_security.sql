-- Row-level security: notify_app only sees and changes the rows of the person set with
--> statement-breakpoint
-- set_config('app.user_id', ...). notify_system delivers to many people at once through an explicit policy.
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "notifications_own_records" ON "notifications" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "notifications_system" ON "notifications" TO notify_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "notification_preferences_own_records" ON "notification_preferences" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "notification_preferences_system" ON "notification_preferences" TO notify_system USING (true) WITH CHECK (true);
