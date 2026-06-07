CREATE TABLE "mobile_refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"device" text,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	CONSTRAINT "mobile_refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "mobile_refresh_tokens" ADD CONSTRAINT "mobile_refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mobile_refresh_tokens_user_idx" ON "mobile_refresh_tokens" USING btree ("user_id");