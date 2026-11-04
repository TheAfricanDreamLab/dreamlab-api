CREATE TABLE "circle_contacts" (
	"circle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"email" text,
	"phone" text,
	"whatsapp" boolean DEFAULT false NOT NULL,
	"linkedin" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "circle_contacts_circle_id_user_id_pk" PRIMARY KEY("circle_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "circle_meetups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"circle_id" uuid NOT NULL,
	"host_org_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"mode" text NOT NULL,
	"location" text,
	"details" text DEFAULT '' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle_contacts" ADD CONSTRAINT "circle_contacts_circle_id_dream_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."dream_circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circle_meetups" ADD CONSTRAINT "circle_meetups_circle_id_dream_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."dream_circles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "circle_meetups_circle" ON "circle_meetups" USING btree ("circle_id","starts_at");--> statement-breakpoint
CREATE INDEX "circle_meetups_due" ON "circle_meetups" USING btree ("starts_at");--> statement-breakpoint
ALTER TABLE "circle_contacts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "circle_contacts_host_isolation" ON "circle_contacts" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "circle_contacts_system" ON "circle_contacts" TO learning_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "circle_meetups" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "circle_meetups_host_isolation" ON "circle_meetups" USING (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (host_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "circle_meetups_system" ON "circle_meetups" TO learning_system USING (true) WITH CHECK (true);
