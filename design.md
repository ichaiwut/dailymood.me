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
| Timeline | Grouped entries by day, filter chips (All/Happy/Sad/Work/Friends/Rain), card-based entries with mood emoji square, fetches `/api/log` | Done |
| Stats | Mood line chart (purple #A673F1 gradient fill), mood mix donut, best day card, activity impact diverging bars; week/month/year segmented pill control | Done |
| AI Insights | Hero gradient summary card (#A673F1→#C89BF5→#FCA45B) with Gemini executive summary, dynamic pattern/correlation/alert cards, green suggestion card (#FAFFF8). Loading skeleton, empty state, error state. | Done |
| Entry Detail | Mood hero card (full-width, mood-colored bg, giant faded 200px emoji), note section, AI summary gradient card (#F4EBFE→#FDE8DA) with Gemini-generated Thai summary (`**bold**` → `<strong>`; teaser fallback when no summary), tags pills, edit/compare buttons | Done |
| Edit Entry | Mood hero card with "Tap to change" badge + inline mood picker, editable note textarea with char count, "Re-analyze with AI" gradient button + mic, tags pills (removable × + add input), "SUGGESTED FROM YOUR NOTE" dashed-border AI tag pills, moment section with Replace/Delete overlay buttons, date/time inputs, red "Delete entry" button, delete confirm modal, fixed bottom bar (Cancel + "Save changes" black pill) | Done |
| Settings | Custom mood manager (Premium), mood pack picker | Done (default style) |

## Components

| Component | Purpose |
|---|---|
| `TopBar` / `TopBarClient` | Purple avatar circle (initials) + day label + greeting with name + search/bell icon buttons |
| `BottomNav` | Floating white pill nav: Home, Calendar, FAB (+), Stats, Profile. Purple active, peach FAB |
| `HomeShell` | Home page: streak strip, AI composer, mood picker row, recent entries |
| `SmartLogModal` | Full modal: mood grid, note textarea (purple border), voice/camera, AI detection with gradient section, tag pills |
| `MoodIcon` | SVG mood icon from R2 pack, falls back to emoji |
| `MoodPicker` | 7-mood grid (legacy, replaced by inline row in HomeShell) |
| `LoginForm` | Email-first Linear-style: email → password / register / google_only / verify_sent |
| `VoiceButton` | Browser STT (Web Speech API), locale-aware (TH/EN) |
| `StatsShell` | Stats page: header with period segmented control, average mood line chart card, mood mix donut + best day 2-col grid, activity impact list with diverging bars |
| `InsightsShell` | AI Insights page: hero gradient summary card, pattern card with mini bar chart, suggestion card with routine button, streak nudge row |
| `HistoryShell` | History/Timeline page: filter chips row, day-grouped entry cards with mood emoji squares, search/filter icon buttons |
| `EntryDetail` | Entry detail page: mood hero card with giant emoji + intensity bar, note section, AI summary gradient card, tag pills, edit/compare buttons |

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
