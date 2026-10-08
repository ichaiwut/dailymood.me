/**
 * Create the new Stripe Price objects for the ฿49/mo + ฿390/yr pricing.
 *
 * Stripe Price objects are IMMUTABLE — you can't change the amount of an
 * existing price. To switch the charged amount you create NEW prices and
 * repoint STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY at them. Existing
 * subscribers keep their old price (grandfathered) until they cancel/resub.
 *
 * The amounts come from src/lib/pricing.ts (PRICING), so the prices created
 * here always match what the UI shows. THB is a 2-decimal currency in Stripe,
 * so ฿49 → unit_amount 4900 (consistent with the webhook's amount_total / 100).
 *
 * By default it reuses the SAME Product as your current monthly price (looked
 * up from STRIPE_PRICE_MONTHLY) so both old and new prices live under one
 * product. Override with STRIPE_PRODUCT_ID=<prod_…> if you prefer.
 *
 * Usage (run from project root):
 *   Dry run (prints what it would create, makes nothing):
 *     DRY_RUN=1 npx tsx scripts/create-stripe-prices.ts
 *   Create against TEST keys (uses STRIPE_SECRET_KEY from .env / .env.local):
 *     npx tsx scripts/create-stripe-prices.ts
 *   Create against LIVE keys (export the live secret first):
 *     STRIPE_SECRET_KEY=sk_live_… npx tsx scripts/create-stripe-prices.ts
 *
 * The mode (test vs live) is derived from the secret key prefix and printed
 * loudly before anything is created. After it prints the new IDs, paste them
 * into the matching env (.env.local for test, Railway for live).
 */
import { existsSync, readFileSync } from "fs";
import Stripe from "stripe";
import { PRICING } from "../src/lib/pricing";

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

const DRY_RUN = process.env.DRY_RUN === "1";

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error("✗ STRIPE_SECRET_KEY is not set. Add it to .env.local or export it.");
    process.exit(1);
  }
  const mode = secret.startsWith("sk_live_") ? "LIVE" : secret.startsWith("sk_test_") ? "TEST" : "UNKNOWN";

  const stripe = new Stripe(secret, { apiVersion: "2026-04-22.dahlia" });

  console.log(`\n=== Stripe price setup — mode: ${mode} ===`);
  console.log(`Monthly: ฿${PRICING.monthly} → unit_amount ${PRICING.monthly * 100} thb`);
  console.log(`Yearly:  ฿${PRICING.yearly} → unit_amount ${PRICING.yearly * 100} thb`);

  // Resolve which Product the new prices belong to.
  let productId = process.env.STRIPE_PRODUCT_ID;
  if (!productId) {
    const currentMonthly = process.env.STRIPE_PRICE_MONTHLY;
    if (currentMonthly) {
      try {
        const existing = await stripe.prices.retrieve(currentMonthly);
        productId = typeof existing.product === "string" ? existing.product : existing.product.id;
        console.log(`Reusing product from current STRIPE_PRICE_MONTHLY: ${productId}`);
      } catch {
        console.log(`Could not retrieve STRIPE_PRICE_MONTHLY (${currentMonthly}) in ${mode} mode — likely a different-mode id.`);
      }
    }
  } else {
    console.log(`Using STRIPE_PRODUCT_ID override: ${productId}`);
  }

  if (DRY_RUN) {
    console.log(
      productId
        ? `\n[DRY_RUN] Would create 2 prices under product ${productId}. Nothing created.\n`
        : `\n[DRY_RUN] Would create a new product "DailyMood Pro" + 2 prices. Nothing created.\n`,
    );
    return;
  }

  if (!productId) {
    const product = await stripe.products.create({ name: "DailyMood Pro" });
    productId = product.id;
    console.log(`Created new product: ${productId}`);
  }

  const monthly = await stripe.prices.create({
    product: productId,
    unit_amount: PRICING.monthly * 100,
    currency: "thb",
    recurring: { interval: "month" },
    nickname: `Pro Monthly ฿${PRICING.monthly}`,
  });

  const yearly = await stripe.prices.create({
    product: productId,
    unit_amount: PRICING.yearly * 100,
    currency: "thb",
    recurring: { interval: "year" },
    nickname: `Pro Yearly ฿${PRICING.yearly}`,
  });

  console.log(`\n✓ Created prices in ${mode} mode. Paste these into the matching env:\n`);
  console.log(`STRIPE_PRICE_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_YEARLY=${yearly.id}\n`);
  console.log(mode === "LIVE"
    ? "→ Update these on Railway (live)."
    : "→ Update these in .env.local (test).");
}

main().catch((e) => {
  console.error("✗ Failed:", e);
  process.exit(1);
});
