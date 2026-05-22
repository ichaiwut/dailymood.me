CREATE TABLE "journal_prompt_cache" (
	"user_id" text NOT NULL,
	"mood_id" text NOT NULL,
	"date_key" text NOT NULL,
	"locale" text NOT NULL,
	"prompt" text NOT NULL,
	"generated_at" timestamp NOT NULL,
	CONSTRAINT "journal_prompt_cache_user_id_mood_id_date_key_locale_pk" PRIMARY KEY("user_id","mood_id","date_key","locale")
);
--> statement-breakpoint
ALTER TABLE "journal_prompt_cache" ADD CONSTRAINT "journal_prompt_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;