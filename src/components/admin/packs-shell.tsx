"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DEFAULT_MOOD_IDS } from "@/lib/default-moods";
import { R2_PUBLIC_URL } from "@/lib/moods";
import { AdminPageHeader } from "./admin-page-header";
import { AdminBadge } from "./admin-badge";
import { A } from "./admin-ui";

interface Pack {
  id: string;
  label: string;
  premium: boolean;
  iconFormat: string;
  createdAt: string;
}

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
  }>({
    packs: [],
    loading: true,
    creating: false,
    uploading: false,
    uploadPackId: null,
    editingId: null,
  });
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
    fetchPacks().then((p) => {
      if (!cancelled)
        setState((s) => ({ ...s, packs: p, loading: false }));
    });
    return () => {
      cancelled = true;
    };
  }, [fetchPacks]);

  async function createPack() {
    if (!newId || !newLabel) return;
    setState((s) => ({ ...s, creating: true }));
    await fetch("/api/admin/packs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: newId,
        label: newLabel,
        premium: newPremium,
      }),
    });
    setNewId("");
    setNewLabel("");
    setNewPremium(false);
    const p = await fetchPacks();
    setState((s) => ({ ...s, packs: p, creating: false }));
  }

  async function deletePack(id: string) {
    if (
      !confirm(
        `ลบ pack "${id}"? ผู้ใช้ที่ใช้ pack นี้จะถูกเปลี่ยนกลับเป็น default`,
      )
    )
      return;
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
    await fetch(`/api/admin/packs/${packId}/upload`, {
      method: "POST",
      body: form,
    });
    setFiles({});
    const p = await fetchPacks();
    setState((s) => ({
      ...s,
      packs: p,
      uploadPackId: null,
      uploading: false,
    }));
  }

  function iconUrl(packId: string, moodId: string, format: string) {
    return `${R2_PUBLIC_URL}/${packId}/${moodId}.${format}`;
  }

  const { packs, loading, creating, uploading, uploadPackId, editingId } =
    state;

  if (loading) {
    return (
      <div style={{ color: "var(--ink-3)", padding: 40, fontSize: 14 }}>
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Mood Packs"
        subtitle={`${packs.length} packs ทั้งหมด`}
        actions={
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={A.btnPrimary}
          >
            + Pack ใหม่
          </button>
        }
      />

      <div style={{ ...A.card, marginBottom: 24 }}>
        <h2 style={{ ...A.sectionTitle, marginBottom: 16 }}>
          เพิ่ม Pack ใหม่
        </h2>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div style={{ ...A.eyebrow, marginBottom: 4 }}>
              ID (a-z, 0-9, _, -)
            </div>
            <input
              value={newId}
              onChange={(e) =>
                setNewId(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                )
              }
              placeholder="my_new_pack"
              style={{ ...A.input, width: 200 }}
            />
          </div>
          <div>
            <div style={{ ...A.eyebrow, marginBottom: 4 }}>ชื่อ Pack</div>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="My Pack"
              style={{ ...A.input, width: 200 }}
            />
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
            }}
          >
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
              ...A.btnPrimary,
              background: "var(--purple)",
              boxShadow:
                "0 7px 0 -2px var(--purple-strong), 0 16px 24px -12px rgba(166, 115, 241, .6)",
              opacity: !newId || !newLabel || creating ? 0.5 : 1,
            }}
          >
            {creating ? "กำลังสร้าง..." : "สร้าง"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
        }}
      >
        {packs.map((pack) => (
          <div key={pack.id} style={A.card}>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {DEFAULT_MOOD_IDS.map((moodId) => (
                <div
                  key={moodId}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 50,
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
                    width={20}
                    height={20}
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {editingId === pack.id ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    style={{ ...A.input, width: 150, height: 32 }}
                  />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 14,
                    }}
                  >
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
                      ...A.btnSmall,
                      background: "var(--purple)",
                      color: "#fff",
                    }}
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={() =>
                      setState((s) => ({ ...s, editingId: null }))
                    }
                    style={A.btnSmall}
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {pack.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                    }}
                  >
                    {pack.id}
                  </div>
                </div>
              )}
              {editingId !== pack.id && (
                <AdminBadge
                  variant={pack.premium ? "premium" : "free"}
                >
                  {pack.premium ? "Premium" : "Free"}
                </AdminBadge>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 14,
              }}
            >
              {editingId !== pack.id && (
                <button
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      editingId: pack.id,
                    }));
                    setEditLabel(pack.label);
                    setEditPremium(pack.premium);
                  }}
                  style={{ ...A.btnSmall, flex: 1 }}
                >
                  แก้ไข
                </button>
              )}
              <button
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    uploadPackId:
                      s.uploadPackId === pack.id ? null : pack.id,
                  }))
                }
                style={{
                  ...A.btnSmall,
                  flex: 1,
                  background:
                    uploadPackId === pack.id
                      ? "var(--purple)"
                      : "transparent",
                  color:
                    uploadPackId === pack.id
                      ? "#fff"
                      : "var(--ink-2)",
                }}
              >
                Upload
              </button>
              {pack.id !== "set_486038" && (
                <button
                  onClick={() => deletePack(pack.id)}
                  style={{ ...A.btnDanger, flex: 1 }}
                >
                  ลบ
                </button>
              )}
            </div>

            {uploadPackId === pack.id && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "var(--surface-2)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  อัปโหลดสำหรับ {pack.label}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 10,
                  }}
                >
                  {DEFAULT_MOOD_IDS.map((moodId) => (
                    <label
                      key={moodId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${files[moodId] ? "var(--purple)" : "var(--hairline)"}`,
                        background: "var(--surface)",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          minWidth: 60,
                        }}
                      >
                        {MOOD_LABELS[moodId] ?? moodId}
                      </span>
                      <input
                        type="file"
                        accept=".svg,.webp,.png,image/svg+xml,image/webp,image/png"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f)
                            setFiles((prev) => ({
                              ...prev,
                              [moodId]: f,
                            }));
                        }}
                        style={{ fontSize: 12, flex: 1 }}
                      />
                      {files[moodId] && (
                        <span
                          style={{
                            color: "var(--purple)",
                            fontSize: 12,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    onClick={() => uploadSvgs(pack.id)}
                    disabled={
                      Object.keys(files).length === 0 || uploading
                    }
                    style={{
                      ...A.btnPrimary,
                      background: "var(--purple)",
                      boxShadow:
                        "0 7px 0 -2px var(--purple-strong), 0 16px 24px -12px rgba(166, 115, 241, .6)",
                      opacity:
                        Object.keys(files).length === 0 || uploading
                          ? 0.5
                          : 1,
                    }}
                  >
                    {uploading
                      ? "กำลังอัปโหลด..."
                      : `อัปโหลด (${Object.keys(files).length} ไฟล์)`}
                  </button>
                  <button
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        uploadPackId: null,
                      }));
                      setFiles({});
                    }}
                    style={A.btnGhost}
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
