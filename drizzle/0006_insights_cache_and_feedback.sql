CREATE TABLE `insights_ai_cache` (
	`user_id` text NOT NULL,
	`week_key` text NOT NULL,
	`result` text NOT NULL,
	`entry_count` integer DEFAULT 0 NOT NULL,
	`generated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `week_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `suggestion_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_key` text NOT NULL,
	`suggestion_title` text NOT NULL,
	`reaction` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `suggestion_feedback_user_week_idx` ON `suggestion_feedback` (`user_id`,`week_key`);
