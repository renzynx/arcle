DO $$ BEGIN
    CREATE TYPE "library_status" AS ENUM ('reading', 'completed', 'on_hold', 'dropped', 'planning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"series_id" text NOT NULL,
	"chapter_number" numeric NOT NULL,
	"page_number" integer DEFAULT 1,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_series_unique" UNIQUE("user_id","series_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library" (
	"user_id" text NOT NULL,
	"series_id" text NOT NULL,
	"status" "library_status" DEFAULT 'planning' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "library_user_id_series_id_pk" PRIMARY KEY("user_id","series_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"series_id" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_review" UNIQUE("user_id","series_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_library_idx" ON "library" USING btree ("user_id");
