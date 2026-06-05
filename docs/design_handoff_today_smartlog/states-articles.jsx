// Articles / Health Blog section — 4 variations
// Goal: section บนหน้าหลักของ DailyMood ที่แนะนำบทความสุขภาพใจให้ user อ่าน

const { Icon, MOODS, MoodFace } = window;

/* ============= shared content ============= */
const ARTICLES = [
  {
    id: 'tips-3',
    cat: 'พื้นฐานสุขภาพใจ',
    title: '3 เคล็ดลับดูแลสุขภาพใจง่ายๆ ที่เริ่มทำได้ตั้งแต่วันนี้',
    excerpt: 'บางวันก็รู้สึกเหนื่อยล้า หงุดหงิด หรือเศร้าแบบไม่มีเหตุผล... การดูแลสุขภาพใจสำคัญไม่แพ้สุขภาพกายเลย ลองเอา 3 ทริคนี้ไปปรับใช้กัน',
    minutes: 4,
    date: '17 พ.ค.',
    author: 'ดร. นิดา ภาสกร',
    role: 'นักจิตวิทยาคลินิก',
    tone: 'peach',          // featured color theme
    mood: 'great',
    tag: '💛 ดูแลตัวเอง',
    emoji: '💛',
    hue: 'var(--peach)',
    bgHue: 'rgba(252,164,91,.14)',
  },
  {
    id: 'tired',
    cat: 'จิตวิทยา',
    title: 'ทำไมเราถึงรู้สึกเหนื่อย ทั้งที่ไม่ได้ทำอะไรหนัก?',
    excerpt: 'Mental fatigue กับ physical fatigue ต่างกัน — เข้าใจสัญญาณของร่างกาย และเทคนิคพักใจที่ไม่ต้องลางาน',
    minutes: 6,
    date: '14 พ.ค.',
    author: 'พิม วงศ์สุวรรณ',
    role: 'CEO · DailyMood',
    tone: 'lavender',
    mood: 'meh',
    tag: '🌧 พักหายใจ',
    emoji: '🌧',
    hue: 'var(--purple)',
    bgHue: 'rgba(166,115,241,.14)',
  },
  {
    id: 'breath',
    cat: 'เทคนิคทันที',
    title: 'เทคนิคหายใจ 4-7-8 ลดความเครียดใน 1 นาที',
    excerpt: 'งานวิจัยจาก Harvard ยืนยันว่าการหายใจแบบ 4-7-8 ลด cortisol ได้จริง · ลองทำตาม animation นี้',
    minutes: 2,
    date: '11 พ.ค.',
    author: 'ทีม DailyMood',
    role: '',
    tone: 'mint',
    mood: 'calm',
    tag: '🌿 ลองทำเลย',
    emoji: '🌿',
    hue: '#2EA67D',
    bgHue: 'rgba(133,236,203,.22)',
  },
  {
    id: 'selftalk',
    cat: 'CBT พื้นฐาน',
    title: 'เปลี่ยน Self-talk ให้เป็นมิตรกับตัวเองมากขึ้น',
    excerpt: 'คุณเคยพูดกับตัวเองแบบที่ไม่กล้าพูดกับเพื่อนสนิทไหม? เรียนรู้วิธี reframe ความคิดด้วย CBT เทคนิคง่ายๆ',
    minutes: 5,
    date: '8 พ.ค.',
    author: 'ดร. นิดา ภาสกร',
    role: 'นักจิตวิทยาคลินิก',
    tone: 'yellow',
    mood: 'good',
    tag: '✨ ฝึกใจ',
    emoji: '✨',
    hue: 'var(--yellow)',
    bgHue: 'rgba(253,203,86,.22)',
  },
  {
    id: 'patterns',
    cat: 'Data-driven mood',
    title: '5 สัญญาณว่าคุณต้องการ "พัก" จริงๆ',
    excerpt: 'รู้จัก burnout ก่อนที่มันจะถึงจุดวิกฤต — เช็กลิสต์ที่ใช้จริงในคลินิก',
    minutes: 3,
    date: '4 พ.ค.',
    author: 'พิม วงศ์สุวรรณ',
    role: '',
    tone: 'blue',
    mood: 'bad',
    tag: '🩵 รู้ตัวเอง',
    emoji: '🩵',
    hue: '#5C9DBE',
    bgHue: 'rgba(154,205,226,.28)',
  },
  {
    id: 'journal',
    cat: 'นิสัย',
    title: 'การจดบันทึกอารมณ์ช่วยให้ใจสงบได้ยังไง',
    excerpt: 'งานวิจัย 14 ชิ้น สรุปว่า expressive writing ช่วยลด anxiety ได้ 26% ใน 4 สัปดาห์',
    minutes: 4,
    date: '1 พ.ค.',
    author: 'กานต์ พรหมจักร',
    role: 'Researcher',
    tone: 'purple',
    mood: 'okay',
    tag: '📝 จดเลย',
    emoji: '📝',
    hue: 'var(--purple-strong)',
    bgHue: 'rgba(151,71,255,.14)',
  },
];

/* ============= shared decorative artwork =============
   Hand-drawn SVG illustrations matching each article's tone — no AI placeholder images.
   Compositions use the design system's mood colors + organic shapes. */
function ArticleArt({ tone, size = 240, mood }) {
  const palette = {
    peach: { bg: 'var(--peach)', tint: '#FFE7D2', dark: '#B25F1D', accent: 'var(--purple)' },
    lavender: { bg: 'var(--lavender)', tint: '#EFE3F5', dark: '#6B4A8E', accent: 'var(--peach)' },
    mint: { bg: 'var(--mint)', tint: '#D8F7EC', dark: '#1F8B6A', accent: 'var(--yellow)' },
    yellow: { bg: 'var(--yellow)', tint: '#FFE9B0', dark: '#8C6816', accent: 'var(--purple)' },
    blue: { bg: 'var(--blue)', tint: '#D9EBF3', dark: '#3E6D85', accent: 'var(--peach)' },
    purple: { bg: 'var(--purple)', tint: '#E9DAFD', dark: '#5A2BB3', accent: 'var(--yellow)' },
  }[tone] || { bg: 'var(--peach)', tint: '#FFE7D2', dark: '#B25F1D', accent: 'var(--purple)' };

  // pick illustration variant by tone — six distinct compositions
  if (tone === 'peach') {
    // sunrise + mountain + journal
    return (
      <svg viewBox="0 0 400 240" width={size} style={{ display: 'block', maxWidth: '100%' }}>
        <rect width="400" height="240" fill={palette.tint}/>
        <circle cx="290" cy="120" r="64" fill={palette.bg}/>
        <path d="M0 240 L0 175 Q 100 100 220 165 Q 320 215 400 145 L400 240 Z" fill={palette.dark} opacity=".22"/>
        <path d="M0 240 L0 200 Q 130 155 260 195 Q 340 220 400 195 L400 240 Z" fill={palette.dark} opacity=".4"/>
        {/* tiny journal */}
        <g transform="translate(58 70) rotate(-8)">
          <rect width="80" height="100" rx="6" fill="#fff" stroke={palette.dark} strokeWidth="2"/>
          <line x1="14" y1="26" x2="66" y2="26" stroke={palette.dark} strokeWidth="2" strokeLinecap="round" opacity=".6"/>
          <line x1="14" y1="40" x2="56" y2="40" stroke={palette.dark} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
          <line x1="14" y1="54" x2="60" y2="54" stroke={palette.dark} strokeWidth="2" strokeLinecap="round" opacity=".4"/>
          <circle cx="62" cy="76" r="10" fill={palette.bg}/>
          <path d="M55 74 Q 62 80 69 74" stroke={palette.dark} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        </g>
        {/* sparkles */}
        <g fill={palette.accent}>
          <circle cx="350" cy="50" r="4"/>
          <circle cx="370" cy="90" r="2.5"/>
          <circle cx="180" cy="40" r="3"/>
        </g>
      </svg>
    );
  }
  if (tone === 'lavender') {
    // clouds + raindrops (mental fatigue)
    return (
      <svg viewBox="0 0 400 240" width={size} style={{ display: 'block', maxWidth: '100%' }}>
        <rect width="400" height="240" fill={palette.tint}/>
        <g fill={palette.bg}>
          <ellipse cx="120" cy="90" rx="60" ry="28"/>
          <ellipse cx="160" cy="80" rx="46" ry="24"/>
          <ellipse cx="280" cy="100" rx="70" ry="30"/>
        </g>
        {/* raindrops */}
        <g fill={palette.dark} opacity=".7">
          {[110, 140, 170, 200, 240, 270, 300, 330].map((x, i) => (
            <path key={i} d={`M ${x} ${135 + (i % 3) * 8} Q ${x - 4} ${145 + (i % 3) * 8} ${x} ${158 + (i % 3) * 8} Q ${x + 4} ${145 + (i % 3) * 8} ${x} ${135 + (i % 3) * 8} Z`}/>
          ))}
        </g>
        {/* small face */}
        <g transform="translate(170 165)">
          <circle r="34" fill="#fff"/>
          <circle cx="-10" cy="-6" r="2.6" fill={palette.dark}/>
          <circle cx="10" cy="-6" r="2.6" fill={palette.dark}/>
          <path d="M -10 12 Q 0 8 10 12" stroke={palette.dark} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        </g>
      </svg>
    );
  }
  if (tone === 'mint') {
    // breath circle / lotus
    return (
      <svg viewBox="0 0 400 240" width={size} style={{ display: 'block', maxWidth: '100%' }}>
        <rect width="400" height="240" fill={palette.tint}/>
        {/* concentric breath rings */}
        <g fill="none" stroke={palette.bg} strokeWidth="3">
          <circle cx="200" cy="120" r="100" opacity=".5"/>
          <circle cx="200" cy="120" r="78" opacity=".7"/>
          <circle cx="200" cy="120" r="56" opacity=".9"/>
        </g>
        <circle cx="200" cy="120" r="36" fill={palette.bg}/>
        <text x="200" y="115" textAnchor="middle" fontSize="11" fontWeight="800" fill={palette.dark} fontFamily="Urbanist" letterSpacing=".1em">BREATHE</text>
        <text x="200" y="132" textAnchor="middle" fontSize="14" fontWeight="800" fill={palette.dark} fontFamily="Urbanist">4 · 7 · 8</text>
        {/* tiny leaves */}
        <g fill={palette.dark} opacity=".5">
          <path d="M 70 50 Q 50 70 70 90 Q 90 70 70 50 Z"/>
          <path d="M 340 180 Q 320 200 340 220 Q 360 200 340 180 Z"/>
        </g>
      </svg>
    );
  }
  if (tone === 'yellow') {
    // speech bubbles — self-talk
    return (
      <svg viewBox="0 0 400 240" width={size} style={{ display: 'block', maxWidth: '100%' }}>
        <rect width="400" height="240" fill={palette.tint}/>
        {/* big bubble */}
        <path d="M 60 60 Q 60 40 80 40 L 240 40 Q 260 40 260 60 L 260 130 Q 260 150 240 150 L 130 150 L 100 175 L 110 150 L 80 150 Q 60 150 60 130 Z" fill="#fff" stroke={palette.dark} strokeWidth="2.5"/>
        <line x1="80" y1="70" x2="220" y2="70" stroke={palette.dark} strokeWidth="2.4" strokeLinecap="round"/>
        <line x1="80" y1="90" x2="200" y2="90" stroke={palette.dark} strokeWidth="2.4" strokeLinecap="round" opacity=".7"/>
        <line x1="80" y1="110" x2="170" y2="110" stroke={palette.dark} strokeWidth="2.4" strokeLinecap="round" opacity=".5"/>
        {/* small bubble */}
        <path d="M 250 130 Q 250 120 260 120 L 340 120 Q 350 120 350 130 L 350 170 Q 350 180 340 180 L 290 180 L 270 200 L 280 180 L 260 180 Q 250 180 250 170 Z" fill={palette.bg} stroke={palette.dark} strokeWidth="2.5"/>
        <text x="300" y="156" textAnchor="middle" fontSize="20" fontWeight="800" fill={palette.dark} fontFamily="Urbanist">💛</text>
      </svg>
    );
  }
  if (tone === 'blue') {
    // moon + stars (rest signals)
    return (
      <svg viewBox="0 0 400 240" width={size} style={{ display: 'block', maxWidth: '100%' }}>
        <rect width="400" height="240" fill={palette.tint}/>
        {/* moon */}
        <circle cx="280" cy="100" r="58" fill={palette.bg}/>
        <circle cx="260" cy="92" r="50" fill={palette.tint}/>
        {/* stars */}
        <g fill={palette.dark} opacity=".7">
          {[[80,60],[140,40],[200,80],[100,140],[60,180],[330,180],[190,180]].map(([x,y],i)=>(
            <path key={i} d={`M ${x} ${y-6} L ${x+1.5} ${y-1.5} L ${x+6} ${y} L ${x+1.5} ${y+1.5} L ${x} ${y+6} L ${x-1.5} ${y+1.5} L ${x-6} ${y} L ${x-1.5} ${y-1.5} Z`}/>
          ))}
        </g>
        {/* sleeping face */}
        <g transform="translate(140 145)">
          <circle r="32" fill="#fff"/>
          <path d="M -12 -4 Q -8 -8 -4 -4" stroke={palette.dark} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
          <path d="M 4 -4 Q 8 -8 12 -4" stroke={palette.dark} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
          <path d="M -8 10 Q 0 8 8 10" stroke={palette.dark} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        </g>
      </svg>
    );
  }
  // purple — journal & pen
  return (
    <svg viewBox="0 0 400 240" width={size} style={{ display: 'block', maxWidth: '100%' }}>
      <rect width="400" height="240" fill={palette.tint}/>
      {/* open book */}
      <g transform="translate(60 60)">
        <path d="M 0 20 L 140 0 L 140 100 L 0 120 Z" fill="#fff" stroke={palette.dark} strokeWidth="2.5"/>
        <path d="M 140 0 L 280 20 L 280 120 L 140 100 Z" fill="#fff" stroke={palette.dark} strokeWidth="2.5"/>
        <line x1="140" y1="0" x2="140" y2="100" stroke={palette.dark} strokeWidth="2"/>
        {[18, 36, 54, 72].map((y, i) => (
          <line key={i} x1={20 + i * 2} y1={y + 6} x2={120 - i * 2} y2={y - 6} stroke={palette.dark} strokeWidth="1.6" opacity=".4"/>
        ))}
        {[18, 36, 54, 72].map((y, i) => (
          <line key={i} x1={160 + i * 2} y1={y - 6} x2={260 - i * 2} y2={y + 6} stroke={palette.dark} strokeWidth="1.6" opacity=".4"/>
        ))}
      </g>
      {/* heart sparkle */}
      <g transform="translate(310 50)" fill={palette.bg}>
        <path d="M 20 30 Q 5 18 10 6 Q 20 -4 25 8 Q 30 -4 40 6 Q 45 18 30 30 L 25 35 Z"/>
      </g>
    </svg>
  );
}

/* ============= V1: Editorial magazine grid ============= */
function ArticlesV1() {
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1, 4);
  return (
    <section style={{ background: 'var(--w-bg)', padding: '52px 0 12px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="thai w-eyebrow" style={{ marginBottom: 10 }}>คลังบทความ · อัพเดททุกสัปดาห์</div>
            <h2 className="thai" style={{ fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.08, maxWidth: 640 }}>
              อ่านสักนิด <span style={{ color: 'var(--w-ink-3)' }}>—</span> ดูแลใจให้ดี
            </h2>
            <p className="thai" style={{ fontSize: 15, color: 'var(--w-ink-2)', margin: '10px 0 0', lineHeight: 1.5, maxWidth: 540 }}>
              เคล็ดลับสุขภาพใจสั้นๆ จากนักจิตวิทยาและทีม DailyMood · อ่านจบใน 5 นาที
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ทั้งหมด', 'พื้นฐาน', 'เทคนิคทันที', 'จิตวิทยา', 'CBT', 'นิสัย'].map((t, i) => (
              <button key={t} className="thai" style={{
                padding: '7px 14px', borderRadius: 100, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                background: i === 0 ? 'var(--w-ink)' : '#fff',
                color: i === 0 ? '#fff' : 'var(--w-ink-2)',
                border: i === 0 ? 'none' : '1px solid var(--w-rule)',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* magazine grid: 1 big + 3 stacked */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24, alignItems: 'stretch' }}>
          {/* Featured card */}
          <article style={{ background: '#fff', borderRadius: 22, border: '1px solid var(--w-rule)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative' }}>
              <ArticleArt tone={featured.tone} size="100%"/>
              <span className="thai" style={{ position: 'absolute', top: 16, left: 16, padding: '6px 12px', borderRadius: 100, background: 'rgba(26,19,32,.85)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                ★ บทความเด่น
              </span>
              <span className="thai" style={{ position: 'absolute', top: 16, right: 16, padding: '6px 12px', borderRadius: 100, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'var(--w-ink-2)' }}>
                ⏱ {featured.minutes} นาที
              </span>
            </div>
            <div style={{ padding: '24px 28px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="thai" style={{ fontSize: 12, fontWeight: 700, color: featured.hue, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>{featured.cat}</div>
              <h3 className="thai" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.22, margin: '0 0 14px', color: 'var(--w-ink)', letterSpacing: '-0.018em' }}>
                {featured.title}
              </h3>
              <p className="thai" style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--w-ink-2)', margin: 0, flex: 1 }}>
                {featured.excerpt}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--w-rule)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 50, background: featured.hue, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>นด</div>
                <div style={{ flex: 1 }}>
                  <div className="thai" style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-ink)' }}>{featured.author}</div>
                  <div className="thai" style={{ fontSize: 12, color: 'var(--w-ink-3)' }}>{featured.role} · {featured.date}</div>
                </div>
                <button className="w-btn w-btn-ink thai" style={{ height: 38, fontSize: 13, padding: '0 16px' }}>อ่านต่อ →</button>
              </div>
            </div>
          </article>

          {/* Side stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rest.map(a => (
              <article key={a.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--w-rule)', overflow: 'hidden', display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0 }}>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <ArticleArt tone={a.tone} size="100%"/>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="thai" style={{ fontSize: 10, fontWeight: 800, color: a.hue, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{a.cat}</div>
                    <h4 className="thai" style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, margin: 0, color: 'var(--w-ink)', letterSpacing: '-0.005em' }}>
                      {a.title}
                    </h4>
                  </div>
                  <div className="thai" style={{ fontSize: 11, color: 'var(--w-ink-3)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{a.date}</span>
                    <span style={{ width: 3, height: 3, borderRadius: 50, background: 'var(--w-ink-3)' }}/>
                    <span>⏱ {a.minutes} นาที</span>
                  </div>
                </div>
              </article>
            ))}
            <a href="#" className="thai" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px', borderRadius: 14, background: 'transparent', border: '1px dashed var(--w-rule-strong)', color: 'var(--w-ink-2)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              ดูบทความทั้งหมด <span style={{ color: 'var(--w-ink-3)' }}>(42)</span> →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============= V2: Mood-themed card row ============= */
function ArticlesV2() {
  const four = ARTICLES.slice(0, 4);
  return (
    <section style={{ background: 'var(--w-tint)', padding: '56px 0 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="thai w-eyebrow" style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--peach)' }}>●</span> &nbsp;เลือกอ่านตามอารมณ์ของคุณวันนี้
          </div>
          <h2 className="thai" style={{ fontSize: 36, fontWeight: 800, margin: '0 auto', letterSpacing: '-0.022em', lineHeight: 1.15, maxWidth: 680 }}>
            ใจไหนก็มี<span style={{ color: 'var(--peach)' }}>บทความ</span>ให้คุณ
          </h2>
          <p className="thai" style={{ fontSize: 15, color: 'var(--w-ink-2)', margin: '12px auto 0', lineHeight: 1.55, maxWidth: 560 }}>
            แต่ละบทความถูกจับคู่กับ "อารมณ์" ที่เหมาะจะอ่าน · เลือกที่ใจคุณตอนนี้ต้องการได้เลย
          </p>
        </div>

        {/* mood filter chips */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          {MOODS.slice(0, 5).map((m, i) => (
            <button key={m.id} className="thai" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px 7px 7px', borderRadius: 100,
              background: i === 0 ? '#fff' : 'transparent',
              border: i === 0 ? '1px solid var(--w-rule-strong)' : '1px solid var(--w-rule)',
              boxShadow: i === 0 ? '0 4px 12px -4px rgba(26,19,32,.08)' : 'none',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 13, color: 'var(--w-ink)',
              cursor: 'pointer',
            }}>
              <span style={{ width: 26, height: 26, borderRadius: 50, background: m.color, display: 'grid', placeItems: 'center' }}>
                <MoodFace face={m.face} size={20} bg="transparent"/>
              </span>
              {m.th}
            </button>
          ))}
        </div>

        {/* 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {four.map(a => {
            const mood = MOODS.find(m => m.id === a.mood) || MOODS[0];
            return (
              <article key={a.id} style={{
                background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--w-rule)',
                display: 'flex', flexDirection: 'column',
                position: 'relative', transition: 'transform .2s ease',
              }}>
                {/* top mood band */}
                <div style={{ background: mood.color, padding: '18px 18px 14px', position: 'relative', overflow: 'hidden' }}>
                  <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: .14 }} preserveAspectRatio="none">
                    <defs>
                      <pattern id={`dots-${a.id}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#1A1320"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#dots-${a.id})`}/>
                  </svg>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <MoodFace face={mood.face} size={48} bg="rgba(255,255,255,.85)"/>
                    <span className="thai" style={{ padding: '4px 10px', background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(4px)', borderRadius: 100, fontSize: 10, fontWeight: 800, color: 'var(--w-ink)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      สำหรับวันที่ {mood.th}
                    </span>
                  </div>
                </div>

                {/* body */}
                <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="thai" style={{ fontSize: 11, fontWeight: 800, color: a.hue, textTransform: 'uppercase', letterSpacing: '.06em' }}>{a.cat}</div>
                  <h3 className="thai" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3, margin: 0, color: 'var(--w-ink)', letterSpacing: '-0.005em' }}>
                    {a.title}
                  </h3>
                  <p className="thai" style={{ fontSize: 13, color: 'var(--w-ink-2)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                    {a.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px dashed var(--w-rule)' }}>
                    <span className="thai" style={{ fontSize: 11, color: 'var(--w-ink-3)', fontWeight: 600 }}>⏱ {a.minutes} นาที</span>
                    <span className="thai" style={{ fontSize: 13, fontWeight: 800, color: 'var(--w-ink)' }}>อ่านต่อ →</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button className="w-btn w-btn-ghost thai" style={{ height: 44, padding: '0 24px', fontSize: 14, background: '#fff' }}>
            ดูทั้ง 42 บทความ →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============= V3: Typography-driven editorial list ============= */
function ArticlesV3() {
  const four = ARTICLES.slice(0, 4);
  return (
    <section style={{ background: 'var(--w-bg)', padding: '60px 0' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>

        {/* Header: huge type, no image */}
        <div style={{ borderTop: '2px solid var(--w-ink)', paddingTop: 20, marginBottom: 36, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'flex-end', gap: 24 }}>
          <div>
            <div className="thai" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--w-ink-3)', marginBottom: 12 }}>
              ISSUE 18 · พ.ค. 2026 · DAILYMOOD JOURNAL
            </div>
            <h2 className="thai" style={{ fontSize: 88, fontWeight: 800, margin: 0, letterSpacing: '-0.04em', lineHeight: .9, color: 'var(--w-ink)' }}>
              อ่าน<br/>
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: 'var(--w-ink-2)' }}>เพื่อใจ.</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <button className="w-btn w-btn-ink thai" style={{ height: 44, padding: '0 22px', fontSize: 14 }}>
              สมัครรับ Weekly →
            </button>
            <span className="thai" style={{ fontSize: 11, color: 'var(--w-ink-3)' }}>ทุกวันอาทิตย์เช้า · ไม่มีโฆษณา</span>
          </div>
        </div>

        {/* List */}
        <div>
          {four.map((a, i) => (
            <a key={a.id} href="#" style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '28px 0', borderBottom: i < four.length - 1 ? '1px solid var(--w-rule)' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr 220px 120px', gap: 32, alignItems: 'center' }}>
                {/* numeral */}
                <div className="thai" style={{ fontSize: 64, fontWeight: 800, color: 'var(--w-ink-3)', lineHeight: 1, letterSpacing: '-0.04em', fontFeatureSettings: '"tnum"' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* title + meta */}
                <div>
                  <div className="thai" style={{ fontSize: 11, fontWeight: 800, color: a.hue, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                    {a.cat}
                  </div>
                  <h3 className="thai" style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.18, color: 'var(--w-ink)' }}>
                    {a.title}
                  </h3>
                  <p className="thai" style={{ fontSize: 14, color: 'var(--w-ink-2)', margin: '10px 0 0', lineHeight: 1.55, maxWidth: 580 }}>
                    {a.excerpt}
                  </p>
                </div>

                {/* author */}
                <div>
                  <div className="thai" style={{ fontSize: 11, fontWeight: 800, color: 'var(--w-ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>WRITTEN BY</div>
                  <div className="thai" style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-ink)' }}>{a.author}</div>
                  <div className="thai" style={{ fontSize: 12, color: 'var(--w-ink-3)', marginTop: 2 }}>{a.role || a.date}</div>
                </div>

                {/* read time + dot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="thai" style={{ fontSize: 28, fontWeight: 800, color: 'var(--w-ink)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {a.minutes}<span style={{ fontSize: 14, color: 'var(--w-ink-3)', fontWeight: 600, marginLeft: 3 }}>นาที</span>
                    </div>
                    <div className="thai" style={{ fontSize: 11, color: 'var(--w-ink-3)', marginTop: 4 }}>{a.date}</div>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 50, background: a.bgHue,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.hue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12 H19 M13 6 L19 12 L13 18"/>
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer link */}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: '2px solid var(--w-ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="thai" style={{ fontSize: 12, color: 'var(--w-ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>04 / 42 บทความ</span>
          <a href="#" className="thai" style={{ fontSize: 14, fontWeight: 800, color: 'var(--w-ink)', textDecoration: 'underline', textUnderlineOffset: 4 }}>ดูคลังบทความทั้งหมด →</a>
        </div>
      </div>
    </section>
  );
}

/* ============= V4: Hero feature + sidebar list + newsletter ============= */
function ArticlesV4() {
  const hero = ARTICLES[0];
  const side = ARTICLES.slice(1, 5);
  return (
    <section style={{ background: 'var(--w-bg)', padding: '52px 0' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        {/* eyebrow header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: hero.bgHue, display: 'grid', placeItems: 'center' }}>
              <Icon name="heart" size={18} stroke={hero.hue} sw={2.2}/>
            </div>
            <div>
              <div className="thai w-eyebrow">DailyMood Reads</div>
              <div className="thai" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.018em', marginTop: 2 }}>
                บทความสุขภาพใจประจำสัปดาห์
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="thai" style={{ fontSize: 12, color: 'var(--w-ink-3)' }}>อัพเดท: 17 พ.ค. 2026</span>
            <button className="thai" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 100, background: '#fff', border: '1px solid var(--w-rule)', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, color: 'var(--w-ink-2)', cursor: 'pointer' }}>
              <Icon name="bell" size={14} stroke="var(--w-ink-2)" sw={1.8}/> ติดตาม
            </button>
          </div>
        </div>

        {/* hero + sidebar layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 28 }}>

          {/* Hero article — magazine cover style */}
          <article style={{ background: '#fff', borderRadius: 24, border: '1px solid var(--w-rule)', overflow: 'hidden', position: 'relative' }}>
            {/* Top art band */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <ArticleArt tone={hero.tone} size="100%"/>
              {/* badges */}
              <div style={{ position: 'absolute', top: 18, left: 20, display: 'flex', gap: 8 }}>
                <span className="thai" style={{ padding: '6px 12px', borderRadius: 100, background: 'rgba(26,19,32,.85)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>เด่นประจำสัปดาห์</span>
                <span className="thai" style={{ padding: '6px 12px', borderRadius: 100, background: 'rgba(255,255,255,.95)', color: hero.hue, fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{hero.cat}</span>
              </div>
              <span className="thai" style={{ position: 'absolute', top: 18, right: 20, padding: '6px 12px', borderRadius: 100, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'var(--w-ink-2)' }}>
                ⏱ {hero.minutes} นาทีอ่านจบ
              </span>
            </div>

            {/* Content */}
            <div style={{ padding: '32px 32px 28px' }}>
              <h3 className="thai" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.18, margin: '0 0 14px', color: 'var(--w-ink)', letterSpacing: '-0.025em' }}>
                {hero.title}
              </h3>
              <p className="thai" style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--w-ink-2)', margin: '0 0 22px' }}>
                {hero.excerpt}
              </p>

              {/* Bullet preview — the 3 tips inside the article */}
              <div style={{ background: hero.bgHue, borderRadius: 14, padding: '18px 20px', marginBottom: 22 }}>
                <div className="thai w-eyebrow" style={{ marginBottom: 10, color: hero.hue }}>คุณจะได้อ่าน</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    'หมั่นเช็กอินความรู้สึกตัวเอง (Daily Check-in)',
                    'อนุญาตให้ตัวเอง \'รู้สึกแย่\' ได้บ้าง',
                    'ตามหา \'แพทเทิร์น\' ของความสุขและสิ่งกระตุ้น',
                  ].map((t, i) => (
                    <div key={i} className="thai" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--w-ink)', fontWeight: 600 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 50, background: hero.hue, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer of card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 18, borderTop: '1px solid var(--w-rule)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 50, background: hero.hue, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>นด</div>
                <div style={{ flex: 1 }}>
                  <div className="thai" style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-ink)' }}>{hero.author}</div>
                  <div className="thai" style={{ fontSize: 12, color: 'var(--w-ink-3)' }}>{hero.role} · {hero.date} · 2.1k คนอ่านแล้ว</div>
                </div>
                <button className="w-btn w-btn-primary thai" style={{ height: 42, padding: '0 22px', fontSize: 14 }}>
                  เริ่มอ่าน →
                </button>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="thai w-eyebrow" style={{ paddingBottom: 4 }}>กำลังเป็นที่นิยม</div>

            {side.map((a, i) => (
              <a key={a.id} href="#" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, background: '#fff', border: '1px solid var(--w-rule)' }}>
                <div className="thai" style={{
                  fontSize: 28, fontWeight: 800, color: 'var(--w-ink-3)', letterSpacing: '-0.03em', lineHeight: 1, minWidth: 32,
                }}>{String(i + 2).padStart(2, '0')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="thai" style={{ fontSize: 10, fontWeight: 800, color: a.hue, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{a.cat}</div>
                  <div className="thai" style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: 'var(--w-ink)', letterSpacing: '-0.005em' }}>{a.title}</div>
                  <div className="thai" style={{ fontSize: 11, color: 'var(--w-ink-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{a.date}</span>
                    <span style={{ width: 3, height: 3, borderRadius: 50, background: 'var(--w-ink-3)' }}/>
                    <span>⏱ {a.minutes} นาที</span>
                  </div>
                </div>
              </a>
            ))}

            {/* Newsletter widget */}
            <div style={{ background: 'var(--w-ink)', color: '#fff', borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 50, background: 'radial-gradient(circle, var(--peach), transparent 70%)', opacity: .35 }}/>
              <div style={{ position: 'relative' }}>
                <div className="thai" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .7, marginBottom: 8 }}>📮 จดหมายข่าวสัปดาห์</div>
                <div className="thai" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3, marginBottom: 12, letterSpacing: '-0.01em' }}>
                  บทความใหม่ในกล่อง<br/>อีเมลของคุณทุกอาทิตย์
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input type="email" placeholder="คุณ@email.com" className="thai" style={{
                    flex: 1, padding: '0 12px', height: 38, borderRadius: 10, border: 'none',
                    background: 'rgba(255,255,255,.12)', color: '#fff', fontFamily: 'inherit', fontSize: 13, outline: 'none',
                  }}/>
                  <button className="thai" style={{ padding: '0 14px', height: 38, borderRadius: 10, background: 'var(--peach)', border: 'none', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>สมัคร</button>
                </div>
                <div className="thai" style={{ fontSize: 10, opacity: .55, marginTop: 8 }}>ฟรี · ยกเลิกได้ตลอด · 2,400+ คนสมัครแล้ว</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============= wrappers for the canvas ============= */
const { DesktopFrame } = window;

function ArticlesScreenV1() { return <DesktopFrame active="today" noFooter><ArticlesV1/></DesktopFrame>; }
function ArticlesScreenV2() { return <DesktopFrame active="today" noFooter><ArticlesV2/></DesktopFrame>; }
function ArticlesScreenV3() { return <DesktopFrame active="today" noFooter><ArticlesV3/></DesktopFrame>; }
function ArticlesScreenV4() { return <DesktopFrame active="today" noFooter><ArticlesV4/></DesktopFrame>; }

window.ArticlesScreenV1 = ArticlesScreenV1;
window.ArticlesScreenV2 = ArticlesScreenV2;
window.ArticlesScreenV3 = ArticlesScreenV3;
window.ArticlesScreenV4 = ArticlesScreenV4;
window.ARTICLES = ARTICLES;
window.ArticleArt = ArticleArt;
