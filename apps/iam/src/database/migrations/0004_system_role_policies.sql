-- iam_system reads and writes every row through an explicit policy, instead of bypassing RLS as
--> statement-breakpoint
-- a member of the table owner (Azure Database for PostgreSQL cannot grant BYPASSRLS). deploy.sh
--> statement-breakpoint
-- then takes the owner role away, so the system connection can no longer change the schema.
--> statement-breakpoint
CREATE POLICY "enterprise_profiles_system" ON "enterprise_profiles" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "group_members_system" ON "group_members" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "groups_system" ON "groups" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "institution_profiles_system" ON "institution_profiles" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "invitations_system" ON "invitations" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "memberships_system" ON "memberships" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "org_domains_system" ON "org_domains" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "org_units_system" ON "org_units" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "organizations_system" ON "organizations" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "partner_profiles_system" ON "partner_profiles" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "role_assignments_system" ON "role_assignments" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "roles_system" ON "roles" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "scim_directories_system" ON "scim_directories" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "sponsor_profiles_system" ON "sponsor_profiles" TO iam_system USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "sso_connections_system" ON "sso_connections" TO iam_system USING (true) WITH CHECK (true);
