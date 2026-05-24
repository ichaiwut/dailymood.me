-- Activities table: user-defined activities for mood entries
CREATE TABLE activities (
  id text PRIMARY KEY NOT NULL,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  label text NOT NULL,
  label_th text,
  "order" integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX activities_user_idx ON activities (user_id);
--> statement-breakpoint
-- Add activity_id column to mood_entries
ALTER TABLE mood_entries ADD COLUMN activity_id text REFERENCES activities(id);
--> statement-breakpoint
-- Seed default activities (system-wide, userId = NULL)
INSERT INTO activities (id, emoji, label, label_th, "order", is_default, created_at) VALUES
  ('act_work',     '💼', 'Work',     'ทำงาน',           0, true, now()),
  ('act_exercise', '🏃', 'Exercise', 'ออกกำลังกาย',      1, true, now()),
  ('act_friends',  '👫', 'Friends',  'เจอเพื่อน',        2, true, now()),
  ('act_family',   '👨‍👩‍👧', 'Family',   'ครอบครัว',         3, true, now()),
  ('act_dining',   '🍽️', 'Dining',   'กินข้าวนอกบ้าน',   4, true, now()),
  ('act_gaming',   '🎮', 'Gaming',   'เล่นเกม',          5, true, now()),
  ('act_reading',  '📚', 'Reading',  'อ่านหนังสือ',       6, true, now()),
  ('act_movies',   '🎬', 'Movies',   'ดูหนัง/ซีรีส์',     7, true, now()),
  ('act_rest',     '😴', 'Rest',     'พักผ่อน',           8, true, now()),
  ('act_travel',   '✈️', 'Travel',   'เที่ยว',            9, true, now());
