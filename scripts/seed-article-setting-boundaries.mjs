/**
 * Seed one article: "Why Saying No Feels So Hard" (boundaries, psychology).
 *
 * Self-contained (raw `pg`, no `@/` alias) so it can run against local or prod.
 * Idempotent via ON CONFLICT (slug) — re-running updates the row in place.
 *
 *   node --env-file=.env.local scripts/seed-article-setting-boundaries.mjs   # local
 *   DATABASE_URL=<prod> node scripts/seed-article-setting-boundaries.mjs     # prod
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

const CATEGORY_SLUG = "psychology";

const article = {
  slug: "setting-boundaries-saying-no",
  tone: "blue",
  tags: ["Boundaries", "การตั้งขอบเขต", "พูดว่าไม่"],
  published: true,
  titleEn: "Why Saying No Feels So Hard — and How to Set Boundaries Without the Guilt",
  titleTh: "ทำไมการพูดว่า \"ไม่\" ถึงยากนัก แล้วตั้งขอบเขตยังไงให้ไม่รู้สึกผิด",
  excerptEn:
    "You say yes to one more thing, then quietly resent it. Saying no isn't rude or selfish — it's a skill, and the guilt that comes with it can fade with practice. Here's how to start.",
  excerptTh:
    "ตอบตกลงไปอีกเรื่อง แล้วก็มานั่งหงุดหงิดกับตัวเองทีหลัง การพูดว่า \"ไม่\" ไม่ได้แปลว่าเราใจร้ายหรือเห็นแก่ตัว มันเป็นทักษะที่ฝึกได้ และความรู้สึกผิดที่ตามมาก็ค่อยๆ จางลงได้ครับ",
  keyTakeawayEn:
    "Saying no feels hard because we're wired to fear disappointing people — but a boundary isn't a wall that pushes others away, it's the line that lets a relationship stay honest instead of quietly resentful. You don't owe anyone a long apology or a list of excuses: **a clear, kind, short no is enough** (\"I can't take that on right now\"). The guilt that shows up afterward is a habit, not proof you did something wrong, and it fades the more you practice. **Start with low-stakes situations** — a small no to a minor request — and let the muscle grow from there. Protecting your time and energy isn't selfish; it's what lets you show up for the things that actually matter.",
  keyTakeawayTh:
    "การพูดว่า \"ไม่\" มันยากเพราะเราถูกหล่อหลอมมาให้กลัวการทำให้คนอื่นผิดหวัง แต่ขอบเขตไม่ใช่กำแพงที่ผลักคนออกไป มันคือเส้นที่ทำให้ความสัมพันธ์ยังจริงใจต่อกันได้ แทนที่จะค่อยๆ เก็บความหงุดหงิดไว้ข้างใน เราไม่ได้ติดค้างคำขอโทษยาวๆ หรือเหตุผลเป็นพรืดกับใคร เพราะ **คำว่าไม่ที่ชัดเจน ใจดี และสั้นๆ ก็พอแล้ว** (\"ตอนนี้เรารับเพิ่มไม่ไหวจริงๆ\") ความรู้สึกผิดที่โผล่มาทีหลังเป็นแค่ความเคยชิน ไม่ใช่หลักฐานว่าเราทำผิด และมันจะจางลงเรื่อยๆ ยิ่งฝึกยิ่งง่าย **เริ่มจากเรื่องเล็กๆ ก่อน** ปฏิเสธคำขอเล็กน้อยที่ไม่กดดัน แล้วค่อยๆ ขยับขึ้นไป การดูแลเวลาและพลังของตัวเองไม่ใช่ความเห็นแก่ตัว แต่มันคือสิ่งที่ทำให้เรามีแรงไปทุ่มเทกับเรื่องที่สำคัญจริงๆ ครับ",
  bodyEn: `Someone asks for a favor, and before you've even thought it through, "sure, no problem" is already out of your mouth. Later you feel the weight of it — the evening you gave away, the thing you actually wanted to do, the quiet flicker of resentment you'd never say out loud. If saying no makes your chest tighten, you're not weak or difficult. For a lot of us, "yes" became the safe answer a long time ago. The good news is that boundaries are a skill, not a personality trait — and like any skill, they get easier with practice.

## 1. Why It Feels So Hard (Why It's Hard)

Most of us learned early that keeping other people happy keeps us safe — so a request triggers a quiet fear of disappointing someone, being seen as selfish, or starting a conflict. Saying yes makes that fear go away *right now*, even if it costs us later. That's why the word "no" can feel physically uncomfortable, like you're doing something wrong. But notice what's actually happening: you're not avoiding harm, you're avoiding a feeling. And a feeling you can learn to sit with.

## 2. A Boundary Isn't a Wall (Not Selfish)

The biggest myth about boundaries is that they push people away. In reality, a boundary is what keeps a relationship honest. When you keep saying yes while quietly running on empty, the resentment builds — and that's what actually erodes closeness, far more than a kind no ever could. Saying "I can't do this one" isn't shutting someone out; it's telling them the truth so the relationship can run on something real instead of a slow, silent burnout.

## 3. You Don't Owe a Long Explanation (How to Say It)

A no doesn't need a paragraph of apology or a stack of excuses — the more you over-explain, the more it sounds like a door you've left open for negotiation. A clear, warm, short answer is plenty: "I can't take that on right now," "That doesn't work for me this week," "I'd love to, but I'm full." You can be kind and firm at the same time. And you don't have to fill the silence afterward — let the no stand on its own.

## 4. Start With the Small Ones (Start Small)

You don't have to begin with the hardest person in your life. Like any muscle, this one grows from light reps first: decline a small request, skip an event you don't want to attend, let a non-urgent message wait until tomorrow. Each small no teaches your nervous system that the feared disaster doesn't come — the other person is usually fine, and you're still okay. The guilt that shows up afterward isn't a verdict; it's just an old habit fading. Give it time, and "no" stops feeling like a betrayal and starts feeling like self-respect.

---

> Every time you say no to something that drains you, you're quietly saying yes to something that matters more.`,
  bodyTh: `มีคนมาขอให้ช่วยอะไรสักอย่าง แล้วยังไม่ทันได้คิดเลย คำว่า "ได้เลย ไม่มีปัญหา" ก็หลุดออกไปแล้ว พอตกเย็นถึงค่อยรู้สึกถึงน้ำหนักของมัน — เวลาที่ยกให้เขาไป เรื่องที่เราตั้งใจจะทำเอง ความหงุดหงิดเบาๆ ที่ไม่เคยพูดออกมาดังๆ ถ้าการปฏิเสธทำให้รู้สึกอึดอัดในอก คุณไม่ได้อ่อนแอหรือเป็นคนเรื่องมากนะครับ สำหรับหลายคน คำว่า "ตกลง" กลายเป็นคำตอบที่ปลอดภัยมาตั้งนานแล้ว ข่าวดีคือการตั้งขอบเขตเป็นทักษะ ไม่ใช่นิสัยติดตัว และเหมือนทักษะทุกอย่าง มันง่ายขึ้นเมื่อได้ฝึก

## 1. ทำไมมันถึงยากนัก (Why It's Hard)

พวกเราส่วนใหญ่ถูกสอนมาตั้งแต่เด็กว่า การทำให้คนอื่นพอใจคือการทำให้ตัวเองปลอดภัย พอมีคนมาขออะไร มันเลยจุดความกลัวเบาๆ ขึ้นมา — กลัวทำให้เขาผิดหวัง กลัวโดนมองว่าเห็นแก่ตัว กลัวจะมีปากเสียงกัน การตอบตกลงทำให้ความกลัวนั้นหายไป "ตอนนี้" เลย ถึงแม้จะต้องมาจ่ายทีหลังก็ตาม นี่แหละครับที่ทำให้คำว่า "ไม่" รู้สึกอึดอัดเหมือนเรากำลังทำอะไรผิด แต่ลองสังเกตดูดีๆ ว่าจริงๆ แล้วเกิดอะไรขึ้น เราไม่ได้กำลังหลบเลี่ยงอันตราย เราแค่กำลังหลบเลี่ยง "ความรู้สึก" และความรู้สึกน่ะ เราฝึกอยู่กับมันได้

## 2. ขอบเขตไม่ใช่กำแพง (Not Selfish)

ความเข้าใจผิดที่ใหญ่ที่สุดเรื่องขอบเขต คือคิดว่ามันผลักคนออกไป แต่จริงๆ ขอบเขตคือสิ่งที่ทำให้ความสัมพันธ์ยังจริงใจต่อกันได้ เวลาเราตอบตกลงไปเรื่อยๆ ทั้งที่ข้างในแห้งแล้งหมดแรง ความหงุดหงิดมันจะค่อยๆ สะสม และนั่นต่างหากที่กัดกร่อนความสนิทกัน มากกว่าคำปฏิเสธดีๆ คำเดียวเสียอีก การบอกว่า "เรื่องนี้เราทำให้ไม่ได้" ไม่ใช่การปิดประตูใส่ใคร แต่คือการบอกความจริง เพื่อให้ความสัมพันธ์เดินต่อบนอะไรที่จริง แทนที่จะค่อยๆ มอดไหม้เงียบๆ

## 3. เราไม่ได้ติดค้างคำอธิบายยาวๆ (How to Say It)

คำว่าไม่ ไม่ต้องมีคำขอโทษยาวเป็นย่อหน้า หรือเหตุผลกองเป็นพรืด ยิ่งเราอธิบายเยอะ มันยิ่งฟังเหมือนประตูที่เราแง้มไว้ให้ต่อรอง คำตอบสั้นๆ ที่ชัดเจนและอบอุ่นก็พอแล้วครับ เช่น "ตอนนี้เรารับเพิ่มไม่ไหวจริงๆ" "สัปดาห์นี้ไม่สะดวกเลย" หรือ "อยากช่วยนะ แต่ตอนนี้เต็มมือมากๆ" เราใจดีและหนักแน่นไปพร้อมกันได้ และไม่ต้องรีบเติมความเงียบที่ตามมาด้วย ปล่อยให้คำว่าไม่ยืนอยู่ของมันเองได้เลย

## 4. เริ่มจากเรื่องเล็กๆ ก่อน (Start Small)

ไม่ต้องเริ่มจากคนที่ยากที่สุดในชีวิตก็ได้ครับ เหมือนกล้ามเนื้อมัดหนึ่ง มันโตจากการฝึกเบาๆ ก่อน ลองปฏิเสธคำขอเล็กน้อย ลองไม่ไปงานที่ไม่ได้อยากไป ลองปล่อยข้อความที่ไม่ด่วนไว้ตอบพรุ่งนี้ คำว่าไม่เล็กๆ แต่ละครั้งกำลังสอนใจเราว่า เรื่องร้ายที่กลัวไว้มันไม่ได้เกิดขึ้นจริง — อีกฝ่ายส่วนใหญ่ก็โอเคดี และเราก็ยังโอเคอยู่ ความรู้สึกผิดที่โผล่มาทีหลังไม่ใช่คำตัดสินว่าเราทำผิด มันเป็นแค่ความเคยชินเก่าๆ ที่กำลังจางลง ให้เวลามันหน่อย แล้วคำว่า "ไม่" จะเลิกรู้สึกเหมือนการทรยศ และเริ่มรู้สึกเหมือนการเคารพตัวเองครับ

---

> ทุกครั้งที่เราพูดว่าไม่กับสิ่งที่ดูดพลังเราไป เรากำลังพูดว่าใช่เงียบๆ ให้กับสิ่งที่สำคัญกว่าอยู่`,
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
