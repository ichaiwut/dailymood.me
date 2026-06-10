/**
 * Seed one article: "Why We Comfort Friends So Well — and Treat Ourselves the Worst" (self-compassion, basics).
 *
 * Self-contained (raw `pg`, no `@/` alias) so it can run against local or prod.
 * Idempotent via ON CONFLICT (slug) — re-running updates the row in place.
 *
 *   node --env-file=.env.local scripts/seed-article-self-compassion.mjs   # local
 *   DATABASE_URL=<prod> node scripts/seed-article-self-compassion.mjs     # prod
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

const CATEGORY_SLUG = "basics";

const article = {
  slug: "self-compassion-treat-yourself-like-a-friend",
  tone: "peach",
  tags: ["Self-compassion", "ใจดีกับตัวเอง", "ดูแลใจ"],
  published: true,
  titleEn: "Why We Comfort Friends So Well — but Are Hardest on Ourselves",
  titleTh: "ทำไมเราปลอบเพื่อนเก่ง แต่กลับใจร้ายกับตัวเองที่สุด",
  excerptEn:
    "When a friend fails, we know exactly what to say. When we fail, the voice in our head turns harsh. Self-compassion is the skill of turning that same warmth inward — and it makes you stronger, not softer.",
  excerptTh:
    "เวลาเพื่อนพลาด เรารู้เลยว่าควรพูดอะไร แต่พอเป็นตัวเองพลาดบ้าง เสียงในหัวกลับดุที่สุด ใจดีกับตัวเองคือทักษะของการหันความอบอุ่นแบบเดียวกันนั้นกลับเข้าหาตัวเอง และมันทำให้เราแข็งแรงขึ้น ไม่ใช่อ่อนแอลงครับ",
  keyTakeawayEn:
    "Most of us speak to ourselves in a tone we'd never use with someone we love. Self-compassion isn't self-pity or letting yourself off the hook — research finds that people who are kind to themselves actually **recover from setbacks faster and stay more motivated**, because energy spent on self-attack gets freed up for actually fixing things. It rests on three parts: **being gentle instead of harsh** when you're struggling, **remembering that everyone fails sometimes** (you're not uniquely flawed), and **acknowledging the feeling as it is** — without suppressing it or drowning in it. The simplest way in: when you stumble, ask **\"what would I say to my closest friend right now?\"** — then try offering yourself that same sentence.",
  keyTakeawayTh:
    "พวกเราหลายคนพูดกับตัวเองด้วยน้ำเสียงที่ไม่มีวันใช้กับคนที่เรารัก ใจดีกับตัวเองไม่ใช่การสงสารตัวเองหรือปล่อยผ่านความผิดพลาด งานวิจัยพบว่าคนที่ใจดีกับตัวเองกลับ **ฟื้นตัวจากความผิดพลาดได้เร็วกว่าและมีแรงไปต่อมากกว่า** เพราะพลังที่เคยใช้ตำหนิตัวเองถูกปลดปล่อยไปใช้แก้ปัญหาจริงๆ แทน หัวใจของมันมี 3 ส่วน คือ **อ่อนโยนแทนที่จะซ้ำเติม** ในวันที่ลำบาก, **จำไว้ว่าใครๆ ก็พลาดกันได้** (เราไม่ได้แย่อยู่คนเดียว) และ **รับรู้ความรู้สึกตามที่มันเป็น** โดยไม่กดทับและไม่จมดิ่งไปกับมัน วิธีเริ่มที่ง่ายที่สุดคือ เวลาพลาด ลองถามตัวเองว่า **\"ถ้าเป็นเพื่อนสนิท เราจะพูดกับเขาว่าอะไร\"** แล้วลองมอบประโยคเดียวกันนั้นให้ตัวเองดูครับ",
  bodyEn: `A friend calls you after messing up at work. You don't even have to think — "hey, it happens to everyone, you've been doing your best." The words come out warm and easy. Now picture yourself making the exact same mistake. The voice in your head probably sounds nothing like that. For many of us it turns sharp instantly: how could you, you should've known better, this always happens. Somewhere along the way we learned that being hard on ourselves is how responsible people behave. But there's a different way to meet your own bad days — psychologists call it self-compassion — and it's a skill you can practice, not a personality you're born with.

## 1. It's Not Letting Yourself Off the Hook (Common Myth)

The biggest worry people have: "if I stop criticizing myself, won't I get lazy?" Research says the opposite. People who treat themselves with kindness after a failure actually recover faster, are more willing to admit mistakes, and are more likely to try again — because the energy that used to go into self-attack gets freed up for actually fixing things. Harsh self-criticism feels productive, but it mostly just adds a second injury on top of the first: now you're dealing with the mistake *and* the beating you're giving yourself for it.

## 2. The Three Parts of Self-Compassion (Three Elements)

The first is **gentleness over harshness** — talking to yourself like someone who's on your side, especially when things go wrong. The second is **remembering you're not alone in this**: everyone fails, gets rejected, and has days they're not proud of. Struggling doesn't make you uniquely broken; it makes you human. The third is **seeing the feeling as it is** — letting yourself notice "this hurts" without pretending it's fine, and without spiraling into "this hurts, therefore everything is ruined." Kindness, shared humanity, and honest awareness — together they change how a hard day lands on you.

## 3. Try the Friend Test (Perspective Shift)

Here's the simplest doorway in. Next time you catch the harsh voice mid-sentence, pause and ask: *if my closest friend were in this exact situation, what would I say to them?* Notice the gap between that answer and what you were just saying to yourself. You don't have to force positive thinking or pretend the mistake didn't matter — just try offering yourself the same sentence you'd offer them. It often feels awkward at first. That awkwardness is just a sign the muscle hasn't been used much.

## 4. Small Gestures Beat Big Speeches (Daily Practice)

Self-compassion doesn't require a ritual. On a rough day, it can be as small as putting a hand on your chest and taking one slow breath. Saying quietly, "today was genuinely hard." Letting yourself rest without earning it first. Even noting your mood at the end of the day — honestly, without grading yourself — is a small act of treating your feelings as worth listening to. None of these fix the problem on the spot. What they do is change who shows up to face the problem: someone who's been kicked while down, or someone who has their own back.

---

> You can hold yourself to high standards and still be on your own side — the two were never opposites.`,
  bodyTh: `ลองนึกภาพเพื่อนโทรมาหาหลังทำงานพลาดครับ เราแทบไม่ต้องคิดเลย "เฮ้ย ใครๆ ก็พลาดกันได้ แกทำเต็มที่แล้ว" คำปลอบไหลออกมาง่ายและอบอุ่นมาก ทีนี้ลองนึกว่าเราทำพลาดเรื่องเดียวกันเป๊ะ เสียงในหัวเราคงไม่ได้พูดแบบนั้น สำหรับหลายคนมันเปลี่ยนเป็นเสียงดุทันที ทำไมถึงพลาด น่าจะรู้ดีกว่านี้ เป็นแบบนี้ทุกที เหมือนเราถูกสอนมาว่าการเข้มงวดกับตัวเองคือความรับผิดชอบ แต่จริงๆ แล้วมีอีกวิธีในการอยู่กับวันแย่ๆ ของตัวเอง นักจิตวิทยาเรียกว่า Self-compassion หรือการใจดีกับตัวเอง และมันคือทักษะที่ฝึกได้ ไม่ใช่นิสัยที่ต้องเกิดมาพร้อมครับ

## 1. ใจดีกับตัวเอง ไม่ใช่การปล่อยผ่านตัวเอง (Common Myth)

ความกังวลที่คนมีมากที่สุดคือ "ถ้าเลิกดุตัวเอง เดี๋ยวก็ขี้เกียจสิ" แต่งานวิจัยพบตรงกันข้ามครับ คนที่ใจดีกับตัวเองหลังความผิดพลาด กลับฟื้นตัวเร็วกว่า กล้ายอมรับผิดมากกว่า และมีแนวโน้มลุกขึ้นลองใหม่มากกว่า เพราะพลังที่เคยหมดไปกับการตำหนิตัวเอง ถูกเอาไปใช้แก้ปัญหาจริงๆ แทน การดุตัวเองแรงๆ มันรู้สึกเหมือนมีประโยชน์ แต่ส่วนใหญ่มันแค่เพิ่มแผลที่สองซ้อนลงไปบนแผลแรก คือต้องรับมือทั้งความผิดพลาด และความเจ็บจากการซ้ำเติมตัวเองไปพร้อมกัน

## 2. สามส่วนของการใจดีกับตัวเอง (Three Elements)

ส่วนแรกคือ **อ่อนโยนแทนการซ้ำเติม** พูดกับตัวเองเหมือนคนที่อยู่ข้างเรา โดยเฉพาะตอนที่อะไรๆ ไม่เป็นใจ ส่วนที่สองคือ **จำไว้ว่าเราไม่ได้แย่อยู่คนเดียว** ทุกคนเคยพลาด เคยถูกปฏิเสธ เคยมีวันที่ไม่ภูมิใจในตัวเอง ความลำบากไม่ได้แปลว่าเราพังกว่าคนอื่น มันแปลว่าเราเป็นมนุษย์ และส่วนที่สามคือ **มองความรู้สึกตามที่มันเป็น** ยอมให้ตัวเองรับรู้ว่า "มันเจ็บนะ" โดยไม่ต้องฝืนว่าไม่เป็นไร และไม่เลยเถิดไปถึง "มันเจ็บ แปลว่าทุกอย่างพังหมดแล้ว" ความอ่อนโยน ความรู้สึกร่วมกับคนอื่น และการรับรู้ตามจริง สามอย่างนี้รวมกันแล้วเปลี่ยนน้ำหนักของวันแย่ๆ ได้จริงครับ

## 3. ลองใช้ "เพื่อนสนิทเทสต์" (The Friend Test)

นี่คือประตูที่ง่ายที่สุดครับ ครั้งหน้าถ้าจับได้ว่าเสียงดุในหัวกำลังพูดอยู่ ลองหยุดแล้วถามว่า *ถ้าเพื่อนสนิทเจอสถานการณ์เดียวกันนี้เป๊ะ เราจะพูดกับเขาว่าอะไร* แล้วสังเกตระยะห่างระหว่างคำตอบนั้น กับสิ่งที่เราเพิ่งพูดใส่ตัวเอง ไม่ต้องฝืนคิดบวก ไม่ต้องแกล้งทำว่าความผิดพลาดไม่สำคัญ แค่ลองมอบประโยคเดียวกันนั้นให้ตัวเองดู ช่วงแรกมันมักรู้สึกเขินๆ แปลกๆ นั่นเป็นแค่สัญญาณว่ากล้ามเนื้อมัดนี้ไม่ค่อยถูกใช้งานเท่านั้นเองครับ

## 4. ท่าทีเล็กๆ สำคัญกว่าคำพูดสวยๆ (Small Gestures)

การใจดีกับตัวเองไม่ต้องมีพิธีอะไรเลยครับ ในวันที่หนักๆ มันเล็กได้ขนาดเอามือวางที่หน้าอกแล้วหายใจช้าๆ สักหนึ่งครั้ง บอกตัวเองเบาๆ ว่า "วันนี้ยากจริงๆ นะ" หรือยอมให้ตัวเองพักโดยไม่ต้องรู้สึกว่าต้องทำอะไรให้สมควรพักก่อน แม้แต่การบันทึกอารมณ์ตอนท้ายวันแบบตรงไปตรงมา โดยไม่ตัดสินว่ารู้สึกแบบนี้ถูกหรือผิด ก็เป็นการบอกตัวเองเล็กๆ ว่าความรู้สึกของเราน่ารับฟัง สิ่งเหล่านี้ไม่ได้แก้ปัญหาตรงหน้าทันที แต่มันเปลี่ยนคนที่จะลุกไปเจอปัญหานั้น จากคนที่เพิ่งโดนซ้ำเติม เป็นคนที่มีตัวเองอยู่ข้างๆ ครับ

---

> เราตั้งมาตรฐานสูงให้ตัวเอง พร้อมกับอยู่ข้างตัวเองไปด้วยได้ สองอย่างนี้ไม่เคยขัดกันเลย`,
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
