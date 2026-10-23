CREATE TABLE "course_drafts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"course_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"doc" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"base_version_no" integer,
	"published_version_no" integer,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"submitted_by_user_id" uuid,
	"submitted_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "course_drafts_open_course" ON "course_drafts" USING btree ("course_id") WHERE status <> 'published' and course_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "course_drafts_open_slug" ON "course_drafts" USING btree ("slug") WHERE status <> 'published';--> statement-breakpoint
CREATE INDEX "course_drafts_owner_status" ON "course_drafts" USING btree ("owner_org_id","status");--> statement-breakpoint
-- Drafts belong to the organisation writing the course (reviewers from the platform read them through catalog_system).
--> statement-breakpoint
ALTER TABLE "course_drafts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "course_drafts_owner_isolation" ON "course_drafts" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
