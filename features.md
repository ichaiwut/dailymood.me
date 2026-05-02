# DailyMood.me — Features

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **API:** REST API via Next.js Route Handlers (`/api/*`) — รองรับ Mobile App ในอนาคต
- **Database:** Cloudflare D1 (SQLite)
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js (Google/GitHub OAuth)
- **AI:** Google Gemini
- **Email:** Resend
- **Payment:** Stripe
- **Image Storage:** Cloudflare R2
- **Styling:** Tailwind CSS
- **Deploy:** Cloudflare Pages + Workers
- **i18n:** TH / EN (สองภาษา)

## Target Audience
- เปิดให้คนทั่วไปใช้ (public)

## Business Model
- Free / Premium (Stripe)
- รายละเอียด plan ยังไม่กำหนด

## Auth & Guest Mode
- ต้อง login เพื่อใช้งานเต็มรูปแบบ (Google/GitHub OAuth)
- Guest mode: ใช้ได้โดยไม่ต้อง login แต่ข้อมูลเก็บใน localStorage หมดอายุ 24 ชั่วโมง

## Features

### Planned

#### Mood System
- [x] Mood Log — เลือก mood ประจำวัน (emoji + color, 7 default moods)
- [ ] Custom Mood Types — ผู้ใช้เพิ่ม/ลบ mood ได้เอง
- [x] Mini Journal — เขียนบันทึกสั้นๆ คู่กับ mood

#### Visualization
- [ ] Mood Calendar — ปฏิทินแสดงสี/emoji ของแต่ละวัน
- [ ] Mood Analytics — กราฟ/สถิติแนวโน้มอารมณ์
- [ ] Streak & Habits — ติดตาม streak การบันทึก

#### AI Features (Gemini)
- [ ] AI Mood Analysis — วิเคราะห์แนวโน้ม mood
- [ ] AI Suggestions — แนะนำกิจกรรม/คำแนะนำตาม mood
- [ ] AI Summary — สรุป mood รายสัปดาห์/เดือน
- [ ] AI Chatbot — คุยเป็นเพื่อน

#### Social & Sharing
- [ ] Share Card — สร้างการ์ดแชร์ mood ลง social media

#### Account & Payment
- [x] User Auth — login ด้วย Google (NextAuth.js)
- [ ] Guest Mode — ใช้งานได้ 24 ชม. โดยไม่ต้อง login
- [ ] Premium Plan — ชำระผ่าน Stripe

#### Localization
- [x] i18n — รองรับภาษาไทยและอังกฤษ (next-intl)

### In Progress

### Completed
- [x] User Auth — Google login via NextAuth.js
- [x] i18n — TH/EN via next-intl
- [x] Mood Log — Mood Picker UI (7 default moods, emoji + color, localStorage)
- [x] Mini Journal — Note input คู่กับ mood

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET/POST | /api/auth/* | NextAuth.js handlers (login, callback, session) | Done |

## Database Schema

_(จะอัปเดตเมื่อเริ่ม implement)_
