CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"emoji" text NOT NULL,
	"label" text NOT NULL,
	"label_th" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN "tokens_in" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN "tokens_out" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN "estimated_cost_thb" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD COLUMN "activity_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_activated_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "welcome_shown_at" timestamp;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_user_idx" ON "activities" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;