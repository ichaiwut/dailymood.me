const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXTAUTH_URL || "https://my.dailymood.me";
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let started = false;

export function startCronScheduler() {
  if (started || !CRON_SECRET || process.env.NODE_ENV !== "production") return;
  started = true;

  console.log("[cron] Scheduler started — reminders every 30min, AI coach at 08:00 ICT, weekly digest Mon 08:00 ICT");

  setInterval(async () => {
    try {
      const res = await fetch(`${APP_URL}/api/cron/reminders`, {
        method: "POST",
        headers: { "x-cron-secret": CRON_SECRET },
      });
      const data = await res.json();
      console.log(`[cron] Reminders: sent=${(data as Record<string,unknown>).sent}`);
    } catch (e) {
      console.error("[cron] Reminders failed:", e);
    }

    // The scheduler ticks every 30 min, so the 01:00 UTC hour contains TWO
    // ticks. Daily/weekly jobs must fire once per occurrence, so restrict them
    // to the first half-hour tick (of the two ticks in the hour, exactly one
    // lands in [:00,:30)). Each handler also has a persistent guard as backstop.
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcDay = now.getUTCDay();
    const utcMinute = now.getUTCMinutes();
    const dailyWindow = utcHour === 1 && utcMinute < 30;

    // AI Coach: once daily around 08:00 ICT (01:00 UTC)
    if (dailyWindow) {
      try {
        const res = await fetch(`${APP_URL}/api/cron/ai-coach`, {
          headers: { "x-cron-secret": CRON_SECRET },
        });
        const data = await res.json();
        console.log(`[cron] AI Coach: sent=${(data as Record<string,unknown>).sent}`);
      } catch (e) {
        console.error("[cron] AI Coach failed:", e);
      }
    }

    // Weekly Digest: Monday 08:00 ICT (01:00 UTC, day=1)
    if (dailyWindow && utcDay === 1) {
      try {
        const res = await fetch(`${APP_URL}/api/cron/weekly-digest`, {
          headers: { "x-cron-secret": CRON_SECRET },
        });
        const data = await res.json();
        console.log(`[cron] Weekly Digest: sent=${(data as Record<string,unknown>).sent}`);
      } catch (e) {
        console.error("[cron] Weekly Digest failed:", e);
      }
    }
  }, INTERVAL_MS);
}
