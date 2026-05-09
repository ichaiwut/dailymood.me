CREATE TABLE `calendar_ai_cache` (
  `user_id`      text    NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `year_month`   text    NOT NULL,
  `result`       text    NOT NULL,
  `entry_count`  integer NOT NULL DEFAULT 0,
  `generated_at` integer NOT NULL,
  PRIMARY KEY (`user_id`, `year_month`)
);
