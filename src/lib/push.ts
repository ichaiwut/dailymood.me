// Expo push notifications. The mobile app (Expo) registers an Expo push token
// (`ExponentPushToken[...]`) via POST /api/notifications/register; we send through
// Expo's push service, which proxies to APNs (iOS) and FCM (Android) — so the
// server never touches Apple/Google credentials directly.
//
// Raw fetch (no SDK) to match the codebase's other integrations (revenuecat.ts,
// turnstile.ts, line.ts). Handles 100-per-request chunking and prunes tokens that
// Expo reports as DeviceNotRegistered.
//
// Env: EXPO_ACCESS_TOKEN (optional) — if set, sent as a Bearer to harden the push
// endpoint against spoofed sends. Push works without it.

import { getDb } from "@/lib/cf";
import { deviceTokens } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK = 100;

export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: "ok" | "error";
  details?: { error?: string };
}

/** Send to explicit tokens; returns the subset that are dead (DeviceNotRegistered). */
async function sendToTokens(tokens: string[], msg: PushMessage): Promise<string[]> {
  const valid = tokens.filter(isExpoPushToken);
  if (valid.length === 0) return [];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  const dead: string[] = [];
  for (let i = 0; i < valid.length; i += CHUNK) {
    const chunk = valid.slice(i, i + CHUNK);
    const messages = chunk.map((to) => ({
      to,
      title: msg.title,
      body: msg.body,
      sound: "default",
      ...(msg.data ? { data: msg.data } : {}),
    }));
    try {
      const res = await fetch(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(messages) });
      const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
      const tickets = json?.data ?? [];
      tickets.forEach((t, idx) => {
        if (t.status === "error" && t.details?.error === "DeviceNotRegistered") dead.push(chunk[idx]);
      });
    } catch {
      // Network error talking to Expo — skip this chunk; do NOT treat as dead.
    }
  }
  return dead;
}

async function pruneTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  try {
    await getDb().delete(deviceTokens).where(inArray(deviceTokens.token, tokens));
  } catch {
    // best-effort
  }
}

/**
 * Push to all of a user's registered devices, auto-pruning dead tokens.
 * Returns the number of device tokens the user had (0 = no devices → caller may
 * fall back to email). Never throws — push is best-effort.
 */
export async function pushToUser(userId: string, msg: PushMessage): Promise<number> {
  try {
    const rows = await getDb()
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, userId));
    const tokens = rows.map((r) => r.token);
    if (tokens.length === 0) return 0;
    const dead = await sendToTokens(tokens, msg);
    if (dead.length) await pruneTokens(dead);
    return tokens.length;
  } catch {
    return 0;
  }
}
