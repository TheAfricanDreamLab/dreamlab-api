ALTER TABLE "program_calendar_weeks" ADD COLUMN "kind" text DEFAULT 'learning' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "stream_sizes" jsonb;