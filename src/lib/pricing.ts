/**
 * Single source of truth for Premium (Pro) pricing shown in the UI.
 *
 * ⚠️ These are DISPLAY values only. The amount Stripe actually charges lives in
 * the Stripe Price objects referenced by STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY.
 * After changing a number here, create matching Stripe Price objects and repoint
 * those env vars — see `scripts/create-stripe-prices.ts`. Mobile (IAP) prices are
 * set in App Store Connect / Google Play, not here.
 */
export const PRICING = {
  /** Monthly plan price, THB */
  monthly: 49,
  /** Yearly plan price, THB */
  yearly: 390,
  /** Yearly plan expressed per month (rounded), THB — the "฿33/เดือน" sub-label */
  yearlyPerMonth: 33,
  /** Savings of yearly vs 12× monthly, percent — the "ประหยัด 34%" badge */
  savingsPct: 34,
} as const;
