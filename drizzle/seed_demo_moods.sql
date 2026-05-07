-- Seed: 2 random mood entries per day for the past 60 days
-- Target user: hello@dailymood.me
-- Run: npm run db:seed:demo:local   (or :demo:prod)

WITH RECURSIVE
  days(n) AS (
    SELECT 0
    UNION ALL
    SELECT n + 1 FROM days WHERE n < 59
  ),
  slots(s) AS (
    VALUES (1), (2)
  )
INSERT INTO mood_entries
  (id, user_id, mood_type_id, note, tags, sentiment, ai_source, date, created_at)
SELECT
  'seed_' || lower(hex(randomblob(6))) || '_' || days.n || '_' || slots.s,
  u.id,
  CASE abs(random()) % 7
    WHEN 0 THEN 'amazing'
    WHEN 1 THEN 'happy'
    WHEN 2 THEN 'neutral'
    WHEN 3 THEN 'sad'
    WHEN 4 THEN 'angry'
    WHEN 5 THEN 'anxious'
    ELSE        'tired'
  END,
  NULL,
  '[]',
  NULL,
  'manual',
  date(unixepoch('now') - days.n * 86400, 'unixepoch'),
  unixepoch('now') - days.n * 86400 - (abs(random()) % 86400)
FROM users u, days, slots
WHERE u.email = 'hello@dailymood.me';
