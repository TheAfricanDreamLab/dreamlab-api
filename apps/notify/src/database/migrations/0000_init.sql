-- Grants. The roles notify_app (RLS enforced) and notify_system (cross-user delivery) are created by infra (docker/postgres/init.sql in development).
GRANT USAGE ON SCHEMA public TO notify_app, notify_system;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO notify_app, notify_system;--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"dedupe_key" text NOT NULL,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_user_key" UNIQUE("user_id","dedupe_key")
);
--> statement-breakpoint
CREATE INDEX "notifications_user_created" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);