CREATE TABLE "circle_attachments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"circle_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"uploader_user_id" uuid NOT NULL,
	"post_id" uuid,
	"kind" text NOT NULL,
	"path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"duration_sec" integer,
	"width" integer,
	"height" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_posts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"circle_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text DEFAULT '' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"pinned_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle_attachments" ADD CONSTRAINT "circle_attachments_circle_id_dream_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."dream_circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_attachments" ADD CONSTRAINT "circle_attachments_post_id_circle_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."circle_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_posts" ADD CONSTRAINT "circle_posts_circle_id_dream_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."dream_circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "circle_attachments_post" ON "circle_attachments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "circle_attachments_uploader" ON "circle_attachments" USING btree ("uploader_user_id","created_at");--> statement-breakpoint
CREATE INDEX "circle_posts_board" ON "circle_posts" USING btree ("circle_id","created_at","id");--> statement-breakpoint
CREATE INDEX "circle_posts_replies" ON "circle_posts" USING btree ("parent_id","created_at");--> statement-breakpoint
ALTER TABLE "circle_posts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "circle_posts_host_isolation" ON "circle_posts" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "circle_posts_system" ON "circle_posts" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "circle_attachments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "circle_attachments_host_isolation" ON "circle_attachments" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "circle_attachments_system" ON "circle_attachments" TO learning_system USING (true) WITH CHECK (true);
