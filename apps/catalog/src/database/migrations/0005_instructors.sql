CREATE TABLE "course_staff" (
	"course_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"role" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "course_staff_course_id_profile_id_pk" PRIMARY KEY("course_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "instructor_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"photo_url" text,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_staff" ADD CONSTRAINT "course_staff_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_staff" ADD CONSTRAINT "course_staff_profile_id_instructor_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."instructor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_staff_profile" ON "course_staff" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "instructor_profiles_owner" ON "instructor_profiles" USING btree ("owner_org_id");
--> statement-breakpoint
-- Row-level security by owner organisation; catalog_system reads across through explicit policies.
--> statement-breakpoint
ALTER TABLE "instructor_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "instructor_profiles_owner_isolation" ON "instructor_profiles" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "instructor_profiles_system" ON "instructor_profiles" TO catalog_system USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "course_staff" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "course_staff_owner_isolation" ON "course_staff" USING (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (owner_org_id = nullif(current_setting('app.org_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "course_staff_system" ON "course_staff" TO catalog_system USING (true) WITH CHECK (true);
