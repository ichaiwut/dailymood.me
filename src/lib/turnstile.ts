// Cloudflare Turnstile server-side verification for the public guest endpoint.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
//
// Fail-open by design: when TURNSTILE_SECRET_KEY is unset (local dev, or before
// the widget is provisioned in the dashboard) verification is skipped so the
// endpoint keeps working. Setting the secret in prod makes the bot check
// mandatory. A missing/invalid token fails closed; a network error talking to
// Cloudflare fails open (don't hard-block real users on our outage — the per-IP
// and global limits still bound abuse).

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skip
  if (!token) return false; // configured but no token → reject

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return !!data?.success;
  } catch {
    return true;
  }
}
