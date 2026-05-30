CREATE TABLE "guest_entries" (
	"token" text PRIMARY KEY NOT NULL,
	"mood_type_id" text NOT NULL,
	"note" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"sentiment" real,
	"ai_summary" text,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"claimed_at" timestamp
);
