/**
 * Send the "Try Pro free for 14 days" promo email.
 *
 * Segment: users who are NOT Pro and have NEVER started a trial,
 *          not opted out of marketing, not already sent this campaign,
 *          and with a verified (reachable) email.
 *
 * Usage (run from project root):
 *   Dry run (count + sample, sends nothing):
 *     DRY_RUN=1 npx tsx scripts/send-trial-promo.ts
 *   Test one address (renders the real email to your inbox):
 *     TEST_TO=ting@buzzwoo.de TEST_LOCALE=th npx tsx scripts/send-trial-promo.ts
 *   Real blast (against whichever DATABASE_URL is set):
 *     npx tsx scripts/send-trial-promo.ts
 *
 * DB target: shell DATABASE_URL wins; otherwise .env.local then .env are read.
 * For a prod blast, export the prod DATABASE_URL before running.
 * Upload the image first: npx tsx scripts/upload-promo-image.ts
 */
import { existsSync, readFileSync } from "fs";
import { Client } from "pg";
import { Resend } from "resend";
import { trialPromoEmail } from "../src/lib/promo-email";
import { unsubUrl } from "../src/lib/email-unsub";

// --- env loading: shell env wins, then .env.local, then .env ---
function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf-8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnv(".env.local");
loadEnv(".env");

const FROM = "Dailymood <hello@dailymood.me>";
const CTA_URL = process.env.PROMO_CTA_URL || "https://my.dailymood.me/profile/subscription";
const DELAY_MS = Number(process.env.DELAY_MS || 250);
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null;
const DRY_RUN = !!process.env.DRY_RUN;
const TEST_TO = process.env.TEST_TO;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendOne(resend: Resend, user: { id: string; email: string; name: string | null; locale: string | null }) {
  const u = unsubUrl(user.id);
  const { subject, html } = trialPromoEmail({
    name: user.name,
    locale: user.locale ?? "en",
    ctaUrl: CTA_URL,
    unsubUrl: u,
  });
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${u}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

async function main() {
  if (!process.env.RESEND_API_KEY && !DRY_RUN) throw new Error("RESEND_API_KEY not set");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Test mode: send a single email, no DB segment.
  if (TEST_TO) {
    console.log(`TEST send → ${TEST_TO} (locale=${process.env.TEST_LOCALE || "th"})`);
    await sendOne(resend, {
      id: "test-recipient",
      email: TEST_TO,
      name: null,
      locale: process.env.TEST_LOCALE || "th",
    });
    console.log("Sent. Check the inbox (image + layout + unsubscribe link).");
    return;
  }

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const limitSql = LIMIT ? `LIMIT ${LIMIT}` : "";
  const { rows } = await db.query<{ id: string; email: string; name: string | null; locale: string | null }>(
    `SELECT id, email, name, locale
       FROM users
      WHERE is_premium = false
        AND trial_activated_at IS NULL
        AND marketing_opt_out = false
        AND trial_promo_sent_at IS NULL
        AND email_verified IS NOT NULL
      ORDER BY created_at ASC
      ${limitSql}`,
  );

  console.log(`Segment: ${rows.length} recipient(s).`);

  if (DRY_RUN) {
    console.log("DRY RUN — nothing will be sent. Sample:");
    for (const r of rows.slice(0, 10)) console.log(`  ${r.email} (locale=${r.locale ?? "en"})`);
    if (rows.length > 10) console.log(`  …and ${rows.length - 10} more`);
    await db.end();
    return;
  }

  let sent = 0;
  let failed = 0;
  for (const user of rows) {
    try {
      await sendOne(resend, user);
      await db.query(`UPDATE users SET trial_promo_sent_at = now() WHERE id = $1`, [user.id]);
      sent++;
    } catch (e) {
      failed++;
      console.error(`  failed: ${user.email} — ${(e as Error).message}`);
    }
    if (DELAY_MS) await sleep(DELAY_MS);
  }

  console.log(`\nDone. sent=${sent} failed=${failed} total=${rows.length}`);
  await db.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
