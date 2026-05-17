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
- Free / Premium (Stripe)
- Stripe checkout/webhook ยังไม่ได้ wire — premium flag flip ผ่าน DB ก่อน

## User Tiers

| | Guest | Free | Premium |
|---|---|---|---|
| Storage | localStorage (24h TTL) | D1 | D1 |
| Quick Icons | ✓ | ✓ | ✓ |
| Mini Journal | ✓ | ✓ | ✓ |
| AI NLP (Gemini) | — | 3 ครั้ง/วัน | ไม่จำกัด |
| AI Vision (Gemini) | — | — | ✓ |
| Custom Moods | — | — | ✓ (สูงสุด 13 เพิ่มเติม) |

## Features

### Planned

#### Mood System
- [x] Mood Log — Quick Icons (7 default moods)
- [x] Mini Journal — note สั้นๆ
- [x] Custom Mood Types (Premium)
- [x] Multi-entry per day (timeline)
- [x] Mood Icon Packs — SVG/WebP/PNG icons hosted on R2 at `{packId}/{moodId}.{format}`; default pack `set_486038`. `users.mood_pack` stores selection. Free users can switch between free packs; premium packs require Pro. Profile page has "Mood Icons" section with grid cards showing preview of all packs.

#### Smart Logging (AI)
- [x] Smart Log Modal — text + voice + image
- [x] AI NLP Tagging (Gemini) — auto-extract mood + tags + sentiment + AI summary
- [x] AI Summary — Gemini generates 1-3 sentence Thai summary with **bold** key phrases; saved to `mood_entries.ai_summary`; entries without summary show teaser fallback
- [x] AI Vision (Premium) — extract context tags from photo
- [x] Voice input — Web Speech API (TH/EN)
- [x] Confirm flow — user แก้/ยืนยัน suggestion ก่อน save
- [x] Daily AI rate limit — Free 5 NLP/วัน

#### Visualization
- [x] Today's Timeline — entry grid (1/2/3 cols) with horizontal day-axis above (spine + mood-colored dots positioned by time-of-day, pulsing "Now" cap on the right)
- [x] Mood Calendar — monthly mood grid (colored day cells by dominant mood), year-in-pixels (12×31 grid), stat cards (AVG MOOD with delta, STREAK, LOGGED), month navigation. API: `/api/calendar?year=Y&month=MM`
- [x] Calendar Day Sheet — tap a day cell → bottom sheet slides up showing that day's entries. Drag handle, date header with prev/next day arrows, mood card(s), note preview, tag chips, Edit + "Open full entry" CTA. Empty day shows "+ Log mood" button (opens SmartLogModal with preset date). Future dates disabled + toast. Multi-entry days show stacked cards. Dismiss via scrim tap, swipe, or Escape key.
- [x] Stats Page (`/stats`) — functional period toggle (Week/Month/Year), average mood line chart (SVG, adapts to period), mood mix donut, highest mood day card, real activity impact from tag-mood correlation (min 5 entries/tag, cap 6 rows, diverging bars). Delta badge vs previous period. Premium: Year toggle + activity rows 4-6 unlocked. Free: rows 4-6 blurred. Link to AI Insights. Bottom nav linked (replaced Insights tab). API: `/api/stats?period=week|month|year`
- [ ] Streak & Habits

#### Profile & Account
- [x] Profile Overview (`/profile`) — hero card (purple→peach gradient, avatar initials with accent color, name, email, member-since, premium badge), hero stats row (streak 🔥, entries 📓, avg mood 😄 — tappable deep-links), mood signature card (stacked bar of mood distribution over 30 days + headline + top 3 %s), achievements preview row (horizontal scroll, 6 visible), settings shortcut list (notifications, language, privacy, export, subscription — color-tinted icon tiles), footer (help/sign out/version). API: `GET /api/profile`, `PATCH /api/profile`
- [x] Edit Profile (`/profile/edit`) — avatar upload (Premium, 2MB limit, client-side WebP optimize via `optimizeImage()`, R2 storage at `users/{userId}/avatar/{ulid}.webp`, signed read URLs, remove button), accent color picker (6 colors), display name (≤30 chars), email (read-only with verified badge), bio (≤160 chars), delete account button. API: `POST /api/profile/avatar`, `DELETE /api/profile/avatar`
- [x] Settings (`/profile/settings`) — Reminders (daily check-in toggle, time, days), Appearance (theme Light/Dark/Auto, mood palette Neon/Tempered/Mono), Language (EN/TH radio), Privacy (hide previews, anonymous insights toggles), Custom moods (Premium), Data (export, clear all entries), About (help, feedback, terms)
- [x] Achievements (`/profile/achievements`) — hero progress ring (% unlocked), filter pills (All/Earned/In progress/Locked with counts), 2-col badge grid (earned=colored border+date, in-progress=dashed+progress bar, locked=grayscale). 12 badges: streak 7/30/100/365, entries 50/100/500, early bird, night owl, tag master, zen 30, photo journal. DB: `user_achievements` table, auto-earn on check. API: `GET /api/profile/achievements`

#### Pages
- [x] AI Insights page (`/insights`) — Gemini-powered weekly insights feed. Hero summary card (lavender→peach gradient) with Read Full + Share (Web Share API / clipboard). Pattern cards with mini sparkline viz + tag badges (PATTERN/CORRELATION/ALERT). Suggestion card with thumbs up/down + "Add to routine" feedback (persisted in D1 `suggestion_feedback` table). Streak card. Cached per week in D1 `insights_ai_cache` table (delta-3 invalidation like calendar AI). Premium: full access. Free: hero preview (headline + first sentence) + locked state. Accessed via Stats page link (not in bottom nav). API: `GET /api/insights`, `POST /api/insights/feedback`.
- [x] Timeline view (Calendar tab) — segmented toggle Calendar/Timeline on the Calendar page; reverse-chronological feed of entries grouped by day (TODAY/YESTERDAY/WEEKDAY), mood filter chips, entry cards with mood swatch + title + time + note preview + tag emojis. Tap → entry detail. Data: `/api/calendar/timeline`. `/history` page redirects to `/calendar`.
- [x] ~~History/Timeline page (`/history`)~~ — redirects to Calendar tab (Timeline view)
- [x] Mood Detail page (`/entry/[id]`) — mood hero card with giant faded emoji, note section, AI summary, tags, three-dot menu → edit
- [x] Edit Entry page (`/entry/[id]/edit`) — 2-col desktop layout (grid-2col). Left: page header (entry number + weekday/date title), horizontal mood picker row (7 moods), date/time/period (เช้า/บ่าย/เย็น) 3-field row with auto-derived period, note textarea with toolbar (bold toggle via `**markdown**`, voice, image, AI re-analyze), tags with # pills + inline add + suggested tags row. Right sidebar (sticky): live preview card (mood-colored, updates real-time), AI insight card with current summary, keyboard shortcuts card (⌘S save, Esc cancel, ⌘↵ AI), danger zone card (delete with confirm). Mobile: sidebar hidden, date/time stacks vertically, AI re-analyze button wraps to new row, danger zone duplicated inline (since sidebar is hidden), bottom bar (Cancel + Save) rendered via portal to escape stacking context. API: `PATCH /api/log/[id]`, `DELETE /api/log/[id]`
- [x] 404 Not Found page — standalone (no TopBar/BottomNav), blue kawaii circle character with "?" badges, faded "404" bg text, back-to-home + report-broken-link buttons. Root-level `not-found.tsx` with i18n (TH/EN)
- [x] 403 Forbidden page (`/forbidden`) — standalone, orange kawaii circle character with lock badge + sparkles, faded "403" bg text, "PRIVATE ENTRY" label, sign-in-to-different-account + back-to-journal buttons. i18n (TH/EN)
- [x] Privacy page (`/privacy`) — hero card (purple gradient, shield icon, ENCRYPTED/NO TRACKERS/NO ADS badges), TL;DR summary (4 items with icons), 7 numbered sections covering data collection, AI, images, third-party services, retention, rights, contact. i18n TH/EN. Linked from Settings + Pricing footer
- [x] Terms page (`/terms`) — hero card (peach gradient, handshake icon, effective date), TL;DR summary (4 items: age, conduct, billing, medical disclaimer), 7 numbered sections covering accounts, acceptable use, premium, content ownership, liability, changes, contact. i18n TH/EN. Linked from Settings + Pricing footer

#### Calendar AI (Premium)
- [x] AI Monthly Summary card — replaces stat tiles for premium; Gemini-generated 2-3 sentence summary with **bold** key phrases + 3 highlight chips (Best day, Hardest day, Top trigger) + "Tell me more →" to Insights. Free users see 1st sentence + blurred chips + upgrade CTA. Cache: D1 `calendar_ai_cache` table, invalidate on ≥3 new entries. API: `GET /api/calendar/ai`
- [x] Pattern rings on calendar grid — ★ best day (peach ring), ◌ recurring pattern (purple ring), ◌ anomaly (lavender ring). Toggle pill "✨ AI patterns" + legend. Premium only.
- [x] Patterns Detected feed — 2-3 AI-detected pattern cards below grid (icon, title, explanation, "View →"). Premium only; free sees locked state.
- [x] Ask AI search bar — NL search wired to Gemini. Dashed border bar with rotating placeholder queries. POST `/api/calendar/ask` with rate limit (10/hr). Returns answer + matching dates as clickable chips. Premium only.

#### AI Features (Gemini) — Planned
- [ ] AI Mood Analysis (trends)
- [ ] AI Suggestions
- [ ] AI Summary (weekly)
- [ ] AI Chatbot

#### Social & Sharing
- [ ] Share Card

#### Account & Payment
- [x] User Auth — Google + email/password (NextAuth.js + Credentials provider)
- [x] Email verification (24h token, Resend)
- [x] Password reset (1h token, Resend)
- [x] Login UI — email-first flow (Linear-style): email → register/sign-in/Google-only branches
- [x] Login wall — unauthenticated users redirect to `/login`
- [x] Rate limiting on email-sending routes (5/hr register+forgot, 3/hr resend-verify) via D1
- [ ] Guest Mode — disabled (app is login-only; `dailymood.me` landing TBD)
- [x] Stripe Checkout + Webhook + Customer Portal
- [x] Premium gating (via `users.isPremium`)
- [x] Subscription Management (`/profile/subscription`) — hero card (plan name, status pill, renewal date, next charge, member-for stats), billing action rows (payment method, billing history — all via Stripe Customer Portal), switch nudge (monthly→yearly save 20%), cancel with BottomSheet confirmation → portal. Free users see upgrade CTA. DB: `stripeSubscriptionId`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `planInterval` on `users` table, populated by webhook. API: `GET /api/subscription`
- [x] User Menu — burger dropdown (avatar + ☰) → Settings, Logout
- [x] Profile tab (You) — bottom nav tab → `/profile` (replaces old `/settings`); `/settings` redirects to `/profile/settings`

#### Admin Panel
- [x] Admin Dashboard (`/admin`) — sidebar layout (240px fixed), auth via `ADMIN_EMAILS` env var (email hardcode), TH-only UI. Dashboard overview with stat cards (total users, premium count, total entries, 7d entries, new users 30d, AI calls today/30d, feedback count) + recent feedback list.
- [x] User Management (`/admin/users`) — searchable user table with filter pills (All/Premium/Free), pagination (50/page). Toggle premium status, delete user (cascade + R2 cleanup). User detail page (`/admin/users/[id]`) with full profile info, Stripe data, auth providers, recent entries, AI usage stats.
- [x] Entry Browser (`/admin/entries`) — all entries table with user email, mood emoji+label, AI source badge, image indicator. Privacy-first: note/tags/AI summary never sent to admin. Filter by userId. Delete entry (+ R2 cleanup). Pagination.
- [x] AI Usage Dashboard (`/admin/ai`) — stat cards (NLP/Vision 7d + 30d, calendar/insights cache row counts). Stacked bar chart of daily AI calls (30 days). Top 10 AI users leaderboard.
- [x] Feedback Hub (`/admin/feedback`) — two-panel layout: user feedback messages (paginated, deletable, linked to user detail) + AI suggestion feedback aggregation (title, thumbs up/down/routine counts).
- [x] Mood Pack Manager (`/admin/packs`) — CRUD for mood icon packs. Create pack (ID + label + premium flag), edit label/premium, delete (resets users to default). Upload 7 SVG icons per pack to R2 (`{packId}/{moodId}.svg`). Icon preview grid. DB: `mood_packs` table (id, label, premium, createdAt). API: `GET/POST /api/admin/packs`, `GET/PATCH/DELETE /api/admin/packs/[id]`, `POST /api/admin/packs/[id]/upload`. User-facing: `GET /api/moods/packs` returns dynamic pack list.

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
| GET | `/api/moods` | any | List system + user's custom moods |
| POST | `/api/moods` | premium | Create custom mood |
| DELETE | `/api/moods/:id` | premium | Delete own custom mood |
| GET | `/api/profile` | auth | Profile data: user info, stats (streak, totalEntries, avgMood), mood signature (30-day mood distribution), tier |
| PATCH | `/api/profile` | auth | Update profile: name, bio, accentColor, locale |
| POST | `/api/profile/avatar` | premium | Upload avatar: FormData image (≤2MB), optimize client-side, R2 upload, delete old, update users.imageKey |
| DELETE | `/api/profile/avatar` | auth | Remove custom avatar: delete R2 object, set users.imageKey to null |
| GET | `/api/profile/achievements` | auth | Achievements: badge progress, earned dates. Auto-earns newly completed badges |
| GET | `/api/subscription` | auth | Subscription state: isPremium, currentPeriodEnd, cancelAtPeriodEnd, planInterval, memberSince |
| POST | `/api/stripe/checkout` | auth | Create Stripe Checkout session (monthly/yearly) |
| POST | `/api/stripe/portal` | auth | Create Stripe Customer Portal session (return_url: /profile/subscription) |
| POST | `/api/stripe/webhook` | — | Stripe webhook: checkout.session.completed, customer.subscription.updated/deleted → sync isPremium + subscription columns |

## Database Schema (Drizzle on PostgreSQL)

- `users` — id, email, image, **imageKey** (R2 avatar key, Premium upload), **passwordHash** (null for OAuth-only), emailVerified, isPremium, stripeCustomerId, **stripeSubscriptionId**, **currentPeriodEnd**, **cancelAtPeriodEnd**, **planInterval**, locale, **bio**, **accentColor**, createdAt
- `accounts`, `sessions` — NextAuth
- `verification_tokens` — (identifier, token) PK; type = `email_verify` | `password_reset`; expires
- `mood_types` — system defaults (userId NULL) + custom (userId set, premium only)
- `mood_entries` — id, userId, moodTypeId, note, imageKey, tags JSON, sentiment, aiSummary, aiSource, date, createdAt
- `ai_usage` — (userId, date) PK, nlpCount, visionCount
- `rate_limits` — key PK (`<endpoint>:<ip>`), count, resetAt — fixed-window rate limit on D1

- `calendar_ai_cache` — (userId, yearMonth) PK, result JSON, entryCount, generatedAt — caches Gemini-generated calendar AI summaries + patterns per month
- `insights_ai_cache` — (userId, weekKey) PK, result JSON, entryCount, generatedAt — caches weekly AI insights (delta-3 invalidation)
- `suggestion_feedback` — id PK, userId, weekKey, suggestionTitle, reaction (up/down/routine), createdAt — persists user feedback on AI suggestions
- `user_achievements` — (userId, badgeId) PK, earnedAt — tracks when user earned each badge
- `mood_packs` — id PK, label, premium (boolean), createdAt — mood icon pack registry (icons stored on R2 at `{packId}/{moodId}.svg`)

Migrations: `drizzle/0000_smart_logging.sql`, `0001_add_mood_pack.sql`, `0002_email_password.sql`, `0003_rate_limits.sql`, `0004_ai_summary.sql`, `0005_calendar_ai_cache.sql`, `0006_insights_cache_and_feedback.sql`, `0007_profile_achievements.sql`, `0008_privacy_settings.sql`, `0009_feedback.sql`, `0010_reminders.sql`, `0011_subscription_columns.sql`, `0012_mood_packs.sql`, `0017_avatar.sql`. Seed: `drizzle/seed.sql` (7 default moods).

## Setup Notes (Railway)

```bash
# Local dev
npm run dev

# Build
npm run build

# Deploy (auto via git push to Railway)
git push origin master
```

Required env (Railway): `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `ADMIN_EMAIL`, `CRON_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_USER_ID`.
