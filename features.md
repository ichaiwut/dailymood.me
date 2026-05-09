# DailyMood.me — Features

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **API:** REST API via Next.js Route Handlers (`/api/*`) — รองรับ Mobile App ในอนาคต
- **Database:** Cloudflare D1 (SQLite) + Drizzle ORM
- **Auth:** NextAuth.js (Google OAuth)
- **AI:** Google Gemini (gemini-2.0-flash, NLP + Vision)
- **Email:** Resend
- **Payment:** Stripe (test mode; gating ทำผ่าน `users.isPremium` flag)
- **Image Storage:** Cloudflare R2 (signed read URLs, 1-hour TTL)
- **Styling:** Tailwind CSS
- **Deploy:** Cloudflare Pages + Workers (`@cloudflare/next-on-pages`)
- **i18n:** TH / EN

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
| AI NLP (Gemini) | — | 1 ครั้ง/วัน | ไม่จำกัด |
| AI Vision (Gemini) | — | — | ✓ |
| Custom Moods | — | — | ✓ (สูงสุด 13 เพิ่มเติม) |

## Features

### Planned

#### Mood System
- [x] Mood Log — Quick Icons (7 default moods)
- [x] Mini Journal — note สั้นๆ
- [x] Custom Mood Types (Premium)
- [x] Multi-entry per day (timeline)
- [x] Mood Icon Packs — SVG icons hosted on R2 at `{packId}/{moodId}.svg`; default pack `set_486038`. `users.mood_pack` stores selection (Premium will be able to switch; Free locked to default).

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
- [x] Stats Page (`/stats`) — average mood line chart, mood mix donut, best day, activity impact (mock AI data); week/month/year segmented control; fetches `/api/stats`
- [ ] Streak & Habits

#### Pages
- [x] AI Insights page (`/insights`) — Gemini-powered executive summary, correlation detection (tag-mood links, day-of-week patterns), actionable suggestions. API at `/api/insights` fetches 30-day mood data → Gemini analyzes → returns headline, summary, patterns (pattern/correlation/alert), suggestion. Bottom nav linked.
- [x] Timeline view (Calendar tab) — segmented toggle Calendar/Timeline on the Calendar page; reverse-chronological feed of entries grouped by day (TODAY/YESTERDAY/WEEKDAY), mood filter chips, entry cards with mood swatch + title + time + note preview + tag emojis. Tap → entry detail. Data: `/api/calendar/timeline`. `/history` page redirects to `/calendar`.
- [x] ~~History/Timeline page (`/history`)~~ — redirects to Calendar tab (Timeline view)
- [x] Mood Detail page (`/entry/[id]`) — mood hero card with giant faded emoji, note section, AI summary, tags, three-dot menu → edit
- [x] Edit Entry page (`/entry/[id]/edit`) — edit mood, note, tags (add/remove), re-analyze with AI, image replace/delete, date/time edit, delete entry. API: `PATCH /api/log/[id]`, `DELETE /api/log/[id]`

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
- [ ] Stripe Checkout + Webhook
- [x] Premium gating (via `users.isPremium`)
- [x] User Menu — burger dropdown (avatar + ☰) → Settings, Logout

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
| GET | `/api/moods` | any | List system + user's custom moods |
| POST | `/api/moods` | premium | Create custom mood |
| DELETE | `/api/moods/:id` | premium | Delete own custom mood |

## Database Schema (Drizzle on D1)

- `users` — id, email, image, **passwordHash** (null for OAuth-only), emailVerified, isPremium, stripeCustomerId, locale, createdAt
- `accounts`, `sessions` — NextAuth
- `verification_tokens` — (identifier, token) PK; type = `email_verify` | `password_reset`; expires
- `mood_types` — system defaults (userId NULL) + custom (userId set, premium only)
- `mood_entries` — id, userId, moodTypeId, note, imageKey, tags JSON, sentiment, aiSummary, aiSource, date, createdAt
- `ai_usage` — (userId, date) PK, nlpCount, visionCount
- `rate_limits` — key PK (`<endpoint>:<ip>`), count, resetAt — fixed-window rate limit on D1

- `calendar_ai_cache` — (userId, yearMonth) PK, result JSON, entryCount, generatedAt — caches Gemini-generated calendar AI summaries + patterns per month

Migrations: `drizzle/0000_smart_logging.sql`, `0001_add_mood_pack.sql`, `0002_email_password.sql`, `0003_rate_limits.sql`, `0004_ai_summary.sql`, `0005_calendar_ai_cache.sql`. Seed: `drizzle/seed.sql` (7 default moods).

## Setup Notes (Cloudflare)

```bash
# Create D1 + R2
wrangler d1 create dailymood          # paste id into wrangler.toml
wrangler r2 bucket create dailymood   # already exists

# Migrate + seed
npm run db:migrate:local && npm run db:seed:local
npm run db:migrate:prod  && npm run db:seed:prod

# Local dev (after pages:build)
npm run pages:build && npm run pages:dev
```

Required env: `R2_ACCOUNT_ID` (new — needed for SigV4 signed URLs).
