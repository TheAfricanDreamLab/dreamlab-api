DROP INDEX "org_domains_domain_key";--> statement-breakpoint
DROP INDEX "scim_directories_org_idx";--> statement-breakpoint
DROP INDEX "sso_connections_org_idx";--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "mfa_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_secret_encrypted" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_recovery_hashes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "require_admin_mfa" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "scim_directories" ADD COLUMN "token_hint" text;--> statement-breakpoint
ALTER TABLE "sso_connections" ADD COLUMN "secret_encrypted" text;--> statement-breakpoint
ALTER TABLE "sso_connections" ADD COLUMN "enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sso_connections" ADD COLUMN "tested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sso_connections" ADD COLUMN "default_role_key" text DEFAULT 'learner' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "groups_org_external_key" ON "groups" USING btree ("org_id","external_id") WHERE external_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_external_key" ON "memberships" USING btree ("org_id","external_id") WHERE external_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "org_domains_verified_domain_key" ON "org_domains" USING btree ("domain") WHERE verified_at is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "org_domains_org_domain_key" ON "org_domains" USING btree ("org_id","domain");--> statement-breakpoint
CREATE UNIQUE INDEX "scim_directories_org_key" ON "scim_directories" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scim_directories_token_key" ON "scim_directories" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "sso_connections_org_key" ON "sso_connections" USING btree ("org_id");