-- Seed default mood types (system, no user_id)
INSERT OR IGNORE INTO mood_types (id, user_id, emoji, label, label_th, color, "order", is_default) VALUES
  ('amazing', NULL, '🤩', 'Amazing', 'ดีมาก',     '#F59E0B', 0, 1),
  ('happy',   NULL, '😊', 'Happy',   'มีความสุข', '#22C55E', 1, 1),
  ('neutral', NULL, '😐', 'Neutral', 'เฉยๆ',      '#8B5CF6', 2, 1),
  ('sad',     NULL, '😢', 'Sad',     'เศร้า',     '#3B82F6', 3, 1),
  ('angry',   NULL, '😡', 'Angry',   'โกรธ',      '#EF4444', 4, 1),
  ('anxious', NULL, '😰', 'Anxious', 'กังวล',     '#F97316', 5, 1),
  ('tired',   NULL, '😴', 'Tired',   'เหนื่อย',   '#6B7280', 6, 1);
