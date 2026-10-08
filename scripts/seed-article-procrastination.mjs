/**
 * Seed one article: "Why You Put It Off — Procrastination Isn't Laziness,
 * It's Avoiding a Feeling" (procrastination as emotion regulation, psychology).
 *
 * Self-contained (raw `pg`, no `@/` alias) so it can run against local or prod.
 * Idempotent via ON CONFLICT (slug) — re-running updates the row in place.
 *
 *   node --env-file=.env.local scripts/seed-article-procrastination.mjs   # local
 *   DATABASE_URL=<prod> node scripts/seed-article-procrastination.mjs      # prod
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
  slug: "procrastination-is-not-laziness",
  tone: "mint",
  tags: ["ผัดวันประกันพรุ่ง", "อารมณ์", "แรงจูงใจ", "ใจดีกับตัวเอง"],
  published: true,
  titleEn: "Why You Put It Off — Procrastination Isn't Laziness, It's Avoiding a Feeling",
  titleTh: "ทำไมเราถึงผัดไปเรื่อยๆ — การผัดวันไม่ใช่ความขี้เกียจ แต่คือการหนีความรู้สึก",
  excerptEn:
    "The task has been open in a tab for three days. You're not doing it — but you're not relaxing either. You scroll, you tidy the kitchen, and a low hum of guilt follows you the whole time. It's easy to call this laziness or a lack of discipline. But most of the time procrastination isn't about the work at all. It's about a feeling the work stirs up — and the quiet, instant relief of not having to feel it right now.",
  excerptTh:
    "ไฟล์งานเปิดค้างอยู่ในแท็บมาสามวันแล้ว เราไม่ได้ทำมัน แต่ก็ไม่ได้พักจริงๆ เอาแต่ไถหน้าจอ ลุกไปจัดครัว แล้วก็มีความรู้สึกผิดหึ่งๆ ตามติดอยู่ในใจตลอด เรามักเรียกอาการนี้ว่าขี้เกียจหรือไม่มีวินัย แต่ส่วนใหญ่แล้วการผัดวันไม่ได้เกี่ยวกับตัวงานเลย มันเกี่ยวกับความรู้สึกที่งานนั้นปลุกขึ้นมาในใจ กับความโล่งใจแวบเดียวที่ได้จากการยังไม่ต้องเจอความรู้สึกนั้นตอนนี้ครับ",
  keyTakeawayEn:
    "Procrastination is not a time-management problem or a character flaw — it's **emotion management gone sideways.** We don't put off tasks because they take effort; we put them off because they stir up an uncomfortable feeling — boredom, anxiety, self-doubt, the fear of doing it badly — and avoiding the task gives us **instant relief from that feeling.** The relief is real, which is exactly why the habit sticks: your brain gets rewarded every time you flee. But it borrows that relief from your future self, who inherits the task *plus* the guilt. And here's the twist most people miss: **beating yourself up for procrastinating makes you procrastinate more** — the shame is just one more bad feeling to escape. What breaks the loop isn't more discipline; it's lowering the emotional cost of starting: name the feeling the task brings up, shrink the first step until it's almost too small to resist, and forgive yourself for last time so you're not dragging that weight to the desk.",
  keyTakeawayTh:
    "การผัดวันไม่ใช่ปัญหาเรื่องบริหารเวลา และไม่ใช่นิสัยเสีย แต่เป็น **การจัดการอารมณ์ที่เพี้ยนไป** เราไม่ได้ผัดงานเพราะมันเหนื่อย แต่ผัดเพราะมันปลุกความรู้สึกไม่สบายใจขึ้นมา ทั้งความเบื่อ ความกังวล ความไม่มั่นใจ หรือกลัวว่าจะทำได้ไม่ดี และการเลี่ยงงานทำให้เรา **โล่งใจขึ้นทันที** ความโล่งใจนั้นเป็นของจริง นี่แหละที่ทำให้นิสัยนี้ติดแน่น เพราะสมองได้รางวัลทุกครั้งที่เราหนี แต่มันเป็นการยืมความสบายมาจากตัวเราในอนาคต ที่ต้องมารับทั้งงาน *และ* ความรู้สึกผิดไปเต็มๆ และจุดที่หลายคนมองข้ามคือ **การโทษตัวเองที่ผัดวัน ยิ่งทำให้ผัดหนักขึ้น** เพราะความรู้สึกผิดก็เป็นอีกอารมณ์แย่ๆ ที่เราอยากหนีอยู่ดี สิ่งที่ตัดวงจรนี้ได้จริงไม่ใช่การมีวินัยมากขึ้น แต่คือการลดต้นทุนทางใจของการเริ่ม เรียกชื่อความรู้สึกที่งานปลุกขึ้นมา ย่อ step แรกให้เล็กจนแทบปฏิเสธไม่ลง แล้วให้อภัยตัวเองเรื่องครั้งที่แล้ว จะได้ไม่ต้องแบกน้ำหนักนั้นมานั่งโต๊ะทำงานด้วยครับ",
  bodyEn: `There's a task you keep not doing. Maybe it's a form, an email you owe someone, a project that actually matters to you. It's been sitting there for days. You're not working on it, but you're not really enjoying anything else either — there's a low background hum of guilt under everything you do instead. When someone asks, you say you're being lazy, or that you just can't get disciplined. But if laziness were the answer, you'd feel relaxed while avoiding it — and you don't. Something more interesting is going on, and understanding it changes what you can actually do about it.

## 1. It's Not About the Work — It's About a Feeling

We tend to picture procrastination as a battle between you and the task: the task is hard or boring, and you're not trying hard enough. But the researchers who study it most closely describe it differently. Procrastination, they argue, is **an emotion-regulation problem, not a time-management one.** The task isn't really the enemy — the *feeling the task brings up* is. Opening that report makes you anxious about doing it wrong. Starting that message makes you feel the awkwardness of a hard conversation. Facing that project reminds you how much you care, and how easily you could fall short. Those feelings are uncomfortable, and the mind does what minds do with discomfort: it looks for the nearest exit. Scrolling, snacking, tidying, "I'll do it after lunch." You're not avoiding the work. You're avoiding how the work makes you feel.

## 2. The Trap of Instant Relief

Here's why it's so sticky. The moment you decide *not* to do the thing, the bad feeling drops — instantly. The anxiety eases, the pressure lifts, and for a little while you feel better. That relief is a reward, and your brain files it away. So the next time a task stirs up a hard feeling, the shortcut is already worn in: avoid it, feel better now. Researchers call this "giving in to feel good" — prioritizing how you feel *in this moment* over what you actually want for yourself. The catch is that the relief is a loan, not a gift. Your present self feels better; your future self inherits the untouched task, a tighter deadline, and a fresh layer of guilt. It also explains why "just be more disciplined" rarely works. Discipline is aimed at the task, but the real pull is the emotional relief — and no amount of willpower makes an uncomfortable feeling stop being uncomfortable.

## 3. Guilt Doesn't Motivate — It Feeds the Loop

Most people's response to procrastinating is to get angry at themselves. *What is wrong with me. Why am I like this. I should have started days ago.* It feels like the responsible thing to do — surely a little self-punishment will light a fire. But it does the opposite. Remember that procrastination is driven by wanting to escape a bad feeling. When you pile guilt and self-criticism on top, you've just manufactured *more* bad feeling — and now the task is attached to shame as well as anxiety. So the next time you glance at it, there's even more to avoid. In one well-known study, students who **forgave themselves** for procrastinating before an exam went on to procrastinate *less* before the next one, compared to those who stayed hard on themselves. Letting go of the guilt didn't make them lazy; it cleared away the extra weight, so sitting down to work no longer meant sitting down with their own harshest voice.

## 4. Lowering the Cost of Starting

If procrastination is about avoiding a feeling, the way out isn't to force the work — it's to make starting feel less threatening. A few things genuinely help. First, **name the feeling.** Instead of "I don't want to do this," get specific: *"I'm avoiding this because I'm scared it won't be good enough."* Putting words to the feeling takes some of its power away, and reminds you the task itself is fine — it's the fear you're dodging. Second, **shrink the first step until it's almost silly.** Not "write the report" but "open the document and type one ugly sentence." The point isn't the sentence; it's that starting is where the resistance lives, and once you're in, continuing is far easier. Set a timer for five minutes and let yourself stop when it rings — you usually won't want to. Third, **forgive yourself for last time.** You're not starting from a clean slate, but you can choose not to carry the guilt to the desk. The kindest and most effective thing you can tell yourself isn't "stop being lazy." It's *"this is hard for me, and I can begin anyway."*

## Sources & Further Reading

The ideas in this article draw on research into procrastination and emotion:

- **Procrastination is about managing mood, not time** — [Sirois & Pychyl (2013), Social and Personality Psychology Compass](https://compass.onlinelibrary.wiley.com/doi/abs/10.1111/spc3.12011)
- **Forgiving yourself for procrastinating reduces it next time** — [Wohl, Pychyl & Bennett (2010), Personality and Individual Differences](https://www.sciencedirect.com/science/article/abs/pii/S0191886910000474)
- **A readable, practical guide to the emotional roots of procrastination** — [Timothy Pychyl, *Solving the Procrastination Puzzle*](https://www.penguinrandomhouse.com/books/315695/solving-the-procrastination-puzzle-by-timothy-a-pychyl/)
- **The big-picture overview of what drives procrastination** — [Steel (2007), Psychological Bulletin](https://pubmed.ncbi.nlm.nih.gov/17201571/)

---

> You were never lazy. You were trying not to feel something — and the moment you can name the feeling and take one small step toward it anyway, the task stops being a monster and goes back to being just a task.`,
  bodyTh: `มีงานอยู่ชิ้นหนึ่งที่เราไม่ยอมทำสักที อาจจะเป็นเอกสารที่ต้องกรอก อีเมลที่ติดค้างใครไว้ หรือโปรเจกต์ที่เราแคร์มันจริงๆ มันวางค้างอยู่แบบนั้นมาหลายวัน เราไม่ได้ลงมือทำ แต่ก็ไม่ได้สนุกกับอย่างอื่นเต็มที่เหมือนกัน เพราะมีความรู้สึกผิดหึ่งๆ อยู่เบื้องหลังทุกอย่างที่เราทำแทน พอมีคนถาม เราก็บอกว่าตัวเองขี้เกียจ หรือคุมตัวเองให้มีวินัยไม่ได้ แต่ถ้ามันเป็นเพราะขี้เกียจจริง เราน่าจะรู้สึกสบายใจตอนที่หลบมันอยู่ ซึ่งเราไม่ได้รู้สึกแบบนั้นเลย มันมีอะไรที่น่าสนใจกว่านั้นเกิดขึ้นอยู่ และพอเราเข้าใจมัน ทางออกของเราก็จะต่างไปจากเดิมครับ

## 1. มันไม่ใช่เรื่องของงาน แต่เป็นเรื่องของความรู้สึก

เรามักนึกภาพว่าการผัดวันคือศึกระหว่างเรากับงาน คืองานมันยากหรือน่าเบื่อ ส่วนเราก็พยายามไม่มากพอ แต่นักวิจัยที่ศึกษาเรื่องนี้อย่างจริงจังที่สุดกลับอธิบายไว้ต่างออกไป เขาบอกว่าการผัดวันเป็น **ปัญหาเรื่องการจัดการอารมณ์ ไม่ใช่การจัดการเวลา** ตัวงานไม่ใช่ศัตรูตัวจริง แต่เป็น *ความรู้สึกที่งานนั้นปลุกขึ้นมา* ต่างหาก การเปิดไฟล์รายงานทำให้เรากังวลว่าจะทำได้ไม่ดี การเริ่มพิมพ์ข้อความทำให้รู้สึกอึดอัดกับบทสนทนาที่ยาก การหันไปเจอโปรเจกต์นั้นก็เตือนให้เรารู้ว่าเราแคร์มันแค่ไหน และมันพลาดได้ง่ายแค่ไหน ความรู้สึกพวกนี้ไม่สบายใจเลย และใจคนเราก็ทำในสิ่งที่ใจถนัดเวลาเจอความอึดอัด นั่นคือมองหาทางออกที่ใกล้ที่สุด ไถหน้าจอ หาของกิน จัดโต๊ะ หรือ "เดี๋ยวกินข้าวเสร็จค่อยทำ" เราไม่ได้กำลังหนีงาน เรากำลังหนีความรู้สึกที่งานทำให้เราเป็นครับ

## 2. กับดักของความโล่งใจแวบเดียว

ทีนี้มาดูว่าทำไมมันถึงติดแน่นขนาดนี้ วินาทีที่เราตัดสินใจว่า *จะยังไม่ทำ* ความรู้สึกแย่ๆ ก็หายไปทันที ความกังวลคลายลง ความกดดันเบาลง แล้วเราก็รู้สึกดีขึ้นอยู่พักหนึ่ง ความโล่งใจนั้นคือรางวัล และสมองเราก็จดจำมันไว้ ดังนั้นครั้งต่อไปที่งานปลุกความรู้สึกยากๆ ขึ้นมา ทางลัดก็ถูกเหยียบจนเป็นร่องไว้แล้ว คือหนีมันไว้ก่อน แล้วจะสบายใจขึ้นตอนนี้ นักวิจัยเรียกสิ่งนี้ว่าการยอมทำตามใจเพื่อให้รู้สึกดี คือให้ความสำคัญกับความรู้สึก *ในตอนนี้* มากกว่าสิ่งที่เราอยากได้จริงๆ สำหรับตัวเอง แต่กับดักก็คือ ความโล่งใจนั้นเป็นแค่การยืมมา ไม่ใช่ของฟรี ตัวเราตอนนี้รู้สึกดีขึ้น แต่ตัวเราในอนาคตต้องมารับทั้งงานที่ยังไม่ได้แตะ เดดไลน์ที่กระชั้นขึ้น และความรู้สึกผิดชั้นใหม่ นี่ยังอธิบายด้วยว่าทำไม "ก็แค่มีวินัยให้มากขึ้นสิ" ถึงไม่ค่อยได้ผล เพราะวินัยเล็งไปที่ตัวงาน แต่แรงดึงตัวจริงคือความโล่งใจทางอารมณ์ และไม่ว่าจะใช้พลังใจมากแค่ไหน ก็ไม่ได้ทำให้ความรู้สึกอึดอัดเลิกอึดอัดครับ

## 3. ความรู้สึกผิดไม่ได้สร้างแรงใจ แต่หล่อเลี้ยงวงจร

คนส่วนใหญ่ตอบสนองต่อการผัดวันด้วยการโกรธตัวเอง *เราเป็นอะไรของเรา ทำไมถึงเป็นแบบนี้ น่าจะเริ่มทำตั้งหลายวันก่อนแล้ว* มันรู้สึกเหมือนเป็นสิ่งที่คนรับผิดชอบควรทำ เหมือนลงโทษตัวเองสักหน่อยแล้วมันจะจุดไฟให้ลุกขึ้นมาทำ แต่จริงๆ มันให้ผลตรงกันข้าม อย่าลืมว่าการผัดวันถูกขับด้วยความอยากหนีความรู้สึกแย่ พอเราเอาความรู้สึกผิดกับการตำหนิตัวเองไปกองทับเข้าไปอีก เราก็แค่ผลิต *ความรู้สึกแย่เพิ่ม* ขึ้นมา และตอนนี้งานชิ้นนั้นก็ผูกอยู่กับทั้งความละอายและความกังวลไปแล้ว ครั้งต่อไปที่เราเหลือบไปมองมัน เลยยิ่งมีเรื่องให้อยากหนีมากขึ้นไปอีก มีงานวิจัยที่รู้จักกันดีชิ้นหนึ่งพบว่า นักศึกษาที่ **ให้อภัยตัวเอง** เรื่องที่ผัดการอ่านหนังสือก่อนสอบ กลับผัดวัน *น้อยลง* ในการสอบครั้งถัดไป เมื่อเทียบกับคนที่ยังเข้มงวดกับตัวเอง การปล่อยวางความรู้สึกผิดไม่ได้ทำให้พวกเขาขี้เกียจลง แต่มันช่วยปัดน้ำหนักส่วนเกินออกไป การนั่งลงทำงานเลยไม่ได้แปลว่าต้องนั่งลงพร้อมกับเสียงตำหนิที่ดุที่สุดของตัวเองอีกต่อไปครับ

## 4. ลดต้นทุนของการเริ่ม

ถ้าการผัดวันคือการหนีความรู้สึก ทางออกก็ไม่ใช่การฝืนทำงาน แต่คือการทำให้การเริ่มรู้สึกน่ากลัวน้อยลง มีอยู่ไม่กี่อย่างที่ช่วยได้จริงๆ อย่างแรก **เรียกชื่อความรู้สึกออกมา** แทนที่จะบอกว่า "ไม่อยากทำเลย" ลองเจาะให้ชัด เช่น *"ที่เราเลี่ยงมัน เพราะกลัวว่าจะทำออกมาได้ไม่ดีพอ"* การใส่คำให้ความรู้สึกช่วยลดพลังของมันลง และเตือนเราว่าตัวงานจริงๆ ไม่ได้น่ากลัว สิ่งที่เราหลบอยู่คือความกลัวต่างหาก อย่างที่สอง **ย่อ step แรกให้เล็กจนเกือบน่าขำ** ไม่ใช่ "เขียนรายงาน" แต่เป็น "เปิดไฟล์ขึ้นมา แล้วพิมพ์ประโยคห่วยๆ สักหนึ่งประโยค" ประเด็นไม่ได้อยู่ที่ประโยคนั้น แต่อยู่ที่แรงต้านทั้งหมดมันซ่อนอยู่ตรงจุดเริ่ม พอเราเข้าไปอยู่ในงานแล้ว การทำต่อจะง่ายขึ้นเยอะ ลองตั้งเวลาห้านาที แล้วอนุญาตให้ตัวเองหยุดได้เมื่อหมดเวลา ซึ่งส่วนใหญ่พอถึงตอนนั้นเราจะไม่อยากหยุดเอง อย่างที่สาม **ให้อภัยตัวเองเรื่องครั้งที่แล้ว** เราไม่ได้เริ่มจากศูนย์ที่สะอาดหมดจด แต่เราเลือกได้ว่าจะไม่แบกความรู้สึกผิดมานั่งที่โต๊ะด้วย สิ่งที่ใจดีและได้ผลที่สุดที่เราบอกตัวเองได้ ไม่ใช่ "เลิกขี้เกียจได้แล้ว" แต่คือ *"เรื่องนี้มันยากสำหรับเราจริงๆ แต่เราก็เริ่มมันได้อยู่ดี"* ครับ

## อ้างอิงและอ่านเพิ่มเติม

แนวคิดในบทความนี้อิงจากงานวิจัยด้านการผัดวันและอารมณ์:

- **การผัดวันเป็นเรื่องการจัดการอารมณ์ ไม่ใช่การจัดการเวลา** — [Sirois & Pychyl (2013), Social and Personality Psychology Compass](https://compass.onlinelibrary.wiley.com/doi/abs/10.1111/spc3.12011)
- **การให้อภัยตัวเองเรื่องผัดวัน ช่วยให้ผัดน้อยลงในครั้งถัดไป** — [Wohl, Pychyl & Bennett (2010), Personality and Individual Differences](https://www.sciencedirect.com/science/article/abs/pii/S0191886910000474)
- **หนังสืออ่านง่ายที่เจาะรากทางอารมณ์ของการผัดวัน** — [Timothy Pychyl, *Solving the Procrastination Puzzle*](https://www.penguinrandomhouse.com/books/315695/solving-the-procrastination-puzzle-by-timothy-a-pychyl/)
- **ภาพรวมใหญ่ว่าอะไรขับเคลื่อนการผัดวัน** — [Steel (2007), Psychological Bulletin](https://pubmed.ncbi.nlm.nih.gov/17201571/)

---

> เราไม่เคยขี้เกียจเลย เราแค่พยายามไม่รู้สึกอะไรบางอย่างอยู่ และวินาทีที่เราเรียกชื่อความรู้สึกนั้นได้ แล้วขยับก้าวเล็กๆ เข้าหามันทั้งอย่างนั้น งานที่เคยเป็นสัตว์ประหลาดก็จะกลับไปเป็นแค่งานชิ้นหนึ่งครับ`,
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
