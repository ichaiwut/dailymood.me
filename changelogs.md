# DailyMood.me — Changelogs

## 2026-05-24

### 6. Activities
กิจกรรมที่ผูกกับแต่ละ mood entry

- **10 default activities** — 💼 ทำงาน, 🏃 ออกกำลังกาย, 👫 เจอเพื่อน, 👨‍👩‍👧 ครอบครัว, 🍽️ กินข้าวนอกบ้าน, 🎮 เล่นเกม, 📚 อ่านหนังสือ, 🎬 ดูหนัง/ซีรีส์, 😴 พักผ่อน, ✈️ เที่ยว
- **Custom activities** — Free: 5, Premium: 100. Manage ใน Settings → กิจกรรม
- **1 activity ต่อ entry** — horizontal scrollable chips, tap เลือก/ยกเลิก
- **แสดง** — SmartLogModal, Edit Entry, Entry Detail (chip), Timeline + DaySheet (emoji)
- **AI suggest** — Gemini analyzeText ส่ง activity list + return suggestedActivityId
- **AI analytics** — activity data ส่งเข้า Calendar AI summary, AI Insights, Chart Annotations payloads ให้ Gemini ใช้วิเคราะห์
- **Stats** — `activityInsight` array (activity-mood correlation แยกจาก tag-based `activityImpact`)
- DB: `activities` table + `mood_entries.activity_id` FK
- API: `GET/POST /api/activities`, `DELETE /api/activities/[id]`
- Migration: `0018_activities.sql` (create table + seed defaults + add FK)
- Files: `activity-limits.ts`, `default-activities.ts`, `activity-manager.tsx`, `activity-picker.tsx`

### 1. Public Holidays + Personal Events
ระบบปฏิทินวันสำคัญ

- **วันหยุดราชการไทย** — hardcode ~20 วัน/ปี (สงกรานต์, วันพ่อ, วันแม่ ฯลฯ) ไม่พึ่ง API ภายนอก
- **วันสำคัญส่วนตัว** — user เพิ่มเองได้ (วันเกิด, ครบรอบ) ซ้ำทุกปีอัตโนมัติ. Free: 3 วัน, Premium: ไม่จำกัด
- **แสดงบน Calendar grid** — red dot (วันหยุด) / blue dot (วันส่วนตัว) ที่มุมซ้ายบน
- **DaySheet** — chip ชื่อวันสำคัญเมื่อแตะวัน
- **Entry Detail** — chip ใน mood hero card
- **SmartLogModal** — แสดงวันที่ + chip วันสำคัญใต้ header
- **Home** — banner ใน greeting hero ถ้าวันนี้เป็นวันสำคัญ
- **Settings → วันสำคัญ** — emoji picker grid + month/day selector + CRUD
- DB: `personal_events`, `holiday_cache` tables
- API: `GET/POST /api/events`, `DELETE /api/events/[id]`
- Files: `schema.ts`, `holidays.ts`, `special-days.ts`, `event-limits.ts`, `personal-events-manager.tsx`, `special-day-banner.tsx`

### 2. AI Coach + Weekly Digest Toggle Fix
แก้ toggles ที่กดแล้วไม่ save

- Uncomment `aiCoachEnabled` / `weeklyDigestEnabled` ใน PATCH `/api/profile`
- อ่านค่าจริงจาก DB แทน hardcode `false`
- Load toggle state จาก `/api/profile` ตอนเปิดหน้า Insights
- Forecast card: เปลี่ยนจาก "กำลังวิเคราะห์..." ค้าง → "AI กำลังสร้างให้ — กลับมาดูอีกทีนะ"

### 3. Weekly Digest Email
Cron ส่ง email สรุปสัปดาห์ทุกวันจันทร์ 08:00 ICT

- Premium users ที่เปิด `weeklyDigestEnabled`
- Reuse insights cache (ถ้ามี) หรือ generate ใหม่ผ่าน Gemini
- Email: headline, summary, avg mood/streak/entries stats, 3 patterns, suggestion card
- CTA button "ดูเพิ่มเติม" → `/insights`
- Cron: `/api/cron/weekly-digest`, registered ใน `cron-scheduler.ts`

### 4. Email Template Improvements
Logo + Unsubscribe footer ทั้ง AI Coach และ Weekly Digest

- `icon.png` logo + "DailyMood" bold แทนข้อความ plain
- Footer: "ไม่ต้องการรับอีก? ปิดได้ที่หน้า Insights" พร้อม link
- Shared `email-parts.ts` ใช้ร่วมกัน 2 email templates

### 5. Timeline Markers
หมุดวันสำคัญบนกราฟ mood trend ในหน้า Stats

- เส้น dashed แนวตั้ง (red = วันหยุด, blue = วันส่วนตัว) ตัดผ่านกราฟ
- Emoji circle ด้านบน + hover/tap tooltip แสดงชื่อวัน
- Card "วันสำคัญในช่วงนี้" ใต้กราฟ แสดง chips พร้อมวันที่
- รองรับทุก period (week/month/year) ทุก tier

### Commits

| Commit | Description |
|---|---|
| `88c78fa` | feat: public holidays + personal events on calendar |
| `12178ba` | fix: AI Coach + Weekly Digest toggles persist to DB |
| `f1be0a8` | feat: Weekly Digest email cron — Monday 08:00 ICT |
| `9525580` | fix: email logo + unsubscribe footer |
| `58b617b` | feat: Timeline Markers on Stats mood trend chart |
| `4de91bb` | docs: sync features.md with changelogs |
| `56a2893` | feat: Activities — per-entry activity tracking with AI suggestion |
