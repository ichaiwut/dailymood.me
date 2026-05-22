CREATE TABLE "chart_annotations_cache" (
	"user_id" text NOT NULL,
	"period_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"entry_count" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp NOT NULL,
	CONSTRAINT "chart_annotations_cache_user_id_period_key_pk" PRIMARY KEY("user_id","period_key")
);
--> statement-breakpoint
ALTER TABLE "chart_annotations_cache" ADD CONSTRAINT "chart_annotations_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;