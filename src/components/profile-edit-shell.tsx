"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const ACCENT_COLORS = [
  "#A673F1", "#FCA45B", "#85ECCB", "#FDCB56", "#9ACDE2", "#D4BEE4",
];

interface UserData {
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  bio: string | null;
  accentColor: string | null;
}

export function ProfileEditShell() {
  const t = useTranslations("profile");
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState("#A673F1");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json() as Promise<{ user: UserData }>)
      .then((d) => {
        const u = d.user;
        setUser(u);
        setName(u.name || "");
        setBio(u.bio || "");
        setAccent(u.accentColor || "#A673F1");
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      name !== (user.name || "") ||
      bio !== (user.bio || "") ||
      accent !== (user.accentColor || "#A673F1")
    );
  }, [name, bio, accent, user]);

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim(), accentColor: accent }),
      });
      if (res.ok) {
        setToast(t("saved"));
        setTimeout(() => router.push("/profile" as "/"), 600);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px 0" }}>
        <div style={{ height: 140, borderRadius: "50%", width: 112, margin: "0 auto 24px", background: "var(--surface-2)" }} className="skeleton-pulse" />
        <div style={{ height: 200, borderRadius: 22, background: "var(--surface)" }} className="skeleton-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const initials = getInitials(name || user.name, user.email);

  return (
    <div className="fade-in center-720" style={{ paddingBottom: 40 }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0 24px" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "transparent", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{t("editProfile")}</div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          style={{
            background: dirty ? "var(--primary)" : "transparent",
            color: dirty ? "#fff" : "var(--ink-3)",
            border: dirty ? "none" : "1.5px solid var(--hairline)",
            borderRadius: 20,
            padding: "8px 18px",
            fontSize: 15, fontWeight: 700,
            cursor: dirty ? "pointer" : "default",
            opacity: dirty ? 1 : 0.5,
            transition: "all 0.2s",
          }}
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>

      {/* Avatar Card */}
      <div
        style={{
          background: "#fff", border: "1.5px solid #F2F0F5", borderRadius: 24,
          padding: "28px 20px", textAlign: "center", marginBottom: 16,
        }}
      >
        <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 16px" }}>
          {user.image ? (
            <img
              src={user.image}
              alt=""
              referrerPolicy="no-referrer"
              style={{
                width: 120, height: 120, borderRadius: "50%",
                objectFit: "cover", border: "3px solid #F2F0F5",
              }}
            />
          ) : (
            <div
              style={{
                width: 120, height: 120, borderRadius: "50%",
                background: accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 44, fontWeight: 800, color: "#fff",
              }}
            >
              {initials}
            </div>
          )}
          <div
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 36, height: 36, borderRadius: "50%",
              background: "#FCA45B", border: "3px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, cursor: "pointer",
            }}
          >
            📷
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div
        style={{
          background: "#fff", border: "1.5px solid #F2F0F5", borderRadius: 24,
          padding: "24px 20px", marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Display Name */}
          <div>
            <label style={LABEL_STYLE}>{t("displayName")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              style={INPUT_STYLE}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label style={LABEL_STYLE}>{t("email")}</label>
            <div style={{ ...INPUT_STYLE, color: "var(--ink-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{user.email}</span>
              {user.emailVerified && (
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2DA963" }}>
                  ✓ {t("verified")}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={LABEL_STYLE}>{t("bio")}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder={t("bioPlaceholder")}
              rows={3}
              style={{ ...INPUT_STYLE, resize: "none" }}
            />
            <div style={{ fontSize: 14, color: bio.length > 140 ? "#FCA45B" : "var(--ink-3)", textAlign: "right", marginTop: 6, fontWeight: 600 }}>
              {bio.length}/160
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: "#FFFAF8", border: "1.5px solid #F5E0D8", borderRadius: 24,
          padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#D94444" }}>{t("deleteAccount")}</div>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 2 }}>
            {t("deleteAccountDesc") || "ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร"}
          </div>
        </div>
        <button
          type="button"
          style={{
            padding: "10px 20px", borderRadius: 14,
            border: "1.5px solid #F5DADA", background: "#fff",
            fontSize: 14, fontWeight: 700, color: "#D94444", cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {t("deleteAccount")}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
            background: "var(--ink)", color: "#fff", padding: "12px 28px",
            borderRadius: 20, fontSize: 15, fontWeight: 700, zIndex: 200,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: "var(--ink-2)",
  marginBottom: 8, display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", padding: "14px 16px", borderRadius: 16,
  border: "1.5px solid #F2F0F5", background: "#FAFAFA",
  fontSize: 16, fontWeight: 500, color: "var(--ink)",
  outline: "none", fontFamily: "inherit",
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}
