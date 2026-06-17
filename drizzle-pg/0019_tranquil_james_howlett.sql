ALTER TABLE "users" ADD COLUMN "reminder_email_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reminder_push_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_digest_email_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_digest_push_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_coach_email_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_coach_push_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill: carry each legacy single flag into its email channel so no existing
-- user silently loses their reminder / digest / coach emails. Push stays false.
UPDATE "users" SET
  "reminder_email_enabled" = "reminder_enabled",
  "weekly_digest_email_enabled" = "weekly_digest_enabled",
  "ai_coach_email_enabled" = "ai_coach_enabled";