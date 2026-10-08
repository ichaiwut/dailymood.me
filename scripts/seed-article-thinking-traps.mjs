/**
 * Seed one article: "5 Thinking Traps That Quietly Twist Your Mood" (CBT).
 *
 * Self-contained (raw `pg`, no `@/` alias) so it can run against local or prod.
 * Idempotent via ON CONFLICT (slug) — re-running updates the row in place.
 *
 *   node --env-file=.env.local scripts/seed-article-thinking-traps.mjs   # local
 *   DATABASE_URL=<prod> node scripts/seed-article-thinking-traps.mjs      # prod
 */
import pg from "pg";

const ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(now = Date.now()) {
  let ts = ""; let t = now;
  for (let i = 9; i >= 0; i--) { ts = ENC[t % 32] + ts; t = Math.floor(t / 32); }
  const r = new Uint8Array(16); crypto.getRandomValues(r);
  let rs = ""; for (let i = 0; i < 16; i++) rs += ENC[r[i] % 32];
  return ts + rs;
}

// Mirrors calcReadingTime() in src/lib/articles.ts
function calcReadingTime(bodyTh, bodyEn) {
  const thMinutes = bodyTh.replace(/\s+/g, "").length / 900;
  const enMinutes = bodyEn.split(/\s+/).filter(Boolean).length / 200;
  return Math.max(1, Math.round(Math.max(thMinutes, enMinutes)));
}

const CATEGORY_SLUG = "cbt";

const article = {
  slug: "thinking-traps-cognitive-distortions",
  tone: "yellow",
  tags: ["CBT", "กับดักความคิด", "มุมมอง"],
  published: true,
  titleEn: "5 Thinking Traps That Quietly Twist Your Mood",
  titleTh: "5 กับดักความคิดที่ค่อยๆ บิดอารมณ์เราโดยไม่รู้ตัว",
  excerptEn:
    "The same situation, two very different feelings — often it's not the event but the thought wrapped around it. Here are five common thinking traps and how to step back from them.",
  excerptTh:
    "เหตุการณ์เดียวกัน แต่รู้สึกต่างกันคนละขั้ว หลายครั้งไม่ใช่เพราะเรื่องที่เกิด แต่เพราะความคิดที่เราห่อหุ้มมันไว้ ลองมารู้จัก 5 กับดักความคิดที่พบบ่อย พร้อมวิธีถอยออกมามองครับ",
  keyTakeawayEn:
    "Most of the time it isn't the situation that decides how we feel — it's the thought we attach to it. Five of the most common thinking traps are **all-or-nothing thinking** (no middle ground), **catastrophizing** (jumping to the worst case), **mind-reading** (assuming others' negative thoughts), **overgeneralizing** (turning one event into a rule), and **should statements** (rigid self-demands). The goal isn't to silence these thoughts or force positivity — it's simply to **notice and name** them. The moment you catch yourself thinking \"this is catastrophizing,\" the thought loses some of its power, and you get the space to choose a more balanced, kinder view instead.",
  keyTakeawayTh:
    "หลายครั้งสิ่งที่กำหนดว่าเราจะรู้สึกยังไง ไม่ใช่ตัวเหตุการณ์ แต่เป็น **ความคิด** ที่เราใส่เข้าไปกับมัน กับดักความคิดที่พบบ่อยมี 5 แบบ คือ **คิดแบบขาว-ดำ** (ไม่มีตรงกลาง), **คิดไปไกลถึงเรื่องร้ายที่สุด**, **เดาใจคนอื่น** (มักเดาในแง่ลบ), **เหมารวมจากครั้งเดียว** และ **กฎ \"ต้อง/ควร\" ที่แบกไว้** เป้าหมายไม่ใช่การห้ามความคิดเหล่านี้หรือฝืนคิดบวก แต่แค่ **สังเกตและเรียกชื่อมัน** ก็พอ เพราะวินาทีที่เราจับได้ว่า \"อ้อ นี่เรากำลังคิดไปไกลแล้วนี่\" ความคิดนั้นก็จะคลายแรงลง และเราจะมีพื้นที่พอที่จะเลือกมองมันแบบที่สมดุลและใจดีกับตัวเองมากขึ้นครับ",
  bodyEn: `Two people can go through the exact same thing and feel completely differently about it. Often the gap isn't the event itself — it's the thought we wrap around it. When we're stressed or tired, the mind takes shortcuts to make sense of things fast, and some of those shortcuts quietly bend reality in a way that hurts. Here are five of the most common thinking traps. You don't have to fight them — just learning to spot one is often enough to loosen its grip.

## 1. All-or-Nothing Thinking (Black-and-White)

Everything is either perfect or a total failure, with no middle ground. One small mistake at work becomes "I'm bad at my job," and a single slip on a plan becomes "I've ruined everything." But real life almost always lives in the grey area in between. When you catch an "always" or a "never," try asking yourself: is there a version of this that sits somewhere in the middle?

## 2. Catastrophizing (Worst-Case Spiral)

Here the mind jumps straight to the worst possible outcome and treats it as a done deal. A friend doesn't reply, and within minutes you've decided they're upset with you. A small symptom becomes a serious illness. The thought feels urgent and certain, but it's a prediction — not something that has actually happened. Try asking: what's the *most likely* outcome, not just the scariest one?

## 3. Mind-Reading (Guessing Others' Thoughts)

This trap convinces you that you know what other people are thinking — and it's usually something negative about you. "They think I'm boring." "My boss is annoyed with me." But we're rarely as transparent to others as we feel, and most people are far more wrapped up in their own day than we assume. Unless someone actually said it, it's a guess, not the truth.

## 4. Overgeneralizing (One Time = Every Time)

One bad experience gets stretched into a rule about everything. One awkward conversation becomes "I'm terrible with people," and one rejection becomes "this always happens to me." Words like *always*, *never*, *everyone*, and *no one* are the giveaway. A single event is just that — one data point, not the whole pattern.

## 5. Should Statements (The Rules We Carry)

These are the silent rules we hold ourselves to: "I should be further along by now," "I shouldn't feel this way." Every *should* tends to arrive with a quiet side of guilt when we fall short — and often the rule was never really ours; we just absorbed it from somewhere. Try swapping "I should" for "I'd like to" or "it would be nice if." It turns a demand into a choice, and that small shift takes off a surprising amount of pressure.

## Sources & Further Reading

The ideas in this article draw on well-established psychology research:

- **Cognitive distortions in cognitive therapy** — [Aaron T. Beck (cognitive therapy)](https://en.wikipedia.org/wiki/Cognitive_distortion)
- **The popular list of thinking traps** — [Burns, D. (1980), Feeling Good: The New Mood Therapy](https://en.wikipedia.org/wiki/Feeling_Good:_The_New_Mood_Therapy)

---

> You can't always stop the first thought from showing up — but you can learn to notice it, name it, and decide whether it's worth believing.`,
  bodyTh: `คนสองคนเจอเรื่องเดียวกันเป๊ะ แต่กลับรู้สึกต่างกันคนละขั้วก็ได้ หลายครั้งช่องว่างนั้นไม่ได้มาจากเหตุการณ์ แต่มาจาก "ความคิด" ที่เราห่อหุ้มมันไว้ เวลาที่เราเครียดหรือเหนื่อย สมองมักใช้ทางลัดในการตีความเรื่องราวให้เร็วเข้าไว้ และทางลัดบางอย่างก็ค่อยๆ บิดความจริงไปในทางที่ทำให้เราเจ็บโดยไม่รู้ตัว ลองมารู้จัก 5 กับดักความคิดที่พบบ่อยกันครับ ไม่ต้องไปฝืนสู้กับมัน แค่เริ่มมองออกว่า "อ้อ นี่มันกับดักนี่นา" ก็ช่วยให้มันคลายแรงดึงลงได้เยอะแล้ว

## 1. คิดแบบขาว-ดำ (All-or-Nothing)

คือการมองว่าทุกอย่างต้องสมบูรณ์แบบ ไม่งั้นก็ล้มเหลวไปเลย ไม่มีตรงกลาง พลาดเล็กๆ เรื่องงานครั้งเดียวก็กลายเป็น "เราทำงานไม่ได้เรื่อง" หรือเผลอกินของที่ตั้งใจงดไปคำเดียวก็รู้สึกว่า "พังหมดแล้ว" ทั้งที่จริงชีวิตส่วนใหญ่อยู่ในโซนสีเทาตรงกลางนั่นแหละ ถ้าจับได้ว่าตัวเองกำลังคิดด้วยคำว่า "เสมอ" หรือ "ไม่เคย" ลองถามตัวเองดูว่า มันมีเวอร์ชันที่อยู่ตรงกลางไหมครับ

## 2. คิดไปไกลถึงเรื่องร้ายที่สุด (Catastrophizing)

กับดักนี้คือใจกระโดดไปหาผลลัพธ์ที่แย่ที่สุดทันที แล้วเชื่อว่ามันต้องเกิดขึ้นแน่ๆ เพื่อนยังไม่ตอบแชต ไม่กี่นาทีก็สรุปไปแล้วว่าเขาโกรธเรา อาการเล็กๆ ก็คิดว่าเป็นโรคร้าย ความคิดแบบนี้รู้สึกเร่งด่วนและแน่นอนเหมือนเป็นเรื่องจริง แต่จริงๆ มันเป็นแค่ "การคาดเดา" ไม่ใช่สิ่งที่เกิดขึ้นแล้ว ลองถามตัวเองว่า ผลลัพธ์ที่ "น่าจะเกิดจริง" คืออะไร ไม่ใช่แค่อันที่น่ากลัวที่สุดครับ

## 3. เดาใจคนอื่น (Mind-Reading)

กับดักนี้ทำให้เราเชื่อว่ารู้ว่าคนอื่นกำลังคิดอะไรอยู่ ซึ่งมักเป็นเรื่องแย่ๆ เกี่ยวกับตัวเรา เช่น "เขาคงคิดว่าเราน่าเบื่อ" หรือ "หัวหน้าคงรำคาญเรา" แต่จริงๆ คนอื่นมองเราไม่ได้ชัดอย่างที่เรารู้สึกหรอก และส่วนใหญ่เขาก็วุ่นอยู่กับเรื่องของตัวเองมากกว่าที่เราคิด ถ้าเขาไม่ได้พูดออกมาตรงๆ มันก็เป็นแค่การเดา ไม่ใช่ความจริงครับ

## 4. เหมารวมจากครั้งเดียว (Overgeneralizing)

คือการเอาประสบการณ์แย่ครั้งเดียวมาตั้งเป็นกฎของทุกเรื่อง คุยกับใครแล้วเขินครั้งเดียวก็สรุปว่า "เราเข้ากับคนไม่เป็น" โดนปฏิเสธทีก็คิดว่า "ทำไมต้องเป็นแบบนี้ทุกที" คำว่า เสมอ ไม่เคย ทุกคน ไม่มีใคร คือสัญญาณของกับดักนี้ เหตุการณ์เดียวก็เป็นแค่เหตุการณ์เดียว ไม่ใช่ภาพรวมทั้งหมดของตัวเราครับ

## 5. กฎ "ต้อง" และ "ควร" ที่แบกไว้ (Should Statements)

คือกฎเงียบๆ ที่เราตั้งให้ตัวเอง เช่น "อายุเท่านี้ควรไปได้ไกลกว่านี้แล้ว" หรือ "ไม่ควรรู้สึกแบบนี้เลย" ทุกคำว่า "ต้อง" และ "ควร" มักแถมความรู้สึกผิดมาด้วยเวลาเราทำไม่ได้ตามนั้น และหลายข้อก็ไม่ใช่กฎของเราเองด้วยซ้ำ เราแค่ซึมซับมันมาจากที่ไหนสักแห่ง ลองเปลี่ยนจาก "เราต้อง" เป็น "เราอยากจะ" หรือ "ถ้าได้ก็ดี" ดูครับ มันเปลี่ยนคำสั่งให้กลายเป็นทางเลือก แล้วความกดดันจะเบาลงเยอะเลย

## อ้างอิงและอ่านเพิ่มเติม

แนวคิดในบทความนี้อิงจากงานจิตวิทยาที่ยอมรับกันมานาน:

- **กับดักความคิดในการบำบัดแบบ CBT** — [Aaron T. Beck](https://en.wikipedia.org/wiki/Cognitive_distortion)
- **รายการกับดักความคิดที่เป็นที่รู้จัก** — [David Burns (1980), Feeling Good](https://en.wikipedia.org/wiki/Feeling_Good:_The_New_Mood_Therapy)

---

> เราอาจห้ามไม่ให้ความคิดแรกผุดขึ้นมาไม่ได้ แต่เราฝึก "สังเกตมัน เรียกชื่อมัน แล้วเลือกได้ว่าจะเชื่อมันไหม" ได้ครับ`,
};

async function main() {
  const cs = process.env.DATABASE_URL;
  if (!cs) { console.error("DATABASE_URL not set"); process.exit(1); }
  const pool = new pg.Pool({ connectionString: cs });

  const cat = await pool.query("SELECT id FROM article_categories WHERE slug = $1", [CATEGORY_SLUG]);
  if (!cat.rows[0]) { console.error(`Category "${CATEGORY_SLUG}" not found`); process.exit(1); }
  const categoryId = cat.rows[0].id;

  const id = ulid();
  const rt = calcReadingTime(article.bodyTh, article.bodyEn);

  const res = await pool.query(
    `INSERT INTO articles
       (id, slug, category_id, title_th, title_en, excerpt_th, excerpt_en,
        body_th, body_en, key_takeaway_th, key_takeaway_en, tone, tags,
        reading_time_minutes, published, published_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
             CASE WHEN $15 THEN NOW() ELSE NULL END, NOW(), NOW())
     ON CONFLICT (slug) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        title_th = EXCLUDED.title_th, title_en = EXCLUDED.title_en,
        excerpt_th = EXCLUDED.excerpt_th, excerpt_en = EXCLUDED.excerpt_en,
        body_th = EXCLUDED.body_th, body_en = EXCLUDED.body_en,
        key_takeaway_th = EXCLUDED.key_takeaway_th, key_takeaway_en = EXCLUDED.key_takeaway_en,
        tone = EXCLUDED.tone, tags = EXCLUDED.tags,
        reading_time_minutes = EXCLUDED.reading_time_minutes,
        published = EXCLUDED.published, updated_at = NOW()
     RETURNING id, (xmax = 0) AS inserted`,
    [
      id, article.slug, categoryId, article.titleTh, article.titleEn,
      article.excerptTh, article.excerptEn, article.bodyTh, article.bodyEn,
      article.keyTakeawayTh, article.keyTakeawayEn, article.tone,
      JSON.stringify(article.tags), rt, article.published,
    ],
  );

  const row = res.rows[0];
  console.log(`${row.inserted ? "Inserted" : "Updated"} article "${article.slug}"`);
  console.log(`  id=${row.id}  category=${CATEGORY_SLUG}  tone=${article.tone}  reading=${rt}min  published=${article.published}`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
