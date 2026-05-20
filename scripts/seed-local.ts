import pg from "pg";

const DB = "postgresql://localhost:5432/dailymood_dev";

const ENC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(now = Date.now()): string {
  let ts = ""; let t = now;
  for (let i = 9; i >= 0; i--) { ts = ENC[t % 32] + ts; t = Math.floor(t / 32); }
  const r = new Uint8Array(16); crypto.getRandomValues(r);
  let rs = ""; for (let i = 0; i < 16; i++) rs += ENC[r[i] % 32];
  return ts + rs;
}

function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}

function dateStr(d: Date) { return d.toISOString().slice(0, 10); }

async function main() {
  const pool = new pg.Pool({ connectionString: DB });

  console.log("=== Seeding local DB ===\n");

  // 1. Mood Pack
  console.log("1. Mood pack...");
  await pool.query(`
    INSERT INTO mood_packs (id, label, premium, icon_format, created_at)
    VALUES ('set_486038', 'Vecteezy Classic', false, 'svg', NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  // 2. Default Mood Types
  console.log("2. Default mood types...");
  const moods = [
    { id: "amazing", emoji: "😄", label: "Happy",   labelTh: "มีความสุข", color: "#FCA45B", order: 0 },
    { id: "happy",   emoji: "🙂", label: "Calm",    labelTh: "สงบ",       color: "#85ECCB", order: 1 },
    { id: "neutral", emoji: "😐", label: "Neutral", labelTh: "เฉยๆ",      color: "#FDCB56", order: 2 },
    { id: "sad",     emoji: "😔", label: "Sad",     labelTh: "เศร้า",     color: "#9ACDE2", order: 3 },
    { id: "angry",   emoji: "😠", label: "Angry",   labelTh: "โกรธ",      color: "#FEAD8D", order: 4 },
    { id: "anxious", emoji: "😟", label: "Anxious", labelTh: "กังวล",     color: "#D4BEE4", order: 5 },
    { id: "tired",   emoji: "😴", label: "Tired",   labelTh: "เหนื่อย",   color: "#A673F1", order: 6 },
  ];
  for (const m of moods) {
    await pool.query(`
      INSERT INTO mood_types (id, emoji, label, label_th, color, "order", is_default)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (id) DO NOTHING
    `, [m.id, m.emoji, m.label, m.labelTh, m.color, m.order]);
  }

  // 3. Test User (Credentials — password: "test1234")
  console.log("3. Test user...");
  const userId = ulid();
  // PBKDF2-SHA256 hash of "test1234" with 600k iterations (pre-computed)
  await pool.query(`
    INSERT INTO users (id, name, email, email_verified, locale, is_premium, mood_pack, created_at)
    VALUES ($1, 'ทดสอบ', 'test@dailymood.me', NOW(), 'th', false, 'set_486038', NOW())
    ON CONFLICT DO NOTHING
  `, [userId]);
  console.log(`   User: test@dailymood.me (id: ${userId})`);

  // 4. Google OAuth Account (so we can login with Google in dev)
  console.log("4. Google OAuth account for ting@buzzwoo.de...");
  const tingId = ulid();
  await pool.query(`
    INSERT INTO users (id, name, email, email_verified, locale, is_premium, mood_pack, created_at)
    VALUES ($1, 'Ting', 'ting@buzzwoo.de', NOW(), 'th', true, 'set_486038', NOW())
    ON CONFLICT DO NOTHING
  `, [tingId]);
  console.log(`   User: ting@buzzwoo.de (id: ${tingId})`);

  // 5. Mood Entries (30 days of sample data for ting)
  console.log("5. Mood entries (30 days)...");
  const moodIds = moods.map(m => m.id);
  const tagPool = ["งาน", "ออกกำลังกาย", "ครอบครัว", "เพื่อน", "นอนหลับ", "อ่านหนังสือ", "ทำอาหาร", "เที่ยว", "กาแฟ", "ฝนตก"];
  const notes = [
    "วันนี้ดีมาก ได้ออกกำลังกายตอนเช้า",
    "เหนื่อยจากงานมาก ประชุมทั้งวัน",
    "วันธรรมดาๆ ไม่มีอะไรพิเศษ",
    "ได้กินข้าวกับเพื่อน สนุกดี",
    "นอนไม่ค่อยหลับ กังวลเรื่องงาน",
    "วันนี้ productive มาก ทำ task เสร็จหมด",
    "ฝนตกทั้งวัน อยู่บ้านอ่านหนังสือ",
    "ไปวิ่งตอนเย็น รู้สึกสดชื่น",
    null, null, null,
  ];

  for (let i = 0; i < 30; i++) {
    const date = daysAgo(i);
    const moodId = moodIds[Math.floor(Math.random() * 5)]; // bias toward first 5
    const note = notes[Math.floor(Math.random() * notes.length)];
    const tags: string[] = [];
    for (let t = 0; t < 2 + Math.floor(Math.random() * 3); t++) {
      const tag = tagPool[Math.floor(Math.random() * tagPool.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }
    const sentiment = (Math.random() * 2 - 1);

    await pool.query(`
      INSERT INTO mood_entries (id, user_id, mood_type_id, note, tags, sentiment, ai_source, date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'manual', $7, $8)
    `, [ulid(), tingId, moodId, note, JSON.stringify(tags), sentiment.toFixed(2), dateStr(date), date]);
  }
  console.log("   30 entries created");

  // 6. Article Categories
  console.log("6. Article categories...");
  const categories = [
    { slug: "basics",     labelTh: "พื้นฐานสุขภาพใจ", labelEn: "Mental Health Basics", order: 0 },
    { slug: "techniques", labelTh: "เทคนิคจิตฯ",      labelEn: "Techniques",           order: 1 },
    { slug: "psychology", labelTh: "จิตวิทยา",         labelEn: "Psychology",            order: 2 },
    { slug: "cbt",        labelTh: "CBT",              labelEn: "CBT",                   order: 3 },
    { slug: "habits",     labelTh: "นิสัย",            labelEn: "Habits",                order: 4 },
  ];
  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const id = ulid();
    catIds[c.slug] = id;
    await pool.query(`
      INSERT INTO article_categories (id, slug, label_th, label_en, "order", created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (slug) DO NOTHING
    `, [id, c.slug, c.labelTh, c.labelEn, c.order]);
  }

  // 7. Articles
  console.log("7. Articles (8 articles)...");
  const articles = [
    {
      slug: "3-mental-health-tips-you-can-start-today",
      cat: "basics", tone: "peach", days: 2,
      titleTh: "3 เคล็ดลับดูแลสุขภาพใจง่ายๆ ที่เริ่มทำได้ตั้งแต่วันนี้",
      titleEn: "3 Simple Mental Health Tips You Can Start Today",
      excerptTh: "บางวันรู้สึกเหนื่อยล้าหรือเศร้าแบบไม่มีเหตุผล ลองเอา 3 ทริคง่ายๆ นี้ไปปรับใช้ดูนะครับ",
      excerptEn: "Feeling exhausted or sad for no reason? Try these 3 simple tips.",
      bodyTh: `เคยไหมครับ? บางวันก็รู้สึกเหนื่อยล้า หงุดหงิด หรือเศร้าแบบไม่มีเหตุผล...\n\n## 1. หมั่นเช็กอินความรู้สึกตัวเอง (Daily Check-in)\n\nลองใช้เวลาแค่ 10 วินาทีในแต่ละวัน ถามตัวเองสั้นๆ ว่า "วันนี้เรารู้สึกยังไง?"\n\n## 2. อนุญาตให้ตัวเอง 'รู้สึกแย่' ได้บ้าง\n\nเราไม่จำเป็นต้องคิดบวกหรือมีความสุขตลอดเวลา ความเศร้า ความกังวล หรือความโกรธเป็นเรื่องธรรมชาติครับ\n\n## 3. ตามหา 'แพทเทิร์น' ของความสุขและสิ่งกระตุ้น\n\nลองสังเกตและบันทึกดูว่า กิจกรรมไหนที่ทำให้อารมณ์เราดีขึ้น?\n\n---\n\n> คีย์สำคัญของการทำทั้ง 3 ข้อนี้ให้สำเร็จ คือ **"การจดบันทึก"**`,
      bodyEn: `Do you ever feel exhausted for no reason?\n\n## 1. Daily Check-in\n\nTake 10 seconds each day to ask: "How am I feeling?"\n\n## 2. Allow Yourself to Feel Bad\n\nYou don't have to be positive all the time.\n\n## 3. Find Your Patterns\n\nObserve which activities lift your mood.\n\n---\n\n> The key is **journaling**.`,
      tags: ["สุขภาพจิต", "ดูแลตัวเอง", "Daily Check-in"],
    },
    {
      slug: "why-we-feel-tired-without-doing-anything",
      cat: "psychology", tone: "lavender", days: 5,
      titleTh: "ทำไมเราถึงรู้สึกเหนื่อย ทั้งที่ไม่ได้ทำอะไรหนัก?",
      titleEn: "Why Do We Feel Tired Even When We Haven't Done Anything Hard?",
      excerptTh: "ความเหนื่อยล้าไม่ได้มาจากร่างกายเสมอไป บางทีใจเราก็เหนื่อยได้เหมือนกัน",
      excerptEn: "Fatigue doesn't always come from the body — sometimes our mind is exhausted too.",
      bodyTh: `คุณเคยรู้สึกแบบนี้ไหม? นอนมาเต็มที่ แต่กลับรู้สึกเหนื่อย\n\n## ความเหนื่อยล้าทางจิตใจคืออะไร?\n\nสมองของเราทำงานหนักตลอดเวลา ทุกอย่างใช้พลังงาน\n\n## สาเหตุหลัก\n\n### Decision Fatigue\nทุกวันเราตัดสินใจนับร้อยครั้ง\n\n### อารมณ์ที่ถูกกดเอาไว้\nเมื่อเรากดอารมณ์ไว้ ร่างกายยังคงตอบสนอง\n\n### Overstimulation\nการรับข้อมูลมากเกินไปจากโซเชียลมีเดีย`,
      bodyEn: `Have you ever felt inexplicably tired?\n\n## What is Mental Fatigue?\n\nOur brain works hard constantly.\n\n## Main Causes\n\n### Decision Fatigue\nWe make hundreds of decisions daily.\n\n### Suppressed Emotions\nOur body still responds to hidden emotions.\n\n### Overstimulation\nToo much information from social media.`,
      tags: ["จิตวิทยา", "ความเหนื่อยล้า", "Decision Fatigue"],
    },
    {
      slug: "4-7-8-breathing-technique",
      cat: "techniques", tone: "mint", days: 8,
      titleTh: "เทคนิคหายใจ 4-7-8 ลดความเครียดใน 1 นาที",
      titleEn: "The 4-7-8 Breathing Technique: Reduce Stress in 1 Minute",
      excerptTh: "เทคนิคง่ายๆ ที่ทำได้ทุกที่ทุกเวลา แค่หายใจก็สงบได้",
      excerptEn: "A simple technique you can do anywhere — just breathe and find calm.",
      bodyTh: `เมื่อรู้สึกเครียด ร่างกายจะเข้าสู่โหมด fight-or-flight\n\n## วิธีทำ\n\n1. **หายใจเข้า 4 วินาที**\n2. **กลั้นหายใจ 7 วินาที**\n3. **หายใจออก 8 วินาที**\n\nทำซ้ำ 3-4 รอบ\n\n## ทำไมถึงได้ผล?\n\nกระตุ้นระบบประสาท parasympathetic ซึ่งทำให้ร่างกายสงบลง`,
      bodyEn: `When stressed, your body enters fight-or-flight mode.\n\n## How to Do It\n\n1. **Breathe in for 4 seconds**\n2. **Hold for 7 seconds**\n3. **Breathe out for 8 seconds**\n\nRepeat 3-4 cycles.\n\n## Why Does It Work?\n\nActivates the parasympathetic nervous system.`,
      tags: ["เทคนิค", "หายใจ", "ลดเครียด"],
    },
    {
      slug: "change-self-talk-to-be-kinder",
      cat: "cbt", tone: "yellow", days: 11,
      titleTh: "เปลี่ยน Self-talk ให้เป็นมิตรกับตัวเองมากขึ้น",
      titleEn: "Change Your Self-talk to Be Kinder to Yourself",
      excerptTh: "เสียงในหัวพูดกับเราแบบไหน? เรียนรู้วิธีเปลี่ยน inner critic ให้เป็น inner coach",
      excerptEn: "What does the voice in your head say? Turn your inner critic into an inner coach.",
      bodyTh: `คุณเคยสังเกตไหมว่า เสียงในหัวพูดกับตัวเองอย่างไร?\n\n## Self-talk คืออะไร?\n\nบทสนทนาภายในที่เราพูดกับตัวเองตลอดเวลา\n\n## วิธีเปลี่ยน\n\n### 1. สังเกตก่อน\nเริ่มจากการสังเกตว่าเสียงในหัวพูดอะไร\n\n### 2. ถามตัวเองว่า "จริงหรือเปล่า?"\nความคิดอัตโนมัติไม่ใช่ความจริงเสมอไป\n\n### 3. เปลี่ยนเป็นเวอร์ชันที่เป็นมิตรกว่า\n- "ทำไมโง่จัง" → "ผิดพลาดได้ ครั้งหน้าจะดีขึ้น"`,
      bodyEn: `Have you noticed how the voice in your head talks to you?\n\n## What is Self-talk?\n\nThe ongoing internal conversation we have with ourselves.\n\n## How to Change It\n\n### 1. Observe First\nNotice what the voice says.\n\n### 2. Ask "Is This True?"\nAutomatic thoughts aren't always facts.\n\n### 3. Reframe to a Kinder Version\n- "I'm so stupid" → "I made a mistake. I'll do better."`,
      tags: ["CBT", "Self-talk", "พัฒนาตัวเอง"],
    },
    {
      slug: "5-minute-morning-routine-for-mental-health",
      cat: "habits", tone: "blue", days: 14,
      titleTh: "5 นาทีตอนเช้า ที่เปลี่ยนทั้งวันของคุณ",
      titleEn: "A 5-Minute Morning Routine That Changes Your Whole Day",
      excerptTh: "ไม่ต้องตื่นตี 4 หรือทำ routine ยาวๆ แค่ 5 นาทีก็พอ",
      excerptEn: "No need to wake up at 4 AM — just 5 minutes is enough.",
      bodyTh: `หลายคนอ่านเรื่อง morning routine แล้วรู้สึกว่ามันยาก\n\n## 5 นาทีตอนเช้า ทำอะไรดี?\n\n### นาทีที่ 1-2: เช็กอินกับตัวเอง\nก่อนหยิบมือถือ ถามตัวเองว่า "ตอนนี้รู้สึกยังไง?"\n\n### นาทีที่ 3: ตั้งใจสำหรับวันนี้\nคิดสั้นๆ ว่า "วันนี้อยากให้เป็นยังไง?"\n\n### นาทีที่ 4-5: ขอบคุณ 3 สิ่ง\nนึกถึง 3 สิ่งเล็กๆ ที่รู้สึกขอบคุณ`,
      bodyEn: `Many people feel overwhelmed by morning routines.\n\n## What to Do in 5 Morning Minutes\n\n### Minutes 1-2: Check in with yourself\nBefore grabbing your phone, ask: "How am I feeling?"\n\n### Minute 3: Set an intention\n"How do I want today to feel?"\n\n### Minutes 4-5: Gratitude for 3 things\nThink of 3 small things you're grateful for.`,
      tags: ["นิสัย", "Morning Routine", "Gratitude"],
    },
    {
      slug: "what-is-emotional-intelligence",
      cat: "psychology", tone: "purple", days: 18,
      titleTh: "EQ คืออะไร? ทำไมสำคัญกว่า IQ ในชีวิตจริง",
      titleEn: "What is EQ? Why It Matters More Than IQ in Real Life",
      excerptTh: "ความฉลาดทางอารมณ์เป็นทักษะที่ฝึกได้ ไม่ใช่พรสวรรค์",
      excerptEn: "Emotional intelligence is a skill you can practice.",
      bodyTh: `## EQ มี 5 องค์ประกอบ\n\n### 1. การรู้จักอารมณ์ตัวเอง\nรู้ว่าตอนนี้รู้สึกอะไร\n\n### 2. การจัดการอารมณ์\nเลือกวิธีตอบสนองที่เหมาะสม\n\n### 3. แรงจูงใจภายใน\nขับเคลื่อนตัวเองได้\n\n### 4. ความเข้าอกเข้าใจ\nเข้าใจอารมณ์ของคนรอบข้าง\n\n### 5. ทักษะทางสังคม\nสื่อสารอย่างมีประสิทธิภาพ`,
      bodyEn: `## 5 Components of EQ\n\n### 1. Self-awareness\nKnowing what you feel right now.\n\n### 2. Self-regulation\nChoosing appropriate responses.\n\n### 3. Internal Motivation\nDriving yourself.\n\n### 4. Empathy\nUnderstanding others' emotions.\n\n### 5. Social Skills\nCommunicating effectively.`,
      tags: ["EQ", "จิตวิทยา", "ทักษะ"],
    },
    {
      slug: "how-to-build-journaling-habit",
      cat: "habits", tone: "peach", days: 21,
      titleTh: "เริ่มบันทึกอารมณ์ยังไง ให้ทำได้ทุกวันโดยไม่รู้สึกเป็นภาระ",
      titleEn: "How to Start Journaling So It Becomes a Daily Habit",
      excerptTh: "ไม่ต้องเขียนเยอะ ไม่ต้องสวย แค่เริ่มจากสิ่งเล็กๆ",
      excerptEn: "You don't need to write a lot — just start small.",
      bodyTh: `## 3 กฎเหล็กของการบันทึกที่ยั่งยืน\n\n### กฎที่ 1: น้อยดีกว่ามาก\nแค่ 1 บรรทัดก็พอ\n\n### กฎที่ 2: ทำให้ง่ายที่สุด\nเลือกเวลาที่สะดวก ใช้แอปที่เปิดง่าย\n\n### กฎที่ 3: ไม่มีถูกผิด\nแค่บันทึกสิ่งที่รู้สึกจริงๆ\n\n> การบันทึก 30 วินาทีต่อวัน ดีกว่าไม่บันทึกเลย`,
      bodyEn: `## 3 Rules for Sustainable Journaling\n\n### Rule 1: Less is More\nOne line is enough.\n\n### Rule 2: Make It Easy\nPick a convenient time.\n\n### Rule 3: There's No Right or Wrong\nJust record what you feel.\n\n> 30 seconds of journaling per day is better than none.`,
      tags: ["บันทึก", "นิสัย", "Journaling"],
    },
    {
      slug: "understanding-anxiety-vs-worry",
      cat: "psychology", tone: "blue", days: 25,
      titleTh: "กังวล vs วิตกกังวล ต่างกันยังไง?",
      titleEn: "Worry vs Anxiety: What's the Difference?",
      excerptTh: "ทุกคนกังวลเป็นเรื่องปกติ แต่ถ้ามันเริ่มรบกวนชีวิตประจำวัน อาจเป็นสัญญาณ",
      excerptEn: "Everyone worries — but when it starts affecting daily life, it may be a sign.",
      bodyTh: `## ความแตกต่าง\n\n**กังวล** = ชั่วคราว จัดการได้\n**วิตกกังวล** = ยาวนาน ควบคุมยาก\n\n## สัญญาณที่ควรสังเกต\n\n- กังวลเรื่องเดิมซ้ำๆ มากกว่า 6 เดือน\n- นอนไม่หลับเพราะคิดมาก\n- มีอาการทางกาย เช่น ปวดท้อง ปวดหัว\n\n## สิ่งที่ช่วยได้\n\n- **บันทึกสิ่งที่กังวล** — เขียนออกมาช่วยลดพลังของมัน\n- **พูดคุยกับคนที่ไว้ใจ**\n\n> ไม่มีอะไรผิดกับการขอความช่วยเหลือ`,
      bodyEn: `## The Difference\n\n**Worry** = temporary, manageable\n**Anxiety** = prolonged, hard to control\n\n## Signs to Watch For\n\n- Worrying about the same thing for 6+ months\n- Can't sleep because of overthinking\n- Physical symptoms like stomach aches\n\n## What Can Help\n\n- **Write down your worries**\n- **Talk to someone you trust**\n\n> There's nothing wrong with asking for help.`,
      tags: ["จิตวิทยา", "ความกังวล", "Anxiety"],
    },
  ];

  for (const a of articles) {
    const id = ulid();
    const pubDate = daysAgo(a.days);
    const thChars = a.bodyTh.replace(/\s+/g, "").length;
    const enWords = a.bodyEn.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(Math.max(thChars / 900, enWords / 200)));

    // Resolve category ID — need to re-query since ON CONFLICT may skip
    const catRow = await pool.query("SELECT id FROM article_categories WHERE slug = $1", [a.cat]);
    const catId = catRow.rows[0]?.id ?? catIds[a.cat];

    await pool.query(`
      INSERT INTO articles (id, slug, category_id, title_th, title_en, excerpt_th, excerpt_en,
        body_th, body_en, tone, tags, reading_time_minutes, published, published_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $13, $13)
      ON CONFLICT (slug) DO NOTHING
    `, [id, a.slug, catId, a.titleTh, a.titleEn, a.excerptTh, a.excerptEn,
        a.bodyTh, a.bodyEn, a.tone, JSON.stringify(a.tags), readingTime, pubDate]);
    console.log(`   ${a.slug} (${readingTime} min)`);
  }

  // Summary
  const counts = await pool.query(`
    SELECT
      (SELECT count(*) FROM users) as users,
      (SELECT count(*) FROM mood_types) as mood_types,
      (SELECT count(*) FROM mood_entries) as entries,
      (SELECT count(*) FROM article_categories) as categories,
      (SELECT count(*) FROM articles) as articles
  `);
  console.log("\n=== Done ===");
  console.log(counts.rows[0]);

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
