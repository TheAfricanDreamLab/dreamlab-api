DROP INDEX "competency_events_once";--> statement-breakpoint
ALTER TABLE "competency_events" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "competency_events_revision" ON "competency_events" USING btree ("source","source_id","dimension","revision");