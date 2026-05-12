# DailyMood.me — Design Handover

> Feature inventory สำหรับ redesign ทั้งแอป ไม่รวม design specs — designer ออกแบบใหม่ทั้งหมด

## App Overview

- **Product:** แอปบันทึกอารมณ์ประจำวัน (mood tracking)
- **URL:** `my.dailymood.me` (login required, ไม่มี guest mode)
- **Platform:** Mobile-first web app (responsive)
- **Languages:** TH / EN (bilingual ทั้งแอป)
- **User tiers:** Free / Premium (฿99/เดือน หรือ ฿949/ปี)
- **Tone:** เบาๆ เปิดกว้าง ไม่กดดัน ไม่ใช่ chatbot — เป็นเครื่องมือบันทึกอารมณ์

---

## Navigation Structure

### Persistent Shell (ทุกหน้าหลังล็อกอิน)
- **TopBar:** Home แสดง avatar + greeting ตามเวลา + วันที่ + menu | หน้าอื่นแสดง logo + menu
- **User Menu dropdown:** Settings, Privacy, Terms, Logout
- **BottomNav:** 5 items — Home, Calendar, **FAB (ปุ่มบันทึก ตรงกลาง)**, Stats, Profile

### Pages ที่ไม่มี shell
- Login, Verify email, Forgot password, Reset password, 404, 403, Privacy, Terms

---

## All Screens & Features

### 1. Login & Auth

#### Login Page (`/login`)
- Single page, multi-step flow:
  1. **Landing** — ปุ่ม Google OAuth + ปุ่ม "Sign in with email" + ลิงก์ "สร้างบัญชีใหม่"
  2. **Email** — กรอก email → ระบบเช็คว่ามีบัญชีหรือยัง
  3. **Password** — กรอกรหัสผ่าน + ลิงก์ "ลืมรหัสผ่าน"
  4. **Register** — กรอกชื่อ + รหัสผ่าน (≥8 ตัว) → สร้างบัญชี
  5. **Google Only** — แจ้งว่า email นี้ใช้ Google เท่านั้น
  6. **Verify Sent** — "เช็คอีเมลของคุณ" + ปุ่ม Resend

- **Error states:** email ไม่ถูกต้อง, รหัสผ่านผิด, email ยังไม่ verify, รหัสผ่านสั้นเกินไป, email ซ้ำ, rate limited

#### Verify Email (`/auth/verify?token=...`)
- เปิดจากลิงก์ในอีเมล → แสดงสถานะสำเร็จ หรือ token หมดอายุ/ไม่ถูกต้อง

#### Forgot Password (`/auth/forgot`)
- กรอก email → ส่งลิงก์ reset
- **Sent state:** แจ้งว่าส่งแล้ว + ปุ่ม Resend

#### Reset Password (`/auth/reset?token=...`)
- กรอกรหัสผ่านใหม่ + ยืนยัน
- **Done state:** "เปลี่ยนรหัสผ่านสำเร็จ" + ลิงก์ไปล็อกอิน
- **Invalid token:** แจ้ง error + ลิงก์ไปล็อกอิน

---

### 2. Home Page (`/`)

#### AI Composer Card
- ช่องเขียน note + ปุ่มวิเคราะห์ด้วย AI
- **States:**
  - ว่าง → ปุ่ม disabled
  - มีข้อความ → ปุ่ม active
  - กำลังวิเคราะห์ → loading animation
  - ได้ผลลัพธ์ → แสดง mood ที่ AI แนะนำ (เลือกได้) + tags (ลบได้) → ปุ่ม "Save with AI"
  - Rate limited → แจ้งว่า AI ใช้ได้อีกกี่นาที
- ปุ่ม voice input (Web Speech API)
- ปุ่มกล้อง/รูป (Premium เท่านั้น — Free เห็นปุ่มพร้อม PRO badge)

#### Quick Mood Picker
- แถวเลื่อนได้ของ mood icons (7 default + custom moods)
- กดแล้วเปิด SmartLogModal พร้อม mood ที่เลือก

#### Streak Strip
- แสดง streak ปัจจุบัน + กราฟ 7 แท่ง

#### Last 7 Days
- 7 ช่องแสดง mood สีของแต่ละวัน + วันที่ + ชื่อวัน
- วันนี้ highlight + วันที่ยังไม่มี entry แสดง "—"

#### Recent Entries
- เลื่อนแนวนอน — card ของ entry ล่าสุด (mood, เวลา, note preview, tags)
- กดไปหน้า entry detail
- **Loading:** skeleton cards
- **Empty:** "ยังไม่มีรายการ"
- **Toast:** "Saved ✓" หลัง save สำเร็จ

---

### 3. SmartLogModal (Full-screen overlay)

เปิดจาก: FAB ใน BottomNav, กด mood ใน Quick Picker, กด "Log mood" ใน DaySheet

#### Elements
- ปุ่มปิด (X) + ชื่อ "New entry" + ปุ่ม Save
- Hero card สี mood ที่เลือก + ชื่อ mood + icon
- **Mood picker:** แถวเลื่อนได้ เปลี่ยน mood ได้
- **Note textarea:** ไม่บังคับ (placeholder เบาๆ ไม่กดดัน)
- **ปุ่ม "Suggest tags with AI"** (Free มี badge PRO)
- **Tags:** pills ลบได้ + ช่อง add tag เอง
- **Voice button:** ไมค์ (กดค้าง = กำลังฟัง สีแดง pulse)
- **Camera button:** Premium เท่านั้น
- **Premium teaser block:** Free users เห็น upgrade nudge

#### States
- Default → Analyzing (loading) → Result (mood + tags) → Saving → Saved
- Rate limited: แจ้ง cooldown
- Error: แสดง error message

---

### 4. Calendar Page (`/calendar`)

#### View Toggle
- สลับ **Calendar view** / **Timeline view**

#### Calendar View
- เลื่อนเดือน (ลูกศร + ชื่อเดือน/ปี)
- **ตาราง 7 คอลัมน์:** แต่ละช่องแสดงสีของ mood วันนั้น
  - วันนี้: มี highlight border
  - วันที่เลือก: มี border
  - วันในอนาคต: จางลง กดไม่ได้
  - กดวัน → เปิด DaySheet

#### AI Monthly Summary (Premium)
- Card สรุป mood ของเดือนจาก AI + 3 highlights (วันดีที่สุด, วันยากที่สุด, top trigger)
- **Free:** เห็นประโยคแรก + ส่วนที่เหลือเบลอ + ปุ่ม upgrade

#### Pattern Overlay (Premium)
- ปุ่ม toggle เปิด/ปิด pattern rings บนตาราง
- 3 แบบ: ★ best day, ● recurring, ● anomaly
- Legend อธิบายแต่ละแบบ

#### Patterns Feed (Premium)
- 2-3 cards อธิบาย pattern ที่ AI หา (icon, ชื่อ, คำอธิบาย)
- **Free:** เห็น locked state

#### Ask AI Bar (Premium)
- ช่องพิมพ์คำถามภาษาธรรมชาติ (placeholder หมุนเปลี่ยนตัวอย่าง)
- คำตอบ AI + วันที่เกี่ยวข้องเป็น chips กดได้ (highlight วันบนตาราง)
- Rate limited: 1 ครั้ง / 30 นาที

#### DaySheet (Bottom Sheet)
- เปิดเมื่อกดวันบนตาราง
- Drag handle + วันที่ + ลูกศรเลื่อนวัน
- **มี entries:** แสดง entry cards
- **วันว่าง (อดีต):** "วันนี้เป็นยังไง?" + ปุ่ม "Log mood"
- **วันในอนาคต:** "ยังบันทึกไม่ได้"

#### Timeline View
- รายการ entries เรียงตามวัน (TODAY / YESTERDAY / วัน-วันที่)
- Filter chips ด้านบน

#### Toast
- "ยังบันทึกวันในอนาคตไม่ได้" เมื่อกดวันในอนาคต

---

### 5. Stats Page (`/stats`)

#### Period Toggle
- Week / Month / Year
- **Year = Premium** — Free เห็น tab แต่กดไม่ได้ + nudge upgrade

#### AI Insights Summary Card
- สรุปสั้นๆ จาก AI + ลิงก์ "Tell me more →" ไป Insights
- **Free:** teaser copy + upgrade CTA

#### Mood Trend Line Chart
- กราฟเส้นแสดง average mood ตาม period
- ค่าเฉลี่ย + delta badge เทียบ period ก่อนหน้า (↑ ดีขึ้น / ↓ แย่ลง)

#### 2-Column Grid
- **Mood Mix:** donut chart — สัดส่วน mood + mood อันดับ 1
- **Highest Mood Day:** mood icon + ชื่อวัน

#### Activity Impact (Premium)
- แสดงว่า tags ไหนทำให้ mood ดี/แย่ขึ้น (ต้องมี ≥5 entries ต่อ tag)
- Bar chart แนวนอน diverging จากกลาง
- **Free:** 3 แถวแรกเห็น + แถว 4-6 เบลอ + upgrade teaser

#### States
- **Loading:** skeleton blocks
- **No data:** icon + "ไม่มีข้อมูล"

---

### 6. Insights Page (`/insights`)

#### Hero Summary Card
- สรุปประจำสัปดาห์จาก AI — headline + summary (expand ได้) + ปุ่ม Share/Copy
- **Free:** เห็น headline + ประโยคแรก + overlay upgrade CTA

#### Pattern Cards (Premium, 1-3 cards)
- แต่ละ card มี tag (PATTERN / CORRELATION / ALERT)
- อาจมี mini bar chart 7 วัน
- **Free:** teaser cards พร้อม PRO badge

#### Suggestion Card
- คำแนะนำประจำสัปดาห์ + ปุ่ม 👍/👎 feedback

#### Streak Card
- 🔥 + จำนวนวัน streak

#### States
- **Loading:** skeleton
- **Empty (ไม่มี entry):** "ยังไม่มีข้อมูลเพียงพอ"
- **Too few entries:** "เกือบแล้ว! บันทึกอีกนิด"
- **Error:** "เกิดข้อผิดพลาด" + ปุ่ม Retry

---

### 7. Entry Detail Page (`/entry/[id]`)

- ปุ่มกลับ + วันที่ + menu 3 จุด (Edit)
- **Mood Hero Card:** พื้นหลังสี mood + icon ใหญ่ + ชื่อ mood + เวลา
- **Your Note:** ข้อความ
- **AI Summary:** สรุปจาก AI (Premium) / teaser + "Upgrade →" (Free ถ้าไม่มี summary)
- **Photo:** รูปแนบ (ถ้ามี)
- **Tags:** pills
- **Loading:** skeleton
- **Not found:** "ไม่พบรายการนี้"

---

### 8. Edit Entry Page (`/entry/[id]/edit`)

- แก้ไข mood, note, tags (เพิ่ม/ลบ), วิเคราะห์ใหม่ด้วย AI, เปลี่ยน/ลบรูป, แก้วันที่/เวลา, ลบ entry

---

### 9. Profile Page (`/profile`)

#### Hero Card
- Avatar (รูปหรือ initials ตาม accent color) + ชื่อ + "สมาชิกตั้งแต่..." + PRO badge (ถ้ามี)
- กด avatar → ไปหน้า edit profile

#### Stats Row (3 ช่อง)
- Streak 🔥 (ลิงก์ไป achievements) / Total Entries 📓 (ลิงก์ไป calendar) / Avg Mood (ลิงก์ไป stats)

#### Mood Signature (Premium)
- แท่งสีแสดงสัดส่วน mood 30 วัน + headline ("คุณส่วนใหญ่ happy + neutral")
- **Free:** teaser + upgrade CTA

#### Achievements Row
- เลื่อนแนวนอน — badges ที่ได้แล้ว (สูงสุด 6) + "X/12 →" ลิงก์

#### Settings Sections

| Section | รายละเอียด |
|---------|-----------|
| **Subscription** | ลิงก์ไป subscription management หรือ pricing |
| **Reminders** | Toggle เปิด/ปิด daily reminder → เลือกเวลา + วันของสัปดาห์ (Mon-Sun) + ปุ่ม Save |
| **Language** | Radio: English / ภาษาไทย (เปลี่ยนแล้ว reload) |
| **Privacy** | Toggle "ซ่อน preview" (Premium — เบลอ note/tags บน cards) / Free เห็น PRO teaser |
| **Custom Moods** | จัดการ custom moods (Premium) / Free เห็น PRO teaser |
| **Mood Pack** | Grid ของ icon packs — free packs เลือกได้, premium packs มี PRO badge + lock |
| **Data** | Export CSV + Clear all entries (destructive, มี confirmation) |
| **About** | Send feedback (bottom sheet, textarea 1000 chars) + Terms + Privacy |

#### Sign Out
- ปุ่ม sign out → confirmation bottom sheet

#### Feedback Sheet
- Textarea + ปุ่ม Send
- **Cooldown:** "ลองอีกครั้งใน X นาที"
- **Success:** "ขอบคุณ!"

---

### 10. Profile Edit (`/profile/edit`)

- ปุ่มกลับ + ปุ่ม Save (active เมื่อมีการเปลี่ยน)
- **Avatar:** รูปหรือ initials + icon กล้อง
- **Accent color picker:** 6 สี (purple, orange, mint, yellow, sky, lavender)
- **Display Name** (max 30 ตัวอักษร)
- **Email** (read-only + badge VERIFIED)
- **Bio** (max 160 ตัวอักษร + counter)
- **ปุ่ม Delete account** (destructive, ล่างสุด)

---

### 11. Achievements (`/profile/achievements`)

- **Progress ring:** วงกลม % + "X/12 unlocked"
- **Filter pills:** All / Earned / In Progress / Locked
- **2-column badge grid:**
  - Earned: สีเต็ม + วันที่ได้
  - In progress: border dashed + progress bar
  - Locked: grayscale + จาง

#### 12 Badges
| Badge | เงื่อนไข |
|-------|---------|
| Streak 7 | streak 7 วัน |
| Streak 30 | streak 30 วัน |
| Streak 100 | streak 100 วัน |
| Streak 365 | streak 365 วัน |
| Entries 50 | บันทึก 50 ครั้ง |
| Entries 100 | บันทึก 100 ครั้ง |
| Entries 500 | บันทึก 500 ครั้ง |
| Early Bird | บันทึกก่อน 8am 5 ครั้ง |
| Night Owl | บันทึก 00:00-04:00 10 ครั้ง |
| Tag Master | ใช้ 20 tags ที่ต่างกัน |
| Zen 30 | streak 30 วัน mood neutral/happy |
| Photo Journal | แนบรูป 25 ครั้ง |

---

### 12. Subscription Management (`/profile/subscription`)

#### Premium Users
- **Hero card:** ชื่อ plan + status badge (ACTIVE / CANCELING / TRIALING) + วันต่ออายุ + stats (next charge / สมาชิกมากี่เดือน)
- **Canceling notice:** แจ้งว่าจะหมดอายุเมื่อไหร่ + ปุ่ม Resubscribe
- **Billing section:** Payment method / Billing history / Switch to yearly → เปิด Stripe Portal
- **Cancel button** → confirmation bottom sheet → Stripe Portal

#### Free Users
- Upgrade CTA → ไปหน้า Pricing

---

### 13. Pricing Page (`/pricing`)

- ปุ่มปิด (X)
- Badge "DAILYMOOD PRO"
- Headline
- **Feature list (6 items):** AI analysis, photo journal, yearly stats, calendar AI, custom moods, activity impact
- **Plan picker (2 ช่อง):**
  - Monthly: ฿99/เดือน
  - Yearly: ฿949/ปี (≈฿79/เดือน, badge "BEST VALUE", ประหยัด ~20%)
- **CTA button:** "Subscribe now →" → Stripe Checkout
- **Success state:** "🎉 Welcome to Pro!" + ปุ่ม "Get started"
- **Cancelled state:** แจ้งว่า payment ยังไม่สำเร็จ

---

### 14. History / Timeline (`/history`)

- Redirect ไปหน้า Calendar (Timeline view)
- รายการ entries เรียงตามวัน
- Entry cards: mood square + note preview + tags + เวลา
- **Empty:** "ยังไม่มีรายการ"

---

### 15. Static Pages

#### 404 Not Found
- Standalone (ไม่มี nav) — kawaii character + "404" + ปุ่มกลับ home

#### 403 Forbidden
- Standalone — kawaii character + lock icon + "PRIVATE ENTRY" + ปุ่ม sign in / กลับ

#### Privacy Policy (`/privacy`)
- Hero card (shield icon + badges: ENCRYPTED, NO TRACKERS, NO ADS)
- TL;DR summary (4 items) + 7 sections

#### Terms of Service (`/terms`)
- Hero card (handshake icon + effective date)
- TL;DR summary (4 items) + 7 sections

---

### 16. Admin Panel (`/admin`)

> UI แยกจาก user-facing, มี sidebar navigation

#### Dashboard (`/admin`)
- 6 stat cards: total users, premium users, total entries, entries 7d, new users 30d, AI calls today/30d, feedback count
- Recent 5 feedback messages

#### Users (`/admin/users`)
- Searchable paginated table (50/page) + filter: All / Premium / Free
- แต่ละ row: name, email, premium badge, plan, joined, entry count
- Actions: toggle premium, delete user
- **User Detail (`/admin/users/[id]`):** full profile, Stripe data, entries, AI usage

#### Entries (`/admin/entries`)
- Paginated table: user email, mood, AI source badge, image indicator
- Privacy-first: ไม่ส่ง note/tags/AI summary ไป admin
- Filter by user, delete entry

#### Feedback (`/admin/feedback`)
- User feedback messages (paginated, deletable)
- AI suggestion feedback aggregation (thumbs up/down/routine counts)

#### Mood Pack Manager (`/admin/packs`)
- CRUD for mood icon packs
- Create: ID + label + premium flag
- Upload 7 SVG icons per pack
- Preview grid, edit, delete

#### AI Usage (`/admin/ai`)
- Stat cards: NLP/Vision counts (7d + 30d)
- Stacked bar chart daily AI calls (30 วัน)
- Top 10 AI users leaderboard

---

## Premium vs Free Summary

| Feature | Free | Premium |
|---------|------|---------|
| Mood logging (manual + note + tags) | ✅ | ✅ |
| Voice input | ✅ | ✅ |
| Stats (Week + Month) | ✅ | ✅ |
| Calendar (basic grid) | ✅ | ✅ |
| Timeline / History | ✅ | ✅ |
| Streak & Achievements | ✅ | ✅ |
| i18n (TH/EN) | ✅ | ✅ |
| AI text analysis | 1/วัน | ไม่จำกัด (cooldown 5 นาที) |
| AI summary ใน entries | ❌ | ✅ |
| Photo/image attachment | ❌ | ✅ |
| AI Vision (วิเคราะห์รูป) | ❌ | ✅ |
| Stats: Year period | ❌ | ✅ |
| Stats: Activity Impact (แถว 4-6) | ❌ | ✅ |
| Calendar: Monthly AI summary | ❌ (เห็น teaser) | ✅ |
| Calendar: Pattern overlay | ❌ | ✅ |
| Calendar: Ask AI | ❌ | ✅ |
| Insights: Full weekly insights | ❌ (เห็น headline) | ✅ |
| Profile: Mood Signature | ❌ (teaser) | ✅ |
| Profile: Hide Preview | ❌ (teaser) | ✅ |
| Custom Moods (สูงสุด 13) | ❌ (teaser) | ✅ |
| Premium mood icon packs | ❌ (lock) | ✅ |

**Gating rule:** ห้ามซ่อน Premium features — ต้องแสดงเสมอพร้อม PRO badge + teaser + upgrade CTA

---

## Emails

| Email | Trigger | รายละเอียด |
|-------|---------|-----------|
| Verify email | สมัครด้วย email | ลิงก์ยืนยัน (หมดอายุ 24 ชม.) |
| Reset password | กด forgot password | ลิงก์ reset (หมดอายุ 1 ชม.) |
| Daily reminder | Cron job (ถ้า user เปิด) | "วันนี้เป็นยังไงบ้าง?" — ส่งถ้า: เปิด reminder, เวลาตรง, วันตรง, ยังไม่ได้บันทึกวันนี้ |

---

## AI Features (Google Gemini)

| Feature | Input | Output | Tier |
|---------|-------|--------|------|
| Text analysis | Note (≤500 chars) | mood ที่แนะนำ, sentiment, tags 3-8, summary 1-2 ประโยค (TH) | Free: 1/วัน, Premium: ไม่จำกัด |
| Vision analysis | รูปภาพ | tags 3-6 (activity/place/food/weather) | Premium เท่านั้น |
| Weekly insights | mood data สัปดาห์ | headline, summary, patterns 1-3, suggestion 1 | Premium (Free เห็น headline) |
| Calendar monthly AI | mood data เดือน | summary, highlights 3, patterns 3 | Premium เท่านั้น |
| Ask AI | คำถาม + mood data เดือน | คำตอบ + วันที่เกี่ยวข้อง | Premium, 1/30 นาที |

---

## Default Mood Types (7)

1. Amazing (amazing)
2. Happy (happy)
3. Neutral (neutral)
4. Sad (sad)
5. Angry (angry)
6. Anxious (anxious)
7. Tired (tired)

Premium users สร้าง custom moods ได้สูงสุด 13 อัน (icon + ชื่อ + สี)

---

## Mood Icon Packs

- หลาย packs (admin จัดการผ่าน `/admin/packs`)
- แต่ละ pack มี 7 icons (ตาม mood types)
- Format: SVG/WebP/PNG hosted บน R2
- Free packs สลับได้ / Premium packs ต้อง upgrade

---

## LINE OA — Admin Notifications

ไม่ใช่ user-facing — ส่งแจ้ง admin ทาง LINE:
- สมัครใหม่ (Credentials): `🆕 สมัครใหม่: {email}`
- สมัครใหม่ (Google): `🆕 สมัครใหม่ (Google): {email}`
- ชำระเงิน: `💳 ชำระเงิน: {plan} {amount} — {email}`

---

## Common UI States (ทุกหน้า)

| State | รายละเอียด |
|-------|-----------|
| Loading | Skeleton placeholders (ทุกหน้ามี) |
| Empty | Icon + ข้อความ + CTA (ถ้ามี) |
| Error | ข้อความ error + ปุ่ม Retry (ถ้ามี) |
| Toast | Pill notification ด้านบน, auto-dismiss ~3 วินาที |
| Premium teaser | PRO badge + คำอธิบาย feature + ลิงก์ upgrade |

---

## Key Interactions

- **Mood logging:** FAB → SmartLogModal → เลือก mood → เขียน note (optional) → AI analyze (optional) → แก้ tags → Save
- **Quick mood:** กด mood icon → SmartLogModal (mood pre-selected) → Save
- **Calendar day tap:** → DaySheet → ดู entries / กด "Log mood"
- **Entry detail:** กดจาก card → ดู full entry → menu → Edit
- **Subscription:** Profile → Subscription → Manage/Cancel via Stripe Portal
- **Language switch:** Profile → Language → เลือก → reload
- **Feedback:** Profile → About → Send feedback → bottom sheet → Submit
