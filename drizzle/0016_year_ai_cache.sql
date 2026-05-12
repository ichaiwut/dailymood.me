CREATE TABLE IF NOT EXISTS "year_ai_cache" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "year" text NOT NULL,
  "result" jsonb NOT NULL,
  "entry_count" integer NOT NULL DEFAULT 0,
  "generated_at" timestamp NOT NULL,
  CONSTRAINT "year_ai_cache_pkey" PRIMARY KEY ("user_id", "year")
);
