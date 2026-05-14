const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXTAUTH_URL || "https://my.dailymood.me";
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let started = false;

export function startCronScheduler() {
  if (started || !CRON_SECRET || process.env.NODE_ENV !== "production") return;
  started = true;

  console.log("[cron] Scheduler started — reminders every 30min, AI coach at 08:00 ICT");

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

    // AI Coach: once daily around 08:00 ICT (01:00 UTC)
    const utcHour = new Date().getUTCHours();
    if (utcHour === 1) {
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
  }, INTERVAL_MS);
}
