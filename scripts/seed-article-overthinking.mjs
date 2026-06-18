/**
 * Seed one article: "Why Your Mind Loops the Same Thought" (overthinking, psychology).
 *
 * Self-contained (raw `pg`, no `@/` alias) so it can run against local or prod.
 * Idempotent via ON CONFLICT (slug) — re-running updates the row in place.
 *
 *   node --env-file=.env.local scripts/seed-article-overthinking.mjs   # local
 *   DATABASE_URL=<prod> node scripts/seed-article-overthinking.mjs     # prod
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
  slug: "overthinking-why-the-mind-loops",
  tone: "lavender",
  tags: ["Overthinking", "คิดวน", "คิดมาก", "ดูแลใจ"],
  published: true,
  titleEn: "Why Your Mind Loops the Same Thought (Even When It Doesn't Help)",
  titleTh: "ทำไมสมองถึงชอบคิดวนเรื่องเดิม (ทั้งที่ไม่ได้ช่วยอะไร)",
  excerptEn:
    "Lying awake replaying the same worry, knowing it won't hand you a new answer — that's not a sign you think too much or aren't strong enough. Your brain is wired to loop. Once you see how the loop actually works, it gets easier to look at it kindly and set it down.",
  excerptTh:
    "นอนไม่หลับเพราะคิดวนเรื่องเดิมซ้ำๆ ทั้งที่รู้ว่าคิดไปก็ไม่ได้คำตอบใหม่ ไม่ได้แปลว่าเราคิดมากเกินไปหรือใจไม่แข็งแรงพอ แต่สมองถูกออกแบบมาให้วนแบบนั้น พอเข้าใจว่าวงจรนี้ทำงานยังไงจริงๆ เราก็มองมันด้วยสายตาที่ใจดีขึ้น และวางมันลงได้ง่ายขึ้นครับ",
  keyTakeawayEn:
    "Overthinking feels like problem-solving, but it isn't: **problem-solving moves you toward a decision or an action, while rumination just circles the same spot.** Your brain loops on purpose — it's wired to keep unresolved problems 'open' so you don't forget a possible threat, which is why worries get loudest at night when nothing else is competing for your attention. The loop also feeds itself: **the more you replay it, the lower your mood drops, and a low mood pulls up even more negative thoughts.** The way out isn't forcing yourself to stop — it's noticing what's happening and naming it: **'this is looping, not solving.'** Then give the open thought somewhere to rest — write it down, or note how you're feeling — so your mind can stop holding it all at once.",
  keyTakeawayTh:
    "การคิดวนรู้สึกเหมือนการแก้ปัญหา แต่จริงๆ มันไม่ใช่ครับ **การแก้ปัญหาพาเราขยับไปหาการตัดสินใจหรือการลงมือทำ ส่วนการคิดวนแค่พาเราวนอยู่ที่เดิม** สมองวนซ้ำเพราะมันถูกออกแบบมาให้เก็บเรื่องที่ยังไม่จบไว้ 'ค้าง' ไม่ให้เราลืมภัยที่อาจเกิดขึ้น นั่นแหละคือเหตุผลที่มันดังที่สุดตอนกลางคืนตอนที่ไม่มีอะไรมาแย่งความสนใจ แถมวงจรนี้ยังเลี้ยงตัวเองด้วย **ยิ่งคิดวนซ้ำ อารมณ์ยิ่งตก พออารมณ์ตกก็ยิ่งดึงความคิดลบขึ้นมาอีก** ทางออกไม่ใช่การฝืนสั่งให้ตัวเองหยุดคิด แต่คือการรู้ทันว่ากำลังเกิดอะไรขึ้นแล้วเรียกชื่อมันว่า **'นี่คือการคิดวน ไม่ใช่การแก้ปัญหา'** จากนั้นหาที่พักให้ความคิดที่ค้างอยู่ ไม่ว่าจะเขียนมันออกมา หรือบันทึกว่าตอนนี้รู้สึกยังไง เพื่อให้สมองไม่ต้องแบกมันไว้ทั้งหมดพร้อมกันครับ",
  bodyEn: `It's 1 a.m. You've replayed the same conversation for the fortieth time tonight — what you said, what you should have said, what they were probably thinking. You already know that thinking about it more won't change anything. And yet the loop keeps going. Most of us treat this as a personal failing: I worry too much, I can't switch my brain off. But looping isn't a flaw in your character — it's a feature of how every human brain handles unfinished business. Understanding why the loop runs won't make it vanish, but it changes how you relate to it: from "what's wrong with me" to "oh, this is my brain doing its thing again."

## 1. Looping Isn't Solving (Rumination vs. Problem-Solving)

The reason the loop is so hard to drop is that it disguises itself as something useful. It feels like if you just think it through one more time, you'll finally crack it. But there's a clear line between the two: **problem-solving moves toward something** — a decision, a next step, a question you can actually answer — while **rumination circles the same feeling without ever landing.** Here's a quick test: after ten minutes of thinking, are you any closer to a step you could take? If yes, that's problem-solving. If you're just rehearsing how bad things are, your brain has slipped into a loop and mistaken the repetition for progress.

## 2. Your Brain Hates Unfinished Business (The Open Loop)

Back in 1927, a psychologist noticed that waiters could remember complex unpaid orders perfectly — then forgot them the instant the bill was settled. Our minds hold on to **anything left unresolved** and keep nudging us about it, while finished things get filed away and released. On top of that, the brain is a threat-detector by design: an unsolved worry registers as a possible danger, so it keeps the file open to make sure you don't forget to deal with it. So when you can't stop circling a problem, **it isn't your mind malfunctioning — it's your mind doing exactly what it evolved to do: refusing to drop something it has flagged as important.** The catch is that it can't tell the difference between a threat you can act on and one you can only stew over.

## 3. Why It Gets Loudest at Night (When the Noise Drops)

During the day, work, conversations, and a hundred small tasks keep your attention occupied. At night — or in the shower, or on a long drive — that competition disappears, and the brain drifts straight back to whatever's unresolved. That's why the same thought that felt manageable at 3 p.m. feels enormous at midnight: **less is happening, so the loop has the stage to itself.** And there's a second twist — rumination and mood feed each other. **The longer you replay something, the lower your mood sinks, and a low mood acts like a magnet, pulling up more memories and thoughts that match it.** It's a feedback loop, not a sign you're getting closer to the bottom of anything.

## 4. Naming the Loop Loosens It (What Actually Helps)

Because the loop runs on its own, ordering yourself to "just stop thinking about it" rarely works — it usually adds a layer of frustration on top. What helps more is small and almost gentle. The first move is simply to **catch it and name it**: "okay, this is looping, not solving." That one sentence opens a sliver of distance between you and the thought, and distance is what the loop can't survive in. The second is to **give the open thought a place to rest outside your head** — write the worry down, or note how you're feeling right now. Your mind loops partly because it's afraid to let go of something unfinished; **when you put it somewhere it can be found again, the brain is more willing to set it down for the night.** You're not solving the problem in that moment — you're telling your brain it's safe to stop holding it.

## Sources & Further Reading

The ideas in this article draw on well-established psychology research:

- **Why unfinished things keep nagging (the "open loop")** — [Zeigarnik, B. (1927)](https://en.wikipedia.org/wiki/Zeigarnik_effect)
- **Why looping isn't the same as solving** — [Nolen-Hoeksema, Wisco & Lyubomirsky (2008)](https://journals.sagepub.com/doi/10.1111/j.1745-6924.2008.00088.x)
- **The mind drifts — and dips — when it's unoccupied** — [Killingsworth & Gilbert (2010), Science](https://news.harvard.edu/gazette/story/2010/11/wandering-mind-not-a-happy-mind/)
- **A low mood pulls up more negative thoughts** — [Bower, G. (1981)](https://en.wikipedia.org/wiki/Mood_congruence)

---

> A looping mind isn't a weak one. It's a brain trying to take care of you — just with a tool built for a different kind of danger.`,
  bodyTh: `ตีหนึ่งแล้วครับ เราเพิ่งเล่นบทสนทนาเดิมซ้ำเป็นรอบที่สี่สิบของคืนนี้ ว่าเราพูดอะไรไป ควรจะพูดอะไร อีกฝ่ายคงคิดยังไงอยู่ ทั้งที่รู้อยู่แก่ใจว่าคิดต่อไปก็เปลี่ยนอะไรไม่ได้ แต่วงมันก็ยังหมุนอยู่ดี พวกเราหลายคนมองว่านี่คือความผิดของตัวเอง คิดมากไป สั่งให้สมองหยุดสักทีก็ไม่ได้ แต่การคิดวนไม่ใช่ข้อบกพร่องในตัวเรา มันคือกลไกปกติของสมองมนุษย์ทุกคนเวลาเจอเรื่องที่ยังไม่จบ การเข้าใจว่าทำไมวงนี้ถึงหมุน ไม่ได้ทำให้มันหายไปทันที แต่มันเปลี่ยนวิธีที่เราอยู่กับมัน จาก "เราเป็นอะไรไป" เป็น "อ๋อ นี่สมองมันกำลังทำงานของมันอีกแล้ว" ครับ

## 1. คิดวน ไม่ใช่การแก้ปัญหา (Not Problem-Solving)

เหตุผลที่วงคิดวนสลัดออกยากมาก คือมันปลอมตัวเป็นอะไรที่ดูมีประโยชน์ มันรู้สึกเหมือนว่าถ้าเราคิดอีกสักรอบเดียว เดี๋ยวก็คงคิดออก แต่จริงๆ สองอย่างนี้มีเส้นแบ่งชัดเจนครับ **การแก้ปัญหาจะขยับไปหาอะไรสักอย่าง** ไม่ว่าจะเป็นการตัดสินใจ ก้าวต่อไป หรือคำถามที่เราตอบได้จริง ส่วน **การคิดวนจะวนอยู่กับความรู้สึกเดิมโดยไม่เคยลงเอยที่ไหน** ลองเช็กง่ายๆ ว่าคิดมาสิบนาทีแล้ว เราเข้าใกล้ก้าวที่ลงมือทำได้บ้างไหม ถ้าใช่ นั่นคือการแก้ปัญหา แต่ถ้าเอาแต่ซ้อมว่ามันแย่แค่ไหน แสดงว่าสมองไถลเข้าวงคิดวนแล้ว และเข้าใจผิดว่าการวนซ้ำคือความคืบหน้า

## 2. สมองไม่ชอบเรื่องที่ค้างคา (The Open Loop)

ย้อนไปปี 1927 นักจิตวิทยาคนหนึ่งสังเกตว่าบริกรจำออเดอร์ซับซ้อนที่ยังไม่จ่ายเงินได้แม่นยำมาก แต่พอจ่ายบิลเสร็จปุ๊บก็ลืมทันที สมองเรายึด **ทุกเรื่องที่ยังไม่จบ** เอาไว้แล้วคอยสะกิดเตือนเรื่อยๆ ส่วนเรื่องที่จบแล้วจะถูกเก็บเข้าลิ้นชักแล้วปล่อยมือ ยิ่งไปกว่านั้น สมองถูกออกแบบมาให้เป็นเครื่องจับภัย เรื่องกังวลที่ยังไม่คลี่คลายจะถูกตีความว่าเป็นอันตรายที่อาจเกิดขึ้น มันเลยเปิดแฟ้มค้างไว้เพื่อไม่ให้เราลืมจัดการ ฉะนั้นเวลาที่เราหยุดวนเรื่องไหนไม่ได้ **มันไม่ใช่สมองทำงานผิดพลาด แต่คือสมองทำในสิ่งที่มันวิวัฒน์มาเป๊ะๆ คือไม่ยอมปล่อยเรื่องที่มันปักธงไว้ว่าสำคัญ** จุดที่พลาดคือมันแยกไม่ออกว่าภัยไหนลงมือแก้ได้ กับภัยไหนที่เราทำได้แค่นั่งกลุ้ม

## 3. ทำไมมันดังที่สุดตอนกลางคืน (Why It Gets Loud)

ตอนกลางวัน งาน บทสนทนา และงานจุกจิกอีกร้อยอย่างคอยดึงความสนใจเราเอาไว้ พอถึงกลางคืน หรือตอนอาบน้ำ หรือตอนขับรถไกลๆ ตัวแย่งความสนใจพวกนั้นหายไป สมองก็ลอยกลับไปหาเรื่องที่ยังค้างคาทันที นั่นแหละคือเหตุผลที่ความคิดเดียวกันซึ่งตอนบ่ายสามยังพอรับมือได้ พอเที่ยงคืนกลับใหญ่โตมหาศาล **เพราะมีอะไรเกิดขึ้นน้อยลง วงคิดวนเลยได้เวทีไปครองคนเดียว** แล้วยังมีอีกชั้นหนึ่งด้วย คือการคิดวนกับอารมณ์มันเลี้ยงกันไปมา **ยิ่งเราเล่นเรื่องเดิมซ้ำนานเท่าไหร่ อารมณ์ยิ่งดิ่งลง พออารมณ์ดิ่งมันก็ทำตัวเป็นแม่เหล็กดึงความทรงจำและความคิดที่เข้ากันกับอารมณ์นั้นขึ้นมาอีก** มันคือวงจรป้อนกลับ ไม่ใช่สัญญาณว่าเรากำลังเข้าใกล้คำตอบของอะไรเลยครับ

## 4. พอเรียกชื่อมันได้ มันก็คลายลง (What Helps)

เพราะวงคิดวนมันหมุนเองได้ การสั่งตัวเองว่า "หยุดคิดได้แล้ว" เลยแทบไม่เคยได้ผล ส่วนใหญ่มีแต่จะเพิ่มความหงุดหงิดซ้อนเข้าไปอีกชั้น สิ่งที่ช่วยได้มากกว่ากลับเป็นอะไรเล็กๆ และค่อนข้างอ่อนโยน ก้าวแรกคือแค่ **จับให้ทันแล้วเรียกชื่อมัน** ว่า "เอาล่ะ นี่คือการคิดวน ไม่ใช่การแก้ปัญหา" ประโยคเดียวนี้เปิดระยะห่างบางๆ ระหว่างเรากับความคิด และระยะห่างนี่แหละคือสิ่งที่วงคิดวนอยู่ไม่ได้ ก้าวที่สองคือ **หาที่พักให้ความคิดที่ค้างอยู่ ไว้นอกหัวเรา** จะเขียนเรื่องที่กังวลออกมา หรือบันทึกว่าตอนนี้รู้สึกยังไงก็ได้ สมองวนส่วนหนึ่งเพราะมันกลัวจะปล่อยเรื่องที่ยังไม่จบ **พอเราเอามันไปวางไว้ในที่ที่กลับมาหาเจอได้ สมองก็ยอมวางมันลงสำหรับคืนนี้ได้ง่ายขึ้น** ในตอนนั้นเราไม่ได้กำลังแก้ปัญหา แต่เรากำลังบอกสมองว่าปลอดภัยแล้วนะ ไม่ต้องแบกมันไว้ก็ได้ครับ

## อ้างอิงและอ่านเพิ่มเติม

แนวคิดในบทความนี้อิงจากงานจิตวิทยาที่ยอมรับกันมานาน:

- **ทำไมเรื่องที่ยังไม่จบถึงคอยกวนใจ (open loop)** — [Zeigarnik (1927)](https://en.wikipedia.org/wiki/Zeigarnik_effect)
- **ทำไมการคิดวนไม่เท่ากับการแก้ปัญหา** — [Nolen-Hoeksema, Wisco & Lyubomirsky (2008)](https://journals.sagepub.com/doi/10.1111/j.1745-6924.2008.00088.x)
- **จิตวอกแวกกลับไปหาเรื่องค้างตอนว่าง และทำให้อารมณ์ตก** — [Killingsworth & Gilbert (2010), Science](https://news.harvard.edu/gazette/story/2010/11/wandering-mind-not-a-happy-mind/)
- **อารมณ์ที่ตกดึงความคิดลบขึ้นมาอีก** — [Bower (1981)](https://en.wikipedia.org/wiki/Mood_congruence)

---

> สมองที่คิดวนไม่ใช่สมองที่อ่อนแอ มันคือสมองที่พยายามดูแลเรา แค่ด้วยเครื่องมือที่ถูกสร้างมาเพื่อภัยอีกแบบหนึ่งเท่านั้นเองครับ`,
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
