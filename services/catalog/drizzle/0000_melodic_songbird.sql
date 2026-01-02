DO $$ BEGIN
    CREATE TYPE "public"."status" AS ENUM('ongoing', 'completed', 'hiatus', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"series_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text,
	"slug" text NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "genres" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"chapter_id" text NOT NULL,
	"number" integer NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "series" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"author" text,
	"status" "status" DEFAULT 'ongoing' NOT NULL,
	"cover_image" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"rating_avg" numeric(3, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "series_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "series_genres" (
	"series_id" text NOT NULL,
	"genre_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "series_genres_series_id_genre_id_pk" PRIMARY KEY("series_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "chapters" ADD CONSTRAINT "chapters_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "pages" ADD CONSTRAINT "pages_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapters_series_idx" ON "chapters" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapters_number_idx" ON "chapters" USING btree ("series_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chapters_slug_idx" ON "chapters" USING btree ("series_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "genres_name_idx" ON "genres" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "genres_slug_idx" ON "genres" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_chapter_idx" ON "pages" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_order_idx" ON "pages" USING btree ("chapter_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_idx" ON "series" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slug_idx" ON "series" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_genres_series_idx" ON "series_genres" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_genres_genre_idx" ON "series_genres" USING btree ("genre_id");
