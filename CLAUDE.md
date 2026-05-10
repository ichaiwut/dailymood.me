# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**DailyMood.me** — a daily mood tracking web application.

## Domains

- **`my.dailymood.me`** — this repo (the app). Login required, no guest access. Indexing disabled (`robots.ts` + `<meta robots>` noindex).
- **`dailymood.me`** — landing page (separate repo, TBD). Marketing/SEO surface.
- OAuth callbacks must be registered for `https://my.dailymood.me/api/auth/callback/*`.
- `NEXTAUTH_URL=https://my.dailymood.me` in production env.

## Tech Stack

- Next.js (App Router) + TypeScript
- Cloudflare Pages + Workers (deploy via `@cloudflare/next-on-pages`)
- Cloudflare D1 (SQLite) + Drizzle ORM
- NextAuth.js (Google/GitHub OAuth)
- Tailwind CSS
- REST API design (`/api/*`) — เผื่อ Mobile App ในอนาคต
- Resend (email)
- Google Gemini AI
- Stripe (payment)

## Commands

- `npm run dev` — run dev server
- `npm run build` — build for production
- `npm run lint` — run ESLint

## Important Rules

- **UX Copy** — ข้อความทุกจุดที่ user เห็น (placeholder, label, button, error, toast) ต้องเขียนเป็นภาษามนุษย์ที่อ่านเข้าใจง่าย ห้ามใช้คำเทคนิค (เช่น tags, sentiment, NLP, Gemini, rate_limited) ตรงๆ ใน UI
- **Tone** — แอปนี้เป็นเครื่องมือบันทึกอารมณ์ ไม่ใช่ chatbot ห้ามเขียน copy ที่ขอให้ user "เล่า" หรือ "บอก" อะไร ใช้โทนเบาๆ เปิดกว้าง ไม่กดดัน (เช่น "วันนี้เป็นยังไงบ้าง..." ดีกว่า "เล่าให้ฟังหน่อย")
- **Premium gating** — ห้ามซ่อน feature ที่เป็น Premium ออกจาก UI ต้องแสดงให้ user เห็นเสมอพร้อมข้อความอธิบายว่า feature ทำอะไร + badge "PREMIUM" เพื่อให้ user รู้ว่ามี feature นี้อยู่และอยากอัปเกรด ห้ามใช้ `{isPremium && <Component />}` เด็ดขาด ให้ใช้ ternary แสดง teaser แทน
- **features.md** — ทุกครั้งที่เพิ่ม feature ใหม่ หรือแก้ไข feature ต้องอัปเดตไฟล์ `features.md` ด้วยเสมอ
- **design.md** — ทุกครั้งที่เพิ่มหรือแก้ไขเรื่อง design ต้องอัปเดตไฟล์ `design.md` ด้วยเสมอ
- **Images** — ทุกครั้งที่ต้องใส่รูปต้องทำตามนี้:
  1. **Optimize ก่อน upload เสมอ** — resize (max 1600px ด้านยาว) + convert WebP + compress (quality ~0.82)
     - User uploads (จาก browser) — ใช้ `optimizeImage()` ใน `src/lib/client-image.ts` (OffscreenCanvas + WebP)
     - Static assets (logo ฯลฯ) — optimize ฝั่ง dev ก่อน upload manual
  2. **Upload ไป Cloudflare R2** (bucket: `dailymood`) ใช้ S3 SDK ผ่าน `uploadObject()` ใน `src/lib/r2.ts`
  3. **URL policy**:
     - **User uploads (รูปส่วนตัว)** → เก็บแค่ `imageKey` ใน DB → generate **signed URL** ตอนอ่าน (TTL 1 ชม.) ผ่าน `getSignedReadUrl()`
     - **Public assets (logo, marketing)** → ใช้ `R2_PUBLIC_URL` ตรงๆ ได้
  4. ห้ามเก็บรูปใน repo

## Cloudflare R2 — Image Storage

- Bucket: `dailymood`
- Credentials ใน `.env`: `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- **ทุกการเข้าถึงผ่าน S3 SDK** (`src/lib/r2.ts`) — dev/prod เขียนไป bucket จริงเหมือนกัน (ไม่ใช้ R2 binding เพื่อให้ local dev เห็น file ใน dashboard ได้)
- Helper: `uploadObject(key, body, contentType)`, `deleteObject(key)`, `getSignedReadUrl(key)`
- Optimization บังคับ — ดู section "Important Rules → Images"

## Email — Resend

- ใช้ **Resend** สำหรับส่ง email ทุกกรณี (transactional, notification ฯลฯ)
- API key อยู่ใน `.env` (`RESEND_API_KEY`)
- `from` = `Dailymood <hello@dailymood.me>` (ต้อง verify domain `dailymood.me` ใน Resend)
- Auth emails (verify / reset) ใช้ template ใน `src/lib/auth-email.ts` (TH + EN)

## Auth

- **Providers:** Google OAuth + Credentials (email/password)
- **Password hashing:** PBKDF2-SHA256, 600k iter, Web Crypto only — ห้ามเพิ่ม dep crypto อื่น (`src/lib/password.ts`)
- **Verify-before-login:** บังคับ — Credentials provider โยน `email_not_verified` ถ้ายังไม่ verify
- **Email collision:** ถ้า email นั้นสมัครด้วย Google แล้ว → register เพิ่มไม่ได้ (HTTP 409 `use_google`); ห้าม auto-link
- **Tokens:** `verification_tokens` table; verify TTL 24h, reset TTL 1h, single-use (delete on consume)
- **Rate limiting:** `src/lib/rate-limit.ts` (D1 fixed window) — register 5/hr/IP, forgot 5/hr/IP, resend-verify 3/hr/IP. ใช้ `clientIp(req)` (อ่าน `cf-connecting-ip` ก่อน fallback `x-forwarded-for`)
- **Login UI:** email-first single page (`src/components/login-form.tsx`) — email → branch ไป password / register / google_only / verify_sent

## AI — Google Gemini

- ใช้ **Google Gemini** สำหรับ AI features
- Credentials อยู่ใน `.env` (`GEMINI_API_KEY`, `GEMINI_PROJECT`)

## Payment — Stripe

- ใช้ **Stripe** สำหรับระบบ payment
- Credentials อยู่ใน `.env` (`STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`)
- ตอนนี้ใช้ **test mode** อยู่
