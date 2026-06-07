"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { togglePremium, deleteUser } from "@/lib/admin-actions";
import { AdminStatCard as StatCard } from "./admin-stat-card";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  isPremium: boolean;
  planInterval: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  locale: string | null;
  bio: string | null;
  accentColor: string | null;
  createdAt: string;
  emailVerified: boolean;
  hasPassword: boolean;
  providers: string[];
  totalEntries: number;
  totalNlp: number;
  totalVision: number;
}

interface EntryRow {
  id: string;
  moodTypeId: string;
  aiSource: string;
  date: string;
  createdAt: string;
}

const CARD: React.CSSProperties = {
  background: "var(--w-surface)",
  border: "1px solid var(--w-rule)",
  borderRadius: "4px 18px 18px 18px",
  padding: 24,
  boxShadow: "0 18px 40px -20px rgba(60, 40, 20, .45)",
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 4,
};

export function UserDetailShell({
  user,
  entries,
}: {
  user: UserData;
  entries: EntryRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div style={{ opacity: pending ? 0.6 : 1, transition: "opacity 200ms" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link
          href="/admin/users"
          style={{ fontSize: 13, fontWeight: 700, color: "var(--purple-strong)", textDecoration: "none" }}
        >
          ← ผู้ใช้ทั้งหมด
        </Link>
      </div>

      <div style={{ ...CARD, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {user.name || user.email}
            </h1>
            <div style={{ fontSize: 14, color: "var(--ink-2)" }}>{user.email}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() =>
                startTransition(() => togglePremium(user.id, !user.isPremium))
              }
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: user.isPremium ? "none" : "1px solid var(--w-rule-strong)",
                background: user.isPremium
                  ? "linear-gradient(135deg, var(--peach), var(--purple))"
                  : "var(--w-surface)",
                color: user.isPremium ? "#fff" : "var(--w-ink-2)",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: user.isPremium
                  ? "0 10px 22px -10px rgba(166,115,241,.7)"
                  : "0 6px 16px -8px rgba(60,40,20,.35)",
              }}
            >
              {user.isPremium ? "✨ ปิด Premium" : "เปิด Premium"}
            </button>
            <button
              onClick={() => {
                if (confirm(`ลบผู้ใช้ ${user.email}? ข้อมูลทั้งหมดจะถูกลบถาวร`)) {
                  startTransition(async () => {
                    await deleteUser(user.id);
                    router.push("/admin/users");
                  });
                }
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: "var(--w-tint-danger)",
                color: "var(--w-tint-danger-fg)",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ลบผู้ใช้
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            fontSize: 13,
          }}
        >
          <InfoRow label="ID" value={user.id} />
          <InfoRow label="สถานะ" value={user.isPremium ? "✨ Pro" : "Free"} />
          <InfoRow label="แผน" value={user.planInterval ?? "—"} />
          <InfoRow label="ยืนยันอีเมล" value={user.emailVerified ? "✓" : "✗"} />
          <InfoRow label="มีรหัสผ่าน" value={user.hasPassword ? "✓" : "✗"} />
          <InfoRow label="Provider" value={user.providers.join(", ") || "—"} />
          <InfoRow label="ภาษา" value={user.locale ?? "en"} />
          <InfoRow label="สี" value={user.accentColor ?? "default"} />
          <InfoRow label="สมัครเมื่อ" value={new Date(user.createdAt).toLocaleDateString("th-TH")} />
          {user.currentPeriodEnd && (
            <InfoRow
              label="ถัดไป"
              value={new Date(user.currentPeriodEnd).toLocaleDateString("th-TH")}
            />
          )}
          {user.cancelAtPeriodEnd && (
            <InfoRow label="ยกเลิก" value="จะหมดอายุตามรอบ" />
          )}
          <InfoRow label="Stripe Customer" value={user.stripeCustomerId ?? "—"} />
        </div>
        {user.bio && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-2)" }}>
            <span style={LABEL}>Bio</span>
            <div>{user.bio}</div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="บันทึกทั้งหมด" value={user.totalEntries} tab="peach" />
        <StatCard label="NLP Calls" value={user.totalNlp} tab="purple" />
        <StatCard label="Vision Calls" value={user.totalVision} tab="mint" />
      </div>

      <div style={CARD}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          บันทึกล่าสุด (20 รายการ)
        </h2>
        {entries.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>ไม่มีบันทึก</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["วันที่", "Mood", "แหล่งที่มา"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--w-ink-3)",
                      padding: "8px 10px",
                      textAlign: "left",
                      borderBottom: "1.5px solid var(--w-rule)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td style={{ padding: "8px 10px", fontSize: 13 }}>{e.date}</td>
                  <td style={{ padding: "8px 10px", fontSize: 13 }}>{e.moodTypeId}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: "var(--ink-3)" }}>
                    {e.aiSource}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink)", wordBreak: "break-all" }}>
        {value}
      </div>
    </div>
  );
}
