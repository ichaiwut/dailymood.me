import { getDb } from "@/lib/cf";
import { aiUsage } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const FREE_NLP_DAILY_LIMIT = 1;

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getNlpUsage(userId: string, date = todayKey()): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: aiUsage.nlpCount })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.date, date)))
    .limit(1);
  return row?.n ?? 0;
}

/** Atomic increment via UPSERT; returns the new count. */
export async function incNlpUsage(userId: string, date = todayKey()): Promise<number> {
  const db = getDb();
  await db
    .insert(aiUsage)
    .values({ userId, date, nlpCount: 1, visionCount: 0 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.date],
      set: { nlpCount: sql`${aiUsage.nlpCount} + 1` },
    });
  return getNlpUsage(userId, date);
}

export async function incVisionUsage(userId: string, date = todayKey()): Promise<void> {
  const db = getDb();
  await db
    .insert(aiUsage)
    .values({ userId, date, nlpCount: 0, visionCount: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.date],
      set: { visionCount: sql`${aiUsage.visionCount} + 1` },
    });
}
