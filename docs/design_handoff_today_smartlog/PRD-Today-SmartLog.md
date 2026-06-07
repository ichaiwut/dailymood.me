# PRD — Today / Dashboard (มีข้อมูล) + Smart Log AI · Paper Desk

**Components (source of truth — `webapp/states-articles-paper.jsx`, bundled):**
- **Today / Dashboard:** `TodayPaper` (+ `TodayPromoBar`, `TodayTopbar`)
- **Smart Log AI modals:** `SmartLogPaper` (input), `SmartLogResultPaper` (AI result), `SmartLogAnalyzingPaper` (loading), `SmartLogRateLimitedPaper` (free-tier limit) — all built on the shared `SLShell` + `SLHeader`
- **Paper primitives (reuse, build once):** `PaperStyle`, `PAClip`, `PASticker`, `PAMark` + `.pa-*` CSS
- **Shared deps (bundled `shared.jsx`):** `MOODS`, `MoodFace`, `Icon`, `DMLogo`. Entry thumbnail uses `ArticleArt` from `states-articles.jsx`.

**Target codebase:** Next.js App Router · TypeScript · Tailwind · next-intl (Thai default).
**Fidelity:** High — exact colors, spacing, type, shadows, rotations below. Source wins on any visual ambiguity; this doc is the implementation contract.
**Placement:**
- `TodayPaper` → the authenticated home route (e.g. `/` or `/today`). Full page: trial **promo bar** → **top nav** → `pa-wrap` desk. Frame width **1280px**, content column **max 1180px**, two-column grid **`1fr 360px`**. Canvas artboard height **1440px** (content ≈ 1382px).
- Smart Log modals → a dialog opened from the **"+ บันทึก"** button and the dashboard greeting/assistant. Overlay sits over a dimmed, blurred app. Canvas artboards **1280 × 920**.

---

## 1. Goal
Reskin the live DailyMood **Today dashboard** and the **"บันทึกด้วย AI"** logging flow into the product's "Paper Desk" aesthetic — a warm cream desk holding **paper folder cards** (folder tabs, paperclips, washi tape, mood-face stickers, layered/rotated paper, chunky offset-shadow buttons). The information architecture, copy, and product hooks match the production site exactly; only the surface treatment changes.

## 2. About these files
The bundled `.jsx` are **design references** (inline-Babel React + a scoped `<style>` block), not production code to ship. Recreate in the app's React/Tailwind environment, porting the scoped `.pa-*` CSS to Tailwind utilities / `globals.css` tokens and wiring copy through next-intl. Every Thai text node carries `className="thai"` (Noto Sans Thai); keep that or its Tailwind equivalent.

---

## 3. Design tokens

### App tokens (already present)
```
--peach:#FCA45B  --purple:#A673F1  --purple-strong:(plum, ~#7B43C9)
--mint:#85ECCB   --lavender:#D4BEE4  --yellow:#FDCB56  --blue:#B9D6F2
--w-ink:#1A1320  --w-ink-2:#4A3F55  --w-ink-3:#8C8497
--w-rule:rgba(26,19,32,.08)  --w-rule-strong:(~rgba(26,19,32,.18))
--w-tint:(soft warm fill)    --w-bg:#FBF6EE
```
Fonts: **Urbanist** (Latin) + **Noto Sans Thai** (`.thai` on every Thai node).

### Paper-desk specifics (scoped `.pa-*` — full source in `PaperStyle`)
- **Desk surface** `.pa-wrap`: bg `#F1E5CF` + grain `::before` `radial-gradient(rgba(120,90,50,.07) 1px, transparent 1.4px); background-size:7px 7px; opacity:.5; pointer-events:none`.
- **Card shadow:** `0 18px 40px -20px rgba(60,40,20,.45)`.
- **Chunky button shadows:** peach `0 7px 0 -2px #d97f3b, 0 16px 24px -12px rgba(217,127,59,.7)`; ink `0 7px 0 -2px #000, …`. Purple variant used here: `0 6px 0 -2px #6F3FB8, 0 14px 22px -12px rgba(166,115,241,.7)` on `linear-gradient(135deg, var(--purple), #B98BF0)`.
- **Plum dark surface:** `linear-gradient(155deg,#2A1F33,#1A1320)`, white text.
- **Modal dim:** `rgba(26,19,32,.46)` + `backdrop-filter: blur(6px)`.

### Shared paper primitives (build once, reuse — see §4 of the Article PRD for full geometry)
`.pa-tab` (folder tab, variants `.ink/.mint/.lav/.yellow/.purple`), `.pa-sheet` (white paper body, radius `4px 18px 18px 18px`, card shadow, `position:relative; overflow:hidden`), `PAClip` (paperclip SVG, metal `#B7B2BC`), `.pa-washi` (perforated tape, color variants), `PASticker` (mood-face peel: disc, `border:4px solid #fff`, drop shadow, inner `MoodFace` at `size*0.78`, `bg="transparent"`), `PAMark` (highlighter block, `rotate(-1.2deg)`), `.pa-chip` (white pill, `6px 12px`, soft shadow), `.pa-btn`/`.pa-btn.ink` (chunky button, `height:42`).

---

## 4. Mood model (matches the live product)
A **7-mood** set, in this order, drives the greeting picker, the modal mood tiles, entry stickers, and the timeline dots. Defined locally as `RM` (face ids map to the shared `MoodFace` characters):

| # | label (`th`) | `face` id | `color` |
|---|---|---|---|
| 0 | มีความสุข | `great` | `var(--peach)` |
| 1 | สงบ | `calm` | `#B9D6F2` |
| 2 | เฉยๆ | `okay` | `var(--mint)` |
| 3 | เศร้า | `bad` | `var(--blue)` |
| 4 | โกรธ | `awful` | `var(--purple)` |
| 5 | กังวล | `meh` | `var(--lavender)` |
| 6 | เหนื่อย | `meh` | `var(--yellow)` |

In production, give กังวล / เหนื่อย distinct faces if available; the mock reuses `meh` for both.

**Activities** (`ACTIVITIES`, used by the dashboard assistant + Smart Log input):
`💼 ทำงาน · 🏃 ออกกำลังกาย · 👫 เจอเพื่อน · 👨‍👩‍👧 ครอบครัว · 🍽️ กินข้าวนอกบ้าน · 🎮 เล่นเกม · 📚 อ่านหนังสือ · 🌿 พักผ่อน`.

---

## 5. Today / Dashboard — `TodayPaper`

### 5.1 App chrome (above the desk)
1. **`TodayPromoBar`** — full-width gradient strip `linear-gradient(90deg, var(--peach) 0%, #FBA0A0 45%, var(--purple) 100%)`, white text, `min-height:46; centered; gap:16`. Copy: **"✨ ลองใช้ Pro ฟรี 14 วัน — ไม่ต้องใช้บัตร"** + a white pill button **"เริ่มเลย →"**.
2. **`TodayTopbar`** — white bar, `border-bottom:1px solid --w-rule`, inner `max-width:1180; height:72`.
   - Left: `DMLogo` + wordmark **"Daily <span peach>Mood</span>"** (`18/800`); nav `หน้าหลัก` (active: `--w-tint` pill, `800`) · `ปฏิทิน` · `สถิติ` · `AI` · `บทความ` (inactive `600/ink-3`).
   - Right: peach **`.pa-btn` "+ บันทึก"** (`height:40`) → opens Smart Log · Input; circular **🌙** dark-mode toggle (40×40); **🌐 EN** pill; **avatar** 38px gradient disc "TS".

### 5.2 Desk content — grid `1fr 360px`, gap 30, `align-items:flex-start`, padding `28px 0 56px`

#### LEFT column
1. **Greeting folder** (`position:relative; margin-bottom:30`): `.pa-tab` **"วันศุกร์ที่ 5 มิ.ย."** over a `.pa-sheet` (`radius 4px 18px 18px 18px; padding:28px 32px 30px`). A `PAClip` (`top:-15; right:40; rotate(7deg)`) + a lavender radial glow blob (`top:-50; right:-40; 180×180; opacity:.45`). Inside: eyebrow **"สวัสดีตอนเช้า ☀️"** (`13/800/purple-strong`), `<h1>` **"วันนี้คุณรู้สึก `<PAMark>`ยังไง`</PAMark>`?"** (`32/800/-0.022em`), then the **mood picker**: `RM.map` → vertical sticker buttons (`PASticker size={52}` + label `11`); index 0 selected (`color`, `scale(1.06) rotate(-5deg)`, colored shadow), others white face. A peach `PASticker face="great" size={48}` peels off the **bottom-left** (`bottom:-14; left:-14; rotate(-12deg)`).
2. **AI Mood Assistant card** (`.pa-sheet; radius:16; padding:22px 24px; margin-bottom:30`) — lavender glow blob top-right (`opacity:.55`). Header: 34px gradient-purple rounded square holding a white `sparkle` + **"AI MOOD ASSISTANT"** (`13/800/purple-strong/uppercase`). **Note input**: `min-height:96; radius:12; border:1.5px solid --w-rule; background:#FBF7F0; padding:14px 16px`, placeholder **"วันนี้เป็นยังไงบ้าง..."** (`15/ink-3`). **Activity chips**: `ACTIVITIES` as white outline pills (`7px 13px; radius:100; border --w-rule; 13/700`, emoji + label), `flex-wrap`. **Controls row**: `mic` icon button (42×42 square, `radius:12`, border) · `photo` icon button with a **PRO** badge (ink pill, `top/right:-7`) · `location` pin icon button · right-aligned **`.pa-btn`** "วิเคราะห์ ✦" in the **purple** variant. **Disclaimer** `12/ink-3`: "เป็นแค่มุมมองจาก AI ไว้ประกอบการตัดสินใจ". **PRO usage banner**: `linear-gradient(135deg,#F1E7FA,#F8EDEB); radius:12; padding:12px 16px`, ink **PRO** chip + "ใช้ AI ได้ **3 ครั้ง/วัน** — [อัปเกรด Pro] เพื่อใช้ได้ไม่จำกัด".
3. **Section header**: `<h2>` **"วันนี้"** (`24/800`) + `.pa-chip` **"📌 3 entries · กิจกรรม"**.
4. **Timeline sheet** (`.pa-sheet; radius:16; padding:20px 26px 24px`) with a **yellow washi** strip (`width:92; left:34; rotate(-3deg)`). Axis labels `6:00…21:00` (`10/800/ink-3`); a 5px `--w-tint` track with **3 mood dots** (18px, `border:3px solid #fff`, soft shadow) at 11% / 40% / 70% (colors `RM[0]/RM[2]/RM[1]`); a purple **"● ตอนนี้"** pill pinned right (`top:-30`).
5. **Entry folder cards** — grid `repeat(3,1fr); gap:18`. Each: a `.pa-tab` (`เช้า` peach · `บ่าย` mint · `เย็น` lav) over a `.pa-sheet.pa-card-lift` (`rotate(±0.6deg); padding:16px 16px 18px`). Header row: `PASticker size={40} rotate(-6deg)` + mood label (`13/800`) + time (`11/ink-3`) + a `dots` overflow button. Optional **image** entry → `ArticleArt tone="mint"` in a `height:78; radius:10` inset. Body note `<p>` `13/ink-2/1.55`. Tag pills `#…` (`--w-tint` fill, `11/700`).

#### RIGHT rail — `flex column; gap:22`
1. **AI · สัปดาห์นี้ (PRO-gated, dark plum folder)**: `.pa-tab.ink` "✦ AI · สัปดาห์นี้" over a `.pa-sheet` with plum gradient + white text (`padding:22px 22px 24px`). Peach radial glow blob; a translucent **PRO** badge top-right. Copy: "AI สรุปอารมณ์ประจำสัปดาห์ วิเคราะห์ pattern และแนะนำสิ่งที่ช่วยให้ดีขึ้น". White CTA button **"อัปเกรด Pro →"**.
2. **Streak card** (`.pa-sheet; radius:16; padding:22px 22px 20px`) with **peach washi** (`width:96`). Eyebrow "STREAK"; big number **5** (`46/800`) + "วันติดต่อกัน" + 🔥; a 14-segment bar (`flex; gap:5; height:26; radius:5`), first 5 filled peach, rest `--w-tint`.
3. **Mini calendar folder** — `.pa-tab.mint` **"มิถุนายน 2569"** over a `.pa-sheet` (`radius 4px 16px 16px 16px; padding:18px 20px 20px`). "ดูทั้งหมด →" link top-right. Weekday header `อา…ส`; 7-col grid, **June 2569 = June 2026** (1 = Monday → 1 leading empty cell). Days **1–4** filled (alternating `--lavender`/`--peach`), **5 = today** (white, `2.5px solid var(--purple)`), rest `--w-tint`.

---

## 6. Smart Log AI — modal flow

### 6.1 Shared shell
- **`SLShell({ width=728, children })`** — full **1280 × 920** stage: `pa-wrap` desk (dot grain) behind a **dim** layer (`rgba(26,19,32,.46)` + `blur(6px)`), then a centered white modal sheet `radius:8px 26px 26px 26px; box-shadow:0 44px 100px -24px rgba(40,20,10,.6); overflow:hidden`, with a **lavender washi** strip at top (`width:128; top:-13`). In production, render the real app behind (not the static desk) and trap focus in the dialog.
- **`SLHeader`** — `padding:24px 28px 0`: 34px gradient-purple square + white `sparkle` + **"บันทึกด้วย AI"** (`20/800`); right = 36px `--w-tint` circular close (`×`).

### 6.2 Input — `SmartLogPaper` (width 728)
Header → body `padding:18px 28px 26px`:
- **Date** row: `cal` icon + **"วันศุกร์ที่ 5 มิถุนายน 2569"** (`14/700/ink-2`).
- **"อารมณ์ของคุณ"** label → 7-col grid of **rounded-square mood tiles** (`radius:14; bg #fff; padding:11px 4px 9px`): each a 40px disc (`--w-tint`, or mood `color` when selected) holding `MoodFace size={30} bg="transparent"` + label. Selected tile (mock: **เฉยๆ**, index 2): `border:2px solid --w-ink`, lifted shadow, `translateY(-1px)`.
- **Note input** (`min-height:120; radius:14; border 1.5px; bg #FBF7F0`), placeholder "วันนี้เป็นยังไงบ้าง...".
- **Controls**: `mic` · `รูป`+PRO · `location` icon buttons; right "เหลือ AI วันนี้ **3 / 3**".
- **"กิจกรรม"** label → activity chips, `flex-nowrap; overflow:hidden` with a right fade mask.
- **PRO banner**: gradient lav/peach card, 30px gradient-purple sparkle square + "**PRO** · AI อ่านสิ่งที่คุณเขียน แล้วสรุปอารมณ์ แท็ก และ insight ให้อัตโนมัติ [อัปเกรด →]".
- **Footer** (right-aligned): `ยกเลิก` (outline) · `วิเคราะห์ ✦` (muted `--w-tint`) · **`.pa-btn` "บันทึก"** (peach).

### 6.3 Result — `SmartLogResultPaper` (width 728)
Same header. Body: a **filled** note (the user's text: "วันนี้พรีเซนต์งานผ่านไปแล้ว เหนื่อยแต่โล่งใจ ขอกาแฟร้านโปรดเป็นรางวัล ☕") + controls row ("เหลือ AI วันนี้ **3 / 5**"), then the **AI result note** — a `.pa-sheet` tinted `linear-gradient(135deg,#F1E7FA,#F8EDEB)` with **yellow washi**:
- Header: `sparkle` + **"AI วิเคราะห์ให้"** + "· แก้ไขได้".
- **อารมณ์**: the 7 `RM` stickers in a row, **detected = index 1 (สงบ)** rendered larger (`size 40`, colored, `rotate(-6deg)`, colored shadow), others `size 34` white.
- **แท็ก**: `.pa-chip` pills `#งาน #โล่งใจ #กาแฟ` each with a removable `×`, plus a dashed **"+ เพิ่ม"**.
- **สรุป**: white inset card, label + sentence with `<PAMark color="var(--mint)">ผ่านงานสำคัญไปได้</PAMark>` and bold spans.
- **Footer**: `ยกเลิก` · `เขียนเอง` (both outline) · **`.pa-btn` "บันทึก"**.

### 6.4 Analyzing — `SmartLogAnalyzingPaper` (width 580)
Header → centered body: a 120px **spinner ring** (`4px` track + `borderTopColor:--purple-strong; borderRightColor:--peach; animation: slspin 1.2s linear infinite`) with 🧠 centered; `<h2>` **"AI กำลังวิเคราะห์..."**; sub "กำลังอ่านข้อความและจับ trigger — ใช้เวลาประมาณ 2-3 วินาที"; three step `.pa-chip`s: **✓ ตรวจอารมณ์** (mint) · **● จับ trigger** (lavender) · **○ สรุปสั้น** (`--w-tint`).

### 6.5 Rate limit (Free) — `SmartLogRateLimitedPaper` (width 560)
No standard header — just a top-right close button. Centered: 76px `#FEF0F0` disc with ⏳; `<h2>` **"ขอเบรกแป๊บนะ"**; body "คุณใช้ Smart Log AI ครบ **10 ครั้ง / วัน** (Free) แล้ว — รีเซ็ตเที่ยงคืน หรืออัพเป็น Premium ใช้ไม่จำกัด"; a **usage card** (`.pa-sheet; bg #FBF7F0` + yellow washi): "วันนี้ใช้ไปแล้ว **10 / 10**", a full peach→purple bar, "รีเซ็ตในอีก 4 ชม. 23 นาที". Buttons: **`.pa-btn` purple "✨ อัพเป็น Premium"** + `บันทึกแบบปกติ` (outline).

---

## 7. Interactions & behavior
- **"+ บันทึก" / greeting "วิเคราะห์"** → open `SmartLogPaper` (Input). On submit with text → `SmartLogAnalyzingPaper` (~2–3s) → `SmartLogResultPaper`. If the free daily quota is exhausted → `SmartLogRateLimitedPaper` instead.
- **Mood picker / tiles**: single-select, `aria-pressed`; selected = colored sticker/tile + lift. Picking from the dashboard greeting can deep-link into the modal pre-filled.
- **AI result**: mood + tags are **editable** (tag `×` removes, "+ เพิ่ม" adds, mood re-selectable). "บันทึก" writes the entry; "เขียนเอง" switches to manual edit.
- **Usage counters** ("เหลือ AI วันนี้ n / m") reflect real free-tier quota; gate AI actions and surface the rate-limit modal at 0.
- **Dashboard cards/links** (AI Insights upsell, calendar "ดูทั้งหมด", entry overflow `dots`) are real navigation/menus.
- **Hover (recommended):** lift + straighten the `rotate()` on entry cards; keep clip/washi/sticker pinned. Disable transforms under `prefers-reduced-motion: reduce`. The spinner must respect reduced-motion (show a static state).
- **Never** use `scrollIntoView` inside the app shell.

## 8. Responsive (container queries / ≤640px)
- **Dashboard:** collapse `1fr 360px` → single column; move the right rail **below** the entries. Promo bar text may shorten; top nav collapses to a menu; entry grid `repeat(3,1fr)` → 1–2 cols. `<h1>` → ~28px. Mood picker wraps; keep targets ≥44px.
- **Smart Log modal:** on mobile render as a **bottom sheet** (rounded top, drag handle) rather than a centered dialog; mood tiles may scroll horizontally or wrap to 2 rows; footer buttons full-width stacked. Keep all hit targets ≥44px.

## 9. Accessibility
- Modals are `role="dialog" aria-modal="true"`, labelled by the "บันทึกด้วย AI" title; trap focus; `Esc` + backdrop click close; restore focus to the trigger.
- Mood pickers/tiles: real `<button>` with `aria-pressed` + `aria-label={mood.th}`; the group is a radiogroup semantically.
- Decorative clip/washi/sticker/glow/grain → `aria-hidden`.
- Plum AI card: white on `#1A1320` passes; verify `purple-strong` link/category text ≥4.5:1.
- Progress/usage bars need text equivalents (the "n / m" labels cover this).
- Don't gate content behind entrance/spinner animation; base state visible (PDF/print/reduced-motion safe).

## 10. Files in this bundle
| File | What |
|---|---|
| `PRD-Today-SmartLog.md` | This document. |
| `states-articles-paper.jsx` | Source of truth — `TodayPaper`, `TodayPromoBar`, `TodayTopbar`, `SmartLogPaper`, `SmartLogResultPaper`, `SmartLogAnalyzingPaper`, `SmartLogRateLimitedPaper`, `SLShell`, `SLHeader`, `RM`, `ACTIVITIES`, `TODAY_ENTRIES`, and the paper primitives (`PaperStyle`, `PAClip`, `PASticker`, `PAMark`). |
| `shared.jsx` | `MOODS`, `MoodFace`, `Icon`, `DMLogo`, `DesktopFrame` + web-app chrome. |
| `states-articles.jsx` | `ArticleArt` (entry-thumbnail illustration) + `ARTICLES` data. |
| `webapp-tokens.css` | Web-app tokens (`--w-*`, mood colors, `.pa-*` consumers). |

Preview inside `DailyMood Web App.html` → **หน้าหลัก / Today** → **Today / Dashboard (มีข้อมูล)**, and the **Smart Log AI** section (Input / Result / กำลังวิเคราะห์ / Rate limit).
