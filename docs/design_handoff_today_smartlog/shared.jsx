// Shared web components: Topbar, MoodFace, BottomBar (mobile), atomic bits

const MOODS = [
  { id: 'great',   th: 'ดีมาก',   en: 'Great',   color: 'var(--peach)', face: 'great' },
  { id: 'good',    th: 'ดี',      en: 'Good',    color: 'var(--yellow)', face: 'good' },
  { id: 'okay',    th: 'เฉย ๆ',   en: 'Okay',    color: 'var(--mint)', face: 'okay' },
  { id: 'meh',     th: 'เหนื่อย', en: 'Meh',     color: 'var(--lavender)', face: 'meh' },
  { id: 'bad',     th: 'แย่',     en: 'Bad',     color: 'var(--blue)', face: 'bad' },
  { id: 'awful',   th: 'แย่มาก',  en: 'Awful',   color: 'var(--purple)', face: 'awful' },
  { id: 'calm',    th: 'สงบ',     en: 'Calm',    color: '#B9D6F2', face: 'calm' },
];

function MoodFace({ face, size = 48, bg }) {
  const w = size;
  const sw = size * 0.05;
  const eye = (cx, cy) => <circle cx={cx} cy={cy} r={size*0.06} fill="#1A1320" />;
  let mouth;
  if (face === 'great') mouth = <path d={`M ${w*0.32} ${w*0.62} Q ${w*0.5} ${w*0.82} ${w*0.68} ${w*0.62}`} stroke="#1A1320" strokeWidth={sw} fill="none" strokeLinecap="round"/>;
  else if (face === 'good') mouth = <path d={`M ${w*0.34} ${w*0.62} Q ${w*0.5} ${w*0.74} ${w*0.66} ${w*0.62}`} stroke="#1A1320" strokeWidth={sw} fill="none" strokeLinecap="round"/>;
  else if (face === 'okay') mouth = <line x1={w*0.36} y1={w*0.66} x2={w*0.64} y2={w*0.66} stroke="#1A1320" strokeWidth={sw} strokeLinecap="round"/>;
  else if (face === 'meh') mouth = <path d={`M ${w*0.34} ${w*0.68} Q ${w*0.5} ${w*0.62} ${w*0.66} ${w*0.68}`} stroke="#1A1320" strokeWidth={sw} fill="none" strokeLinecap="round"/>;
  else if (face === 'bad') mouth = <path d={`M ${w*0.34} ${w*0.72} Q ${w*0.5} ${w*0.58} ${w*0.66} ${w*0.72}`} stroke="#1A1320" strokeWidth={sw} fill="none" strokeLinecap="round"/>;
  else if (face === 'awful') mouth = <path d={`M ${w*0.32} ${w*0.74} Q ${w*0.5} ${w*0.54} ${w*0.68} ${w*0.74}`} stroke="#1A1320" strokeWidth={sw} fill="none" strokeLinecap="round"/>;
  else mouth = <circle cx={w*0.5} cy={w*0.66} r={size*0.05} fill="#1A1320" />;
  return (
    <svg width={w} height={w} viewBox={`0 0 ${w} ${w}`}>
      <circle cx={w*0.5} cy={w*0.5} r={w*0.48} fill={bg || '#fff'} />
      {eye(w*0.36, w*0.42)}
      {eye(w*0.64, w*0.42)}
      {mouth}
    </svg>
  );
}

function DMLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="dmlg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCA45B"/><stop offset=".5" stopColor="#FBA0A0"/><stop offset="1" stopColor="#A673F1"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#dmlg)"/>
      <circle cx="12" cy="14" r="1.6" fill="#1A1320"/>
      <circle cx="20" cy="14" r="1.6" fill="#1A1320"/>
      <path d="M 11 20 Q 16 24 21 20" stroke="#1A1320" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function Topbar({ active = 'today', isPremium = false, hideNav = false }) {
  const items = [
    { id: 'today', label: 'วันนี้', icon: 'home' },
    { id: 'calendar', label: 'ปฏิทิน', icon: 'cal' },
    { id: 'stats', label: 'สถิติ', icon: 'stats' },
    { id: 'insights', label: 'AI', icon: 'ai' },
  ];
  return (
    <header className="w-topbar">
      <div className="w-topbar-inner w-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'var(--w-ink)' }}>
            <DMLogo size={26}/>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>DailyMood</span>
          </a>
          {!hideNav && (
            <nav style={{ display: 'flex', gap: 4 }}>
              {items.map(it => (
                <a key={it.id} href="#" className={`w-nav-link thai ${active === it.id ? 'active' : ''}`}>{it.label}</a>
              ))}
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!hideNav && (
            <>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 100,
                border: '1px solid var(--w-rule)', background: '#fff', fontFamily: 'inherit',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', color: 'var(--w-ink-2)',
              }} className="thai">
                <span style={{ fontSize: 11 }}>⌘K</span>
                <span>ค้นหา</span>
              </button>
              <button className="w-btn w-btn-primary thai" style={{ height: 36 }}>+ บันทึก</button>
              {isPremium && <span className="w-pill thai" style={{ background: 'linear-gradient(135deg, var(--peach), var(--purple))', color: '#fff' }}>✨ Pro</span>}
              <div style={{ width: 32, height: 32, borderRadius: 50, background: 'linear-gradient(135deg, var(--peach), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>NP</div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Bottom nav for mobile — 4 tabs + center FAB
function BottomNav({ active = 'today' }) {
  const items = [
    { id: 'today', label: 'วันนี้', icon: 'home' },
    { id: 'calendar', label: 'ปฏิทิน', icon: 'cal' },
    { id: 'add', primary: true },
    { id: 'stats', label: 'สถิติ', icon: 'stats' },
    { id: 'profile', label: 'คุณ', icon: 'user' },
  ];
  return (
    <div className="w-mobile-bottom">
      {items.map(it => it.primary ? (
        <button key={it.id} className="w-mobile-fab" aria-label="บันทึก"><span>+</span></button>
      ) : (
        <button key={it.id} className={`w-mobile-tab thai ${active === it.id ? 'active' : ''}`}>
          <Icon name={it.icon} size={20} stroke={active === it.id ? 'var(--w-ink)' : 'var(--w-ink-3)'} sw={active === it.id ? 2.2 : 1.8}/>
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function MobileTopbar({ title, back, isPremium, action }) {
  return (
    <div className="w-mobile-top">
      {back ? (
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={22} stroke="var(--w-ink)"/>
        </button>
      ) : (
        <DMLogo size={26}/>
      )}
      {title && <span className="thai" style={{ fontWeight: 700, fontSize: 16, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{title}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {action}
        {isPremium && <span className="w-pill thai" style={{ background: 'linear-gradient(135deg, var(--peach), var(--purple))', color: '#fff', fontSize: 10, padding: '3px 7px' }}>✨</span>}
        <div style={{ width: 30, height: 30, borderRadius: 50, background: 'linear-gradient(135deg, var(--peach), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11 }}>NP</div>
      </div>
    </div>
  );
}

// Footer — bottom of every desktop page
function Footer() {
  const links = ['เกี่ยวกับเรา', 'นโยบายความเป็นส่วนตัว', 'เงื่อนไขการใช้งาน', 'PDPA'];
  return (
    <footer style={{ background: 'transparent', color: 'var(--w-ink-3)', marginTop: 60, borderTop: '1px solid var(--w-rule)' }}>
      <div className="w-container" style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div className="thai" style={{ fontSize: 12, color: 'var(--w-ink-3)' }}>© 2026 DailyMood.me</div>
        <nav style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          {links.map(l => (
            <a key={l} href="#" className="thai" style={{ fontSize: 13, color: 'var(--w-ink-2)', textDecoration: 'none', fontWeight: 500 }}>{l}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

// Unified frame — desktop OR mobile chrome, same inner content uses container queries
function DesktopFrame({ children, active, isPremium, page, noFooter, device = 'desktop', title, back, mobileBottom = true, mobileHeight = 900 }) {
  if (device === 'mobile') {
    return (
      <div className="webapp w-screen" style={{ width: 440, height: mobileHeight, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MobileTopbar title={title} back={back} isPremium={isPremium}/>
        <main style={{ flex: 1, overflow: 'hidden', padding: 16, paddingBottom: mobileBottom ? 88 : 16 }}>
          {children}
        </main>
        {mobileBottom && <BottomNav active={active}/>}
      </div>
    );
  }
  return (
    <div className="webapp w-screen" style={{ width: 1280, minHeight: 800, display: 'flex', flexDirection: 'column' }}>
      <Topbar active={active} isPremium={isPremium}/>
      <main className="w-container" style={{ padding: '32px', flex: 1 }}>
        {children}
      </main>
      {!noFooter && <div className="w-footer-desktop"><Footer/></div>}
    </div>
  );
}

// Mobile-only frame (kept for backwards compat with hand-coded mobile screens)
function MobileFrame({ children, title, back, hasBottom = true, isPremium }) {
  return (
    <div className="webapp w-screen" style={{ width: 440, height: 900, position: 'relative', overflow: 'hidden' }}>
      <MobileTopbar title={title} back={back} isPremium={isPremium}/>
      <div style={{ height: hasBottom ? 'calc(900px - 56px - 72px)' : 'calc(900px - 56px)', overflow: 'hidden' }}>
        {children}
      </div>
      {hasBottom && <BottomNav active={title}/>}
    </div>
  );
}

// Mood chip used across screens
function MoodChip({ mood, size = 36, selected, label }) {
  const m = typeof mood === 'string' ? MOODS.find(x => x.id === mood) : mood;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: size + 16, height: size + 16, borderRadius: 50,
        background: selected ? m.color : '#fff',
        border: selected ? 'none' : '1px solid var(--w-rule)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? `0 8px 18px -4px ${m.color.replace('var(--', '').replace(')', '')}` : 'none',
      }}>
        <MoodFace face={m.face} size={size} bg="transparent"/>
      </div>
      {label && <span className="thai" style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-ink-2)' }}>{m.th}</span>}
    </div>
  );
}

// Icon helper
function Icon({ name, size = 18, stroke = 'currentColor', sw = 1.8 }) {
  const c = { stroke, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 11 L12 4 L21 11 V20 H3 Z" {...c}/><path d="M9 20 V14 H15 V20" {...c}/></>,
    cal: <><rect x="4" y="5" width="16" height="16" rx="2" {...c}/><line x1="4" y1="9" x2="20" y2="9" {...c}/><line x1="8" y1="3" x2="8" y2="7" {...c}/><line x1="16" y1="3" x2="16" y2="7" {...c}/></>,
    stats: <><polyline points="4 18 9 12 13 15 20 6" {...c}/></>,
    ai: <><path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" {...c}/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" {...c}/><line x1="5" y1="12" x2="19" y2="12" {...c}/></>,
    mic: <><rect x="9.5" y="3" width="5" height="11" rx="2.5" {...c}/><path d="M6 11 V13 A6 6 0 0 0 18 13 V11" {...c}/><line x1="12" y1="19" x2="12" y2="22" {...c}/></>,
    img: <><rect x="3" y="5" width="18" height="14" rx="2" {...c}/><circle cx="9" cy="10" r="1.5" {...c}/><path d="M3 17 L9 12 L14 16 L17 13 L21 17" {...c}/></>,
    type: <><path d="M5 5 H19" {...c}/><line x1="12" y1="5" x2="12" y2="20" {...c}/></>,
    star: <path d="M12 3 L14.5 9 L21 9.5 L16 14 L17.5 21 L12 17.5 L6.5 21 L8 14 L3 9.5 L9.5 9 Z" {...c}/>,
    bolt: <path d="M13 3 L4 14 H11 L10 21 L19 10 H12 Z" {...c}/>,
    heart: <path d="M12 20 S 4 14 4 9 A 4 4 0 0 1 12 7 A 4 4 0 0 1 20 9 C 20 14 12 20 12 20 Z" {...c}/>,
    flame: <path d="M12 21 C 7 21 4 17 5 13 C 6 16 8 16 9 14 C 9 11 11 9 12 6 C 13 9 17 11 17 15 C 17 19 14 21 12 21 Z" {...c}/>,
    settings: <><circle cx="12" cy="12" r="3" {...c}/><path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" {...c}/></>,
    arrowR: <path d="M5 12 H19 M13 6 L19 12 L13 18" {...c}/>,
    arrowL: <path d="M19 12 H5 M11 6 L5 12 L11 18" {...c}/>,
    chevR: <path d="M9 5 L16 12 L9 19" {...c}/>,
    chevL: <path d="M15 5 L8 12 L15 19" {...c}/>,
    check: <path d="M5 12 L10 17 L20 7" {...c}/>,
    x: <path d="M6 6 L18 18 M18 6 L6 18" {...c}/>,
    edit: <><path d="M4 20 H8 L19 9 L15 5 L4 16 Z" {...c}/></>,
    bell: <path d="M5 17 H19 L17 13 V10 A5 5 0 0 0 7 10 V13 Z M10 20 A2 2 0 0 0 14 20" {...c}/>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" {...c}/><path d="M8 11 V8 A4 4 0 0 1 16 8 V11" {...c}/></>,
    sparkle: <><path d="M12 3 L13 9 L19 10 L13 11 L12 17 L11 11 L5 10 L11 9 Z" {...c}/></>,
    dots: <><circle cx="6" cy="12" r="1.4" fill={stroke}/><circle cx="12" cy="12" r="1.4" fill={stroke}/><circle cx="18" cy="12" r="1.4" fill={stroke}/></>,
    user: <><circle cx="12" cy="8" r="4" {...c}/><path d="M4 21 C 4 16 8 14 12 14 C 16 14 20 16 20 21" {...c}/></>,
    menu: <><line x1="4" y1="7" x2="20" y2="7" {...c}/><line x1="4" y1="12" x2="20" y2="12" {...c}/><line x1="4" y1="17" x2="20" y2="17" {...c}/></>,
    filter: <><path d="M4 5 H20 L14 13 V20 L10 18 V13 Z" {...c}/></>,
    share: <><circle cx="6" cy="12" r="3" {...c}/><circle cx="18" cy="6" r="3" {...c}/><circle cx="18" cy="18" r="3" {...c}/><line x1="8.5" y1="10.5" x2="15.5" y2="7" {...c}/><line x1="8.5" y1="13.5" x2="15.5" y2="17" {...c}/></>,
    search: <><circle cx="11" cy="11" r="6" {...c}/><line x1="15.5" y1="15.5" x2="20" y2="20" {...c}/></>,
    google: <><path d="M21 12c0-.7-.1-1.4-.2-2H12v3.8h5c-.2 1.1-.9 2.1-1.9 2.7v2.2h3c1.8-1.6 2.9-4 2.9-6.7Z" fill="#4285F4" stroke="none"/><path d="M12 21c2.6 0 4.8-.9 6.3-2.3l-3-2.3c-.8.6-1.9.9-3.3.9-2.5 0-4.7-1.7-5.4-4H3.5v2.5C5 19.9 8.3 21 12 21Z" fill="#34A853" stroke="none"/><path d="M6.6 13.3c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V7.4H3.5C2.9 8.9 2.5 10.4 2.5 12s.4 3.1 1 4.6l3.1-2.5Z" fill="#FBBC05" stroke="none"/><path d="M12 6.5c1.4 0 2.7.5 3.7 1.4l2.7-2.7C16.8 3.9 14.6 3 12 3c-3.7 0-7 2.1-8.5 5.4l3.1 2.5c.7-2.3 2.9-4 5.4-4Z" fill="#EA4335" stroke="none"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>{paths[name]}</svg>;
}

window.MOODS = MOODS;
window.MoodFace = MoodFace;
window.DMLogo = DMLogo;
window.Topbar = Topbar;
window.MobileTopbar = MobileTopbar;
window.BottomNav = BottomNav;
window.DesktopFrame = DesktopFrame;
window.MobileFrame = MobileFrame;
window.MoodChip = MoodChip;
window.Icon = Icon;
window.Footer = Footer;
