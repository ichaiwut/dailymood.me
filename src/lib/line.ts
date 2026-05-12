const LINE_API = "https://api.line.me/v2/bot/message/push";

export async function notifyAdmin(message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;
  if (!token || !userId) return;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(LINE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: message }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.error(`[line] push failed: ${res.status}`, await res.text().catch(() => ""));
    }
  } catch {
    // fire-and-forget — don't break the main flow
  } finally {
    clearTimeout(timer);
  }
}
