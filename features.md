# DailyMood.me — Features

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **API:** REST API via Next.js Route Handlers (`/api/*`) — รองรับ Mobile App ในอนาคต
- **Database:** PostgreSQL (Railway) + Drizzle ORM
- **Auth:** NextAuth.js (Google OAuth + Credentials)
- **AI:** Google Gemini (gemini-2.5-flash, NLP + Vision)
- **Email:** Resend
- **Payment:** Stripe (test mode; gating ทำผ่าน `users.isPremium` flag)
- **Image Storage:** Cloudflare R2 (signed read URLs, 1-hour TTL)
- **Styling:** Tailwind CSS
- **Deploy:** Railway
- **i18n:** TH / EN
- **Admin notifications:** LINE Messaging API (push message to admin on signup/payment)

## Target Audience
- เปิดให้คนทั่วไปใช้ (public)

## Business Model
- Free / Pro (Stripe)
- In-app 14-day free Pro trial — click to activate, no credit card, auto-reverts to Free
- Stripe checkout/webhook for paid subscriptions (monthly ฿99, yearly ฿790)

## User Tiers

| | Guest | Free | Pro |
|---|---|---|---|
| Storage | localStorage (24h TTL) | D1 | D1 |
| Quick Icons | ✓ | ✓ | ✓ |
| Mini Journal | ✓ | ✓ | ✓ |
| AI NLP (Gemini) | — | 3 ครั้ง/วัน | ไม่จำกัด |
| AI Vision (Gemini) | — | — | ✓ |
| Custom Moods | — | — | ✓ (สูงสุด 13 เพิ่มเติม) |

### Free Trial
- 14-day free Pro trial — ทุก free user กดเปิดใช้ได้ 1 ครั้ง ไม่ต้องใส่บัตรเครดิต
- Global banner บนทุกหน้า: activate CTA (ยังไม่เปิดใช้) / countdown (กำลังใช้) / warning (เหลือ ≤3 วัน)
- Confirmation bottom sheet ก่อนเปิดใช้ — เน้นว่าไม่มีค่าใช้จ่าย หมดแล้วกลับ Free อัตโนมัติ
- หมดอายุ auto-downgrade ทันที (computed per-request ใน `getSessionInfo()`, ไม่ใช้ cron)
- DB: `users.trial_activated_at` (one-time guard), `users.trial_ends_at` (expiry)
- Atomic activation: `UPDATE ... WHERE trial_activated_at IS NULL` ป้องกัน double-activate
- Rate limit: 5/hr/IP + 3/hr/user
- API: `POST /api/trial/activate`

## Features

### Planned

#### Mood System
- [x] Mood Log — Quick Icons (7 default moods)
- [x] Mini Journal — note สั้นๆ
- [x] Custom Mood Types (Premium)
- [x] Multi-entry per day (timeline)
- [x] Mood Icon Packs — SVG/WebP/PNG icons hosted on R2 at `{packId}/{moodId}.{format}`; default pack `set_486038`. `users.mood_pack` stores selection. Free users can switch between free packs; premium packs require Pro. Profile page has "Mood Icons" section with grid cards showing preview of all packs.
- [x] Location (optional) — optional place name on entries. GPS auto-detect (browser Geolocation → Google Geocoder reverse lookup) + Google Places Autocomplete text search. `LocationPicker` component (`src/components/location-picker.tsx`) lazy-loads `@googlemaps/js-api-loader` on mount. DB: `mood_entries.location` nullable text (max 200 chars). Available to all users (Free + Premium). Shown on Smart Log Modal (below toolbar), Edit Entry, Entry Detail, Timeline cards, DaySheet mini cards. Env: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Graceful degradation: returns null if env var not set.
- [x] Activities — กิจกรรมที่ผูกกับ entry (1 กิจกรรมต่อ entry). 10 default activities (💼 ทำงาน, 🏃 ออกกำลังกาย, 👫 เจอเพื่อน ฯลฯ). Free: 5 custom activities, Premium: 100. Manage ใน Settings → กิจกรรม. Horizontal scrollable chips ใน SmartLogModal + Edit Entry. แสดง chip ใน Entry Detail, emoji ใน Timeline + DaySheet. AI (Gemini) suggest activity จาก text. DB: `activities` table + `mood_entries.activity_id` FK. API: `GET/POST /api/activities`, `DELETE /api/activities/[id]`

#### Smart Logging (AI)
- [x] Smart Log Modal — text + voice + image — **"Paper Desk" reskin** (`docs/design_handoff_today_smartlog/`): white paper sheet modal with washi-tape strip, folder-style header, rounded-square mood tiles, paper icon buttons (mic/photo/location), washi-taped tinted AI-result note, chunky offset-shadow buttons. Logic unchanged. Decomposed into `src/components/paper/smartlog/` — `SLShell` (backdrop + sheet + **focus trap / Esc / backdrop-close / `role=dialog` / scroll-lock**, new a11y the old modal lacked) + `SLHeader` + per-state views `SLInput`/`SLAnalyzing`/`SLResult`/`SLRateLimit`. Mobile: renders as a bottom sheet (drag handle, rounded top). Quota counter + rate-limit screen driven by live `/api/ai/remaining` (Free 3/day).
- [x] Smart Log — dedicated "AI กำลังวิเคราะห์" state — full-modal spinner ring (purple/peach arc) + 🧠 + 3 step chips (ตรวจอารมณ์ / จับ trigger / สรุปสั้น) animated via `aiStep`; respects `prefers-reduced-motion` (ring stops, content stays). Replaces the old inline analyzing block.
- [x] AI NLP Tagging (Gemini) — auto-extract mood + tags + sentiment + AI summary
- [x] AI Summary — Gemini generates a Thai summary with **bold** key phrases; length scales with input (min 2-3 sentences even for very short notes — expanded via gentle reflection, not invented events — up to ~7 sentences / 800 output tokens for long notes); saved to `mood_entries.ai_summary`; also powers the guest landing "try the AI" card; entries without summary show teaser fallback
- [x] AI Vision (Premium) — extract context tags from photo
- [x] Voice input — Web Speech API (TH/EN)
- [x] Confirm flow — user แก้/ยืนยัน suggestion ก่อน save
- [x] Daily AI rate limit — Free 5 NLP/วัน
- [x] AI Guided Journaling Prompts — textarea placeholder เปลี่ยนตาม mood ที่เลือก. Free: pre-written prompts (7 moods, TH+EN, instant). Premium: Gemini-generated personalized prompt (ใช้ recent tags/moods เป็น context, cached per user/mood/date ใน `journal_prompt_cache` table). Custom moods (Premium): Gemini adapt prompt จาก mood label. API: `GET /api/ai/journal-prompt?moodId=&locale=&moodLabel=`. ไม่นับ NLP quota

#### Visualization
- [x] Today's Timeline — entry grid (1/2/3 cols) with horizontal day-axis above (spine + mood-colored dots positioned by time-of-day, pulsing "Now" cap on the right)
- [x] Mood Calendar — monthly mood grid (colored day cells by dominant mood), year-in-pixels (12×31 grid), stat cards (AVG MOOD with delta, STREAK, LOGGED), month navigation. API: `/api/calendar?year=Y&month=MM`. **"Paper Desk" reskin** (`calendar-shell.tsx`): paper nav buttons + `.pa-filter` view toggle (Calendar/Timeline/Year), the month grid sits in a **paper folder** (month-name tab, `--w-tint` empty cells, purple today-ring), right rail stat cards + legend as paper sheets with colored accents, free upsell as a tinted paper card, day-sheet on a paper backdrop. White-sheet text `--w-ink*`, header theme `--ink*`. Premium AI cards (`calendar-ai-summary` washi-taped tinted sheet, `calendar-patterns-feed` paper cards, `calendar-ask-ai` paper input bar + result sheet) are paper too — the whole calendar is cohesive top-to-bottom.
- [x] Year in Pixels (`/year-in-pixels`, Premium) — 12×31 mood-color grid for the whole year + AI year-summary, stat chips, year-vs-year compare, best/hard month + Q4 trend, PNG export + PDF report. **"Paper Desk" reskin** (`year-in-pixels-shell.tsx`): `.pa-filter` view toggle, the pixel grid in a paper folder (`--w-tint` empties, purple today-ring), AI summary as a washi-taped tinted sheet (white-inset stat chips + compare), selected-cell tooltip + bottom stat cards as paper sheets, `pa-btn` actions, free upsell as a washi paper sheet. White-sheet text `--w-ink*`; PNG/PDF export unchanged. **Year Story** (`/year-in-pixels/story`, `year-story-shell.tsx`) — scroll-reveal year recap, **fully redesigned to Paper Desk**: hero folder (purple tab + paperclip + pixel strip), washi stat folders, dominant-mood folder (`PASticker` + distribution bar), best/tough-month folders, patterns sheets, an ink-tab **plum AI-narrative folder**, mint pixel-grid folder, and an outro sheet with `PASticker` + `pa-btn`. `Reveal` scroll animations preserved.
- [x] Calendar Day Sheet — tap a day cell → sheet showing that day's entries. Date header, mood card(s) with `PASticker`, note preview, tag chips, Edit + "Open full entry" CTA. Empty day shows a `pa-btn` "+ Add retroactively" (opens SmartLogModal with preset date). Future dates disabled + toast. Multi-entry days show stacked cards. **"Paper Desk" reskin** (`day-sheet.tsx`): paper card surfaces (`--w-tint` note/tags, `--w-rule` borders, mood `PASticker`), rendered on a `.pa-wrap` paper backdrop from the calendar. Dismiss via scrim tap.
- [x] Stats Page (`/stats`) — functional period toggle (Week/Month/Year), average mood line chart (SVG, adapts to period), mood mix, highest mood day card, real activity impact from tag-mood correlation, delta badge vs previous period, AI insight summary, share-card. Premium: Year toggle + activity impact unlocked. API: `/api/stats?period=week|month|year`. **"Paper Desk" reskin** (`stats-shell.tsx`): `.pa-filter` period pills + share pill, AI-insight as a washi-taped tinted sheet, 4 stat cards + trend/mood-mix/activity in paper sheets (shared `CARD` style → paper), SVG chart gridlines/labels in `--w-*`, too-few + loading states paper-ified, `pa-btn` CTAs. White-sheet text `--w-ink*`, header title theme `--ink*`.
- [x] AI Chart Annotations (Premium) — glowing AI-annotated pins on mood trend line chart. Hover/tap shows tooltip explaining anomalies, best/worst days, tag correlations (e.g. "วันพุธอารมณ์ดิ่ง คาดว่ามาจาก #ประชุม"). Free: 1 blurred ghost pin + upgrade CTA. All periods (week/month/year). On-demand generation + cached in `chart_annotations_cache` with delta-3 invalidation. API: extends `GET /api/stats` response with `annotations` field
- [x] Timeline Markers — vertical dashed lines on mood trend chart at special day positions (holidays + personal events). Red `#F43F5E` for holidays, blue `#3B82F6` for personal events. Emoji circle above chart. Fetches `/api/events` per month(s) covered by the chart period. All tiers, all periods
- [ ] Streak & Habits

#### Special Days
- [x] Public Holidays (Thai) — hardcoded ~20 recurring holidays/year in `src/lib/holidays.ts` (สงกรานต์, วันพ่อ, วันแม่ ฯลฯ), ไม่พึ่ง API ภายนอก. Red dot indicator on calendar grid (top-left 7px). Holiday name shown as chip in DaySheet, Entry Detail, SmartLogModal, + Home banner
- [x] Personal Events — user-created important dates (birthday, anniversary, etc.). Free: 3 events max, Premium: unlimited. Recurring yearly (stores month+day only). Blue dot indicator on calendar grid. Shown as chip in DaySheet, Entry Detail, SmartLogModal, + Home banner. Managed in Profile Settings → "วันสำคัญ" section. API: `GET/POST /api/events`, `DELETE /api/events/[id]`. DB: `personal_events` table

#### Profile & Account
- [x] Profile Overview (`/profile`) — hero card (purple→peach gradient, avatar initials with accent color, name, email, member-since, premium badge), hero stats row (streak 🔥, entries 📓, avg mood 😄 — tappable deep-links), mood signature card (stacked bar of mood distribution over 30 days + headline + top 3 %s), achievements preview row (horizontal scroll, 6 visible), settings shortcut list (notifications, language, privacy, export, subscription — color-tinted icon tiles), footer (help/sign out/version). API: `GET /api/profile`, `PATCH /api/profile`. **Paper Desk reskin** (`profile-shell.tsx`): clipped gradient hero (`PAClip` + chunky shadow), self-contained snapshot cards (mood signature [+ mint washi], saved-articles, article-reactions) = white `.pa-sheet`; settings-list cards keep themed surface (paper shadow/radius) because they embed the shared `CustomMoodManager`/`PersonalEventsManager` (also used by the not-yet-reskinned `/profile/settings`) which would break on always-white in dark mode; `PremiumTeaser` → fixed lavender tint + `--w-ink*`; edit-pencil header → `.pa-icon-btn`. Confirm/feedback bottom-sheets left themed.
- [x] Edit Profile (`/profile/edit`) — avatar upload (Premium, 2MB limit, client-side WebP optimize via `optimizeImage()`, R2 storage at `users/{userId}/avatar/{ulid}.webp`, signed read URLs, remove button), accent color picker (6 colors), display name (≤30 chars), email (read-only with verified badge), bio (≤160 chars), delete account button. API: `POST /api/profile/avatar`, `DELETE /api/profile/avatar`
- [x] Settings (`/profile/settings`) — Reminders (daily check-in toggle, time, days), Appearance (theme Light/Dark/Auto, mood palette Neon/Tempered/Mono), Language (EN/TH radio), Privacy (hide previews, anonymous insights toggles), Custom moods (Premium), Data (export, clear all entries), About (help, feedback, terms)
- [x] Achievements (`/profile/achievements`) — **"Paper Desk · Sticker Album"** reskin. Sticky left rail: Progress folder (paper-toned ring, % unlocked) + `pa-filter` pills (All/Earned/In progress/Locked with counts). Sticker grid: each badge is a rotated `.pa-sheet` card with a sticker disc; three states read through paper materials — earned = vivid disc + washi tape + rubber-stamp date, in-progress = pale disc + paperclip + progress meter, locked = faded disc on a dashed "empty slot". 12 badges: streak 7/30/100/365, entries 50/100/500, early bird, night owl, tag master, zen 30, photo journal. DB: `user_achievements` table, auto-earn on check. API: `GET /api/profile/achievements`. **Tap any badge → detail sheet** (`AchievementDetailSheet`, Paper Desk content inside the generic `BottomSheet`): sticker hero + per-state body (earned = date + Share button; in-progress = progress meter + "X to go"; locked = how-to-unlock). **Earned badges share to social** (`AchievementShareModal` → `AchievementShareCard`): 1200×630 PNG card (sticker disc + title + unlock date + watermark), light/dark, Share/Save/Copy — same `html-to-image` pipeline as the mood cards, free for all tiers, no PII. Analytics: `trackShareAchievement(badgeId)`

#### Pages
- [x] Today / Home dashboard (`/`) — **"Paper Desk" reskin** (`docs/design_handoff_today_smartlog/`). Two-column desk (`1fr 360px`, single column ≤767px) on a warm cream surface with dot grain (`.pa-desk` — a scoped opt-in so the articles page is untouched; note this makes Home an always-light "paper island" even in dark mode). Left: greeting **folder** (date tab + paperclip + mood-sticker picker that opens the Smart Log modal) → inline **AI MOOD ASSISTANT** composer (reskinned, logic unchanged) → "วันนี้" timeline sheet (washi tape + mood dots) → entry **folder cards** (time-of-day tab เช้า/บ่าย/เย็น, rotated paper, mood sticker, tags). Right rail: dark plum **AI · สัปดาห์นี้** folder (premium insight / free teaser, never hidden) + washi-taped **streak** card + mint-tab **mini-calendar** folder. Panels live in `src/components/paper/today/`. `PASticker` extended with `pack`/`iconFormat`/`iconKey` so the user's real mood pack + custom-mood icons render.
- [x] Trial promo bar — gradient strip (peach→pink→purple) above the top nav: "✨ ลองใช้ Pro ฟรี 14 วัน — ไม่ต้องใช้บัตร" + "เริ่มเลย →" (→ `/pricing`) + dismiss ×. Server-gated in `[locale]/layout.tsx` to non-premium users without an active trial; session-dismissible (`sessionStorage`). `src/components/trial-promo-bar.tsx`
- [x] AI Insights page (`/insights`) — Gemini-powered weekly insights feed. Hero summary card (lavender→peach gradient) with Read Full + Share (Web Share API / clipboard). Pattern cards with mini sparkline viz + tag badges (PATTERN/CORRELATION/ALERT). Suggestion card with thumbs up/down + "Add to routine" feedback (persisted in D1 `suggestion_feedback` table). Streak card. Cached per week in D1 `insights_ai_cache` table (delta-3 invalidation like calendar AI). Premium: full access. Free: hero preview (headline + first sentence) + locked state. Accessed via Stats page link (not in bottom nav). API: `GET /api/insights`, `POST /api/insights/feedback`. **Paper Desk reskin** — hero recap is a purple-tab folder (`PAClip` + gradient sheet + glass stat tiles); 4-feature grid (Forecast/Mood DNA/Themes/Energy Clock), pattern cards + footer toggles = white `.pa-sheet`s; suggestion = washi-taped warm sheet; disclaimer = tinted note; week-nav = `.pa-filter` pills; FreeGate CTA = PRO-tab folder.
- [x] Ask AI chat page (`/ask-ai`) — Gemini multi-turn chat over the user's real entries (full-height layout: thread sidebar + chat area). Threads persisted in DB + mirrored to localStorage for instant load; suggested starter questions; per-message 👍/👎 feedback + copy; AI answers cite how many entries were read. Premium only (free = blurred preview + Pro CTA). API: `/api/ask-ai/threads|messages|suggested`. **Paper Desk reskin** (`ask-ai-shell.tsx`): AI answers are white `.pa-sheet` cards (folded top-left corner) with a `--purple-strong` "DAILYMOOD AI · read N entries" eyebrow; user turns are lavender (`#F1E7FA`) bubbles; suggested questions + paper input bar (`#fff` + purple-gradient send) float on the themed desk; "New question" = `pa-btn ink`; FreeGate CTA = plum PRO-tab folder (`PAClip`). Shared `AiSubTabs` (Insights/Ask AI) upgraded to `.pa-filter` pills.
- [x] Timeline view (Calendar tab) — reverse-chronological feed of entries grouped by day (TODAY/YESTERDAY/WEEKDAY), mood filter chips, entry cards. Tap → entry detail. Data: `/api/calendar/timeline`. `/history` page redirects to `/calendar`. **"Paper Desk" reskin** (`timeline-feed.tsx`): paper filter pills (ink active / white shadowed inactive + mood dot), day-group labels in `--w-ink*`, and entry cards now reuse the shared `EntryFolderCard` (time-of-day folder tab เช้า/บ่าย/เย็น + `PASticker` + rotated paper) for consistency with the Today dashboard.
- [x] ~~History/Timeline page (`/history`)~~ — redirects to Calendar tab (Timeline view)
- [x] Mood Detail page (`/entry/[id]`) — **"Paper Desk" reskin** matching Today/Articles: mood **hero folder** (date tab + paperclip + mood sticker + big day/month/year + entry #), then a 2-col layout — left: washi-taped Note sheet, tinted AI-insight sheet (yellow washi), tinted Flashback sheet (lav washi) or dashed Free teaser, paperclipped photo frame + Maps sheet, `--w-tint` tag pills, delete; right rail: folder cards (วันใกล้เคียง timeline with mood stickers, เดือนที่แล้ว, washi-taped streak). Paper folders on the themed bg + global grain; white-sheet text uses scoped `--w-ink*`, loose/top-bar text uses theme `--ink*`. Logic/data/`GET /api/log/[id]` unchanged. Top-bar back + edit pills
- [x] Edit Entry page (`/entry/[id]/edit`) — **"Paper Desk" reskin**. 2-col layout (grid-2col): the **left form lives on one paper sheet** (folder tab "แก้ไขบันทึก") holding paper mood tiles, `#FBF7F0` date/time fields, note textarea + toolbar (bold `**markdown**`, voice, image, AI re-analyze as a lavender-tint chip), location, AI-suggestion tinted inset, activity, `.pa-chip` tags + inline add + dashed suggested-tag pills, image. Right sticky sidebar: **live-preview** folder (mood-tinted glow + `PASticker`), AI-insight washi sheet, shortcuts sheet (⌘S/Esc/⌘↵), `pa-btn` Save + paper-outline Cancel, danger-zone sheet. Mobile: sidebar hidden, danger zone duplicated inline, portal bottom bar (`pa-btn` Save). Delete-confirm = paper modal (washi + `.pa-wrap`). White-sheet text `--w-ink*`, page header theme `--ink*` (dark-mode safe). Logic + `PATCH/DELETE /api/log/[id]` unchanged
- [x] 404 Not Found page — standalone (no TopBar/BottomNav), blue kawaii circle character with "?" badges, faded "404" bg text, back-to-home + report-broken-link buttons. Root-level `not-found.tsx` with i18n (TH/EN)
- [x] 403 Forbidden page (`/forbidden`) — standalone, orange kawaii circle character with lock badge + sparkles, faded "403" bg text, "PRIVATE ENTRY" label, sign-in-to-different-account + back-to-journal buttons. i18n (TH/EN)
- [x] Privacy page (`/privacy`) — hero card (purple gradient, shield icon, ENCRYPTED/NO TRACKERS/NO ADS badges), TL;DR summary (4 items with icons), 7 numbered sections covering data collection, AI, images, third-party services, retention, rights, contact. i18n TH/EN. Linked from Settings + Pricing footer. **Paper Desk reskin**: hero → clipped gradient folder (`PAClip` + chunky shadow); TL;DR → washi-taped white `.pa-sheet` (`--w-ink*`, `--w-rule` dividers); numbered sections stay loose long-form text on the desk; back button → `.pa-icon-btn`.
- [x] Terms page (`/terms`) — hero card (peach gradient, handshake icon, effective date), TL;DR summary (4 items: age, conduct, billing, medical disclaimer), 7 numbered sections covering accounts, acceptable use, premium, content ownership, liability, changes, contact. i18n TH/EN. Linked from Settings + Pricing footer. **Paper Desk reskin**: same as Privacy — clipped gradient hero folder, washi-taped white TL;DR sheet, loose sections, `.pa-icon-btn` back.

- [x] Articles overview (`/articles`) — "Paper Desk · Magazine grid" reskin: white paper folder cards with tabs, paperclips, washi tape, mood-face stickers, and layered/rotated paper shadows, sitting on the normal app body background (no warm surface — themed). Featured "folder" (1.35fr) + 3-card side stack (1fr), then a paper-styled grid for the rest. Covers use the real uploaded photo when present, else a tone-based hand-drawn `ArticleArt` SVG (6 tones). Mood-face sticker is derived from `articles.tone` (no per-article mood in DB). Keeps live search + dynamic DB category filter pills (ink active pill). Featured footer repurposed (no author data): mood sticker + publish date + purple "อ่านต่อ →". `ArticlesShell` + `src/components/paper/*` primitives. API: `GET /api/articles` (now also returns `tone`)
- [x] Article detail (`/articles/[slug]`) — "Paper Desk · Mood Reader" reskin matching the overview. White paper folders on the normal themed background (no cream surface, like the list page). Top-bar paper-pill Save (bookmark) + Share. Hero folder = category tab + paperclip + cover photo (else `ArticleArt`) + corner mood sticker. Body tip-cards rendered as washi-taped paper sheets (`ArticleBody variant="paper"`). Dark plum "key takeaway" outro folder carrying the AI summary (guest sees blurred teaser + login CTA). Sticky sidebar: Table-of-Contents folder with scroll-spy + **live reading-progress bar**, and a Related folder. **Post-read mood reaction** row (5 mood stickers) — logs how the reader felt after reading via `POST /api/articles/[slug]/reaction`, **persisted** to the `article_reactions` table (one row per user/article, upsert on re-react) + analytics; the chosen mood is re-hydrated on reload from `GET /api/articles/[slug]`. Guests get visual-only feedback (no write). View counting, bookmark toggle, native share/copy-link all preserved. `ArticleDetailShell`. (Save-as-journal-prompt card from the design is not yet built — no backend.)
- [x] Saved articles (`/profile/saved-articles`) — bookmarked-articles list. **"Paper Desk · Saved clippings" reskin** (`SavedArticlesShell`): each saved article is a white `.pa-sheet` clipping with a slight alternating tilt (straightens + lifts on `.pa-card-lift` hover), a metal `PAClip` holding a framed cover (real photo, else tone-based `ArticleArt` SVG), a tone-tinted category pill, 2-line title/excerpt clamp, a `--w-tint` reading-time chip + quiet `--purple-strong` "อ่านต่อ →" affordance. Header = 📎 "คลังของคุณ" eyebrow + `PAMark`-highlighted h1 + count. Paper skeleton clippings while loading; empty state = washi-taped sheet with a floating bookmark glyph + `pa-btn purple` "ไปอ่านบทความ". No mood sticker (reserved for the sibling reactions page). Linked from the profile sidebar. `GET /api/articles/bookmarks`.
- [x] Article reaction history (`/profile/article-reactions`) — user-facing page listing articles the user reacted to (most recent first). **"Paper Desk · Saved clippings" reskin** (`ArticleReactionsShell`) sharing the saved-articles clipping layout (tilted `.pa-sheet` + `PAClip` + framed cover + tone category pill + clamped text), but each clipping is **stamped with the felt mood**: a `PASticker` (real mood face/colour) on the cover's bottom-right corner + a mood-tinted chip naming it (`MoodIcon` + label) in the footer beside reading time + "อ่านต่อ →". Header uses a 💭 eyebrow + **lavender** `PAMark` h1 (vs saved's peach). Empty state = mint-washi sheet with a floating mood sticker. Linked from a nav row in the profile sidebar (below "Saved articles"). `GET /api/articles/reactions`. Consumes the `article_reactions` table.

#### Calendar AI (Premium)
- [x] AI Monthly Summary card — replaces stat tiles for premium; Gemini-generated 2-3 sentence summary with **bold** key phrases + 3 highlight chips (Best day, Hardest day, Top trigger) + "Tell me more →" to Insights. Free users see 1st sentence + blurred chips + upgrade CTA. Cache: D1 `calendar_ai_cache` table, invalidate on ≥3 new entries. API: `GET /api/calendar/ai`
- [x] Pattern rings on calendar grid — ★ best day (peach ring), ◌ recurring pattern (purple ring), ◌ anomaly (lavender ring). Toggle pill "✨ AI patterns" + legend. Premium only.
- [x] Patterns Detected feed — 2-3 AI-detected pattern cards below grid (icon, title, explanation, "View →"). Premium only; free sees locked state.
- [x] Ask AI search bar — NL search wired to Gemini. Dashed border bar with rotating placeholder queries. POST `/api/calendar/ask` with rate limit (10/hr). Returns answer + matching dates as clickable chips. Premium only.

#### AI Features (Gemini) — Planned
- [x] AI Flashback & Cognitive Reflection (Premium) — เมื่อ user บันทึกอารมณ์แย่ (sad/angry/anxious/tired, score ≤ 2) แล้วเปิดดู entry detail, Gemini ค้นหา entries เก่าที่มีอารมณ์คล้ายกันแล้วสร้างข้อความสะท้อนคิดให้กำลังใจ อ้างอิงสถานการณ์ที่เคยผ่านมาได้. แสดงเป็น Flashback card (blue gradient, clock icon) ใต้ AI Insight. Free: teaser card + upgrade CTA. ไม่มี cache (on-demand ทุกครั้ง). API: extends `GET /api/log/[id]` response with `flashback` field
- [ ] AI Mood Analysis (trends)
- [ ] AI Suggestions
- [x] Weekly Digest Email (Premium) — ทุกวันจันทร์ 08:00 ICT ส่ง email สรุปสัปดาห์ ผ่าน Resend. ใช้ insights cache (reuse ถ้ามี, generate ใหม่ถ้าไม่มี). เนื้อหา: headline, summary, avg mood/streak/entries stats, patterns (3 อัน), suggestion card. Toggle on/off ผ่าน Insights page (`weeklyDigestEnabled` column). Cron: `/api/cron/weekly-digest`, registered ใน `cron-scheduler.ts` (Monday UTC day=1, hour=1)
- [x] Email Template Branding — shared `email-parts.ts` ใช้ร่วมกันทุก email template (AI Coach + Weekly Digest). Header: `icon.png` logo + "DailyMood" bold. Footer: unsubscribe link "ไม่ต้องการรับอีก? ปิดได้ที่หน้า Insights"
- [x] Trial Promo Email (Marketing) — one-off campaign นัดให้ user ที่ **ยังไม่ใช่ Pro และยังไม่เคยเปิด trial** มาเปิดใช้ trial 14 วัน. Segment: `is_premium = false AND trial_activated_at IS NULL AND marketing_opt_out = false AND trial_promo_sent_at IS NULL AND email_verified IS NOT NULL`. รูป hero เป็น JPEG (ไม่ใช่ WebP — Outlook ไม่รองรับ WebP ใน email) เก็บที่ R2 `promo/trial-14d.jpg`, copy localize TH/EN ตาม `locale`, CTA → `/profile/subscription`. ส่งผ่าน one-off script `scripts/send-trial-promo.ts` (มี DRY_RUN + TEST_TO mode), idempotent ด้วยคอลัมน์ `trial_promo_sent_at`. Template: `src/lib/promo-email.ts`. รูปอัปโหลดด้วย `scripts/upload-promo-image.ts`
- [x] Marketing Unsubscribe — one-click opt-out (RFC 8058) สำหรับ marketing email. Token เป็น HMAC ของ userId (stateless, ไม่เก็บ DB) ใน `src/lib/email-unsub.ts` ใช้ env `UNSUBSCRIBE_SECRET` (fallback `AUTH_SECRET`/`NEXTAUTH_SECRET`). Route `/api/unsubscribe` (GET = หน้า confirm TH/EN, POST = one-click จาก Gmail/Yahoo) → ตั้ง `marketing_opt_out = true`. ทุก marketing email แนบ header `List-Unsubscribe` + `List-Unsubscribe-Post`
- [ ] AI Chatbot

#### Social & Sharing
- [x] Social Share Cards — ปุ่ม "แชร์ 📤" บนหน้า Stats (`/stats`) เปิด `ShareCardModal` ให้สร้างรูปการ์ดอารมณ์ขนาด 1200×630 (Open Graph ratio) ไปแชร์ลง X/IG. **2 templates:** `Streak` (🔥 จำนวนวันต่อเนื่อง) + `Mood Mix` (สัดส่วนอารมณ์ + อารมณ์หลัก %). เลือกธีม Light/Dark. Actions: แชร์ (Web Share API native sheet → X/IG app), บันทึกรูป (download PNG), คัดลอกรูป (clipboard). **Render ฝั่ง browser** ด้วย `html-to-image` (`toBlob`) — ไม่ใช้ `next/og`/Satori เพราะ Satori วางวรรณยุกต์ไทยผิด (ตก ◌่/◌้ บนสระบน เช่น หนึ่ง→หนึง); เบราว์เซอร์ shape ไทย+emoji ถูกต้อง 100%. การ์ดใช้สี HEX ตรงจาก `DEFAULT_MOODS` (ไม่พึ่ง CSS var/theme) จึงหน้าตาเหมือนกันทุกธีม. **ฟรีทุก tier** (เป็น growth tool — watermark "DailyMood · dailymood.me" ดึงคนใหม่). **No PII** — แสดงแค่ภาพรวมอารมณ์/streak ไม่มี note/tag/ชื่อ. ปุ่มแชร์โผล่เมื่อมี ≥7 entries. Components: `src/components/share-card.tsx`, `src/components/share-card-modal.tsx`. **Achievement share (2nd surface):** tapping an earned badge on `/profile/achievements` → `AchievementShareModal` → `AchievementShareCard` (sticker disc + title + unlock date), reusing the same `html-to-image` capture flow via the shared `useCardShare` hook (`src/components/use-card-share.ts`) + exported `palette`/`mix`/`Watermark` from `share-card.tsx`. Components: `src/components/achievement-share-card.tsx`, `src/components/achievement-share-modal.tsx`. ยังไม่ทำ: share-link `/s/[shareId]` + OG-meta auto-unfurl (phase 2, ต้องใช้ headless browser ฝั่ง server เพราะ Satori ใช้ไม่ได้กับไทย), template "Highlight Entry" (มี note → ต้องมี blur logic)

#### Account & Payment
- [x] User Auth — Google + email/password (NextAuth.js + Credentials provider)
- [x] Email verification (24h token, Resend)
- [x] Password reset (1h token, Resend)
- [x] Login UI — email-first flow: email → register/sign-in/Google-only branches. **"Paper Desk · Sign-in slip" reskin**: split-screen reading desk — left = articles-first paperclipped `.pa-sheet` clippings ("read before you sign up", `PAClip` + framed `ArticleArt`/photo cover + tone category + `PAMark` headline + see-all folder); right = `LoginForm` as a purple folder-tab paper slip (DM-logo header, paper inputs, chunky `.pa-btn` peach primary + paper-outline Google, danger-tint error box, email pill). Mobile (`MobileLoginFeed`) = same paper feed + sticky paper CTA. Theme-adaptive (`--w-ink*` on sheets, `--ink*` loose). Auth logic/step-machine/guest-token handoff unchanged.
- [x] Login wall — unauthenticated users redirect to `/login`
- [x] Rate limiting on email-sending routes (5/hr register+forgot, 3/hr resend-verify) via D1
- [ ] Guest Mode — disabled (app is login-only; `dailymood.me` landing TBD)
- [x] Stripe Checkout + Webhook + Customer Portal (paid subscriptions only, no Stripe trial)
- [x] In-app 14-day free Pro trial — click-to-activate, no credit card, confirmation sheet, global countdown banner, auto-downgrade on expiry
- [x] Pro gating (via `getSessionInfo()` — effective premium = Stripe active OR trial active)
- [x] Pricing page (`/pricing`) — Pro upsell: gradient hero, 14-day trial CTA (free users who haven't tried, → `TrialConfirmSheet`), monthly/yearly plan picker (yearly default, "Save 33%" badge), Stripe-checkout CTA, 6-feature grid, Free-vs-Pro comparison table, success/cancelled states. Analytics tracked (view/plan-select/checkout). API: `POST /api/stripe/checkout`. **Paper Desk reskin** (`pricing-shell.tsx`): feature cards + plan cards = white `.pa-sheet` (active plan = purple ring + `--primary-bg`); comparison = ink-tab folder + `PAClip`; trial CTA = washi-taped lavender sheet; the peach→purple Pro gradient kept as the premium accent (badge/CTAs) but given the chunky offset shadow; success → `pa-btn ink`. Shared `TrialConfirmSheet` (BottomSheet) left themed.
- [x] Subscription Management (`/profile/subscription`) — 3 states: Free (trial CTA + Free vs Pro cards), Trial (countdown card + subscribe CTA), Paid Pro (dark card + billing portal + cancel). DB: `stripeSubscriptionId`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `planInterval`, `trialActivatedAt`, `trialEndsAt` on `users` table. API: `GET /api/subscription`. **Paper Desk reskin** (`subscription-shell.tsx`): feature/usage/Free cards → white `.pa-sheet` (`--w-ink*`); the dark Pro card became a plum folder (`.pa-tab purple` + `PAClip`); trial-status + premium-upsell + trial-banner gradient cards kept (white text) with chunky shadows + a clip; canceling/portal-error/trial-expired notices → tinted `.pa-sheet`; back button → `.pa-icon-btn`. Generic `BottomSheet` cancel + `TrialConfirmSheet` left themed.
- [x] User Menu — burger dropdown (avatar + ☰) → Settings, Logout
- [x] Profile tab (You) — bottom nav tab → `/profile` (replaces old `/settings`); `/settings` redirects to `/profile/settings`

#### Admin Panel (Redesigned)
- [x] **Shared primitives:** `admin-ui.ts` (style constants), `admin-icons.tsx` (SVG nav icons), `AdminPageHeader`, `AdminStatCard` (with delta/trend), `AdminBarChart` (SVG), `AdminBadge` (status/type), upgraded `DataTable` (with rowKey, emptyText, pending state, page number buttons). All admin shells use shared primitives.
- [x] **Sidebar:** Dark sidebar (240px, `var(--ink)` bg) with SVG icons (Home, Users, Edit, Doc, Heart, Sparkle, AI), peach active indicator, version footer. 7 nav items: ภาพรวม, ผู้ใช้, บันทึก, บทความ, Feedback, Mood Packs (divider above), AI Usage. The บทความ item uses `activePrefix: "/admin/article"` so it stays highlighted on both `/admin/articles` and `/admin/article-categories`.
- [x] Article CMS (`/admin/articles`) — full content management, now reachable from the sidebar (was previously URL-only). List page (`AdminArticlesShell`): title/category/status(Published·Draft)/**ยอดอ่าน** (`view_count`)/**ความรู้สึก** (per-article `article_reactions` count, merged in `GET /api/admin/articles` via a grouped count)/เวลาอ่าน/created table, publish toggle + delete, header links "จัดการหมวดหมู่" + "+ สร้างบทความ". Editor (`/admin/articles/[id]` + `/new`, `AdminArticleEditorShell`): bilingual TH/EN title/excerpt/body (Markdown), slug (locked after create), category, tone, tags, cover upload (R2, client-optimized), Preview toggle, reader-reaction breakdown. Categories (`/admin/article-categories`, `AdminArticleCategoriesShell`): CRUD with slug/labels/order + "← บทความ" back link. APIs: `/api/admin/articles[/[id]][/cover]`, `/api/admin/article-categories[/[id]]`. All Paper Desk styled + `requireAdmin`.
- [x] Admin Dashboard (`/admin`) — 4 KPI stat cards with delta (users, premium, revenue MTD via Stripe API, AI calls today), a **บทความ engagement** section (ยอดอ่านบทความ = `sum(articles.view_count)`, คนให้ความรู้สึก = `count(*)` of `article_reactions`), DAU bar chart (30 days, approximate from mood_entries distinct users), recent users table (avatars + Free/Trial/Premium plan + entry count). Stripe revenue via `getStripeRevenueMTD()` with try/catch fallback.
- [x] User Management (`/admin/users`) — DataTable with avatar circles, name+email columns, plan badge (Premium gradient/Free), entry count, date. Search + select filter. Pagination with page numbers. Toggle premium, delete user.
- [x] Entry Browser (`/admin/entries`) — DataTable with AdminBadge for AI source. Filter by userId with clear button.
- [x] AI Usage Dashboard (`/admin/ai`) — 4 stat cards (tokens, cost in THB, NLP calls, Vision calls) + cache stats. AdminBarChart for daily calls. Top users leaderboard. DB: `ai_usage` table extended with `tokens_in`, `tokens_out`, `estimated_cost_thb` columns.
- [x] Feedback Hub (`/admin/feedback`) — Status filter tabs (ทั้งหมด/รอดู/ตอบแล้ว/เก็บถาวร), feedback items with type emoji, star rating, status badge, archive action. DB: `feedbacks` table extended with `type`, `rating`, `status` columns. Server Actions: `archiveFeedback`, `setFeedbackStatus`.
- [x] Mood Pack Manager (`/admin/packs`) — 3-column grid of pack cards with icon preview, AdminBadge for tier, edit/upload/delete actions. Shared style constants.
- [x] Article reader-reaction breakdown — in the article editor (`/admin/articles/[id]`), a "ความรู้สึกของผู้อ่านหลังอ่าน" card shows how many readers reacted with each mood (MoodIcon + count + % bar per mood, in the mood's color) + total. Aggregated from `article_reactions` (`GET /api/admin/articles/[id]` now also returns `reactionCounts`). Empty state when no reactions yet.

#### Admin Notifications
- [x] LINE OA — Push message to admin LINE account on new user signup (Credentials + Google) and successful Stripe checkout. **No user PII** — generic event signals only (`มีคนสมัครใหม่`, `มีคนสั่งซื้อ` + plan/amount). Fire-and-forget via `notifyAdmin()` in `src/lib/line.ts`. Env vars (Railway production only): `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_USER_ID`

#### AI Disclaimers
- [x] AI disclaimer component (`src/components/ai-disclaimer.tsx`) — 5 context-aware variants (chat / analysis / ask / story / parse), i18n via `aiDisclaimer` namespace, 14px muted text inline below AI output. Used on `/ask-ai` (chat), `/insights` (analysis), `/stats` AI summary card (analysis), `/calendar` AI summary + ask result (analysis/ask), `/year-in-pixels/story` AI narrative (story), Smart Log Modal suggestion (parse), home composer AI suggestion (parse), entry detail AI insight (analysis).

#### Localization
- [x] i18n — TH/EN (next-intl)

## API Endpoints

| Method | Endpoint | Tier | Description |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | — | NextAuth handlers (Google + Credentials) |
| POST | `/api/auth/check-email` | — | Returns `{exists, hasPassword}` for email-first login flow |
| POST | `/api/auth/register` | — | Create user + send verify email (rate-limited 5/hr/IP) |
| POST | `/api/auth/verify` | — | Confirm email_verify token → set `emailVerified` |
| POST | `/api/auth/resend-verify` | — | Re-issue verify token (rate-limited 3/hr/IP, silent on unknown email) |
| POST | `/api/auth/forgot` | — | Send reset link (rate-limited 5/hr/IP, silent on unknown email) |
| POST | `/api/auth/reset` | — | Set new password via reset token, auto-verifies email |
| POST | `/api/auth/mobile/login` | — | **Mobile (Bearer)**: email/password → `{accessToken, refreshToken, expiresIn, user}`. Mirrors web Credentials flow (rate-limit 10/15min/IP, verify password, require verified email) |
| POST | `/api/auth/mobile/google` | — | **Mobile (Bearer)**: verify native Google ID token vs Google JWKS → upsert user by email → token pair. Requires `GOOGLE_IOS_CLIENT_ID`/`GOOGLE_ANDROID_CLIENT_ID` env |
| POST | `/api/auth/mobile/apple` | — | **Mobile (Bearer)**: verify Apple identity token vs Apple JWKS → upsert by email → token pair. Name forwarded in body on first sign-in. Required by App Store §4.8 when Google offered. Requires `APPLE_CLIENT_ID` env |
| POST | `/api/auth/mobile/refresh` | — | **Mobile (Bearer)**: rotate refresh token → fresh pair. Reuse of a revoked token revokes the user's whole set (theft detection) |
| POST | `/api/auth/mobile/logout` | — | **Mobile (Bearer)**: revoke the presented refresh token (idempotent) |
| GET/POST | `/api/unsubscribe` | — | One-click marketing opt-out (HMAC token `?u=&sig=`) → `marketing_opt_out = true`. GET shows TH/EN confirm page; POST is RFC 8058 one-click |
| POST | `/api/log/smart` | auth | Multipart text/image → Gemini → suggestion (no DB write) |
| POST | `/api/log/confirm` | auth | Save final entry to D1 |
| GET | `/api/log` | auth | List user entries (date filter, signed image URLs) |
| GET | `/api/log/[id]` | auth | Get single entry (ownership check, signed image URL) |
| PATCH | `/api/log/[id]` | auth | Update entry (mood, note, tags, image, date/time) |
| DELETE | `/api/log/[id]` | auth | Delete entry + R2 image cleanup |
| POST | `/api/upload` | premium | Upload image to R2 (returns imageKey) |
| GET | `/api/calendar` | auth | Calendar data: `?year=Y&month=MM` returns entries + stats; `?year=Y` returns year entries |
| GET | `/api/calendar/timeline` | auth | Timeline entries: `?year=Y&month=MM` returns full entries (id, mood, note, aiSummary, tags, date, createdAt) for the month |
| GET | `/api/calendar/ai` | premium | AI monthly summary + patterns: `?year=Y&month=MM&locale=th`. Cached per month in D1 |
| POST | `/api/calendar/ask` | premium | Ask AI: `{ query, year, month, locale }`. Rate limited 10/hr |
| GET | `/api/stats` | auth | Stats data: `?period=week|month|year`. Returns moodTrend, distribution, avgScore, avgScoreDelta, bestDay, activityImpact (real tag-mood correlation), streak. Year period requires premium |
| GET | `/api/insights` | auth | Weekly AI insights (cached per week in D1 `insights_ai_cache`). Free: preview headline + first sentence only. Premium: full patterns + suggestion |
| POST | `/api/insights/feedback` | premium | Suggestion feedback: `{ weekKey, suggestionTitle, reaction: "up"|"down"|"routine" }` |
| GET | `/api/ai/journal-prompt` | auth | Mood-adaptive journaling prompt: `?moodId=&locale=&moodLabel=`. Free: static prompt. Premium: Gemini-generated + cached per user/mood/date. Does not count against NLP quota |
| GET | `/api/events` | auth | List user's personal events (no params) OR merged holidays+personal events for a month (`?year=&month=`) |
| POST | `/api/events` | auth | Create personal event: `{ label, labelTh?, month, day, emoji? }`. Free: max 3 events (409 limit_reached). Premium: unlimited |
| DELETE | `/api/events/:id` | auth | Delete own personal event |
| GET | `/api/activities` | auth | List all activities (system defaults + user custom) |
| POST | `/api/activities` | auth | Create custom activity: `{ label, labelTh?, emoji? }`. Free: max 5 (409 limit_reached). Premium: max 100 |
| DELETE | `/api/activities/:id` | auth | Delete own custom activity |
| GET | `/api/moods` | any | List system + user's custom moods |
| POST | `/api/moods` | premium | Create custom mood |
| DELETE | `/api/moods/:id` | premium | Delete own custom mood |
| GET | `/api/profile` | auth | Profile data: user info, stats (streak, totalEntries, avgMood), mood signature (30-day mood distribution), tier |
| PATCH | `/api/profile` | auth | Update profile: name, bio, accentColor, locale |
| POST | `/api/profile/avatar` | premium | Upload avatar: FormData image (≤2MB), optimize client-side, R2 upload, delete old, update users.imageKey |
| DELETE | `/api/profile/avatar` | auth | Remove custom avatar: delete R2 object, set users.imageKey to null |
| GET | `/api/profile/achievements` | auth | Achievements: badge progress, earned dates. Auto-earns newly completed badges |
| GET | `/api/subscription` | auth | Subscription state: isPremium, currentPeriodEnd, cancelAtPeriodEnd, planInterval, memberSince, trialActivatedAt, trialEndsAt, trialDaysLeft, isTrialing |
| POST | `/api/trial/activate` | auth | Activate 14-day free Pro trial (one-time, atomic, dual rate-limited 5/hr/IP + 3/hr/user) |
| POST | `/api/stripe/checkout` | auth | Create Stripe Checkout session (monthly/yearly, no trial period) |
| POST | `/api/stripe/portal` | auth | Create Stripe Customer Portal session (return_url: /profile/subscription) |
| POST | `/api/stripe/webhook` | — | Stripe webhook: checkout.session.completed, customer.subscription.updated/deleted → sync isPremium + subscription columns |

## Database Schema (Drizzle on PostgreSQL)

- `users` — id, email, image, **imageKey** (R2 avatar key, Pro upload), **passwordHash** (null for OAuth-only), emailVerified, isPremium, stripeCustomerId, **stripeSubscriptionId**, **currentPeriodEnd**, **cancelAtPeriodEnd**, **planInterval**, **trialActivatedAt** (one-time guard), **trialEndsAt** (expiry timestamp), locale, **bio**, **accentColor**, createdAt
- `accounts`, `sessions` — NextAuth
- `mobile_refresh_tokens` — id PK, userId (FK cascade), tokenHash (SHA-256 of raw, unique), device, createdAt, expiresAt (60d), lastUsedAt, revokedAt — refresh tokens for native mobile app Bearer auth; rotating + theft detection. Access token is a stateless 1h HS256 JWT (`AUTH_SECRET`), verified in `getSessionInfo()` |
- `verification_tokens` — (identifier, token) PK; type = `email_verify` | `password_reset`; expires
- `mood_types` — system defaults (userId NULL) + custom (userId set, premium only)
- `mood_entries` — id, userId, moodTypeId, note, imageKey, tags JSON, sentiment, aiSummary, aiSource, **activityId** (nullable FK→activities), **location** (nullable text, max 200 chars), date, createdAt
- `activities` — id PK, userId (nullable FK→users, null=default), emoji, label, labelTh, order, isDefault, createdAt — 10 system defaults + user custom activities. Free: max 5 custom, Premium: max 100
- `ai_usage` — (userId, date) PK, nlpCount, visionCount
- `rate_limits` — key PK (`<endpoint>:<ip>`), count, resetAt — fixed-window rate limit on D1

- `calendar_ai_cache` — (userId, yearMonth) PK, result JSON, entryCount, generatedAt — caches Gemini-generated calendar AI summaries + patterns per month
- `insights_ai_cache` — (userId, weekKey) PK, result JSON, entryCount, generatedAt — caches weekly AI insights (delta-3 invalidation)
- `suggestion_feedback` — id PK, userId, weekKey, suggestionTitle, reaction (up/down/routine), createdAt — persists user feedback on AI suggestions
- `user_achievements` — (userId, badgeId) PK, earnedAt — tracks when user earned each badge
- `mood_packs` — id PK, label, premium (boolean), createdAt — mood icon pack registry (icons stored on R2 at `{packId}/{moodId}.svg`)
- `journal_prompt_cache` — (userId, moodId, dateKey, locale) PK, prompt text, generatedAt — caches Gemini-generated journaling prompts per user/mood/date (daily rotation for variety)
- `article_reactions` — (userId, articleId) PK (both FK cascade), moodTypeId, createdAt, updatedAt — post-read mood reaction on an article (one row per user/article, upsert on re-react); article_id index for "which content helps" aggregates
- `chart_annotations_cache` — (userId, periodKey) PK, result JSON (annotations array), entryCount, generatedAt — caches AI-detected anomalies/highlights for mood trend chart (delta-3 invalidation)
- `flashback_cache` — entryId PK (FK mood_entries, cascade delete), result JSON (message + pastDate + pastNote), generatedAt — caches Gemini-generated flashback reflections per entry (generate once on first view)
- `personal_events` — id PK, userId (FK cascade), label, labelTh, month (1-12), day (1-31), emoji, createdAt — user's recurring important dates (birthday, anniversary). Free: max 3, Premium: unlimited
- `holiday_cache` — (year, countryCode) PK, data JSON (array of {date, name, localName}), fetchedAt — caches Nager.Date API response per year (30-day TTL)

Migrations: `drizzle/0000_smart_logging.sql`, `0001_add_mood_pack.sql`, `0002_email_password.sql`, `0003_rate_limits.sql`, `0004_ai_summary.sql`, `0005_calendar_ai_cache.sql`, `0006_insights_cache_and_feedback.sql`, `0007_profile_achievements.sql`, `0008_privacy_settings.sql`, `0009_feedback.sql`, `0010_reminders.sql`, `0011_subscription_columns.sql`, `0012_mood_packs.sql`, `0017_avatar.sql`, `0018_activities.sql`, `0019_trial_fields.sql`. Seed: `drizzle/seed.sql` (7 default moods).

## Setup Notes (Railway)

```bash
# Local dev
npm run dev

# Build
npm run build

# Deploy (auto via git push to Railway)
git push origin master
```

Required env (Railway): `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `ADMIN_EMAIL`, `CRON_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_USER_ID`, `UNSUBSCRIBE_SECRET` (HMAC key สำหรับ one-click unsubscribe ของ marketing email — fallback ไปใช้ `AUTH_SECRET`/`NEXTAUTH_SECRET` ถ้าไม่ตั้ง).
