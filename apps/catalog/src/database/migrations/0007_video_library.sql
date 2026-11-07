CREATE TABLE "draft_comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"draft_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"parent_id" uuid,
	"anchor" jsonb NOT NULL,
	"body" text NOT NULL,
	"author_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "draft_presence" (
	"draft_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"where" jsonb,
	"editing_at" timestamp with time zone,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draft_presence_draft_id_user_id_pk" PRIMARY KEY("draft_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "video_captions" (
	"video_id" uuid NOT NULL,
	"lang" text NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"label" text NOT NULL,
	"source" text NOT NULL,
	"cues" jsonb NOT NULL,
	"updated_by_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_captions_video_id_lang_pk" PRIMARY KEY("video_id","lang")
);
--> statement-breakpoint
CREATE TABLE "video_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"video_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"lang" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_until" timestamp with time zone,
	"error" text,
	"requested_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"size" bigint NOT NULL,
	"content_type" text NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL,
	"progress" integer,
	"error" text,
	"duration_s" integer,
	"width" integer,
	"height" integer,
	"renditions" integer[] DEFAULT '{}' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "is_preview" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "draft_comments" ADD CONSTRAINT "draft_comments_draft_id_course_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."course_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_presence" ADD CONSTRAINT "draft_presence_draft_id_course_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."course_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_captions" ADD CONSTRAINT "video_captions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "draft_comments_draft" ON "draft_comments" USING btree ("draft_id","created_at");--> statement-breakpoint
CREATE INDEX "video_jobs_pending" ON "video_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "video_jobs_video" ON "video_jobs" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "videos_library" ON "videos" USING btree ("owner_org_id","created_at");
--> statement-breakpoint
ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "videos_owner_isolation" ON "videos" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "videos_system" ON "videos" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "video_captions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "video_captions_owner_isolation" ON "video_captions" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "video_captions_system" ON "video_captions" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "video_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "video_jobs_owner_isolation" ON "video_jobs" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "video_jobs_system" ON "video_jobs" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "draft_comments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "draft_comments_owner_isolation" ON "draft_comments" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "draft_comments_system" ON "draft_comments" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "draft_presence" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "draft_presence_owner_isolation" ON "draft_presence" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "draft_presence_system" ON "draft_presence" TO catalog_system USING (true) WITH CHECK (true);
