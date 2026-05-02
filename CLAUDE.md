# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**DailyMood.me** — a daily mood tracking web application.

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

- **features.md** — ทุกครั้งที่เพิ่ม feature ใหม่ หรือแก้ไข feature ต้องอัปเดตไฟล์ `features.md` ด้วยเสมอ
- **design.md** — ทุกครั้งที่เพิ่มหรือแก้ไขเรื่อง design ต้องอัปเดตไฟล์ `design.md` ด้วยเสมอ
- **Images** — ทุกครั้งที่ต้องใส่รูป ต้อง optimize รูปก่อน แล้ว upload ไป Cloudflare R2 (bucket: `dailymood`) ใช้ public URL จาก env `R2_PUBLIC_URL` เสมอ ห้ามเก็บรูปใน repo

## Cloudflare R2 — Image Storage

- Bucket: `dailymood`
- Credentials อยู่ใน `.env` (R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)
- ใช้ S3-compatible API ในการ upload
- ต้อง optimize รูปก่อน upload (resize, compress, convert to WebP)

## Email — Resend

- ใช้ **Resend** สำหรับส่ง email ทุกกรณี (transactional, notification ฯลฯ)
- API key อยู่ใน `.env` (`RESEND_API_KEY`)

## AI — Google Gemini

- ใช้ **Google Gemini** สำหรับ AI features
- Credentials อยู่ใน `.env` (`GEMINI_API_KEY`, `GEMINI_PROJECT`)

## Payment — Stripe

- ใช้ **Stripe** สำหรับระบบ payment
- Credentials อยู่ใน `.env` (`STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`)
- ตอนนี้ใช้ **test mode** อยู่
