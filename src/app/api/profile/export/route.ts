import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { moodEntries, moodTypes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  const { userId } = await getSessionInfo();
  if (!userId) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const db = getDb();

  const moods = await db.select().from(moodTypes);
  const moodMap = new Map(moods.map((m) => [m.id, m]));

  const entries = await db
    .select()
    .from(moodEntries)
    .where(eq(moodEntries.userId, userId))
    .orderBy(desc(moodEntries.createdAt));

  const header = "Date,Time,Mood,Mood (TH),Score,Note,Tags,AI Summary,Source";
  const rows = entries.map((e) => {
    const mood = moodMap.get(e.moodTypeId);
    const scores: Record<string, number> = { happy: 5, neutral: 4, calm: 3, sad: 2, angry: 1, anxious: 2, tired: 2 };
    const time = e.createdAt.toISOString().slice(11, 16);
    return [
      e.date,
      time,
      csvEscape(mood?.label ?? e.moodTypeId),
      csvEscape(mood?.labelTh ?? ""),
      scores[e.moodTypeId] ?? 3,
      csvEscape(e.note ?? ""),
      csvEscape((e.tags as string[] | null)?.join(", ") ?? ""),
      csvEscape(e.aiSummary ?? ""),
      e.aiSource,
    ].join(",");
  });

  const csv = "﻿" + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dailymood-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
