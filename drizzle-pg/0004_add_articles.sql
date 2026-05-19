CREATE TABLE "article_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label_th" text NOT NULL,
	"label_en" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "article_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"category_id" text,
	"title_th" text NOT NULL,
	"title_en" text NOT NULL,
	"excerpt_th" text NOT NULL,
	"excerpt_en" text NOT NULL,
	"body_th" text DEFAULT '' NOT NULL,
	"body_en" text DEFAULT '' NOT NULL,
	"cover_image_key" text,
	"reading_time_minutes" integer DEFAULT 3 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "mood_entries" ADD COLUMN "location_lat" real;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD COLUMN "location_lng" real;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."article_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" USING btree ("published","published_at");