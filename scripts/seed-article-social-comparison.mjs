/**
 * Seed one article: "Why the More You Scroll, the More Your Own Life Feels Not Enough"
 * (social comparison, psychology).
 *
 * Self-contained (raw `pg`, no `@/` alias) so it can run against local or prod.
 * Idempotent via ON CONFLICT (slug) — re-running updates the row in place.
 *
 *   node --env-file=.env.local scripts/seed-article-social-comparison.mjs   # local
 *   DATABASE_URL=<prod> node scripts/seed-article-social-comparison.mjs     # prod
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
  slug: "social-comparison-why-scrolling-drains-you",
  tone: "blue",
  tags: ["Social comparison", "เปรียบเทียบตัวเอง", "โซเชียล", "ดูแลใจ"],
  published: true,
  titleEn: "Why the More You Scroll, the More Your Own Life Feels Not Enough",
  titleTh: "ทำไมยิ่งเลื่อนฟีด ยิ่งรู้สึกว่าชีวิตตัวเองไม่พอ",
  excerptEn:
    "You open your phone for a five-minute break and close it twenty minutes later feeling quietly worse about your own life — not because anything bad happened, but because everyone else's looked better. That heaviness isn't envy or weakness. It's what happens when your brain compares your behind-the-scenes to everyone else's highlight reel.",
  excerptTh:
    "เปิดมือถือว่าจะพักสักห้านาที พอปิดอีกทีผ่านไปยี่สิบนาที แล้วรู้สึกแย่กับชีวิตตัวเองขึ้นมาเงียบๆ ทั้งที่ไม่มีอะไรไม่ดีเกิดขึ้นเลย แค่ชีวิตคนอื่นดูดีกว่า ความหนักอึ้งนั้นไม่ใช่ความอิจฉาหรือความอ่อนแอ แต่มันคือสิ่งที่เกิดขึ้นเวลาสมองเอาเบื้องหลังของเราไปเทียบกับฉากที่ดีที่สุดของคนอื่นครับ",
  keyTakeawayEn:
    "Scrolling drains you because your brain is doing something automatic: **comparing yourself to others to figure out how you're doing.** That's a normal built-in function, not a character flaw. The trap is what you're comparing against — a feed is a **highlight reel**, the best 1% of everyone's life, edited and chosen. So you end up measuring **your ordinary behind-the-scenes against everyone else's curated best moments** — a contest rigged to make you lose. Research links more time on social media with lower mood and a stronger sense of 'not enough,' especially when you compare *upward* to people who seem better off. The way out isn't deleting every app — it's noticing the moment you start measuring, and **changing what you compare against: yourself yesterday, not a stranger's highlight today.**",
  keyTakeawayTh:
    "การเลื่อนฟีดทำให้เหนื่อยใจเพราะสมองกำลังทำสิ่งหนึ่งโดยอัตโนมัติ คือ **เอาตัวเราไปเทียบกับคนอื่นเพื่อประเมินว่าเราเป็นยังไง** นี่เป็นกลไกปกติที่ติดตัวมา ไม่ใช่ข้อเสียของนิสัย จุดที่เป็นกับดักคือสิ่งที่เราเอาไปเทียบ เพราะฟีดคือ **ช่วงไฮไลต์** หรือ 1% ที่ดีที่สุดของชีวิตคนอื่น ที่ผ่านการเลือกและแต่งมาแล้ว เราเลยเอา **เบื้องหลังธรรมดาๆ ของตัวเอง ไปเทียบกับฉากที่ดีที่สุดของคนอื่น** ซึ่งเป็นการแข่งที่ถูกตั้งมาให้เราแพ้ตั้งแต่แรก งานวิจัยพบว่ายิ่งใช้เวลากับโซเชียลมาก อารมณ์ยิ่งตกและยิ่งรู้สึกว่าตัวเอง 'ไม่พอ' โดยเฉพาะเวลาเทียบ *ขึ้น* ไปหาคนที่ดูดีกว่า ทางออกไม่ใช่การลบทุกแอปทิ้ง แต่คือการรู้ทันจังหวะที่เริ่มเทียบ แล้ว **เปลี่ยนสิ่งที่เอาไปเทียบ มาเป็นตัวเราเมื่อวาน ไม่ใช่ช่วงไฮไลต์ของคนแปลกหน้าวันนี้ครับ**",
  bodyEn: `You meant to check one thing. Twenty minutes later you're still scrolling — a friend's beach trip, someone's new apartment, a stranger your age who somehow already has it all figured out. Nothing bad happened, but you close the app feeling a little smaller than when you opened it. Most of us blame ourselves for this: I shouldn't compare, I should be happy for them, what's wrong with me. But that quiet drain isn't a sign you're shallow or insecure. It's the predictable result of pointing a very old mental habit at a very new kind of screen.

## 1. Your Brain Compares on Autopilot

Long before phones, humans had no objective ruler for questions like *am I doing okay?* So the mind found a workaround: it measures us against the people around us. A psychologist named Leon Festinger described this back in 1954 — when there's no clear standard, we figure out where we stand by **comparing ourselves to others.** It's how you gauge whether your salary is fair, whether your kid is on track, whether your life is "normal." This isn't pettiness or envy; it's a built-in tool for self-evaluation. The problem isn't that you compare. The problem is *who* your brain now has available to compare against — and what they're choosing to show you.

## 2. A Feed Is a Highlight Reel, Not a Life

In real life you compared yourself to maybe a few dozen people, and you saw their ordinary days too — their tired mornings, their boring commutes. A feed strips all of that away. What's left is curated: the trip, not the credit-card bill; the engagement photo, not the argument the week before. Everyone posts their best 1% and quietly edits out the rest. So when you scroll, you're not comparing your life to their life — you're comparing **your full, messy, behind-the-scenes reality to a stranger's carefully chosen highlight reel.** It feels like an honest comparison, which is exactly why it stings. But it's rigged from the start: you know everything about your own ordinary days, and almost nothing about theirs.

## 3. Comparing Upward, Over and Over

Not all comparison hurts. Sometimes seeing someone thrive is genuinely inspiring. But feeds tilt us toward **upward comparison** — endlessly looking at people who appear happier, richer, more in love, further ahead. Do it twice and it's fine. Do it for twenty minutes, several times a day, and it adds up. Researchers who tracked people's Facebook use found that **the more they used it, the worse they felt afterward** — not better. Others found that scrolling through everyone's highlight reels is linked to **feeling more down and more "not enough,"** largely *because* of all that upward comparing. The heaviness you feel isn't random. It's the slow accumulation of a hundred small moments of measuring yourself against an edited best-case.

## 4. Compare to Yourself Yesterday

The fix isn't to quit every app or to scold yourself for comparing — that just stacks guilt on top of the heaviness. What helps is smaller. First, **catch the moment it starts:** notice the little dip, and name it — "I'm comparing my behind-the-scenes to someone's highlight reel again." That one sentence breaks the spell, because the comparison only works while it stays invisible. Second, **change your reference point.** Instead of measuring against a stranger's best day, measure against **the one person whose full story you actually know: you, yesterday.** Are you a little kinder, a little steadier, a little further along than before? That's the only comparison that's fair — and the only one that can actually point you somewhere. Checking in with how *you* feel, instead of how you stack up, turns the lens back around to the one life you're actually living.

## Sources & Further Reading

The ideas in this article draw on well-established psychology research:

- **Why we compare ourselves to others at all** — [Festinger, L. (1954)](https://en.wikipedia.org/wiki/Social_comparison_theory)
- **More social media use, worse mood afterward** — [Kross et al. (2013), PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0069841)
- **Seeing everyone's highlight reels and feeling down** — [Steers, Wickham & Acitelli (2014)](https://guilfordjournals.com/doi/10.1521/jscp.2014.33.8.701)
- **Social comparison on social media and self-esteem** — [Vogel et al. (2014)](https://doi.apa.org/doi/10.1037/ppm0000047)

---

> The problem was never that your life is too small. It's that you've been holding it up against a highlight reel — and forgetting you only ever see other people's best 1%.`,
  bodyTh: `ตั้งใจจะเปิดดูแค่เรื่องเดียว ผ่านไปยี่สิบนาทียังเลื่อนอยู่เลย ทริปทะเลของเพื่อน คอนโดใหม่ของใครคนหนึ่ง คนแปลกหน้าวัยเดียวกับเราที่ดูเหมือนจะมีทุกอย่างลงตัวไปหมดแล้ว ไม่มีอะไรไม่ดีเกิดขึ้นเลย แต่พอปิดแอปกลับรู้สึกตัวเล็กลงนิดนึงกว่าตอนเปิด พวกเราหลายคนโทษตัวเองกับเรื่องนี้ ว่าไม่ควรไปเทียบ ควรจะดีใจกับเขาสิ เราเป็นอะไรไป แต่ความเหนื่อยใจเงียบๆ นั้นไม่ใช่สัญญาณว่าเราตื้นเขินหรือไม่มั่นใจในตัวเอง มันคือผลที่คาดเดาได้ของการเอานิสัยทางใจเก่าแก่มากๆ ไปจ่อกับหน้าจอแบบใหม่เอี่ยมครับ

## 1. สมองเราเทียบตัวเองโดยอัตโนมัติ (Auto-Compare)

ก่อนจะมีมือถือ มนุษย์ไม่มีไม้บรรทัดที่วัดได้ตรงๆ สำหรับคำถามอย่าง *ตอนนี้เราโอเคไหม* สมองเลยหาทางลัด คือเอาตัวเราไปวัดกับคนรอบข้าง นักจิตวิทยาชื่อ Leon Festinger อธิบายเรื่องนี้ไว้ตั้งแต่ปี 1954 ว่าเวลาไม่มีมาตรฐานที่ชัดเจน เราจะรู้ว่าตัวเองอยู่ตรงไหนด้วยการ **เอาตัวเองไปเทียบกับคนอื่น** มันคือวิธีที่เราใช้ดูว่าเงินเดือนเราโอเคไหม ลูกเราโตตามวัยหรือเปล่า ชีวิตเรา "ปกติ" ไหม นี่ไม่ใช่ความใจแคบหรือความอิจฉา แต่เป็นเครื่องมือประเมินตัวเองที่ติดตัวเรามา ปัญหาไม่ได้อยู่ที่เราเทียบ ปัญหาอยู่ที่ตอนนี้สมองมี *ใคร* ให้เทียบบ้าง และคนเหล่านั้นกำลังเลือกให้เราเห็นอะไรครับ

## 2. ฟีดคือช่วงไฮไลต์ ไม่ใช่ชีวิตจริง (Highlight Reel)

ในชีวิตจริง เราเทียบตัวเองกับคนแค่ไม่กี่สิบคน แล้วเราก็เห็นวันธรรมดาๆ ของเขาด้วย เช้าที่เพลียๆ การเดินทางน่าเบื่อๆ แต่ฟีดตัดส่วนพวกนั้นออกไปหมด เหลือไว้แต่ที่คัดมาแล้ว ทริปเที่ยว ไม่ใช่บิลบัตรเครดิต รูปขอแต่งงาน ไม่ใช่เรื่องที่ทะเลาะกันเมื่ออาทิตย์ก่อน ทุกคนโพสต์ 1% ที่ดีที่สุดของตัวเอง แล้วเงียบๆ ตัดที่เหลือทิ้ง เวลาเราเลื่อนฟีด เราเลยไม่ได้เอาชีวิตเราไปเทียบกับชีวิตเขา แต่เอา **ความจริงทั้งหมดที่ยุ่งเหยิงและเป็นเบื้องหลังของเรา ไปเทียบกับช่วงไฮไลต์ที่คนแปลกหน้าเลือกมาอย่างดี** มันรู้สึกเหมือนการเทียบที่ยุติธรรม นั่นแหละคือเหตุผลที่มันเจ็บ แต่จริงๆ มันถูกตั้งให้เราแพ้ตั้งแต่ต้น เพราะเรารู้ทุกอย่างเกี่ยวกับวันธรรมดาๆ ของตัวเอง แต่แทบไม่รู้อะไรเลยเกี่ยวกับของเขาครับ

## 3. เทียบขึ้นไปเรื่อยๆ ซ้ำแล้วซ้ำอีก (Comparing Upward)

ไม่ใช่การเทียบทุกแบบจะทำร้ายเรา บางครั้งเห็นใครสักคนไปได้สวยก็เป็นแรงบันดาลใจจริงๆ แต่ฟีดมักเอียงให้เราเทียบ **ขึ้น** คือมองแต่คนที่ดูมีความสุขกว่า รวยกว่า รักกันหวานกว่า ไปได้ไกลกว่า ทำแบบนั้นสองครั้งก็ไม่เป็นไร แต่ถ้าทำยี่สิบนาที วันละหลายรอบ มันสะสม นักวิจัยที่ติดตามการใช้ Facebook ของคนกลุ่มหนึ่งพบว่า **ยิ่งใช้มาก พอเลิกใช้กลับยิ่งรู้สึกแย่ลง** ไม่ใช่ดีขึ้น อีกงานหนึ่งพบว่าการเลื่อนดูช่วงไฮไลต์ของทุกคนสัมพันธ์กับ **การรู้สึกหม่นลงและรู้สึกว่าตัวเอง "ไม่พอ"** มากขึ้น ส่วนใหญ่ก็เพราะการเทียบขึ้นทั้งหลายนั่นแหละ ความหนักอึ้งที่เรารู้สึกไม่ได้มาแบบสุ่มๆ มันคือการค่อยๆ สะสมของช่วงเวลาเล็กๆ ร้อยครั้งที่เราเอาตัวเองไปวัดกับฉากที่ดีที่สุดที่ผ่านการแต่งมาแล้วครับ

## 4. กลับมาเทียบกับตัวเองเมื่อวาน (Compare to Yesterday)

ทางแก้ไม่ใช่การเลิกเล่นทุกแอป หรือดุตัวเองที่ไปเทียบกับคนอื่น เพราะนั่นมีแต่จะเพิ่มความรู้สึกผิดซ้อนเข้าไปบนความหนักอึ้ง สิ่งที่ช่วยได้กลับเป็นอะไรเล็กๆ อย่างแรกคือ **จับให้ทันตอนที่มันเริ่ม** สังเกตอาการใจตกนิดๆ แล้วเรียกชื่อมันว่า "เรากำลังเอาเบื้องหลังของตัวเองไปเทียบกับช่วงไฮไลต์ของใครอีกแล้ว" แค่ประโยคเดียวก็คลายมนตร์ได้ เพราะการเทียบจะทำงานได้ก็ต่อเมื่อมันยังมองไม่เห็น อย่างที่สองคือ **เปลี่ยนจุดอ้างอิง** แทนที่จะวัดกับวันที่ดีที่สุดของคนแปลกหน้า ลองวัดกับ **คนเดียวที่เรารู้เรื่องราวทั้งหมดของเขาจริงๆ นั่นคือตัวเราเมื่อวาน** วันนี้เราใจดีกับตัวเองขึ้นนิดนึงไหม นิ่งขึ้นนิดนึงไหม ขยับไปข้างหน้ากว่าเดิมนิดนึงไหม นั่นคือการเทียบเดียวที่ยุติธรรม และเป็นการเทียบเดียวที่พาเราไปไหนได้จริง การกลับมาดูว่า *เรา* รู้สึกยังไง แทนที่จะดูว่าเราอยู่อันดับไหน คือการหมุนเลนส์กลับมาที่ชีวิตเดียวที่เรากำลังใช้อยู่จริงๆ ครับ

## อ้างอิงและอ่านเพิ่มเติม

แนวคิดในบทความนี้อิงจากงานจิตวิทยาที่ยอมรับกันมานาน:

- **ทำไมเราถึงเอาตัวเองไปเทียบกับคนอื่น** — [Festinger (1954)](https://en.wikipedia.org/wiki/Social_comparison_theory)
- **ยิ่งใช้โซเชียลมาก อารมณ์ยิ่งตกหลังเลิกใช้** — [Kross et al. (2013), PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0069841)
- **เห็นแต่ช่วงไฮไลต์ของคนอื่นแล้วใจหม่นลง** — [Steers, Wickham & Acitelli (2014)](https://guilfordjournals.com/doi/10.1521/jscp.2014.33.8.701)
- **การเปรียบเทียบบนโซเชียลกับความรู้สึกมีคุณค่าในตัวเอง** — [Vogel et al. (2014)](https://doi.apa.org/doi/10.1037/ppm0000047)

---

> ปัญหาไม่เคยอยู่ที่ว่าชีวิตเราเล็กเกินไป แต่อยู่ที่เราเอามันไปเทียบกับช่วงไฮไลต์ แล้วลืมไปว่าเราเห็นแค่ 1% ที่ดีที่สุดของคนอื่นเท่านั้นเองครับ`,
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
