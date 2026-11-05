CREATE TABLE "course_draft_saves" (
	"draft_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"doc" jsonb NOT NULL,
	"title" text NOT NULL,
	"saved_by_user_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checkpoint" boolean DEFAULT false NOT NULL,
	CONSTRAINT "course_draft_saves_draft_id_revision_pk" PRIMARY KEY("draft_id","revision")
);
--> statement-breakpoint
ALTER TABLE "course_draft_saves" ADD CONSTRAINT "course_draft_saves_draft_id_course_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."course_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_draft_saves_recent" ON "course_draft_saves" USING btree ("draft_id","saved_at");--> statement-breakpoint
ALTER TABLE "course_draft_saves" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "course_draft_saves_owner_isolation" ON "course_draft_saves" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "course_draft_saves_system" ON "course_draft_saves" TO catalog_system USING (true) WITH CHECK (true);
