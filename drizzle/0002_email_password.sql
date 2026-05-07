ALTER TABLE `users` ADD `password_hash` text;

CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);

CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);
CREATE INDEX `verification_tokens_identifier_type_idx` ON `verification_tokens` (`identifier`, `type`);
