DO $$ BEGIN
    CREATE TYPE "public"."library_status" AS ENUM('reading', 'completed', 'on_hold', 'dropped', 'planning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"track_views" boolean DEFAULT true NOT NULL,
	"track_history" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
