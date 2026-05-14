CREATE TABLE "ask_ai_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"sources_json" jsonb,
	"feedback" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_ai_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"last_message_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ask_ai_messages" ADD CONSTRAINT "ask_ai_messages_thread_id_ask_ai_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ask_ai_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_ai_threads" ADD CONSTRAINT "ask_ai_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ask_ai_messages_thread_idx" ON "ask_ai_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "ask_ai_threads_user_idx" ON "ask_ai_threads" USING btree ("user_id");