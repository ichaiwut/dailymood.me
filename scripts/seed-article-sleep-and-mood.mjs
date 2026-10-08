/**
 * Seed one article: "Why One Bad Night's Sleep Can Throw Off Your Whole Mood"
 * (sleep and emotion, mental-health basics).
 *
 * Self-contained (raw `pg`, no `@/` alias) so it can run against local or prod.
 * Idempotent via ON CONFLICT (slug) — re-running updates the row in place.
 *
 *   node --env-file=.env.local scripts/seed-article-sleep-and-mood.mjs   # local
 *   DATABASE_URL=<prod> node scripts/seed-article-sleep-and-mood.mjs     # prod
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
  slug: "sleep-and-mood-why-one-bad-night-changes-everything",
  tone: "purple",
  tags: ["การนอน", "อารมณ์", "พักผ่อน", "ดูแลใจ"],
  published: true,
  titleEn: "Why One Bad Night's Sleep Can Throw Off Your Whole Mood",
  titleTh: "ทำไมนอนไม่พอแค่คืนเดียว อารมณ์ถึงเปลี่ยนไปทั้งวัน",
  excerptEn:
    "You didn't sleep well, and by mid-morning everything feels heavier — the traffic, the email, the small comment that normally wouldn't touch you. It's easy to decide you're just being difficult. But a rough night doesn't only make you tired; it quietly turns up the volume on every feeling and turns down the part of your brain that keeps them in check.",
  excerptTh:
    "เมื่อคืนนอนไม่ค่อยดี พอสายๆ ทุกอย่างก็ดูหนักไปหมด ทั้งรถติด ทั้งอีเมล ทั้งคำพูดเล็กๆ ที่ปกติไม่น่าจะสะเทือนใจ เรามักคิดว่าตัวเองแค่ขี้งอแงหรืออารมณ์ไม่ดีไปเอง แต่จริงๆ คืนที่นอนไม่พอไม่ได้แค่ทำให้ง่วง มันค่อยๆ เพิ่มเสียงของทุกความรู้สึกให้ดังขึ้น แล้วหรี่สมองส่วนที่คอยคุมความรู้สึกให้เบาลงด้วยครับ",
  keyTakeawayEn:
    "A bad night's sleep doesn't just make you tired — it makes you **more emotional and less able to steady yourself.** Short on sleep, the brain's alarm center (the amygdala) reacts far more strongly to negative things, while the \"brake\" that normally calms it — the prefrontal cortex — goes quiet. So small annoyances feel like big problems, and you have less to work with to talk yourself down. Sleep, especially dreaming (REM) sleep, is also when your brain **processes the day's emotions** — softening the sharp edges so you wake with the memory but less of the sting. And it runs both ways: **stress and low mood make it harder to sleep, and poor sleep makes mood worse** — an easy loop to fall into. The kindest move on a rough day isn't to push harder; it's to expect the extra heaviness, go easier on yourself, and protect tonight's sleep.",
  keyTakeawayTh:
    "การนอนไม่พอไม่ได้แค่ทำให้เหนื่อย แต่ทำให้เรา **อ่อนไหวง่ายขึ้น และตั้งหลักได้ยากขึ้น** เวลานอนน้อย สมองส่วนที่เป็นสัญญาณเตือนภัย (อะมิกดะลา) จะตอบสนองต่อเรื่องลบแรงขึ้นมาก ขณะที่สมองส่วนที่คอย \"เบรก\" ให้ใจสงบ (สมองส่วนหน้า) กลับเงียบลง เรื่องกวนใจเล็กๆ เลยรู้สึกเหมือนปัญหาใหญ่ และเราก็มีแรงปลอบตัวเองน้อยลง นอกจากนี้ การนอน โดยเฉพาะช่วงหลับฝัน (REM) ยังเป็นเวลาที่สมอง **ย่อยอารมณ์ของทั้งวัน** คลายความคมของเรื่องที่กระทบใจ ให้เราตื่นมาพร้อมความทรงจำแต่เจ็บน้อยลง และมันเป็นวงจรสองทาง คือ **ความเครียดกับอารมณ์ที่หม่นทำให้นอนหลับยากขึ้น และการนอนไม่ดีก็ทำให้อารมณ์แย่ลง** วนกันไปง่ายๆ สิ่งที่ใจดีที่สุดที่ทำได้ในวันที่เพลีย ไม่ใช่การฝืนดันตัวเองให้หนักขึ้น แต่คือการเผื่อใจว่าวันนี้จะหนักกว่าปกติ ใจดีกับตัวเองให้มากขึ้น แล้วรักษาการนอนของคืนนี้ไว้ครับ",
  bodyEn: `You slept badly — maybe a late night, maybe just tossing and turning — and now it's the middle of the next day. The traffic feels unbearable. An ordinary email reads as vaguely hostile. A small comment from someone lands harder than it should, and you're not sure whether to snap or cry. It's tempting to decide you're just being difficult, or that something is wrong with you today. But very little of this is about your character. A short night quietly rewires how you feel for the next sixteen hours — and once you know what's happening, it's a lot easier to be kind to yourself while it passes.

## 1. On Low Sleep, Every Feeling Gets Louder

Think of your brain as having a gas pedal and a brake for emotion. The gas pedal is the **amygdala**, a small alarm center that flares up at anything threatening or upsetting. The brake is the **prefrontal cortex**, the calm, reasonable part behind your forehead that says "it's fine, this isn't a big deal." Well rested, the two work together. Short on sleep, the balance breaks. In one well-known study, people kept awake for a night showed amygdala reactions to negative images that were up to about **60% stronger** than in people who had slept — and the calming connection to the prefrontal cortex had gone quiet. In plain terms: the alarm gets louder, and the brake stops answering. That's why on no sleep, a minor problem can feel like a genuine crisis. You're not overreacting on purpose — the part of you that would normally keep things in proportion is running on empty.

## 2. Sleep Is When Your Brain Digests the Day's Emotions

Sleep isn't just rest; it's active repair — and some of that repair is emotional. During the night, especially in the dreaming stage (**REM sleep**), the brain replays the emotional moments of your day and gradually files them away. Researchers describe this as a kind of **"overnight therapy"**: you keep the memory of what happened, but the sharp emotional charge attached to it softens. It's why a problem that felt overwhelming at midnight often feels merely annoying by the afternoon — *if* you slept. Skip the sleep and you skip the processing. The hard feelings from yesterday don't get filed; they carry over, still raw, and pile on top of whatever today brings. So a run of bad nights doesn't just make each day harder on its own — it lets the emotional residue quietly accumulate.

## 3. It Runs Both Ways

Here's the part that makes it feel like a trap: sleep and mood push on each other in **both directions.** A stressful, anxious, or low day makes it harder to fall and stay asleep — your mind won't switch off, so you get less rest. Then the poor sleep makes the next day's mood worse, which makes that night's sleep worse again. Reviews of the research find this two-way link clearly: poor sleep and low mood or anxiety each feed the other over time. This isn't a reason to panic about one bad night — a single rough night is normal, and your body handles it. It's just useful to recognize the loop when you're in it, because naming it — *"I feel low partly because I slept badly, and I'm sleeping badly partly because I feel low"* — takes some of its mystery, and some of its weight, away.

## 4. What Actually Helps

The goal on a tired day isn't to force yourself into a good mood — that rarely works and usually adds guilt. It's gentler than that. First, **expect the heaviness.** If you know a short night turns up your emotional volume, you can meet the day with a little more slack: fewer big decisions, lower expectations, more forgiveness for the version of you that's running on less. Second, **protect tonight instead of fixing today.** You can't undo last night, but you can give your body a fair shot at the next one — a consistent *wake-up* time (even more than bedtime) steadies your rhythm most, and easing off screens and hard conversations in the last hour helps your brain downshift. And if you can't sleep, don't lie there fighting it — get up, do something quiet and dull, and return when you're drowsy. Being tired isn't a character flaw, and it isn't permanent. Most of what feels so heavy today will feel lighter after a night that lets your brain catch up.

## Sources & Further Reading

The ideas in this article draw on sleep and emotion research:

- **A sleepless night makes the emotional brain overreact** — [Yoo, Gujar, Hu, Jolesz & Walker (2007), Current Biology](https://pubmed.ncbi.nlm.nih.gov/17956744/)
- **Sleep, especially REM, processes the day's emotions ("overnight therapy")** — [Walker & van der Helm (2009), Psychological Bulletin](https://pubmed.ncbi.nlm.nih.gov/19702380/)
- **Sleep and mood feed each other, both ways** — [Alvaro, Roberts & Harris (2013), SLEEP](https://pmc.ncbi.nlm.nih.gov/articles/PMC3669059/)
- **A readable overview of what sleep does for the mind** — [Matthew Walker, *Why We Sleep*](https://en.wikipedia.org/wiki/Why_We_Sleep)

---

> A bad night doesn't make you a difficult person. It just turns up the volume on everything and quiets the part of you that turns it back down — and one good night is usually enough to hand you back the dial.`,
  bodyTh: `เมื่อคืนนอนไม่ดี อาจจะนอนดึก หรือแค่พลิกไปพลิกมาทั้งคืน แล้วตอนนี้ก็เลยเที่ยงของวันรุ่งขึ้นมาแล้ว รถติดที่ปกติก็ทนได้ วันนี้กลับรู้สึกเหลืออด อีเมลธรรมดาๆ อ่านแล้วเหมือนมีอารมณ์แฝง คำพูดเล็กๆ ของใครสักคนสะเทือนใจกว่าที่ควรจะเป็น จนไม่แน่ใจว่าจะหงุดหงิดใส่หรือจะร้องไห้ดี เรามักสรุปว่าตัวเองแค่งอแง หรือวันนี้เราเป็นอะไรไปหรือเปล่า แต่จริงๆ แล้วเรื่องพวกนี้แทบไม่เกี่ยวกับนิสัยเราเลย คืนที่นอนสั้นๆ ค่อยๆ เปลี่ยนวิธีที่เรารู้สึกไปตลอดสิบหกชั่วโมงข้างหน้าแบบเงียบๆ และพอเรารู้ว่าเกิดอะไรขึ้น มันก็ง่ายขึ้นเยอะที่จะใจดีกับตัวเองระหว่างรอให้มันผ่านไปครับ

## 1. พอนอนน้อย ทุกความรู้สึกก็ดังขึ้น

ลองนึกว่าสมองเรามีคันเร่งกับเบรกสำหรับอารมณ์ คันเร่งคือ **อะมิกดะลา** (amygdala) ศูนย์สัญญาณเตือนเล็กๆ ที่จะลุกโพลงทุกครั้งที่เจอเรื่องน่ากลัวหรือกวนใจ ส่วนเบรกคือ **สมองส่วนหน้า** (prefrontal cortex) ส่วนที่เย็นและมีเหตุผลตรงหลังหน้าผาก ที่คอยบอกว่า "ไม่เป็นไรน่า เรื่องนี้ไม่ใหญ่หรอก" เวลานอนอิ่ม สองส่วนนี้ทำงานเข้าขากัน แต่พอนอนไม่พอ สมดุลก็พัง มีงานวิจัยที่รู้จักกันดีชิ้นหนึ่งพบว่า คนที่ถูกปลุกให้ตื่นทั้งคืน สมองส่วนอะมิกดะลาตอบสนองต่อภาพเชิงลบแรงขึ้นได้ถึงราว **60%** เมื่อเทียบกับคนที่ได้นอน แถมการเชื่อมต่อกับสมองส่วนหน้าที่คอยช่วยให้ใจสงบก็เงียบลงไปด้วย พูดง่ายๆ คือสัญญาณเตือนดังขึ้น ส่วนเบรกกลับไม่ตอบสนอง นี่แหละเหตุผลที่วันที่ไม่ได้นอน ปัญหาเล็กๆ ถึงรู้สึกเหมือนวิกฤตของจริง เราไม่ได้ตั้งใจจะโอเวอร์ แต่ส่วนที่ปกติคอยดึงทุกอย่างให้กลับมาพอดีมันกำลังหมดแรงอยู่ครับ

## 2. การนอนคือตอนที่สมองย่อยอารมณ์ของทั้งวัน

การนอนไม่ใช่แค่การพัก แต่คือการซ่อมแซม และส่วนหนึ่งของการซ่อมนั้นก็คือเรื่องอารมณ์ ตลอดคืน โดยเฉพาะช่วงหลับฝัน (**REM**) สมองจะเอาช่วงเวลาที่มีอารมณ์ของวันมาเล่นซ้ำ แล้วค่อยๆ จัดเก็บมันเข้าที่ นักวิจัยเรียกกระบวนการนี้ว่าเป็น **"การบำบัดข้ามคืน"** คือเรายังจำได้ว่าเกิดอะไรขึ้น แต่ประจุอารมณ์แรงๆ ที่ติดมากับมันจะอ่อนลง นี่คือเหตุผลที่ปัญหาซึ่งเมื่อเที่ยงคืนรู้สึกท่วมท้น พอบ่ายวันรุ่งขึ้นกลับเหลือแค่รำคาญนิดหน่อย *ถ้า* เราได้นอน แต่ถ้าอดนอน เราก็ข้ามขั้นตอนการย่อยนี้ไป ความรู้สึกหนักๆ จากเมื่อวานไม่ได้ถูกจัดเก็บ มันค้างอยู่แบบสดๆ แล้วมาซ้อนทับกับเรื่องของวันนี้อีก การนอนไม่ดีติดกันหลายคืนจึงไม่ได้แค่ทำให้แต่ละวันหนักขึ้นเฉยๆ แต่ปล่อยให้ตะกอนอารมณ์ค่อยๆ สะสมขึ้นเรื่อยๆ ด้วยครับ

## 3. มันเป็นวงจรสองทาง

ตรงนี้แหละที่ทำให้รู้สึกเหมือนติดกับดัก เพราะการนอนกับอารมณ์ดันกันไปมา **ทั้งสองทาง** วันที่เครียด กังวล หรือใจหม่น ทำให้เราหลับยากและหลับไม่สนิท เพราะสมองไม่ยอมปิดสวิตช์ เราเลยได้พักน้อยลง แล้วการนอนที่ไม่ดีก็ทำให้อารมณ์ของวันรุ่งขึ้นแย่ลงอีก ซึ่งก็วนกลับไปทำให้คืนนั้นนอนแย่ลงไปอีก งานทบทวนวิจัยหลายชิ้นพบความเชื่อมโยงสองทางนี้ชัดเจน คือการนอนที่ไม่ดีกับอารมณ์ที่หม่นหรือความกังวล ต่างก็ป้อนให้กันและกันเมื่อเวลาผ่านไป นี่ไม่ใช่เหตุผลให้ตื่นตระหนกกับการนอนไม่ดีแค่คืนเดียว เพราะคืนแย่ๆ คืนหนึ่งเป็นเรื่องปกติและร่างกายรับมือได้ แต่มันมีประโยชน์ที่จะรู้ทันวงจรตอนที่เราอยู่ในนั้น เพราะแค่เรียกมันออกมาตรงๆ ว่า *"ที่ใจหม่นวันนี้ ส่วนหนึ่งเพราะเมื่อคืนนอนไม่ดี และที่นอนไม่ดี ส่วนหนึ่งก็เพราะใจกำลังหม่น"* ก็ช่วยคลายความลึกลับ และคลายน้ำหนักของมันไปได้บ้างแล้วครับ

## 4. แล้วอะไรช่วยได้จริง

เป้าหมายของวันที่เพลียไม่ใช่การฝืนบังคับตัวเองให้อารมณ์ดี เพราะแบบนั้นมักไม่ได้ผลและยังเพิ่มความรู้สึกผิดเข้าไปอีก สิ่งที่ช่วยได้นุ่มนวลกว่านั้น อย่างแรกคือ **เผื่อใจไว้ว่ามันจะหนัก** ถ้าเรารู้ว่าคืนที่นอนสั้นจะเพิ่มระดับเสียงอารมณ์ของเรา เราก็เผชิญวันนั้นด้วยการผ่อนให้ตัวเองมากขึ้นได้ เช่น เลี่ยงการตัดสินใจเรื่องใหญ่ ลดความคาดหวังลง และให้อภัยตัวเองในเวอร์ชันที่กำลังทำงานด้วยพลังน้อยกว่าปกติ อย่างที่สองคือ **รักษาคืนนี้ไว้ แทนที่จะพยายามแก้วันนี้** เราย้อนแก้เมื่อคืนไม่ได้ แต่ให้โอกาสร่างกายกับคืนถัดไปได้ การตื่นให้เป็นเวลาสม่ำเสมอ (สำคัญยิ่งกว่าเวลาเข้านอนด้วยซ้ำ) คือสิ่งที่ช่วยจูนจังหวะร่างกายได้มากที่สุด และการผ่อนจากหน้าจอกับบทสนทนาหนักๆ ในชั่วโมงสุดท้ายก่อนนอน ก็ช่วยให้สมองค่อยๆ ลดเกียร์ลง ถ้านอนไม่หลับจริงๆ ก็อย่านอนฝืนสู้กับมัน ลุกไปทำอะไรเงียบๆ เนือยๆ แล้วค่อยกลับมาตอนเริ่มง่วง การเหนื่อยไม่ใช่ข้อเสียของนิสัย และมันไม่ได้อยู่กับเราตลอดไป เรื่องที่วันนี้รู้สึกหนักหนา ส่วนใหญ่จะเบาลงเองหลังจากคืนที่ปล่อยให้สมองได้ตามทันครับ

## อ้างอิงและอ่านเพิ่มเติม

แนวคิดในบทความนี้อิงจากงานวิจัยด้านการนอนและอารมณ์:

- **คืนที่อดนอนทำให้สมองส่วนอารมณ์ตอบสนองเกินจริง** — [Yoo, Gujar, Hu, Jolesz & Walker (2007), Current Biology](https://pubmed.ncbi.nlm.nih.gov/17956744/)
- **การนอน โดยเฉพาะช่วงหลับฝัน ช่วยย่อยอารมณ์ของทั้งวัน ("การบำบัดข้ามคืน")** — [Walker & van der Helm (2009), Psychological Bulletin](https://pubmed.ncbi.nlm.nih.gov/19702380/)
- **การนอนกับอารมณ์ป้อนให้กันทั้งสองทาง** — [Alvaro, Roberts & Harris (2013), SLEEP](https://pmc.ncbi.nlm.nih.gov/articles/PMC3669059/)
- **ภาพรวมอ่านง่ายว่าการนอนทำอะไรให้จิตใจบ้าง** — [Matthew Walker, *Why We Sleep*](https://en.wikipedia.org/wiki/Why_We_Sleep)

---

> คืนที่นอนไม่ดีไม่ได้ทำให้เราเป็นคนงอแง มันแค่เพิ่มเสียงของทุกอย่างให้ดังขึ้น แล้วหรี่ส่วนที่คอยหรี่เสียงพวกนั้นลง และคืนดีๆ คืนเดียวก็มักจะพอที่จะคืนปุ่มปรับเสียงนั้นกลับมาให้เราครับ`,
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
