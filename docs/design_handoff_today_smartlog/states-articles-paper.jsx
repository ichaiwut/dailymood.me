// Articles / Blog — "Paper Desk" reskin (folder tabs · paperclips · washi tape · mood-face stickers · layered paper)
// Reuses ARTICLES + ArticleArt + MoodFace from states-articles.jsx
const { MOODS: PA_MOODS, MoodFace: PAFace, ARTICLES: PA_ARTICLES, ArticleArt: PAArt, DesktopFrame: PAFrame } = window;

/* ---- scoped paper styles (injected once) ---- */
function PaperStyle() {
  return (
    <style>{`
    .pa-wrap { background:#F1E5CF; position:relative; }
    .pa-wrap::before { content:''; position:absolute; inset:0; pointer-events:none; opacity:.5;
      background-image:radial-gradient(rgba(120,90,50,.07) 1px, transparent 1.4px); background-size:7px 7px; }
    .pa-tab { display:inline-flex; align-items:center; gap:8px; padding:9px 20px 11px; border-radius:14px 14px 0 0;
      background:var(--peach); color:#fff; font-weight:800; font-size:14px; letter-spacing:-.01em; line-height:1;
      position:relative; z-index:2; margin-bottom:-8px; }
    .pa-tab::after { content:''; position:absolute; top:0; right:-12px; width:14px; height:100%; background:inherit;
      border-radius:0 14px 0 0; transform:skewX(20deg); transform-origin:bottom left; z-index:-1; }
    .pa-tab.ink { background:var(--w-ink); color:#fff; } .pa-tab.mint{ background:var(--mint); color:var(--w-ink); }
    .pa-tab.lav{ background:var(--lavender); color:var(--w-ink); } .pa-tab.yellow{ background:var(--yellow); color:var(--w-ink); }
    .pa-tab.purple{ background:var(--purple); color:#fff; }
    .pa-sheet { background:#fff; border-radius:4px 18px 18px 18px; box-shadow:0 18px 40px -20px rgba(60,40,20,.45); position:relative; }
    .pa-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; height:42px; padding:0 18px;
      border-radius:12px; font-family:inherit; font-weight:800; font-size:14px; border:none; cursor:pointer;
      background:var(--peach); color:#fff; box-shadow:0 7px 0 -2px #d97f3b, 0 16px 24px -12px rgba(217,127,59,.7); }
    .pa-btn.ink { background:var(--w-ink); color:#fff; box-shadow:0 7px 0 -2px #000, 0 16px 24px -14px rgba(0,0,0,.5); }
    .pa-washi { position:absolute; z-index:6; height:26px; width:104px; top:-12px; left:50%;
      transform:translateX(-50%) rotate(-3deg); background:rgba(252,164,91,.5); box-shadow:0 2px 8px rgba(0,0,0,.10);
      -webkit-mask:repeating-linear-gradient(90deg,#000 0 5px,transparent 5px 7px) left/100% 4px no-repeat,
        repeating-linear-gradient(90deg,#000 0 5px,transparent 5px 7px) bottom/100% 4px no-repeat,linear-gradient(#000,#000);
      mask:repeating-linear-gradient(90deg,#000 0 5px,transparent 5px 7px) left/100% 4px no-repeat,
        repeating-linear-gradient(90deg,#000 0 5px,transparent 5px 7px) bottom/100% 4px no-repeat,linear-gradient(#000,#000); }
    .pa-washi.mint{ background:rgba(133,236,203,.65);} .pa-washi.lav{ background:rgba(212,190,228,.75);}
    .pa-washi.yellow{ background:rgba(253,203,86,.65);} .pa-washi.purple{ background:rgba(166,115,241,.5);}
    .pa-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:100px; font-size:12px;
      font-weight:800; background:#fff; color:var(--w-ink); box-shadow:0 6px 16px -8px rgba(60,40,20,.3); }
    .pa-card-lift { transition:transform .2s ease, box-shadow .2s ease; }
  `}</style>
  );
}

function PAClip({ style }) {
  return (
    <svg width="30" height="57" viewBox="0 0 34 64" fill="none" style={{ position:'absolute', filter:'drop-shadow(0 3px 4px rgba(0,0,0,.22))', ...style }}>
      <path d="M24 14v30a8 8 0 0 1-16 0V12a5 5 0 0 1 10 0v30a2.4 2.4 0 0 1-4.8 0V16" stroke="#B7B2BC" strokeWidth="3.4" strokeLinecap="round"/>
    </svg>
  );
}

function PASticker({ face, color, size = 54, style }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', display:'grid', placeItems:'center',
      background:color || '#fff', border:'4px solid #fff', boxShadow:'0 10px 22px -8px rgba(0,0,0,.3)', ...style }}>
      <PAFace face={face} size={size*0.78} bg="transparent"/>
    </div>
  );
}

function PAMark({ children, color = 'var(--peach)' }) {
  return (
    <span style={{ position:'relative', whiteSpace:'nowrap', padding:'0 .1em' }}>
      <span style={{ position:'absolute', left:0, right:0, bottom:'.05em', top:'.2em', background:color,
        transform:'rotate(-1.2deg)', borderRadius:'6px 10px 7px 9px', zIndex:0 }}/>
      <span style={{ position:'relative', zIndex:1 }}>{children}</span>
    </span>
  );
}

/* ============= PAPER · Magazine grid (featured folder + stack) ============= */
function ArticlesPaperGrid() {
  const featured = PA_ARTICLES[0];
  const rest = PA_ARTICLES.slice(1, 4);
  const fmood = PA_MOODS.find(m => m.id === featured.mood) || PA_MOODS[0];
  return (
    <section className="pa-wrap" style={{ padding:'52px 0 40px' }}>
      <PaperStyle/>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 32px', position:'relative' }}>
        {/* header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:30, gap:24, flexWrap:'wrap' }}>
          <div>
            <span className="pa-chip thai" style={{ marginBottom:14 }}>📚 คลังบทความ · อัพเดททุกสัปดาห์</span>
            <h2 className="thai" style={{ fontSize:42, fontWeight:800, margin:'14px 0 0', letterSpacing:'-0.02em', lineHeight:1.05, color:'var(--w-ink)' }}>
              อ่านสักนิด <PAMark>ดูแลใจ</PAMark> ให้ดี
            </h2>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['ทั้งหมด','พื้นฐาน','เทคนิคทันที','จิตวิทยา'].map((t,i)=>(
              <button key={t} className="thai" style={{ padding:'8px 15px', borderRadius:11, fontFamily:'inherit', fontWeight:800, fontSize:13, cursor:'pointer',
                background:i===0?'var(--w-ink)':'#fff', color:i===0?'#fff':'var(--w-ink-2)', border:'none',
                boxShadow:i===0?'0 6px 0 -2px #000':'0 5px 14px -8px rgba(60,40,20,.4)' }}>{t}</button>
            ))}
          </div>
        </div>

        {/* scattered sticker */}
        <PASticker face="great" color="var(--peach)" size={56} style={{ position:'absolute', top:-6, right:'30%', transform:'rotate(-12deg)', zIndex:7 }}/>

        <div style={{ display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:26, alignItems:'stretch' }}>
          {/* Featured folder */}
          <div style={{ position:'relative' }}>
            <span className="pa-tab thai">★ บทความเด่น</span>
            <article className="pa-sheet" style={{ overflow:'hidden', display:'flex', flexDirection:'column', height:'calc(100% - 8px)' }}>
              <PAClip style={{ top:-15, right:34, transform:'rotate(8deg)', zIndex:8 }}/>
              <div style={{ position:'relative', margin:14, marginBottom:0, borderRadius:14, overflow:'hidden' }}>
                <PAArt tone={featured.tone} size="100%"/>
                <span className="thai" style={{ position:'absolute', top:14, right:14, padding:'6px 12px', borderRadius:100, background:'rgba(255,255,255,.92)', backdropFilter:'blur(8px)', fontSize:11, fontWeight:800, color:'var(--w-ink-2)' }}>⏱ {featured.minutes} นาที</span>
              </div>
              <div style={{ padding:'22px 26px 24px', flex:1, display:'flex', flexDirection:'column' }}>
                <div className="thai" style={{ fontSize:12, fontWeight:800, color:featured.hue, marginBottom:9, textTransform:'uppercase', letterSpacing:'.08em' }}>{featured.cat}</div>
                <h3 className="thai" style={{ fontSize:26, fontWeight:800, lineHeight:1.22, margin:'0 0 12px', color:'var(--w-ink)', letterSpacing:'-0.018em' }}>{featured.title}</h3>
                <p className="thai" style={{ fontSize:15, lineHeight:1.6, color:'var(--w-ink-2)', margin:0, flex:1 }}>{featured.excerpt}</p>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20, paddingTop:18, borderTop:'1px solid var(--w-rule)' }}>
                  <PASticker face={fmood.face} color={featured.hue} size={42} style={{ flexShrink:0, transform:'rotate(-6deg)' }}/>
                  <div style={{ flex:1 }}>
                    <div className="thai" style={{ fontSize:13, fontWeight:800, color:'var(--w-ink)' }}>{featured.author}</div>
                    <div className="thai" style={{ fontSize:12, color:'var(--w-ink-3)' }}>{featured.role} · {featured.date}</div>
                  </div>
                  <button className="pa-btn ink thai">อ่านต่อ →</button>
                </div>
              </div>
            </article>
          </div>

          {/* side stack */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {rest.map((a,i)=>{
              const m = PA_MOODS.find(x=>x.id===a.mood) || PA_MOODS[0];
              const tape = ['mint','lav','yellow'][i%3];
              return (
                <article key={a.id} className="pa-sheet" style={{ overflow:'hidden', display:'grid', gridTemplateColumns:'132px 1fr', borderRadius:'4px 14px 14px 14px', transform:`rotate(${i%2?0.5:-0.5}deg)` }}>
                  <span className={`pa-washi ${tape}`} style={{ left:90, width:80 }}/>
                  <div style={{ position:'relative', overflow:'hidden' }}>
                    <PAArt tone={a.tone} size="100%"/>
                    <PASticker face={m.face} color={a.hue} size={34} style={{ position:'absolute', bottom:8, left:8, border:'3px solid #fff', transform:'rotate(-8deg)' }}/>
                  </div>
                  <div style={{ padding:'15px 17px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                    <div>
                      <div className="thai" style={{ fontSize:10, fontWeight:800, color:a.hue, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>{a.cat}</div>
                      <h4 className="thai" style={{ fontSize:15, fontWeight:800, lineHeight:1.3, margin:0, color:'var(--w-ink)' }}>{a.title}</h4>
                    </div>
                    <div className="thai" style={{ fontSize:11, color:'var(--w-ink-3)', marginTop:10, display:'flex', alignItems:'center', gap:8, fontWeight:600 }}>
                      <span>{a.date}</span><span style={{ width:3, height:3, borderRadius:50, background:'var(--w-ink-3)' }}/><span>⏱ {a.minutes} นาที</span>
                    </div>
                  </div>
                </article>
              );
            })}
            <a href="#" className="thai" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'15px', borderRadius:13, background:'transparent', border:'2px dashed var(--w-rule-strong)', color:'var(--w-ink-2)', textDecoration:'none', fontWeight:800, fontSize:14 }}>
              ดูบทความทั้งหมด <span style={{ color:'var(--w-ink-3)' }}>(42)</span> →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============= PAPER · Mood-card row ============= */
function ArticlesPaperRow() {
  const four = PA_ARTICLES.slice(0, 4);
  return (
    <section className="pa-wrap" style={{ padding:'54px 0 58px' }}>
      <PaperStyle/>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 32px', position:'relative' }}>
        {/* header */}
        <div style={{ textAlign:'center', marginBottom:30 }}>
          <span className="pa-chip thai" style={{ marginBottom:14 }}><span style={{ color:'var(--peach)' }}>●</span> เลือกอ่านตามอารมณ์วันนี้</span>
          <h2 className="thai" style={{ fontSize:38, fontWeight:800, margin:'14px auto 0', letterSpacing:'-0.022em', lineHeight:1.12, maxWidth:680, color:'var(--w-ink)' }}>
            ใจไหนก็มี <PAMark color="var(--lavender)">บทความ</PAMark> ให้คุณ
          </h2>
        </div>

        {/* mood filter chips */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:34 }}>
          {PA_MOODS.slice(0,5).map((m,i)=>(
            <button key={m.id} className="thai" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px 6px 6px', borderRadius:100,
              background:'#fff', border:'none', boxShadow:i===0?'0 6px 0 -2px '+m.color+', 0 12px 20px -10px rgba(60,40,20,.4)':'0 5px 14px -8px rgba(60,40,20,.35)',
              fontFamily:'inherit', fontWeight:800, fontSize:13, color:'var(--w-ink)', cursor:'pointer' }}>
              <span style={{ width:28, height:28, borderRadius:50, background:m.color, display:'grid', placeItems:'center' }}><PAFace face={m.face} size={21} bg="transparent"/></span>
              {m.th}
            </button>
          ))}
        </div>

        {/* 4 folder cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {four.map((a,i)=>{
            const m = PA_MOODS.find(x=>x.id===a.mood) || PA_MOODS[0];
            const tabClass = ['','mint','lav','yellow'][i];
            return (
              <div key={a.id} style={{ position:'relative' }}>
                <span className={`pa-tab thai ${tabClass}`} style={{ fontSize:12, padding:'8px 16px 10px' }}>{a.tag}</span>
                <article className="pa-sheet pa-card-lift" style={{ overflow:'hidden', display:'flex', flexDirection:'column', height:'calc(100% - 8px)', transform:`rotate(${i%2?0.6:-0.6}deg)` }}>
                  <div style={{ position:'relative', margin:12, marginBottom:0, borderRadius:12, overflow:'hidden' }}>
                    <PAArt tone={a.tone} size="100%"/>
                    <PASticker face={m.face} color={a.hue} size={40} style={{ position:'absolute', bottom:-6, right:10, transform:'rotate(-8deg)' }}/>
                  </div>
                  <div style={{ padding:'16px 18px 18px', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                    <div className="thai" style={{ fontSize:11, fontWeight:800, color:a.hue, textTransform:'uppercase', letterSpacing:'.06em' }}>{a.cat}</div>
                    <h3 className="thai" style={{ fontSize:16, fontWeight:800, lineHeight:1.3, margin:0, color:'var(--w-ink)' }}>{a.title}</h3>
                    <p className="thai" style={{ fontSize:13, color:'var(--w-ink-2)', lineHeight:1.5, margin:0, flex:1 }}>{a.excerpt}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'1px dashed var(--w-rule)' }}>
                      <span className="thai" style={{ fontSize:11, color:'var(--w-ink-3)', fontWeight:700 }}>⏱ {a.minutes} นาที</span>
                      <span className="thai" style={{ fontSize:13, fontWeight:800, color:a.hue }}>อ่านต่อ →</span>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        <div style={{ display:'flex', justifyContent:'center', marginTop:34 }}>
          <button className="pa-btn thai">ดูทั้ง 42 บทความ →</button>
        </div>
      </div>
    </section>
  );
}

/* ============= PAPER · Article detail — Mood-integrated reader (product-native) ============= */
const { Icon: PAIcon, SAMPLE: PA_SAMPLE, HeroArt: PAHero } = window;

function ArticleDetailPaperV2() {
  const a = PA_SAMPLE;
  const fmood = PA_MOODS.find(m => m.id === a.mood) || PA_MOODS[0];
  const [pre, post] = a.title.split('ดูแลสุขภาพใจ');
  const pill = { display:'inline-flex', alignItems:'center', gap:6, height:38, padding:'0 15px', borderRadius:11,
    background:'#fff', border:'none', boxShadow:'0 5px 14px -8px rgba(60,40,20,.4)', fontFamily:'inherit',
    fontWeight:800, fontSize:13, color:'var(--w-ink-2)', cursor:'pointer' };
  return (
    <PAFrame active="today" noFooter>
      <section className="pa-wrap" style={{ minHeight:'100%', padding:'8px 0 56px' }}>
        <PaperStyle/>
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 32px', position:'relative' }}>
          {/* top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0 22px' }}>
            <a href="#" className="thai" style={{ color:'var(--w-ink-2)', textDecoration:'none', fontSize:14, fontWeight:800, display:'inline-flex', alignItems:'center', gap:6 }}>← คลังบทความ</a>
            <div style={{ display:'flex', gap:10 }}>
              <button className="thai" style={pill}><PAIcon name="heart" size={14} stroke="var(--w-ink-2)"/> บันทึก ({a.saves})</button>
              <button className="thai" style={pill}><PAIcon name="share" size={14} stroke="var(--w-ink-2)"/> แชร์</button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:34, alignItems:'flex-start' }}>
            {/* MAIN */}
            <article style={{ position:'relative' }}>
              {/* title */}
              <header style={{ marginBottom:22 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                  <span className="pa-chip thai">{a.cat}</span>
                  <span className="thai" style={{ fontSize:12, color:'var(--w-ink-3)', fontWeight:700 }}>{a.date} · ⏱ {a.minutes} นาที · 👁 {a.views} อ่านแล้ว</span>
                </div>
                <h1 className="thai" style={{ fontSize:44, fontWeight:800, letterSpacing:'-0.025em', lineHeight:1.14, margin:'0 0 14px', color:'var(--w-ink)' }}>
                  {pre}<PAMark>ดูแลสุขภาพใจ</PAMark>{post}
                </h1>
                <p className="thai" style={{ fontSize:18, lineHeight:1.5, color:'var(--w-ink-2)', margin:0, fontWeight:500 }}>{a.subtitle}</p>
              </header>

              {/* hero folder */}
              <div style={{ position:'relative', marginBottom:34 }}>
                <span className="pa-tab thai">★ บทความเด่น</span>
                <div className="pa-sheet" style={{ overflow:'hidden', borderRadius:'4px 18px 18px 18px' }}>
                  <PAClip style={{ top:-15, right:42, transform:'rotate(8deg)', zIndex:8 }}/>
                  <div style={{ margin:14, borderRadius:14, overflow:'hidden' }}><PAHero height={280}/></div>
                </div>
                <PASticker face={fmood.face} color={a.hue} size={58} style={{ position:'absolute', bottom:-16, left:-14, transform:'rotate(-10deg)', zIndex:9 }}/>
              </div>

              {/* intro */}
              <p className="thai" style={{ fontSize:18, lineHeight:1.75, color:'var(--w-ink)', margin:'0 0 26px' }}>{a.intro}</p>

              {/* tips as paper cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:22, marginBottom:32 }}>
                {a.tips.map((t,i)=>{
                  const tape = ['mint','lav','yellow'][i%3];
                  return (
                    <div key={t.n} className="pa-sheet" style={{ borderRadius:'4px 16px 16px 16px', padding:'24px 28px 24px 26px', display:'grid', gridTemplateColumns:'60px 1fr', gap:22, alignItems:'flex-start', transform:`rotate(${i%2?0.4:-0.4}deg)`, position:'relative' }}>
                      <span className={`pa-washi ${tape}`} style={{ left:44, width:72 }}/>
                      <div style={{ position:'relative' }}>
                        <div style={{ width:56, height:56, borderRadius:14, background:a.bgHue, display:'grid', placeItems:'center' }}>
                          <span className="thai" style={{ fontSize:28, fontWeight:800, color:a.hue, lineHeight:1 }}>{t.n}</span>
                        </div>
                        <span style={{ position:'absolute', bottom:-8, right:-8, fontSize:17, width:30, height:30, borderRadius:50, background:'#fff', display:'grid', placeItems:'center', boxShadow:'0 4px 10px -3px rgba(0,0,0,.28)' }}>{t.emoji}</span>
                      </div>
                      <div>
                        <h2 className="thai" style={{ fontSize:21, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.015em', lineHeight:1.25 }}>{t.title}</h2>
                        <div className="thai" style={{ fontSize:11, fontWeight:800, color:'var(--w-ink-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>{t.sub}</div>
                        <p className="thai" style={{ fontSize:15, lineHeight:1.7, color:'var(--w-ink-2)', margin:0 }}>{t.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* outro — dark plum folder */}
              <div style={{ position:'relative', marginBottom:32 }}>
                <span className="pa-tab thai ink">คีย์สำคัญ · จดบันทึก</span>
                <div className="pa-sheet" style={{ borderRadius:'4px 18px 18px 18px', background:'linear-gradient(155deg,#2A1F33,#1A1320)', color:'#fff', padding:'30px 32px', overflow:'hidden', position:'relative' }}>
                  <div style={{ position:'absolute', top:-40, right:-40, width:170, height:170, borderRadius:50, background:`radial-gradient(circle, ${a.hue}, transparent 70%)`, opacity:.4 }}/>
                  <PASticker face="great" color="#fff" size={46} style={{ position:'absolute', top:20, right:26, transform:'rotate(10deg)' }}/>
                  <div style={{ position:'relative', maxWidth:'82%' }}>
                    <p className="thai" style={{ fontSize:18, lineHeight:1.65, margin:'0 0 20px' }}>{a.outro}</p>
                    <button className="pa-btn thai">เริ่มบันทึก mood แรกของวันนี้ →</button>
                  </div>
                </div>
              </div>

              {/* reading reaction — paper card with clip + sticker buttons */}
              <div className="pa-sheet" style={{ borderRadius:16, background:'#fff', padding:'24px 26px', marginBottom:28, position:'relative' }}>
                <PAClip style={{ top:-15, left:30, transform:'rotate(-8deg)' }}/>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
                  <div>
                    <div className="thai" style={{ fontSize:16, fontWeight:800, marginBottom:3 }}>อ่านจบแล้วรู้สึกยังไงบ้าง?</div>
                    <div className="thai" style={{ fontSize:12, color:'var(--w-ink-2)' }}>บันทึกอารมณ์ตอนนี้ — AI จะรู้ว่าคอนเทนต์แบบไหนช่วยคุณได้</div>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    {PA_MOODS.slice(0,5).map((m,i)=>(
                      <button key={m.id} title={m.th} style={{ border:'none', background:'transparent', cursor:'pointer', padding:0, transform:i===1?'scale(1.12) rotate(-6deg)':'none', transition:'transform .15s ease' }}>
                        <PASticker face={m.face} color={i===1?m.color:'#fff'} size={46} style={{ boxShadow:i===1?`0 10px 20px -6px ${m.color}`:'0 6px 14px -7px rgba(0,0,0,.3)' }}/>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* tags */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                {a.tags.map(t=>(<a key={t} href="#" className="thai" style={{ padding:'6px 12px', borderRadius:100, background:'#fff', boxShadow:'0 5px 14px -9px rgba(60,40,20,.5)', fontSize:13, fontWeight:700, color:'var(--w-ink-2)', textDecoration:'none' }}>#{t}</a>))}
              </div>
            </article>

            {/* SIDEBAR */}
            <aside style={{ position:'sticky', top:20, display:'flex', flexDirection:'column', gap:18 }}>
              {/* TOC folder */}
              <div style={{ position:'relative' }}>
                <span className="pa-tab thai ink" style={{ fontSize:12, padding:'8px 16px 10px' }}>สารบัญ</span>
                <div className="pa-sheet" style={{ borderRadius:'4px 14px 14px 14px', padding:'16px 18px' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {a.tips.map((t,i)=>(
                      <a key={t.n} href="#" className="thai" style={{ textDecoration:'none', display:'flex', gap:10, padding:'8px 10px', borderRadius:9,
                        background:i===0?a.bgHue:'transparent', color:i===0?'var(--w-ink)':'var(--w-ink-2)', fontSize:13, fontWeight:i===0?800:600 }}>
                        <span style={{ color:i===0?a.hue:'var(--w-ink-3)', fontWeight:800, minWidth:18 }}>{t.n}.</span>
                        <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</span>
                      </a>
                    ))}
                  </div>
                  <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--w-rule)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:800, color:'var(--w-ink-3)', marginBottom:6 }}><span className="thai">ความคืบหน้า</span><span>42%</span></div>
                    <div style={{ height:6, borderRadius:100, background:'var(--w-rule)' }}><div style={{ width:'42%', height:'100%', borderRadius:100, background:a.hue }}/></div>
                  </div>
                </div>
              </div>

              {/* save to journal — washi-taped card */}
              <div className="pa-sheet" style={{ borderRadius:16, padding:'20px 20px 18px', background:'#fff', position:'relative' }}>
                <span className="pa-washi yellow" style={{ width:92 }}/>
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'8px 0 8px' }}>
                  <PAIcon name="sparkle" size={18} stroke={a.hue} sw={2.2}/>
                  <span className="thai" style={{ fontSize:13, fontWeight:800, color:'var(--w-ink)' }}>เก็บเป็น journal prompt</span>
                </div>
                <p className="thai" style={{ fontSize:12, color:'var(--w-ink-2)', lineHeight:1.55, margin:'0 0 12px' }}>บันทึกบทความนี้เป็น prompt ในไดอารี่ของคุณ AI จะใช้เป็น context</p>
                <button className="pa-btn ink thai" style={{ width:'100%', height:40, fontSize:13 }}>+ เพิ่มเข้า journal</button>
              </div>

              {/* related folder */}
              <div style={{ position:'relative' }}>
                <span className="pa-tab thai mint" style={{ fontSize:12, padding:'8px 16px 10px' }}>อ่านต่อ</span>
                <div className="pa-sheet" style={{ borderRadius:'4px 14px 14px 14px', padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>
                  {a.related.map((r,i)=>(
                    <a key={i} href="#" style={{ textDecoration:'none', color:'inherit' }}>
                      <div className="thai" style={{ fontSize:10, fontWeight:800, color:r.hue, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{r.cat}</div>
                      <div className="thai" style={{ fontSize:13, fontWeight:800, lineHeight:1.3, color:'var(--w-ink)' }}>{r.title}</div>
                      <div className="thai" style={{ fontSize:11, color:'var(--w-ink-3)', marginTop:3 }}>⏱ {r.min} นาที</div>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PAFrame>
  );
}

/* ============= PAPER · Today / Dashboard (มีข้อมูล) — adapted to the live site ============= */
const PALogo = window.DMLogo;

// Mood set matching the real product (order + labels)
const RM = [
  { th:'มีความสุข', face:'great', color:'var(--peach)' },
  { th:'สงบ',       face:'calm',  color:'#B9D6F2' },
  { th:'เฉยๆ',      face:'okay',  color:'var(--mint)' },
  { th:'เศร้า',     face:'bad',   color:'var(--blue)' },
  { th:'โกรธ',      face:'awful', color:'var(--purple)' },
  { th:'กังวล',     face:'meh',   color:'var(--lavender)' },
  { th:'เหนื่อย',   face:'meh',   color:'var(--yellow)' },
];

const ACTIVITIES = [
  ['💼','ทำงาน'], ['🏃','ออกกำลังกาย'], ['👫','เจอเพื่อน'], ['👨‍👩‍👧','ครอบครัว'],
  ['🍽️','กินข้าวนอกบ้าน'], ['🎮','เล่นเกม'], ['📚','อ่านหนังสือ'], ['🌿','พักผ่อน'],
];

const TODAY_ENTRIES = [
  { mood: 0, time: '7:24', tab: 'เช้า', tags: ['ออกกำลังกาย', 'เช้า'], img: false,
    note: 'ตื่นมาด้วยอารมณ์ดี ออกไปวิ่งเล่นในสวน อากาศกำลังดี เห็นแมวข้างทางด้วย 🐱' },
  { mood: 2, time: '12:40', tab: 'บ่าย', tags: ['งาน', 'กาแฟ'], img: true,
    note: 'มีติวงาน 2 ชม. ที่ Café Amazon — กาแฟดีมาก แต่เริ่มล้าตอนท้าย' },
  { mood: 1, time: '18:12', tab: 'เย็น', tags: ['พักผ่อน', 'อาหาร'], img: false,
    note: 'กลับบ้านดูซีรีส์ กินซูชิที่สั่งมา รู้สึก reset ตัวเองได้ดีขึ้น' },
];

function TodayPromoBar() {
  return (
    <div className="thai" style={{ background:'linear-gradient(90deg, var(--peach) 0%, #FBA0A0 45%, var(--purple) 100%)', color:'#fff', minHeight:46, display:'flex', alignItems:'center', justifyContent:'center', gap:16, fontSize:14, fontWeight:700, padding:'8px 16px' }}>
      <span>✨ ลองใช้ Pro ฟรี 14 วัน — ไม่ต้องใช้บัตร</span>
      <button className="thai" style={{ background:'rgba(255,255,255,.92)', color:'var(--w-ink)', border:'none', borderRadius:100, padding:'6px 15px', fontFamily:'inherit', fontWeight:800, fontSize:13, cursor:'pointer' }}>เริ่มเลย →</button>
    </div>
  );
}

function TodayTopbar() {
  const nav = ['หน้าหลัก','ปฏิทิน','สถิติ','AI','บทความ'];
  return (
    <header style={{ background:'#fff', borderBottom:'1px solid var(--w-rule)' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 32px', height:72, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          <a href="#" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none', color:'var(--w-ink)' }}>
            {PALogo ? <PALogo size={28}/> : null}
            <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-0.01em' }}>Daily <span style={{ color:'var(--peach)' }}>Mood</span></span>
          </a>
          <nav style={{ display:'flex', gap:2 }}>
            {nav.map((n,i)=>(
              <a key={n} href="#" className="thai" style={{ textDecoration:'none', padding:'8px 14px', borderRadius:10, fontSize:14, fontWeight:i===0?800:600,
                color:i===0?'var(--w-ink)':'var(--w-ink-3)', background:i===0?'var(--w-tint)':'transparent' }}>{n}</a>
            ))}
          </nav>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="pa-btn thai" style={{ height:40, padding:'0 18px', boxShadow:'0 6px 0 -2px #d97f3b, 0 12px 20px -12px rgba(217,127,59,.7)' }}>+ บันทึก</button>
          <button aria-label="โหมดมืด" style={{ width:40, height:40, borderRadius:50, border:'1px solid var(--w-rule)', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🌙</button>
          <button className="thai" style={{ display:'flex', alignItems:'center', gap:6, height:40, padding:'0 13px', borderRadius:100, border:'1px solid var(--w-rule)', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:13, color:'var(--w-ink-2)' }}>🌐 EN</button>
          <div style={{ width:38, height:38, borderRadius:50, background:'linear-gradient(135deg, var(--peach), var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>TS</div>
        </div>
      </div>
    </header>
  );
}

function TodayPaper() {
  const iconBtn = { width:42, height:42, borderRadius:12, border:'1px solid var(--w-rule)', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' };
  return (
    <div className="webapp w-screen" style={{ width:1280, minHeight:800, display:'flex', flexDirection:'column' }}>
      <PaperStyle/>
      <TodayPromoBar/>
      <TodayTopbar/>
      <main style={{ flex:1 }}>
        <section className="pa-wrap" style={{ minHeight:'100%', padding:'28px 0 56px' }}>
          <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 32px', position:'relative' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:30, alignItems:'flex-start' }}>

              {/* ===== MAIN COLUMN ===== */}
              <div>
                {/* greeting folder + mood picker */}
                <div style={{ position:'relative', marginBottom:30 }}>
                  <span className="pa-tab thai">วันศุกร์ที่ 5 มิ.ย.</span>
                  <div className="pa-sheet" style={{ borderRadius:'4px 18px 18px 18px', padding:'28px 32px 30px', position:'relative', overflow:'hidden' }}>
                    <PAClip style={{ top:-15, right:40, transform:'rotate(7deg)', zIndex:8 }}/>
                    <div style={{ position:'absolute', top:-50, right:-40, width:180, height:180, borderRadius:50, background:'radial-gradient(circle, var(--lavender), transparent 70%)', opacity:.45 }}/>
                    <div style={{ position:'relative' }}>
                      <div className="thai" style={{ fontSize:13, fontWeight:800, color:'var(--purple-strong)', marginBottom:6 }}>สวัสดีตอนเช้า ☀️</div>
                      <h1 className="thai" style={{ fontSize:32, fontWeight:800, margin:'0 0 22px', letterSpacing:'-0.022em', lineHeight:1.12, color:'var(--w-ink)' }}>
                        วันนี้คุณรู้สึก <PAMark>ยังไง</PAMark>?
                      </h1>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        {RM.map((m,i)=>(
                          <button key={m.th} title={m.th} style={{ border:'none', background:'transparent', cursor:'pointer', padding:0,
                            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                            transform:i===0?'scale(1.06) rotate(-5deg)':'none', transition:'transform .15s ease' }}>
                            <PASticker face={m.face} color={i===0?m.color:'#fff'} size={52}
                              style={{ boxShadow:i===0?`0 12px 24px -6px ${m.color}`:'0 6px 14px -7px rgba(60,40,20,.32)' }}/>
                            <span className="thai" style={{ fontSize:11, fontWeight:i===0?800:600, color:i===0?'var(--w-ink)':'var(--w-ink-3)' }}>{m.th}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <PASticker face="great" color="var(--peach)" size={48} style={{ position:'absolute', bottom:-14, left:-14, transform:'rotate(-12deg)', zIndex:9 }}/>
                </div>

                {/* AI MOOD ASSISTANT — the centerpiece */}
                <div className="pa-sheet" style={{ borderRadius:16, padding:'22px 24px 22px', position:'relative', overflow:'hidden', marginBottom:30 }}>
                  <div style={{ position:'absolute', top:-44, right:-30, width:160, height:160, borderRadius:50, background:'radial-gradient(circle, var(--lavender), transparent 70%)', opacity:.55 }}/>
                  <div style={{ position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg, var(--purple), #C9A6F5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <PAIcon name="sparkle" size={18} stroke="#fff" sw={2.2}/>
                      </div>
                      <span className="thai" style={{ fontSize:13, fontWeight:800, color:'var(--purple-strong)', textTransform:'uppercase', letterSpacing:'.08em' }}>AI Mood Assistant</span>
                    </div>

                    {/* note input */}
                    <div className="thai" style={{ minHeight:96, borderRadius:12, border:'1.5px solid var(--w-rule)', background:'#FBF7F0', padding:'14px 16px', color:'var(--w-ink-3)', fontSize:15, lineHeight:1.6 }}>
                      วันนี้เป็นยังไงบ้าง...
                    </div>

                    {/* activity chips */}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
                      {ACTIVITIES.map(([emoji,label])=>(
                        <span key={label} className="thai" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:100, border:'1px solid var(--w-rule)', background:'#fff', fontSize:13, fontWeight:700, color:'var(--w-ink-2)', cursor:'pointer' }}>
                          <span style={{ fontSize:14 }}>{emoji}</span>{label}
                        </span>
                      ))}
                    </div>

                    {/* controls */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16 }}>
                      <button title="พูด" style={iconBtn}><PAIcon name="mic" size={18} stroke="var(--w-ink-2)"/></button>
                      <button title="แนบรูป (Pro)" style={iconBtn}>
                        <PAIcon name="img" size={18} stroke="var(--w-ink-2)"/>
                        <span style={{ position:'absolute', top:-7, right:-7, background:'var(--w-ink)', color:'#fff', fontSize:8, fontWeight:800, padding:'2px 5px', borderRadius:100, letterSpacing:'.04em' }}>PRO</span>
                      </button>
                      <button title="สถานที่" style={iconBtn}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--w-ink-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                      </button>
                      <button className="pa-btn thai" style={{ marginLeft:'auto', background:'linear-gradient(135deg, var(--purple), #B98BF0)', boxShadow:'0 6px 0 -2px #6F3FB8, 0 14px 22px -12px rgba(166,115,241,.7)' }}>
                        วิเคราะห์ <PAIcon name="sparkle" size={14} stroke="#fff" sw={2.2}/>
                      </button>
                    </div>

                    <div className="thai" style={{ fontSize:12, color:'var(--w-ink-3)', marginTop:14 }}>เป็นแค่มุมมองจาก AI ไว้ประกอบการตัดสินใจ</div>

                    {/* PRO usage banner */}
                    <div className="thai" style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background:'linear-gradient(135deg, #F1E7FA, #F8EDEB)', display:'flex', alignItems:'center', gap:10, fontSize:13, fontWeight:600, color:'var(--w-ink-2)' }}>
                      <span style={{ background:'var(--w-ink)', color:'#fff', fontSize:9, fontWeight:800, padding:'3px 7px', borderRadius:100, letterSpacing:'.04em' }}>PRO</span>
                      <span>ใช้ AI ได้ <b>3 ครั้ง/วัน</b> — <a href="#" style={{ color:'var(--purple-strong)', fontWeight:800, textDecoration:'none' }}>อัปเกรด Pro</a> เพื่อใช้ได้ไม่จำกัด</span>
                    </div>
                  </div>
                </div>

                {/* section header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                  <h2 className="thai" style={{ fontSize:24, fontWeight:800, margin:0, letterSpacing:'-0.02em' }}>วันนี้</h2>
                  <span className="pa-chip thai" style={{ fontSize:12 }}>📌 3 entries · กิจกรรม</span>
                </div>

                {/* timeline sheet */}
                <div className="pa-sheet" style={{ borderRadius:16, padding:'20px 26px 24px', marginBottom:26, position:'relative' }}>
                  <span className="pa-washi yellow" style={{ width:92, left:34, transform:'translateX(0) rotate(-3deg)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--w-ink-3)', fontWeight:800, marginBottom:10, marginTop:6 }}>
                    {['6:00','9:00','12:00','15:00','18:00','21:00'].map(t=><span key={t}>{t}</span>)}
                  </div>
                  <div style={{ height:5, background:'var(--w-tint)', borderRadius:100, position:'relative' }}>
                    {[{ p:11, c:RM[0].color }, { p:40, c:RM[2].color }, { p:70, c:RM[1].color }].map((d,i)=>(
                      <div key={i} style={{ position:'absolute', left:`${d.p}%`, top:-7, width:18, height:18, borderRadius:50, background:d.c, border:'3px solid #fff', boxShadow:'0 3px 8px rgba(60,40,20,.25)' }}/>
                    ))}
                    <div className="thai" style={{ position:'absolute', right:0, top:-30, padding:'3px 11px', borderRadius:100, background:'var(--purple)', color:'#fff', fontSize:10, fontWeight:800 }}>
                      <span style={{ display:'inline-block', width:6, height:6, borderRadius:50, background:'#fff', marginRight:5 }}/>ตอนนี้
                    </div>
                  </div>
                </div>

                {/* entry folder cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
                  {TODAY_ENTRIES.map((e,i)=>{
                    const m = RM[e.mood];
                    return (
                      <div key={i} style={{ position:'relative' }}>
                        <span className={`pa-tab thai ${['','mint','lav'][i]}`} style={{ fontSize:12, padding:'8px 15px 10px' }}>{e.tab}</span>
                        <article className="pa-sheet pa-card-lift" style={{ overflow:'hidden', display:'flex', flexDirection:'column', height:'100%', transform:`rotate(${i%2?0.6:-0.6}deg)`, padding:'16px 16px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <PASticker face={m.face} color={m.color} size={40} style={{ transform:'rotate(-6deg)', flexShrink:0 }}/>
                              <div>
                                <div className="thai" style={{ fontSize:13, fontWeight:800, color:'var(--w-ink)' }}>{m.th}</div>
                                <div style={{ fontSize:11, color:'var(--w-ink-3)', fontWeight:700 }}>{e.time}</div>
                              </div>
                            </div>
                            <button style={{ background:'transparent', border:'none', color:'var(--w-ink-3)', cursor:'pointer', padding:0 }}><PAIcon name="dots"/></button>
                          </div>
                          {e.img && (
                            <div style={{ height:78, borderRadius:10, marginBottom:12, overflow:'hidden', position:'relative' }}>
                              <PAArt tone="mint" size="100%"/>
                            </div>
                          )}
                          <p className="thai" style={{ fontSize:13, color:'var(--w-ink-2)', margin:'0 0 12px', lineHeight:1.55, flex:1 }}>{e.note}</p>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {e.tags.map(t=>(
                              <span key={t} className="thai" style={{ padding:'4px 10px', borderRadius:100, background:'var(--w-tint)', color:'var(--w-ink-2)', fontSize:11, fontWeight:700 }}>#{t}</span>
                            ))}
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ===== RIGHT RAIL ===== */}
              <aside style={{ display:'flex', flexDirection:'column', gap:22 }}>
                {/* AI weekly — dark plum folder, PRO-gated (matches live) */}
                <div style={{ position:'relative' }}>
                  <span className="pa-tab thai ink" style={{ fontSize:12, padding:'8px 16px 10px' }}>✦ AI · สัปดาห์นี้</span>
                  <div className="pa-sheet" style={{ borderRadius:'4px 16px 16px 16px', background:'linear-gradient(155deg,#2A1F33,#1A1320)', color:'#fff', padding:'22px 22px 24px', overflow:'hidden', position:'relative' }}>
                    <div style={{ position:'absolute', top:-36, right:-36, width:150, height:150, borderRadius:50, background:'radial-gradient(circle, var(--peach), transparent 70%)', opacity:.4 }}/>
                    <span style={{ position:'absolute', top:18, right:20, background:'rgba(255,255,255,.16)', color:'#fff', fontSize:10, fontWeight:800, padding:'4px 9px', borderRadius:100, letterSpacing:'.04em' }}>PRO</span>
                    <div style={{ position:'relative', maxWidth:'88%' }}>
                      <div className="thai" style={{ fontSize:15, lineHeight:1.6, color:'rgba(255,255,255,.92)' }}>
                        AI สรุปอารมณ์ประจำสัปดาห์ วิเคราะห์ pattern และแนะนำสิ่งที่ช่วยให้ดีขึ้น
                      </div>
                    </div>
                    <button className="thai" style={{ position:'relative', marginTop:18, background:'#fff', color:'var(--w-ink)', border:'none', padding:'10px 18px', borderRadius:11, fontFamily:'inherit', fontWeight:800, fontSize:13, cursor:'pointer', boxShadow:'0 5px 0 -1px rgba(255,255,255,.35)' }}>อัปเกรด Pro →</button>
                  </div>
                </div>

                {/* streak — washi-taped paper */}
                <div className="pa-sheet" style={{ borderRadius:16, padding:'22px 22px 20px', position:'relative' }}>
                  <span className="pa-washi" style={{ width:96 }}/>
                  <div className="thai" style={{ fontSize:11, fontWeight:800, color:'var(--w-ink-3)', textTransform:'uppercase', letterSpacing:'.08em', margin:'6px 0 10px' }}>STREAK</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:16 }}>
                    <span style={{ fontSize:46, fontWeight:800, letterSpacing:'-0.03em', lineHeight:1 }}>5</span>
                    <span className="thai" style={{ color:'var(--w-ink-3)', fontSize:14, fontWeight:700 }}>วันติดต่อกัน</span>
                    <span style={{ marginLeft:'auto', fontSize:30 }}>🔥</span>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    {Array.from({ length:14 }).map((_,i)=>(
                      <div key={i} style={{ flex:1, height:26, borderRadius:5, background:i<5?'var(--peach)':'var(--w-tint)' }}/>
                    ))}
                  </div>
                </div>

                {/* mini calendar folder — มิถุนายน 2569 */}
                <div style={{ position:'relative' }}>
                  <span className="pa-tab thai mint" style={{ fontSize:12, padding:'8px 16px 10px' }}>มิถุนายน 2569</span>
                  <div className="pa-sheet" style={{ borderRadius:'4px 16px 16px 16px', padding:'18px 20px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', marginBottom:12 }}>
                      <a href="#" className="thai" style={{ fontSize:12, color:'var(--purple-strong)', textDecoration:'none', fontWeight:800 }}>ดูทั้งหมด →</a>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:8 }}>
                      {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d=><div key={d} className="thai" style={{ fontSize:10, fontWeight:800, color:'var(--w-ink-3)', textAlign:'center' }}>{d}</div>)}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6 }}>
                      {Array.from({ length:35 }).map((_,i)=>{
                        const d = i; // June 1 2569 = Monday → 1 leading empty cell (Sun)
                        if (d < 1 || d > 30) return <div key={i}/>;
                        const marks = { 1:'var(--lavender)', 2:'var(--peach)', 3:'var(--lavender)', 4:'var(--peach)' };
                        const today = d === 5;
                        const filled = !!marks[d];
                        return (
                          <div key={i} style={{ aspectRatio:'1', borderRadius:8, background:today?'#fff':(filled?marks[d]:'var(--w-tint)'),
                            border:today?'2.5px solid var(--purple)':'none', display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:12, fontWeight:800, color:filled&&!today?'#fff':'var(--w-ink-2)' }}>{d}</div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============= PAPER · "บันทึกด้วย AI" modal (Smart Log) ============= */
function SmartLogPaper() {
  const selected = 2; // เฉยๆ
  const iconBtn = { width:42, height:42, borderRadius:12, border:'1px solid var(--w-rule)', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 };
  return (
    <div className="webapp" style={{ width:1280, height:920, position:'relative', overflow:'hidden', fontFamily:"'Urbanist', system-ui, sans-serif" }}>
      <PaperStyle/>
      {/* faux app bg + dim */}
      <div className="pa-wrap" style={{ position:'absolute', inset:0 }}/>
      <div style={{ position:'absolute', inset:0, background:'rgba(26,19,32,.46)', backdropFilter:'blur(6px)' }}/>

      {/* modal sheet */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:728, background:'#fff', borderRadius:'8px 26px 26px 26px', boxShadow:'0 44px 100px -24px rgba(40,20,10,.6)', overflow:'hidden' }}>
        <span className="pa-washi lav" style={{ width:128, top:-13 }}/>

        {/* header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg, var(--purple), #C9A6F5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <PAIcon name="sparkle" size={18} stroke="#fff" sw={2.2}/>
            </div>
            <span className="thai" style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.01em' }}>บันทึกด้วย AI</span>
          </div>
          <button aria-label="ปิด" style={{ width:36, height:36, borderRadius:50, background:'var(--w-tint)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <PAIcon name="x" size={16} stroke="var(--w-ink-2)"/>
          </button>
        </div>

        <div style={{ padding:'18px 28px 26px' }}>
          {/* date */}
          <div className="thai" style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:700, color:'var(--w-ink-2)', marginBottom:18 }}>
            <PAIcon name="cal" size={16} stroke="var(--w-ink-3)"/> วันศุกร์ที่ 5 มิถุนายน 2569
          </div>

          {/* moods */}
          <div className="thai" style={{ fontSize:12, fontWeight:800, color:'var(--w-ink-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:11 }}>อารมณ์ของคุณ</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:9, marginBottom:22 }}>
            {RM.map((m,i)=>{
              const on = i===selected;
              return (
                <button key={m.th} title={m.th} className="thai" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:7, padding:'11px 4px 9px', borderRadius:14,
                  background:'#fff', border:on?'2px solid var(--w-ink)':'1px solid var(--w-rule)', cursor:'pointer', fontFamily:'inherit',
                  boxShadow:on?'0 9px 20px -9px rgba(0,0,0,.3)':'0 4px 12px -7px rgba(60,40,20,.28)', transform:on?'translateY(-1px)':'none' }}>
                  <div style={{ width:40, height:40, borderRadius:50, background:on?m.color:'var(--w-tint)', display:'grid', placeItems:'center' }}>
                    <PAFace face={m.face} size={30} bg="transparent"/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:on?800:600, color:on?'var(--w-ink)':'var(--w-ink-2)' }}>{m.th}</span>
                </button>
              );
            })}
          </div>

          {/* note input */}
          <div className="thai" style={{ minHeight:120, borderRadius:14, border:'1.5px solid var(--w-rule)', background:'#FBF7F0', padding:'15px 17px', color:'var(--w-ink-3)', fontSize:15, lineHeight:1.6 }}>
            วันนี้เป็นยังไงบ้าง...
          </div>

          {/* controls */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14 }}>
            <button title="พูด" style={iconBtn}><PAIcon name="mic" size={18} stroke="var(--w-ink-2)"/></button>
            <button title="แนบรูป (Pro)" className="thai" style={{ display:'flex', alignItems:'center', gap:7, height:42, padding:'0 14px', borderRadius:12, border:'1px solid var(--w-rule)', background:'#fff', cursor:'pointer', position:'relative', fontFamily:'inherit', fontWeight:700, fontSize:13, color:'var(--w-ink-2)', flexShrink:0 }}>
              <PAIcon name="img" size={18} stroke="var(--w-ink-2)"/> รูป
              <span style={{ position:'absolute', top:-8, right:-8, background:'var(--w-ink)', color:'#fff', fontSize:8, fontWeight:800, padding:'2px 5px', borderRadius:100, letterSpacing:'.04em' }}>PRO</span>
            </button>
            <button title="สถานที่" style={iconBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--w-ink-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            </button>
            <span className="thai" style={{ marginLeft:'auto', fontSize:13, color:'var(--w-ink-3)', fontWeight:700 }}>เหลือ AI วันนี้ <b style={{ color:'var(--w-ink-2)' }}>3 / 3</b></span>
          </div>

          {/* activities */}
          <div className="thai" style={{ fontSize:12, fontWeight:800, color:'var(--w-ink-3)', textTransform:'uppercase', letterSpacing:'.06em', margin:'18px 0 10px' }}>กิจกรรม</div>
          <div style={{ display:'flex', gap:9, flexWrap:'nowrap', overflow:'hidden', maskImage:'linear-gradient(90deg,#000 88%,transparent)', WebkitMaskImage:'linear-gradient(90deg,#000 88%,transparent)' }}>
            {ACTIVITIES.map(([emoji,label])=>(
              <span key={label} className="thai" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:100, border:'1px solid var(--w-rule)', background:'#fff', fontSize:13, fontWeight:700, color:'var(--w-ink-2)', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                <span style={{ fontSize:14 }}>{emoji}</span>{label}
              </span>
            ))}
          </div>

          {/* PRO banner */}
          <div className="thai" style={{ marginTop:18, padding:'14px 16px', borderRadius:14, background:'linear-gradient(135deg, #F1E7FA, #F8EDEB)', display:'flex', alignItems:'center', gap:12, fontSize:13.5, fontWeight:600, color:'var(--w-ink-2)' }}>
            <span style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg, var(--purple), #C9A6F5)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <PAIcon name="sparkle" size={15} stroke="#fff" sw={2.4}/>
            </span>
            <span><b style={{ color:'var(--purple-strong)' }}>PRO</b> · AI อ่านสิ่งที่คุณเขียน แล้วสรุปอารมณ์ แท็ก และ insight ให้อัตโนมัติ <a href="#" style={{ color:'var(--purple-strong)', fontWeight:800, textDecoration:'none' }}>อัปเกรด →</a></span>
          </div>

          {/* footer */}
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:12, marginTop:24 }}>
            <button className="thai" style={{ height:44, padding:'0 20px', borderRadius:12, border:'1.5px solid var(--w-rule)', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:14, color:'var(--w-ink-2)' }}>ยกเลิก</button>
            <button className="thai" style={{ display:'inline-flex', alignItems:'center', gap:7, height:44, padding:'0 20px', borderRadius:12, border:'none', background:'var(--w-tint)', cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:14, color:'var(--w-ink-3)' }}>
              <PAIcon name="sparkle" size={15} stroke="var(--w-ink-3)" sw={2.2}/> วิเคราะห์
            </button>
            <button className="pa-btn thai" style={{ height:44, padding:'0 24px' }}>บันทึก</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- shared Smart Log paper modal shell ---- */
function SLShell({ width = 728, children }) {
  return (
    <div className="webapp" style={{ width:1280, height:920, position:'relative', overflow:'hidden', fontFamily:"'Urbanist', system-ui, sans-serif" }}>
      <PaperStyle/>
      <div className="pa-wrap" style={{ position:'absolute', inset:0 }}/>
      <div style={{ position:'absolute', inset:0, background:'rgba(26,19,32,.46)', backdropFilter:'blur(6px)' }}/>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width, background:'#fff', borderRadius:'8px 26px 26px 26px', boxShadow:'0 44px 100px -24px rgba(40,20,10,.6)', overflow:'hidden' }}>
        <span className="pa-washi lav" style={{ width:128, top:-13 }}/>
        {children}
      </div>
    </div>
  );
}

function SLHeader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px 0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:11 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg, var(--purple), #C9A6F5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <PAIcon name="sparkle" size={18} stroke="#fff" sw={2.2}/>
        </div>
        <span className="thai" style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.01em' }}>บันทึกด้วย AI</span>
      </div>
      <button aria-label="ปิด" style={{ width:36, height:36, borderRadius:50, background:'var(--w-tint)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <PAIcon name="x" size={16} stroke="var(--w-ink-2)"/>
      </button>
    </div>
  );
}

const slIconBtn = { width:42, height:42, borderRadius:12, border:'1px solid var(--w-rule)', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 };

/* ============= PAPER · Smart Log — RESULT (AI วิเคราะห์ให้) ============= */
function SmartLogResultPaper() {
  const det = 1; // สงบ — โล่งใจ
  return (
    <SLShell>
      <SLHeader/>
      <div style={{ padding:'18px 28px 26px' }}>
        {/* filled note */}
        <div className="thai" style={{ borderRadius:14, border:'1.5px solid var(--w-rule)', background:'#FBF7F0', padding:'15px 17px', fontSize:15, lineHeight:1.6, color:'var(--w-ink)' }}>
          วันนี้พรีเซนต์งานผ่านไปแล้ว เหนื่อยแต่โล่งใจ ขอกาแฟร้านโปรดเป็นรางวัล ☕
        </div>
        {/* controls */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12 }}>
          <button title="พูด" style={slIconBtn}><PAIcon name="mic" size={18} stroke="var(--w-ink-2)"/></button>
          <button title="แนบรูป (Pro)" className="thai" style={{ display:'flex', alignItems:'center', gap:7, height:42, padding:'0 14px', borderRadius:12, border:'1px solid var(--w-rule)', background:'#fff', cursor:'pointer', position:'relative', fontFamily:'inherit', fontWeight:700, fontSize:13, color:'var(--w-ink-2)' }}>
            <PAIcon name="img" size={18} stroke="var(--w-ink-2)"/> รูป
            <span style={{ position:'absolute', top:-8, right:-8, background:'var(--w-ink)', color:'#fff', fontSize:8, fontWeight:800, padding:'2px 5px', borderRadius:100 }}>PRO</span>
          </button>
          <span className="thai" style={{ marginLeft:'auto', fontSize:13, color:'var(--w-ink-3)', fontWeight:700 }}>เหลือ AI วันนี้ <b style={{ color:'var(--w-ink-2)' }}>3 / 5</b></span>
        </div>

        {/* AI result — washi-taped tinted paper note */}
        <div className="pa-sheet" style={{ borderRadius:18, padding:'22px 24px', marginTop:22, position:'relative', background:'linear-gradient(135deg, #F1E7FA, #F8EDEB)' }}>
          <span className="pa-washi yellow" style={{ width:100 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, marginBottom:16 }}>
            <PAIcon name="sparkle" size={15} stroke="var(--purple-strong)" sw={2.2}/>
            <span className="thai" style={{ fontSize:11, fontWeight:800, color:'var(--purple-strong)', textTransform:'uppercase', letterSpacing:'.06em' }}>AI วิเคราะห์ให้</span>
            <span className="thai" style={{ fontSize:11, color:'var(--w-ink-3)', fontWeight:600 }}>· แก้ไขได้</span>
          </div>

          {/* mood */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <span className="thai" style={{ fontSize:13, fontWeight:700, color:'var(--w-ink-2)', minWidth:54 }}>อารมณ์:</span>
            <div style={{ display:'flex', gap:8 }}>
              {RM.map((m,i)=>(
                <PASticker key={m.th} face={m.face} color={i===det?m.color:'#fff'} size={i===det?40:34}
                  style={{ border:i===det?'3px solid #fff':'2px solid #fff', boxShadow:i===det?`0 9px 18px -6px ${m.color}`:'0 4px 10px -6px rgba(60,40,20,.3)', transform:i===det?'rotate(-6deg)':'none' }}/>
              ))}
            </div>
          </div>

          {/* tags */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <span className="thai" style={{ fontSize:13, fontWeight:700, color:'var(--w-ink-2)', minWidth:54 }}>แท็ก:</span>
            {['งาน','โล่งใจ','กาแฟ'].map(t=>(
              <span key={t} className="thai pa-chip" style={{ fontSize:12, padding:'6px 11px' }}>#{t} <span style={{ color:'var(--w-ink-3)', cursor:'pointer' }}>×</span></span>
            ))}
            <button className="thai" style={{ padding:'6px 12px', borderRadius:100, background:'transparent', border:'1.5px dashed var(--w-rule-strong)', color:'var(--w-ink-3)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ เพิ่ม</button>
          </div>

          {/* summary */}
          <div style={{ padding:'14px 16px', background:'rgba(255,255,255,.72)', borderRadius:12 }}>
            <div className="thai" style={{ fontSize:11, fontWeight:800, color:'var(--w-ink-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>สรุป</div>
            <div className="thai" style={{ fontSize:14, lineHeight:1.55, color:'var(--w-ink)' }}>วันนี้คุณ <PAMark color="var(--mint)">ผ่านงานสำคัญไปได้</PAMark> รู้สึก <b>เหนื่อยแต่โล่งใจ</b> และให้รางวัลตัวเองด้วย <b>กาแฟร้านโปรด</b></div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:12, marginTop:24 }}>
          <button className="thai" style={{ height:44, padding:'0 20px', borderRadius:12, border:'1.5px solid var(--w-rule)', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:14, color:'var(--w-ink-2)' }}>ยกเลิก</button>
          <button className="thai" style={{ height:44, padding:'0 20px', borderRadius:12, border:'1.5px solid var(--w-rule)', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:14, color:'var(--w-ink-2)' }}>เขียนเอง</button>
          <button className="pa-btn thai" style={{ height:44, padding:'0 26px' }}>บันทึก</button>
        </div>
      </div>
    </SLShell>
  );
}

/* ============= PAPER · Smart Log — ANALYZING ============= */
function SmartLogAnalyzingPaper() {
  return (
    <SLShell width={580}>
      <style>{`@keyframes slspin{to{transform:rotate(360deg)}}`}</style>
      <SLHeader/>
      <div style={{ padding:'34px 40px 46px', textAlign:'center' }}>
        <div style={{ position:'relative', width:120, height:120, margin:'0 auto 22px' }}>
          <div style={{ position:'absolute', inset:0, borderRadius:50, border:'4px solid var(--w-tint)' }}/>
          <div style={{ position:'absolute', inset:0, borderRadius:50, border:'4px solid transparent', borderTopColor:'var(--purple-strong)', borderRightColor:'var(--peach)', animation:'slspin 1.2s linear infinite' }}/>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:46 }}>🧠</div>
        </div>
        <h2 className="thai" style={{ fontSize:24, fontWeight:800, margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI กำลังวิเคราะห์...</h2>
        <p className="thai" style={{ fontSize:14, color:'var(--w-ink-3)', margin:'0 0 26px', lineHeight:1.55 }}>กำลังอ่านข้อความและจับ trigger — ใช้เวลาประมาณ 2-3 วินาที</p>
        <div className="thai" style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap' }}>
          {[['✓ ตรวจอารมณ์','#1F8B6A','var(--mint)'],['● จับ trigger','var(--purple-strong)','var(--lavender)'],['○ สรุปสั้น','var(--w-ink-3)','var(--w-tint)']].map(([t,fg,bg])=>(
            <span key={t} className="pa-chip" style={{ color:fg, background:bg, fontSize:12 }}>{t}</span>
          ))}
        </div>
      </div>
    </SLShell>
  );
}

/* ============= PAPER · Smart Log — RATE LIMITED (Free) ============= */
function SmartLogRateLimitedPaper() {
  return (
    <SLShell width={560}>
      <button aria-label="ปิด" style={{ position:'absolute', top:18, right:18, width:36, height:36, borderRadius:50, background:'var(--w-tint)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
        <PAIcon name="x" size={16} stroke="var(--w-ink-2)"/>
      </button>
      <div style={{ padding:'40px 38px 36px', textAlign:'center' }}>
        <div style={{ width:76, height:76, borderRadius:50, background:'#FEF0F0', margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, boxShadow:'0 10px 22px -10px rgba(200,90,90,.5)' }}>⏳</div>
        <h2 className="thai" style={{ fontSize:24, fontWeight:800, margin:'0 0 8px', letterSpacing:'-0.02em' }}>ขอเบรกแป๊บนะ</h2>
        <p className="thai" style={{ fontSize:14.5, color:'var(--w-ink-2)', margin:'0 auto 22px', lineHeight:1.6, maxWidth:400 }}>คุณใช้ Smart Log AI ครบ <b>10 ครั้ง / วัน</b> (Free) แล้ว — รีเซ็ตเที่ยงคืน หรืออัพเป็น Premium ใช้ไม่จำกัด</p>

        <div className="pa-sheet thai" style={{ borderRadius:16, padding:'16px 18px', background:'#FBF7F0', textAlign:'left', marginBottom:22, position:'relative' }}>
          <span className="pa-washi yellow" style={{ width:88 }}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, marginTop:4 }}>
            <span>วันนี้ใช้ไปแล้ว</span><b>10 / 10</b>
          </div>
          <div style={{ height:7, borderRadius:100, background:'var(--w-rule)', marginTop:9, overflow:'hidden' }}>
            <div style={{ width:'100%', height:'100%', background:'linear-gradient(90deg, var(--peach), var(--purple))' }}/>
          </div>
          <div style={{ fontSize:12, color:'var(--w-ink-3)', marginTop:9, fontWeight:600 }}>รีเซ็ตในอีก 4 ชม. 23 นาที</div>
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button className="pa-btn thai" style={{ background:'linear-gradient(135deg, var(--purple), #B98BF0)', boxShadow:'0 6px 0 -2px #6F3FB8, 0 14px 22px -12px rgba(166,115,241,.7)' }}>✨ อัพเป็น Premium</button>
          <button className="thai" style={{ height:42, padding:'0 18px', borderRadius:12, border:'1.5px solid var(--w-rule)', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:800, fontSize:14, color:'var(--w-ink-2)' }}>บันทึกแบบปกติ</button>
        </div>
      </div>
    </SLShell>
  );
}

/* ---- canvas wrappers ---- */
function ArticlesPaperScreenGrid() { return <PAFrame active="today" noFooter><ArticlesPaperGrid/></PAFrame>; }
function ArticlesPaperScreenRow() { return <PAFrame active="today" noFooter><ArticlesPaperRow/></PAFrame>; }

window.ArticlesPaperScreenGrid = ArticlesPaperScreenGrid;
window.ArticlesPaperScreenRow = ArticlesPaperScreenRow;
window.ArticleDetailPaperV2 = ArticleDetailPaperV2;
window.TodayPaper = TodayPaper;
window.SmartLogPaper = SmartLogPaper;
window.SmartLogResultPaper = SmartLogResultPaper;
window.SmartLogAnalyzingPaper = SmartLogAnalyzingPaper;
window.SmartLogRateLimitedPaper = SmartLogRateLimitedPaper;
