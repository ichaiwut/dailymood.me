// One-off: add backdated mood entries to a LOCAL user for testing (e.g. share cards).
// Usage:  node scripts/seed-entries-local.mjs ichaiwut.s@gmail.com 400
// LOCAL ONLY — hardcoded localhost connection + guard so it can never touch prod.
import pg from "pg";

const DB = "postgresql://localhost:5432/dailymood_dev";
if (!/@?localhost[:/]/.test(DB) && !DB.includes("127.0.0.1")) {
  console.error("Refusing to run: connection is not localhost.");
  process.exit(1);
}

const EMAIL = process.argv[2] ?? "ichaiwut.s@gmail.com";
const COUNT = parseInt(process.argv[3] ?? "400", 10);
const ICT_OFFSET_MS = 7 * 3600_000;

const ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(now = Date.now()) {
  let ts = "";
  let t = now;
  for (let i = 9; i >= 0; i--) { ts = ENC[t % 32] + ts; t = Math.floor(t / 32); }
  const r = new Uint8Array(16);
  crypto.getRandomValues(r);
  let rs = "";
  for (let i = 0; i < 16; i++) rs += ENC[r[i] % 32];
  return ts + rs;
}

// ICT calendar date (YYYY-MM-DD) for a UTC instant.
function ictDate(ms) {
  return new Date(ms + ICT_OFFSET_MS).toISOString().slice(0, 10);
}
// UTC timestamp whose ICT wall-clock is `dateStr` at h:mm.
function ictInstant(dateStr, h, mm) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, mm) - ICT_OFFSET_MS);
}

function pick(weighted) {
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of weighted) { if ((r -= w) < 0) return v; }
  return weighted[0][0];
}
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const MOOD_WEIGHTS = [
  ["amazing", 18], ["happy", 22], ["neutral", 20],
  ["sad", 12], ["anxious", 12], ["tired", 12], ["angry", 4],
];
const NOTES = [
  "วันนี้เป็นวันที่ดี", "เหนื่อยนิดหน่อยแต่โอเค", "ได้พักผ่อนเต็มที่",
  "งานเยอะหน่อยวันนี้", "เจอเพื่อนเก่า รู้สึกดี", "อากาศดีมาก เดินเล่นสบายๆ",
  "นอนไม่ค่อยพอ", "รู้สึกขอบคุณหลายอย่าง", "ใจเย็นลงเยอะแล้ว",
  "กังวลเรื่องงานนิดหน่อย", "ค่อยๆ ไปทีละวัน",
];

async function main() {
  const pool = new pg.Pool({ connectionString: DB });

  const { rows: users } = await pool.query(
    "SELECT id, name, email FROM users WHERE email = $1 LIMIT 1",
    [EMAIL],
  );
  if (users.length === 0) {
    console.error(`User not found: ${EMAIL}. Create/login this account first.`);
    await pool.end();
    process.exit(1);
  }
  const user = users[0];

  // Use system mood types that actually exist (FK-safe).
  const { rows: moodRows } = await pool.query(
    "SELECT id FROM mood_types WHERE user_id IS NULL",
  );
  const validMoods = new Set(moodRows.map((r) => r.id));
  const moods = MOOD_WEIGHTS.filter(([id]) => validMoods.has(id));
  if (moods.length === 0) {
    console.error("No system mood_types found — run scripts/seed-local first.");
    await pool.end();
    process.exit(1);
  }

  const { rows: before } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM mood_entries WHERE user_id = $1",
    [user.id],
  );

  // Walk back day by day from today (ICT), 1-3 entries/day, until COUNT reached.
  const nowMs = Date.now();
  const entries = [];
  let dayOffset = 0;
  while (entries.length < COUNT) {
    const dayMs = nowMs - dayOffset * 86_400_000;
    const dateStr = ictDate(dayMs);
    const perDay = Math.min(randInt(1, 3), COUNT - entries.length);
    for (let k = 0; k < perDay; k++) {
      const moodId = pick(moods);
      const note = Math.random() < 0.35 ? NOTES[randInt(0, NOTES.length - 1)] : null;
      const createdAt = ictInstant(dateStr, randInt(8, 22), randInt(0, 59));
      entries.push({ id: ulid(createdAt.getTime()), moodId, note, dateStr, createdAt });
    }
    dayOffset++;
  }

  // Bulk insert in chunks.
  const CHUNK = 100;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const slice = entries.slice(i, i + CHUNK);
    const values = [];
    const params = [];
    slice.forEach((e, j) => {
      const b = j * 6;
      values.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, 'manual', $${b + 5}, $${b + 6})`);
      params.push(e.id, user.id, e.moodId, e.note, e.dateStr, e.createdAt);
    });
    await pool.query(
      `INSERT INTO mood_entries (id, user_id, mood_type_id, note, ai_source, date, created_at) VALUES ${values.join(", ")}`,
      params,
    );
  }

  const { rows: after } = await pool.query(
    "SELECT COUNT(*)::int AS n, MIN(date) AS first, MAX(date) AS last FROM mood_entries WHERE user_id = $1",
    [user.id],
  );
  const { rows: dist } = await pool.query(
    "SELECT mood_type_id, COUNT(*)::int AS n FROM mood_entries WHERE user_id = $1 GROUP BY mood_type_id ORDER BY n DESC",
    [user.id],
  );

  console.log(`User: ${user.email} (${user.name ?? "—"})`);
  console.log(`Inserted: ${entries.length} entries`);
  console.log(`Total now: ${after[0].n} (was ${before[0].n})`);
  console.log(`Date range: ${after[0].first} → ${after[0].last}`);
  console.log("Distribution:", dist.map((d) => `${d.mood_type_id}:${d.n}`).join("  "));

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
