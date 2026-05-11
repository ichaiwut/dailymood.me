# DailyMood.me — Design

## Design Direction
- **Concept:** "Moodly" — vibrant purple/mint/peach palette, big rounded corners, friendly and playful UI
- **Reference:** Moodly Figma (Urbanist + purple #A673F1 primary, mint #85ECCB, peach #FCA45B); neon-vibrant mood colors
- **Approach:** Mobile-first responsive; max-width 768px; light mode (white/lavender canvas)
- **AI-slop avoidance:** No generic gradients or glassmorphism; color comes from mood palette, not decoration

## Typography (next/font)
- **UI sans (Latin)**: `Urbanist` (Google, weight 400-800) — all headings, body, buttons
- **UI sans (Thai)**: `Noto Sans Thai` (Google, weight 400-700) — Thai fallback
- **Style:** Bold (800) for headings, 700 for buttons/labels, 500-600 for body

## Color Palette (hex, light)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#FEFEFE` | near-white canvas |
| `--bg-grad` | `linear-gradient(180deg, #FEFEFE 0%, #F8F6FB 40%)` | subtle lavender gradient bg |
| `--surface` | `#FFFFFF` | card backgrounds |
| `--surface-2` | `#F8F6FB` | lavender tint tile |
| `--hairline` | `#F2F0F5` | borders, dividers |
| `--hairline-2` | `#E6DBF7` | stronger border |
| `--ink` | `#0A0A0A` | near-black (primary text) |
| `--ink-2` | `#5A5A5A` | secondary text |
| `--ink-3` | `#8C8C8C` | tertiary gray |
| `--primary` / `--purple` | `#A673F1` | primary brand (active nav, labels, avatar) |
| `--accent` / `--peach` | `#FCA45B` | CTA buttons, FAB, accent |
| `--mint` | `#85ECCB` | calm/positive mood |
| `--yellow` | `#FDCB56` | neutral mood |
| `--blue` | `#9ACDE2` | sad mood |
| `--lavender` | `#D4BEE4` | anxious mood |

## Mood Colors (7 moods)
| Mood | Emoji | Color | Score |
|---|---|---|---|
| Happy | 😄 | `#FCA45B` (peach) | 5 |
| Calm | 🙂 | `#85ECCB` (mint) | 4 |
| Neutral | 😐 | `#FDCB56` (yellow) | 3 |
| Sad | 😔 | `#9ACDE2` (blue) | 2 |
| Angry | 😠 | `#FEAD8D` (light peach) | 1 |
| Anxious | 😟 | `#D4BEE4` (lavender) | 2 |
| Tired | 😴 | `#A673F1` (purple) | 2 |

## Visual Signatures
- **Rounded cards** — `border-radius: 22–28px`, white bg with 1.5px border `#F2F0F5`, subtle purple-tinted shadow
- **Floating bottom nav** — white pill (`border-radius: 38px`) with purple active state, peach FAB elevated center
- **Streak strip** — purple gradient card (`#A673F1 → #C89BF5`) with big shadow, fire emoji, weekly bars
- **AI Composer card** — white card with purple sparkle badge "AI MOOD ASSISTANT", caret animation, mic/camera/save buttons
- **Mood picker** — horizontal scroll of colored rounded rectangles (76×96px, `border-radius: 22px`) with emoji + label
- **Tag chips** — pill-shaped with white bg + 1.5px border or mood-colored bg for detected mood
- **Icon buttons** — 44×44px with 14px radius, `#F8F6FB` bg
- **Labels** — uppercase 12px `font-weight: 800`, purple color, 0.4px letter-spacing

## Pages / Screens

| Page | Description | Status |
|------|-------------|--------|
| Home | Streak strip, AI composer card, mood picker row, recent entries list | Done (Moodly v1) |
| Login | Email-first flow with Google OAuth, purple/peach buttons | Done |
| Smart Log | Full-screen modal: mood picker → note input → AI analysis → tag extraction → confirm | Done |
| Calendar | Month grid with mood-colored days, mini stats row (avg/streak/logged), year-in-pixels heatmap, prev/next navigation | Done |
| Timeline | Integrated into Calendar tab via segmented toggle (Calendar/Timeline). Reverse-chronological feed grouped by day (TODAY/YESTERDAY/WEEKDAY), mood type filter chips, entry cards (48px mood swatch + title + time + 1-line note + tag emojis). Data: `/api/calendar/timeline`. `/history` redirects to `/calendar` | Done |
| Stats | Functional period toggle (Week/Month/Year, #F4F2F7 pill bg). Average mood line chart (purple #A673F1 gradient fill, adapts to period length). Delta badge (green ↑ / red ↓ vs previous period). Mood mix donut (center label adapts to period). Highest Mood Day card (full-width mood-colored bg + emoji). Real activity impact from tag-mood correlation — diverging bars (purple=positive, peach=negative), tag emoji heuristic, min 5 entries/tag, cap 6 rows. Free: rows 4-6 blurred with gradient overlay + "See all with Premium" pill. Year toggle disabled for free (dimmed + inline upsell toast). Insights link card (pastel gradient #FAF7FE→#FDE8DA). Bottom nav: Stats tab replaces Insights tab (bar chart icon) | Done |
| AI Insights | Hero gradient summary card (#A673F1→#C89BF5→#FCA45B) with Read Full (inline expand) + Share (Web Share API / clipboard fallback with "Copied!" toast). Pattern cards: tag badges (PATTERN orange #FCA45B, CORRELATION purple #A673F1, ALERT red #F26B6B) + optional sparkline SVG (60×24, purple line). Suggestion card (#FAFFF8 bg, #DEF1D5 border): green "TRY THIS" badge, thumbs up/down + "Add to routine" feedback pills (persisted in D1). Streak card (#FAF7FE bg, fire emoji). Free: hero preview (headline + first sentence only) + locked overlay. Premium: full feed. Cached weekly in D1 (delta-3 invalidation). Loading skeleton, empty state, too-few-entries state, error state. Back to Stats link in header | Done |
| Entry Detail | Mood hero card (full-width, mood-colored bg, giant faded 200px emoji), note section, AI summary gradient card (#F4EBFE→#FDE8DA) with Gemini-generated Thai summary (`**bold**` → `<strong>`; teaser fallback when no summary), tags pills, edit/compare buttons | Done |
| Edit Entry | Mood hero card with "Tap to change" badge + inline mood picker, editable note textarea with char count, "Re-analyze with AI" gradient button + mic, tags pills (removable × + add input), "SUGGESTED FROM YOUR NOTE" dashed-border AI tag pills, moment section with Replace/Delete overlay buttons, date/time inputs, red "Delete entry" button, delete confirm modal, fixed bottom bar (Cancel + "Save changes" black pill) | Done |
| Settings | Custom mood manager (Premium), mood pack picker (grid cards, 2-col, preview 4 icons per pack, selected=primary border + checkmark, PRO badge on premium packs, lock icon + "Upgrade →" for locked packs, instant save on tap with rollback on error) | Done (replaced by Profile → Settings) |
| Profile Overview | "You" tab. Hero card (purple→peach diagonal gradient, white text, 28px radius, avatar 76px initials circle with accent color + edit pencil overlay). Hero stats row (streak/entries/avg in translucent white panel). Mood signature card (eyebrow label, headline, horizontal stacked bar, top 3 caption). Achievements horizontal scroll (colored ring earned, dashed locked). Settings list (6 rows, color-tinted 42px icon tiles, chevron). Footer (help/sign out outline buttons, version). Bottom nav "You" tab → `/profile` | Done |
| Edit Profile | Modal top bar (back + "Edit profile" + Save purple text). Avatar 112px circle + camera FAB + 6-color accent picker below. Fields: Display name (gray pill input), Email (read-only + verified badge), Bio (textarea ≤160 chars). Delete account outline button at bottom | Done |
| Profile Settings | Grouped sections on tinted bg. Reminders (check-in toggle, time, days). Appearance (theme 3-option segmented: Light/Dark/Auto; mood palette 3-option: Neon/Tempered/Mono with swatch previews). Language (EN/TH radio). Privacy (toggles). Custom moods (Premium). Data (export, clear). About (help, feedback, terms) | Done |
| Achievements | Hero progress (cream→lavender gradient, 88px circular ring, % + "X of Y unlocked"). Filter pills (All/Earned/In progress/Locked with counts, black active/gray inactive). 2-col badge grid (earned: white card, colored 2px border, icon tile, ✓ date; in-progress: lavender card, dashed border, grayscale icon, progress bar + %) | Done |
| Subscription | `/profile/subscription`. Hero card (deep purple gradient #7B4FD3→#A673F1→#C89BF5, 28px radius, glow shadow). Status pill (✨ ACTIVE / ⏳ ENDING SOON). Plan title "DailyMood Pro" + renewal date. 2-col stat panel (NEXT CHARGE + MEMBER FOR) on translucent white. Billing section: NavRow rows (💳 Payment method, 📋 Billing history, 💡 Switch to yearly). All actions → Stripe Customer Portal. Cancel: outline gray button → BottomSheet (😢 emoji, confirm/keep buttons). Canceling state: peach notice band with resubscribe CTA. Free users: centered upgrade card with ✦ icon + "View Pro plans" link to `/pricing` | Done |
| Admin Dashboard | `/admin`. Separate sidebar layout (240px fixed left, `var(--surface)` bg, `var(--hairline)` right border). DailyMood logo + purple "ADMIN" badge. Nav links with active state (purple bg + right border). Content area: `var(--surface-2)` bg, max-width 1200px. TH-only UI, no i18n. Auth: `ADMIN_EMAILS` env var email check via session | Done |
| Admin Users | `/admin/users`. Search input + filter pills (All/Premium/Free). Zebra-striped table with email (purple link), name, premium toggle button (pill badge), entry count, date, delete button (red outline). Pagination. User detail: info grid, stat cards, entries table | Done |
| Admin Entries | `/admin/entries`. Full entries table with mood emoji, user email link, note preview, tags, AI source badge (purple pill for AI, gray for manual), image indicator, delete button. Filter by userId | Done |
| Admin AI Usage | `/admin/ai`. Stat card grid (6 cards). Stacked bar chart (purple=NLP, peach=Vision) 30 days. Top users leaderboard with rank + email link + total count | Done |
| Admin Feedback | `/admin/feedback`. Two-panel grid: user feedback cards (surface-2 bg, message + email link + date + delete) + AI suggestion feedback cards (title + thumbs up/down/routine counts with colored icons) | Done |
| Admin Mood Packs | `/admin/packs`. Create form (ID regex input + label + premium checkbox + purple "สร้าง" button). Pack cards: header (label + Free/Premium badge + pack ID), 7-icon preview grid (48px tiles on surface-2, R2 CDN URLs with onError hide). Edit inline (label + premium). Upload panel (surface-2 bg, 7 file inputs for SVG, selected=purple border, upload count button). Delete (red, blocked for default pack). | Done |
| 404 Not Found | Standalone (no TopBar/BottomNav). Back arrow + "Error 404" header. Blue circle (200px) kawaii character (dot eyes + smile) with peach "?" floating badges. Faded "404" giant text behind (purple 8% opacity). Title + subtitle + body copy. Black pill "Back to home" button (home icon) + ghost "Report broken link" button (links to profile feedback). `fade-in` + `pop` animations | Done |
| 403 Forbidden | `/forbidden`. Standalone. Back arrow + "Error 403" header. Orange circle (200px) kawaii character (closed eyes + blush) with purple lock badge (44px circle, bottom center) + purple sparkle decorations. Faded "403" giant text. Purple uppercase "PRIVATE ENTRY" label. Title + body copy. Purple pill "Sign in to different account" button (lock icon) + ghost "Back to my journal" button | Done |
| Privacy | `/privacy`. Back arrow + "Privacy" title header. Hero card (purple gradient #7B4FD3→#A673F1→#C89BF5, 28px radius, shield 🛡️ floating icon, "YOUR DATA" label, bilingual title, 3 badge pills: ENCRYPTED / NO TRACKERS / NO ADS). "TL;DR" purple label + 4 summary rows in card (icon in colored square + title + body). 7 numbered sections (purple number circles + bold title + body paragraph with **bold** rendering). `fade-in` animation | Done |
| Terms | `/terms`. Back arrow + "Terms" title header. Hero card (peach gradient #E6952E→#FCA45B→#FDCB56, 28px radius, handshake 🤝 floating icon, "THE DEAL" label, bilingual title, effective date text). "THE SHORT VERSION" peach label + 4 summary rows (✅💛💎❤️ icons). 7 numbered sections (peach number circles). Same structure as Privacy | Done |

## Components

| Component | Purpose |
|---|---|
| `BottomSheet` | Generic reusable bottom sheet: scrim (`rgba(10,10,10,0.32)`), panel slides up from bottom (28px top corners), drag handle, body scroll lock, Escape dismiss, `sheet-open`/`sheet-close` CSS animation with deferred unmount |
| `DaySheet` | Calendar day sheet content: date header with prev/next arrows, fetches `/api/log?date=`, renders `EntryMiniCard` list, empty state with "+ Log mood" CTA, loading skeleton |
| `EntryMiniCard` | Compact entry card for sheets: mood color bg (20% alpha) with ghost icon, mood label + time, 2-line note clamp, tag pills, Edit icon + "Open full entry" black pill CTA |
| `AiSummaryCard` | Calendar AI summary card: gradient bg (#FAF7FE→#FDE8DA), ✨ header, Gemini 2-3 sentence summary with **bold** → `<strong>`, 3 highlight chips (Best day/Hardest day/Top trigger), "Tell me more →" CTA. Free tier: 1st sentence + blurred chips + "Unlock with Premium" |
| `PatternsFeed` | AI pattern cards below calendar grid: icon + explanation + "View →". Locked state for free users |
| `AskAiBar` | NL search bar: dashed lavender border, rotating placeholder queries, expands on tap, inline answer with date chips |
| `TopBar` / `TopBarClient` | Purple avatar circle (initials) + day label + greeting with name + search/bell icon buttons |
| `BottomNav` | Floating white pill nav: Home, Calendar, FAB (+), Stats, Profile. Purple active, peach FAB |
| `HomeShell` | Home page: streak strip, AI composer, mood picker row, recent entries |
| `SmartLogModal` | Full modal: mood grid, note textarea (purple border), voice/camera, AI detection with gradient section, tag pills |
| `MoodIcon` | SVG mood icon from R2 pack, falls back to emoji |
| `MoodPicker` | 7-mood grid (legacy, replaced by inline row in HomeShell) |
| `LoginForm` | Email-first Linear-style: email → password / register / google_only / verify_sent |
| `VoiceButton` | Browser STT (Web Speech API), locale-aware (TH/EN) |
| `StatsShell` | Stats page: functional period toggle (Week/Month/Year with Year=premium gate), mood line chart card (SVG, adapts to period length, delta badge), mood mix donut + highest mood day 2-col grid, real activity impact panel (tag-mood correlation, diverging bars, premium blur on rows 4-6), Insights link card. Accepts `tier` prop |
| `InsightsShell` | AI Insights page: hero gradient summary card (Read Full inline expand + Share via Web Share/clipboard), pattern cards (tag badges + optional sparkline), suggestion card (thumbs up/down + "Add to routine" feedback pills → POST `/api/insights/feedback`), streak card. Free: preview + locked. Premium: full feed. Cached weekly. Accepts `tier` prop |
| `TimelineFeed` | Timeline view inside Calendar tab: mood type filter chips, day-grouped entry cards (mood swatch, title from aiSummary/note, time, tag emojis), tap → entry detail. Replaces `HistoryShell` |
| `HistoryShell` | ~~History/Timeline page~~ (deprecated — redirects to Calendar tab) |
| `EntryDetail` | Entry detail page: mood hero card with giant emoji + intensity bar, note section, AI summary gradient card, tag pills, edit/compare buttons |
| `ProfileShell` | Profile overview: hero gradient card (accent-aware gradient, avatar initials, stats row), mood signature card (stacked bar + headline), achievements horizontal scroll, settings list (icon tiles), sign out confirmation sheet. Accepts `tier` prop |
| `ProfileEditShell` | Edit profile form: avatar + accent color picker (6 colors), display name + email (read-only) + bio fields, delete account button. Fetches/patches `/api/profile` |
| `ProfileSettingsShell` | Settings: reminders section (toggle + time + days), appearance (theme + palette segmented pickers), language radio (EN/TH with locale switch), privacy toggles, custom moods (Premium), data (export + clear), about links. Accepts `isPremium` prop |
| `AchievementsShell` | Achievements: hero progress ring (SVG circle, % unlocked), filter pills (All/Earned/In progress/Locked), 2-col badge grid with BadgeCard sub-component (earned/in-progress/locked states). Fetches `/api/profile/achievements` |
| `SubscriptionShell` | Subscription management: hero gradient card (deep purple), status pill, plan title, renewal date, 2-col stats (next charge + member-for). Billing NavRows (payment, history, switch yearly) → Stripe Portal. Cancel BottomSheet. Free: upgrade card. Fetches `GET /api/subscription`, portal via `POST /api/stripe/portal` |
| `AdminSidebar` | Admin sidebar nav (client): 240px fixed left, logo + "ADMIN" badge, nav links with active state (usePathname), email footer. Inline styles using CSS vars |
| `StatCard` | Admin reusable metric card: label (uppercase 11px), large value (28px bold), optional sub text and custom color |
| `DataTable` | Admin generic table: typed columns with optional render fn, zebra striping, pagination (Prev/Next + page counter). Thai labels |
| `UsersShell` | Admin users: search input + filter pills + user table with premium toggle (Server Action), delete button (confirm dialog), pagination via URL params |
| `UserDetailShell` | Admin user detail: back link, info card (toggle premium + delete buttons), info grid, stat cards, recent entries table |
| `EntriesShell` | Admin entries: full table with mood emoji, user link, note, tags, AI source badge, image indicator, delete. userId filter. Pagination |
| `AiUsageShell` | Admin AI usage: stacked bar chart (div-based, purple NLP + peach Vision) + top users leaderboard (ranked list with email links) |
| `FeedbackShell` | Admin feedback: two-panel grid — user feedback cards (message + email + date + delete) + suggestion feedback aggregation (title + reaction counts) |
| `PacksShell` | Admin mood packs: create form, pack cards (preview + edit + upload + delete), SVG file upload with FormData to `/api/admin/packs/[id]/upload` |
| `NotFoundCharacter` / `ForbiddenCharacter` | Pure CSS+SVG kawaii circle characters for error pages. 404: blue circle with dot eyes + smile + peach "?" badges. 403: orange circle with closed eyes + blush + purple lock badge + sparkles. Both use `pop` animation on badges |
| `NotFoundPage` | 404 page client component: standalone layout (back arrow + header), character + faded "404" text, copy section, home + report buttons. Uses `useTranslations("errors")` |
| `ForbiddenPage` | 403 page client component: standalone layout, character + faded "403" text, "PRIVATE ENTRY" label, copy, sign-in + back buttons. Uses `useTranslations("errors")` |
| `PrivacyPage` | Privacy policy page: hero card (purple gradient + shield emoji + badge pills), TL;DR summary card (4 icon rows), 7 numbered sections with `**bold**` rendering. Uses `useTranslations("privacy")` |
| `TermsPage` | Terms of service page: hero card (peach gradient + handshake emoji + effective date), TL;DR summary card (4 icon rows), 7 numbered sections. Uses `useTranslations("terms")` |

## Smart Log Flow (UX)

1. User taps a mood on home row (or AI composer card, or FAB +) → modal opens with mood pre-selected
2. "How was your day?" heading + mood picker grid + note textarea (purple-bordered)
3. **Quick Save** (no text) — saves mood only as manual entry
4. **AI Analyze** (with text) — Gemini returns mood + tags → gradient detection panel with animated tag pills
5. User edits mood, removes/adds tags, then taps **Save** → entry appears in timeline

## Design Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-02 | Modern + Vivid style | ผู้ใช้เลือก |
| 2026-05-02 | Mobile-first | เผื่อ mobile app ในอนาคต |
| 2026-05-05 | AI confirm flow (suggest → edit → save) | ลด false positives จาก NLP |
| 2026-05-05 | Multi-entry/day timeline | สอดคล้องกับ smart logging |
| 2026-05-05 | Client-side image optimize (WebP, max 1600px) | ลด Worker CPU + bandwidth |
| 2026-05-05 | Signed read URLs for R2 (1h TTL) | Privacy ของรูปผู้ใช้ |
| 2026-05-06 | Default mood icons → custom SVG pack hosted on R2 | Unified brand-curated illustration set |
| 2026-05-07 | **Moodly redesign** — drop Clean Wellness → Moodly style. Urbanist font, purple/mint/peach palette, floating pill nav, streak strip, AI composer card. Based on Moodly Figma reference | ผู้ใช้ซื้อ Moodly Figma และต้องการ redesign ทั้งหมดให้เหมือน reference |
| 2026-05-07 | Mood colors: peach=happy, mint=calm, yellow=neutral, blue=sad, lavender=anxious, purple=tired | จับคู่กับ Moodly palette |
| 2026-05-07 | AI Composer card on home (not modal) with caret animation | Centerpiece UX — AI ควรเด่นชัดบนหน้า Home |
| 2026-05-07 | Implement all 10 design screens from Claude Design handoff | Calendar, Stats, AI Insights, History, Entry Detail — ทั้งหมดจาก Moodly design prototype |
| 2026-05-09 | Calendar Day Sheet (bottom sheet) | Daylio-style bottom sheet on day tap — keeps calendar context vs. full-screen push. Generic `BottomSheet` base extracted for reuse |
| 2026-05-09 | Calendar AI features (Summary + Patterns + Ask AI) | AI turns calendar from passive log to reflective surface. Single Gemini call per month for summary+patterns, cached in D1. Premium gating: free sees 1st sentence + blur + locked states. Pattern rings overlay on grid. Ask AI bar at bottom with NL search |
| 2026-05-09 | Timeline view merged into Calendar tab | Two views of one dataset via segmented control. Reuses stats-shell segmented control pattern (#F4F2F7 track, white pill). Filter chips = mood types (not tags). Entry title = aiSummary ?? first line of note ?? mood label. Separate `/api/calendar/timeline` endpoint (no signed URLs = faster). `/history` redirects |
| 2026-05-09 | Stats page redesign — functional period toggle + real activity impact | Period toggle now fetches different data windows (7/30/365d). Activity impact uses real tag-mood correlation from entries (no Gemini, pure data). "Best Day" → "Highest Mood Day" (copy guardrails). Delta badge computed server-side vs previous period. Year toggle premium-gated. Bottom nav: Stats replaces Insights tab |
| 2026-05-09 | AI Insights redesign — caching + feedback + hero actions | Weekly D1 cache (delta-3 invalidation like calendar AI). Suggestion feedback persisted in `suggestion_feedback` table. Hero card gets Read Full + Share. Pattern cards get mini sparkline SVG. Free tier: preview headline + locked state (data stripped at API level). Stats → Insights via link card |
| 2026-05-10 | Profile tab ("You") — 4 screens | Profile Overview replaces old Settings as bottom nav destination. Hero card with user-selectable accent color (6 options) driving gradient. Mood signature computed from 30-day distribution. Achievements with 12 badges, auto-earned on API check. Settings grouped into Reminders/Appearance/Language/Privacy/Data sections. `/settings` redirects to `/profile/settings` |
| 2026-05-10 | Subscription Management (`/profile/subscription`) | PRD adapted from iOS StoreKit → web Stripe. All billing actions via Stripe Customer Portal (no custom billing UI). Deep purple hero card distinct from profile's accent-based gradient. Subscription state stored in DB via webhook (stripeSubscriptionId, currentPeriodEnd, cancelAtPeriodEnd, planInterval) for fast reads. Cancel confirmation via reusable BottomSheet. Free users see upgrade CTA (never hidden per premium-gating rule). Profile NavRow links premium→subscription, free→pricing |
| 2026-05-10 | Admin Panel (`/admin`) — 5 pages | Separate layout outside `[locale]` — sidebar dashboard style, no TopBar/BottomNav. Auth via `ADMIN_EMAILS` env var (hardcoded email, no DB schema change). Server Components + Server Actions (no admin API routes). TH-only UI. Reuses same CSS variables and Tailwind. Dashboard → Users (CRUD) → Entries (browse/delete) → AI Usage (charts) → Feedback (user + AI suggestion) |
| 2026-05-11 | 404 + 403 error pages — kawaii character style | Standalone pages (no TopBar/BottomNav) matching Moodly Figma reference. Pure CSS+SVG characters (no image assets). 404: blue circle + "?" badges, reassuring copy. 403: orange circle + lock badge + sparkles, private entry context. Root `not-found.tsx` wraps own `NextIntlClientProvider`. 403 at `/forbidden` inside `[locale]` tree. "Report broken link" links to existing profile feedback feature |
| 2026-05-11 | Privacy + Terms legal pages | Human-readable legal pages matching Moodly design. Same structure: gradient hero card (purple for privacy, peach for terms), TL;DR summary with icon rows, numbered detail sections. Content adapted to DailyMood's actual stack (Cloudflare D1/R2, Gemini, Stripe, Resend). No auth required. Linked from Settings About section (NavRow with href) + Pricing footer. Bilingual TH/EN via i18n |
