CREATE TABLE "forecast_cache" (
	"user_id" text NOT NULL,
	"target_date" text NOT NULL,
	"result" jsonb NOT NULL,
	"input_hash" text NOT NULL,
	"generated_at" timestamp NOT NULL,
	CONSTRAINT "forecast_cache_user_id_target_date_pk" PRIMARY KEY("user_id","target_date")
);
--> statement-breakpoint
CREATE TABLE "year_ai_cache" (
	"user_id" text NOT NULL,
	"year" text NOT NULL,
	"result" jsonb NOT NULL,
	"entry_count" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp NOT NULL,
	CONSTRAINT "year_ai_cache_user_id_year_pk" PRIMARY KEY("user_id","year")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_coach_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_digest_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "forecast_cache" ADD CONSTRAINT "forecast_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "year_ai_cache" ADD CONSTRAINT "year_ai_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;