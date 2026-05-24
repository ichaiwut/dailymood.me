CREATE TABLE "holiday_cache" (
	"year" text NOT NULL,
	"country_code" text DEFAULT 'TH' NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp NOT NULL,
	CONSTRAINT "holiday_cache_year_country_code_pk" PRIMARY KEY("year","country_code")
);
--> statement-breakpoint
CREATE TABLE "personal_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"label_th" text,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"emoji" text DEFAULT '🎉' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_events" ADD CONSTRAINT "personal_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personal_events_user_idx" ON "personal_events" USING btree ("user_id");