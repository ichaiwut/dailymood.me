CREATE TABLE "flashback_cache" (
	"entry_id" text PRIMARY KEY NOT NULL,
	"result" jsonb NOT NULL,
	"generated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flashback_cache" ADD CONSTRAINT "flashback_cache_entry_id_mood_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."mood_entries"("id") ON DELETE cascade ON UPDATE no action;