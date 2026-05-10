"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DEFAULT_MOOD_IDS } from "@/lib/default-moods";
import { R2_PUBLIC_URL } from "@/lib/moods";

interface Pack {
  id: string;
  label: string;
  premium: boolean;
  iconFormat: string;
  createdAt: string;
}

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline)",
  borderRadius: 16,
  padding: 24,
};

const MOOD_LABELS: Record<string, string> = {
  amazing: "Happy",
  happy: "Calm",
  neutral: "Neutral",
  sad: "Sad",
  angry: "Angry",
  anxious: "Anxious",
  tired: "Tired",
};

export function PacksShell() {
  const [state, setState] = useState<{
    packs: Pack[];
    loading: boolean;
    creating: boolean;
    uploading: boolean;
    uploadPackId: string | null;
    editingId: string | null;
  }>({ packs: [], loading: true, creating: false, uploading: false, uploadPackId: null, editingId: null });
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPremium, setNewPremium] = useState(false);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [editLabel, setEditLabel] = useState("");
  const [editPremium, setEditPremium] = useState(false);

  const fetchPacks = useCallback(async () => {
    const res = await fetch("/api/admin/packs");
    const data = (await res.json()) as { packs?: Pack[] };
    return data.packs ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPacks().then((p) => { if (!cancelled) setState((s) => ({ ...s, packs: p, loading: false })); });
    return () => { cancelled = true; };
  }, [fetchPacks]);

  async function createPack() {
    if (!newId || !newLabel) return;
    setState((s) => ({ ...s, creating: true }));
    await fetch("/api/admin/packs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: newId, label: newLabel, premium: newPremium }),
    });
    setNewId("");
    setNewLabel("");
    setNewPremium(false);
    const p = await fetchPacks();
    setState((s) => ({ ...s, packs: p, creating: false }));
  }

  async function deletePack(id: string) {
    if (!confirm(`ลบ pack "${id}"? ผู้ใช้ที่ใช้ pack นี้จะถูกเปลี่ยนกลับเป็น default`)) return;
    await fetch(`/api/admin/packs/${id}`, { method: "DELETE" });
    const p = await fetchPacks();
    setState((s) => ({ ...s, packs: p }));
  }

  async function updatePack(id: string) {
    await fetch(`/api/admin/packs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: editLabel, premium: editPremium }),
    });
    const p = await fetchPacks();
    setState((s) => ({ ...s, packs: p, editingId: null }));
  }

  async function uploadSvgs(packId: string) {
    if (Object.keys(files).length === 0) return;
    setState((s) => ({ ...s, uploading: true }));
    const form = new FormData();
    for (const [moodId, file] of Object.entries(files)) {
      form.append(moodId, file);
    }
    await fetch(`/api/admin/packs/${packId}/upload`, { method: "POST", body: form });
    setFiles({});
    const p = await fetchPacks();
    setState((s) => ({ ...s, packs: p, uploadPackId: null, uploading: false }));
  }

  function iconUrl(packId: string, moodId: string, format: string) {
    return `${R2_PUBLIC_URL}/${packId}/${moodId}.${format}`;
  }

  const { packs, loading, creating, uploading, uploadPackId, editingId } = state;

  if (loading) {
    return <div style={{ color: "var(--ink-3)", padding: 40 }}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Mood Packs</h1>

      {/* Create new pack */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>เพิ่ม Pack ใหม่</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", marginBottom: 4 }}>
              ID (a-z, 0-9, _, -)
            </div>
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="my_new_pack"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--hairline)",
                fontSize: 14,
                width: 200,
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", marginBottom: 4 }}>
              ชื่อ Pack
            </div>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="My Pack"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--hairline)",
                fontSize: 14,
                width: 200,
              }}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={newPremium}
              onChange={(e) => setNewPremium(e.target.checked)}
            />
            Premium only
          </label>
          <button
            onClick={createPack}
            disabled={!newId || !newLabel || creating}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "var(--purple)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: !newId || !newLabel || creating ? 0.5 : 1,
            }}
          >
            {creating ? "กำลังสร้าง..." : "สร้าง"}
          </button>
        </div>
      </div>

      {/* Pack list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {packs.map((pack) => (
          <div key={pack.id} style={CARD}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              {editingId === pack.id ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1.5px solid var(--hairline)",
                      fontSize: 14,
                      width: 200,
                    }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={editPremium}
                      onChange={(e) => setEditPremium(e.target.checked)}
                    />
                    Premium
                  </label>
                  <button
                    onClick={() => updatePack(pack.id)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "var(--purple)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={() => setState((s) => ({ ...s, editingId: null }))}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--hairline)",
                      background: "var(--surface)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{pack.label}</span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: pack.premium ? "#F0EDFA" : "#F5F5F5",
                      color: pack.premium ? "var(--purple)" : "var(--ink-3)",
                    }}
                  >
                    {pack.premium ? "Premium" : "Free"}
                  </span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "var(--ink-3)" }}>
                    {pack.id}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                {editingId !== pack.id && (
                  <button
                    onClick={() => {
                      setState((s) => ({ ...s, editingId: pack.id }));
                      setEditLabel(pack.label);
                      setEditPremium(pack.premium);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--hairline)",
                      background: "var(--surface)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    แก้ไข
                  </button>
                )}
                <button
                  onClick={() => setState((s) => ({ ...s, uploadPackId: s.uploadPackId === pack.id ? null : pack.id }))}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--hairline)",
                    background: uploadPackId === pack.id ? "var(--purple)" : "var(--surface)",
                    color: uploadPackId === pack.id ? "#fff" : "var(--ink-2)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Upload SVG
                </button>
                {pack.id !== "set_486038" && (
                  <button
                    onClick={() => deletePack(pack.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #FCC",
                      background: "#FFF5F5",
                      color: "#D44",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ลบ
                  </button>
                )}
              </div>
            </div>

            {/* Icon preview */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {DEFAULT_MOOD_IDS.map((moodId) => (
                <div
                  key={moodId}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "var(--surface-2)",
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={iconUrl(pack.id, moodId, pack.iconFormat)}
                      alt={moodId}
                      width={36}
                      height={36}
                      style={{ objectFit: "contain" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--ink-3)" }}>
                    {MOOD_LABELS[moodId] ?? moodId}
                  </span>
                </div>
              ))}
            </div>

            {/* Upload panel */}
            {uploadPackId === pack.id && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "var(--surface-2)",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                  อัปโหลด SVG สำหรับ {pack.label}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {DEFAULT_MOOD_IDS.map((moodId) => (
                    <label
                      key={moodId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${files[moodId] ? "var(--purple)" : "var(--hairline)"}`,
                        background: "var(--surface)",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ fontWeight: 600, minWidth: 60 }}>
                        {MOOD_LABELS[moodId] ?? moodId}
                      </span>
                      <input
                        type="file"
                        accept=".svg,.webp,.png,image/svg+xml,image/webp,image/png"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setFiles((prev) => ({ ...prev, [moodId]: f }));
                        }}
                        style={{ fontSize: 12, flex: 1 }}
                      />
                      {files[moodId] && (
                        <span style={{ color: "var(--purple)", fontSize: 12 }}>✓</span>
                      )}
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => uploadSvgs(pack.id)}
                    disabled={Object.keys(files).length === 0 || uploading}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--purple)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      opacity: Object.keys(files).length === 0 || uploading ? 0.5 : 1,
                    }}
                  >
                    {uploading ? "กำลังอัปโหลด..." : `อัปโหลด (${Object.keys(files).length} ไฟล์)`}
                  </button>
                  <button
                    onClick={() => { setState((s) => ({ ...s, uploadPackId: null })); setFiles({}); }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid var(--hairline)",
                      background: "var(--surface)",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
