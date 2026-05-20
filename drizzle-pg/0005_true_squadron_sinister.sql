CREATE TABLE "article_bookmarks" (
	"user_id" text NOT NULL,
	"article_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "article_bookmarks_user_id_article_id_pk" PRIMARY KEY("user_id","article_id")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "key_takeaway_th" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "key_takeaway_en" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "tone" text DEFAULT 'peach' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;