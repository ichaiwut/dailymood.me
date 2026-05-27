ALTER TABLE users ADD COLUMN welcome_shown_at TIMESTAMP;
--> statement-breakpoint
UPDATE users SET welcome_shown_at = created_at WHERE welcome_shown_at IS NULL;
