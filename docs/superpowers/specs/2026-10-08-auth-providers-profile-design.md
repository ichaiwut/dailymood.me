# Sign-in methods on the profile screen

**Date:** 2026-10-08
**Scope:** mobile app only (`dailymood-mobile`) + the backend it shares with web (`dailymood.me`)
**Status:** design approved, awaiting spec review

## Problem

A user cannot see how they sign in. Someone who created their account with Google has no
way to discover that they could also set a password, and someone with a password has no way
to add Google or Apple. The profile screen says nothing about any of it.

Underneath that is a data problem: **the system has never recorded which provider anyone
used.** Both sign-in paths match an account purely by email address and discard the provider:

- web — `src/lib/auth.ts`, the `jwt` callback looks the user up by `user.email`
- mobile — `upsertUserByEmail()` in `src/lib/mobile-auth.ts`

NextAuth runs on the JWT strategy with no database adapter, so the `accounts` and `sessions`
tables that ship with the NextAuth schema were never written to. Confirmed against
production: both hold **0 rows**.

## What already exists

Two of the four things originally asked for are already built and working:

| Asked for | State |
|---|---|
| Show which provider the user signed in with | Missing — nothing is recorded |
| Let Google/Apple users add a password | **Done.** `GET/POST /api/account/password` already skips the current-password check when `password_hash` is null, and `app/profile/password.tsx` renders set-vs-change from `hasPassword` |
| Let email users connect Google/Apple | Missing — no endpoint, no UI |
| Show the provider avatar | Partial. Google's `picture` is captured **only** when the user row is first created and is never refreshed. Apple never sends one |

The password feature's real defect is discoverability: the row is titled "🔑 Password",
sits under the **Privacy** section, and shows no status. A Google user has no reason to
look there.

## Evidence from production (53 users, read-only query, 2026-10-08)

| Group | Count | How we know | Window |
|---|---|---|---|
| Google | 31 | `image` is a `googleusercontent.com` URL | May–Sep 2026 |
| Email + password | 10 | `password_hash` set, no `image` | May–Sep 2026 |
| Apple | 9 | email ends in `privaterelay.appleid.com` | Jun–**Oct 7 2026** |
| Unknown | 3 | no password, no Google image, not a relay address | Jun–Jul 2026 |

Two findings changed the design:

1. **Apple users already exist**, as recently as the day before this spec. An earlier
   assumption that "Apple only ships with the new app, so every passwordless account is
   Google" would have mislabelled 9 real users.
2. **The 3 unknowns are dormant.** Zero mood entries each, refresh tokens expired in
   Aug–Sep 2026, never once refreshed. They are already signed out. If they return they
   must sign in, and we record the provider for real at that moment.

A force-logout to harvest providers was considered and rejected: only 9 accounts hold a live
session, and those 9 are all identifiable from the evidence above. It would disrupt the users
we can already classify in order to resolve users who are already signed out. Web sessions
are JWTs and could only be invalidated by rotating `AUTH_SECRET`, which hits every web user.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Store links in the existing `accounts` table; **write no backfill rows** | Table already has the right shape (`user_id` / `provider` / `provider_account_id`), so no new table and no data migration — one additive index is needed, see below. Inference stays in the read layer where a wrong rule can be corrected; fabricated rows in an auth table would have to be hunted down later |
| D2 | Linking requires the provider's email to **match** the account email | Keeps the existing email-based lookup correct. Allowing a mismatch means a later sign-in finds no user by that email and silently creates a duplicate account |
| D3 | Mobile only for now | Backend is shared, so web can be added later by writing only its UI and connect flow. Nothing here needs redoing |
| D4 | No force logout | See evidence above |
| D5 | Account merging is out of scope | Merging two accounts means moving mood entries, images, subscriptions and badges, and deciding which subscription survives. Separate project |

## Data model

Reuse `accounts` — no new table, and no rows to migrate:

| Column | Value |
|---|---|
| `id` | ULID |
| `user_id` | our user id |
| `type` | `"oauth"` |
| `provider` | `"google"` \| `"apple"` |
| `provider_account_id` | the provider's `sub` claim |

One row per (user, provider). Written on **every** social sign-in and on every successful
link, upserted on `(provider, provider_account_id)`.

**One schema change is required.** The table carries only `accounts_pkey` on `id` — verified
against production — so that upsert has nothing to conflict on, and the `already_linked`
check in step 3 below could be raced past by two concurrent requests. Add:

```sql
CREATE UNIQUE INDEX accounts_provider_account_idx
  ON accounts (provider, provider_account_id);
```

Additive, and the table is empty in production, so it cannot fail on existing data. Author it
through `src/db/schema.ts` + `npm run db:generate`, apply with `npm run db:migrate:pg:local`
locally and `npm run db:migrate:pg` against production, per CLAUDE.md — never `drizzle-kit
push`. A second
index on `(user_id, provider)` is **not** added: a user legitimately holds at most one row per
provider, but that is enforced by the link logic, not by the schema, and a unique constraint
there would turn a future "same user, re-authorised Apple sub" into a hard error instead of an
update.

Writing on every sign-in — not just on link — is what makes the data real over time: each
returning user converts themselves from an inference into a recorded fact.

## Read model

`GET /api/profile` gains:

```jsonc
"auth": {
  "password": true,
  "google": { "linked": true, "confirmed": true },
  "apple": null
}
```

`confirmed: true` means a row exists in `accounts`. `confirmed: false` means it was inferred.

Inference runs only when the user has **no** `accounts` rows, in this order:

1. `password_hash is not null` → `password: true` (certain — it is what the login check reads)
2. `image like '%googleusercontent.com%'` → Google
3. `email like '%privaterelay.appleid.com'` → Apple
4. otherwise → both providers `null`; the UI shows a neutral row naming no brand

Rule 4 covers the 3 dormant accounts. Guessing between "Apple user who shared their real
address" and "Google user with no profile photo" is not possible, and a wrong brand on the
screen is worse than an honest unknown.

## Endpoints

All require Bearer auth and are rate limited per user via the existing `rateLimit()`.

### `POST /api/account/link/google`, `POST /api/account/link/apple`

Body: `{ idToken: string, name?: string }` (Apple sends `name` only on first authorization).

1. Verify with the existing `verifyGoogleIdToken()` / `verifyAppleIdToken()`
2. `identity.email !== user.email` → `409 email_mismatch`
3. That `(provider, sub)` already belongs to another user → `409 already_linked`
4. Upsert the `accounts` row
5. If the identity carries an image, update `users.image`

Returns the same `auth` block as the profile read, so the client can re-render from one
response.

### `DELETE /api/account/link/:provider`

Refuses with `409 last_sign_in_method` when removing the row would leave the account with no
way back in — no password and no other linked provider. The copy points the user at setting
a password first.

## Avatar

| Rule | Detail |
|---|---|
| Precedence | `image_key` (user's own upload, signed R2 URL) beats `image` (provider URL). **Already correct** in `/api/profile`; unchanged |
| Refresh | On every social sign-in and link, update `users.image` whenever the provider supplies one |
| Why refresh unconditionally | The user's own upload already wins at read time, so a fresh provider URL is harmless — and if they later delete their upload they fall back to a current photo instead of a years-old one |
| Apple | Never supplies an avatar; falls back to initials, which the app already renders |
| Storage | Keep hotlinking Google's URL. The R2 rules in CLAUDE.md govern user uploads, not third-party avatars, and `users.image` already holds external URLs for 31 accounts |

A user who signed up by email and then connects Google gets a photo immediately — impossible
today, because `image` is only ever written at row creation.

## UI

A new **"วิธีลงชื่อเข้าใช้"** section in the Account area of `app/(tabs)/profile.tsx`. The
existing password row **moves here out of Privacy**, where it is currently misfiled.

```
วิธีลงชื่อเข้าใช้
┌──────────────────────────────────────────┐
│ 🔑  อีเมลและรหัสผ่าน      ตั้งไว้แล้ว  › │
│ ────────────────────────────────────────  │
│ G   Google               เชื่อมแล้ว      │
│ ────────────────────────────────────────  │
│   Apple                 [ เชื่อมต่อ ]  │
└──────────────────────────────────────────┘
```

| State | Row shows |
|---|---|
| No password | "ยังไม่ได้ตั้ง" → opens the existing `/profile/password` |
| Has password | "ตั้งไว้แล้ว" → same screen, change mode |
| Provider linked | "เชื่อมแล้ว", tap to disconnect |
| Provider not linked | "เชื่อมต่อ" button |
| Provider unknown (rule 4) | One neutral row, "ลงชื่อเข้าใช้ด้วยบัญชีภายนอก", naming no brand |

**Apple on Android:** hidden when the platform cannot offer it *and* nothing is linked. A
user who linked Apple still sees the row on Android so they can tell how they get in — they
just cannot connect or disconnect there. Gate matches the login screen:
`Platform.OS === 'ios' && appleReady`.

Connect and disconnect both surface a toast on success and on failure, per the convention in
`AGENTS.md`. Copy follows CLAUDE.md: everyday Thai, and no "provider", "OAuth" or "link" in
user-facing text.

## Client work

`src/auth/socialSignIn.ts` currently fuses two steps — `signInWithGoogle()` fetches the
idToken and immediately exchanges it for a session via `loginWithGoogle()`. Linking needs the
token without signing in, so split it:

- `getGoogleIdToken()` / `getAppleIdToken()` — run the native flow, return the raw token
- `signInWithGoogle()` / `signInWithApple()` — token → login (behaviour unchanged)
- `linkGoogle()` / `linkApple()` — token → `POST /api/account/link/*`

Cancellation stays silent (returns null), matching today's behaviour.

Also touched: `src/api/account.ts` (new calls), `app/(tabs)/profile.tsx` (new section, moved
row), `src/api/types.ts` (the `auth` block), both locale files, and `DESIGN.md`.

## Testing

- Inference: each of the four rules, and that a real `accounts` row overrides every guess
- Link: email mismatch rejected; `sub` already owned by another user rejected; happy path
  writes exactly one row and refreshes the avatar
- Unlink: refused when it is the last way in; allowed when a password or another provider
  remains
- Sign-in writes an `accounts` row for a user who had none, flipping `confirmed` to true
- Avatar precedence: an uploaded image still wins after a provider refresh
- Apple on Android: hidden when unlinked, visible and read-only when linked

Verify against a local database first, never by writing to production.

## Out of scope

Web UI and its connect flow; account merging; changing the email-match rule; any change to
how the 3 dormant accounts are treated beyond letting them resolve themselves at next sign-in.
