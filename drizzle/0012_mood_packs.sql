CREATE TABLE mood_packs (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  premium INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Seed existing pack
INSERT INTO mood_packs (id, label, premium, created_at)
VALUES ('set_486038', 'Vecteezy Classic', 0, unixepoch());
