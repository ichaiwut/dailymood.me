import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/cf";
import { users, moodEntries, feedbacks, aiUsage } from "@/db/schema";
import { sql, gte, eq, desc } from "drizzle-orm";
import { StatCard } from "@/components/admin/stat-card";
import Link from "next/link";


function dates() {
  const now = Date.now();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return {
    today: ymd(new Date(now)),
    d7: ymd(new Date(now - 7 * 86400_000)),
    d30: ymd(new Date(now - 30 * 86400_000)),
  };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const db = getDb();

  const { today, d7, d30 } = dates();

  const [
    [{ total: totalUsers }],
    [{ total: premiumUsers }],
    [{ total: totalEntries }],
    [{ total: entries7d }],
    [{ total: newUsers30d }],
    [{ nlp: aiTodayNlp, vision: aiTodayVision }],
    recentFeedback,
    [{ total: totalFeedback }],
    [{ nlp: totalNlp, vision: totalVision }],
  ] = await Promise.all([
    db.select({ total: sql<number>`count(*)` }).from(users),
    db.select({ total: sql<number>`count(*)` }).from(users).where(eq(users.isPremium, true)),
    db.select({ total: sql<number>`count(*)` }).from(moodEntries),
    db.select({ total: sql<number>`count(*)` }).from(moodEntries).where(gte(moodEntries.date, d7)),
    db.select({ total: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, new Date(d30))),
    db
      .select({
        nlp: sql<number>`coalesce(sum(${aiUsage.nlpCount}), 0)`,
        vision: sql<number>`coalesce(sum(${aiUsage.visionCount}), 0)`,
      })
      .from(aiUsage)
      .where(eq(aiUsage.date, today)),
    db
      .select({
        id: feedbacks.id,
        message: feedbacks.message,
        createdAt: feedbacks.createdAt,
        userId: feedbacks.userId,
      })
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt))
      .limit(5),
    db.select({ total: sql<number>`count(*)` }).from(feedbacks),
    db
      .select({
        nlp: sql<number>`coalesce(sum(${aiUsage.nlpCount}), 0)`,
        vision: sql<number>`coalesce(sum(${aiUsage.visionCount}), 0)`,
      })
      .from(aiUsage)
      .where(gte(aiUsage.date, d30)),
  ]);

  return (
    <div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "var(--ink)",
          marginBottom: 24,
        }}
      >
        ภาพรวม
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="ผู้ใช้ทั้งหมด" value={totalUsers} sub={`Premium: ${premiumUsers}`} color="var(--purple)" />
        <StatCard label="บันทึกทั้งหมด" value={totalEntries} sub={`7 วันล่าสุด: ${entries7d}`} />
        <StatCard label="ผู้ใช้ใหม่ (30 วัน)" value={newUsers30d} color="var(--mint)" />
        <StatCard label="AI วันนี้" value={aiTodayNlp + aiTodayVision} sub={`NLP: ${aiTodayNlp} | Vision: ${aiTodayVision}`} color="var(--peach)" />
        <StatCard label="AI 30 วัน" value={totalNlp + totalVision} sub={`NLP: ${totalNlp} | Vision: ${totalVision}`} />
        <StatCard label="ความคิดเห็น" value={totalFeedback} />
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--hairline)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>ความคิดเห็นล่าสุด</h2>
          <Link
            href="/admin/feedback"
            style={{ fontSize: 13, color: "var(--purple)", fontWeight: 600, textDecoration: "none" }}
          >
            ดูทั้งหมด →
          </Link>
        </div>

        {recentFeedback.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>ยังไม่มีความคิดเห็น</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentFeedback.map((fb) => (
              <div
                key={fb.id}
                style={{
                  padding: "12px 16px",
                  background: "var(--surface-2)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
              >
                <div style={{ color: "var(--ink)", marginBottom: 4 }}>
                  {fb.message.length > 120 ? fb.message.slice(0, 120) + "..." : fb.message}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {fb.userId.slice(0, 8)}... · {fb.createdAt.toLocaleDateString("th-TH")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
