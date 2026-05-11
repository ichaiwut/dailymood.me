CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"nlp_count" integer DEFAULT 0 NOT NULL,
	"vision_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_usage_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "calendar_ai_cache" (
	"user_id" text NOT NULL,
	"year_month" text NOT NULL,
	"result" jsonb NOT NULL,
	"entry_count" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp NOT NULL,
	CONSTRAINT "calendar_ai_cache_user_id_year_month_pk" PRIMARY KEY("user_id","year_month")
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights_ai_cache" (
	"user_id" text NOT NULL,
	"week_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"entry_count" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp NOT NULL,
	CONSTRAINT "insights_ai_cache_user_id_week_key_pk" PRIMARY KEY("user_id","week_key")
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mood_type_id" text NOT NULL,
	"note" text,
	"image_key" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"sentiment" real,
	"ai_summary" text,
	"ai_source" text DEFAULT 'manual' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"premium" boolean DEFAULT false NOT NULL,
	"icon_format" text DEFAULT 'svg' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_types" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"emoji" text NOT NULL,
	"label" text NOT NULL,
	"label_th" text,
	"color" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"icon_key" text
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "suggestion_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_key" text NOT NULL,
	"suggestion_title" text NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"earned_at" timestamp NOT NULL,
	CONSTRAINT "user_achievements_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"password_hash" text,
	"image" text,
	"locale" text DEFAULT 'en',
	"is_premium" boolean DEFAULT false NOT NULL,
	"mood_pack" text DEFAULT 'set_486038' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"plan_interval" text,
	"subscription_status" text,
	"bio" text,
	"accent_color" text,
	"hide_preview" boolean DEFAULT false NOT NULL,
	"anonymous_insights" boolean DEFAULT true NOT NULL,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"reminder_time" text DEFAULT '21:00' NOT NULL,
	"reminder_days" text DEFAULT '1,2,3,4,5' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"type" text NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_ai_cache" ADD CONSTRAINT "calendar_ai_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights_ai_cache" ADD CONSTRAINT "insights_ai_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_mood_type_id_mood_types_id_fk" FOREIGN KEY ("mood_type_id") REFERENCES "public"."mood_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_types" ADD CONSTRAINT "mood_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestion_feedback" ADD CONSTRAINT "suggestion_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mood_entries_user_date_idx" ON "mood_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "mood_entries_user_created_idx" ON "mood_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "mood_types_user_idx" ON "mood_types" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "suggestion_feedback_user_week_idx" ON "suggestion_feedback" USING btree ("user_id","week_key");--> statement-breakpoint
CREATE INDEX "verification_tokens_identifier_type_idx" ON "verification_tokens" USING btree ("identifier","type");