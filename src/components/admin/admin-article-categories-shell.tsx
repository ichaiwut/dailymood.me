"use client";

import { useEffect, useState, useCallback } from "react";

interface Category {
  id: string;
  slug: string;
  labelTh: string;
  labelEn: string;
  order: number;
}

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline)",
  borderRadius: 16,
  padding: 24,
};

export function AdminArticleCategoriesShell() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [slug, setSlug] = useState("");
  const [labelTh, setLabelTh] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [order, setOrder] = useState(0);

  const [editId, setEditId] = useState<string | null>(null);
  const [editLabelTh, setEditLabelTh] = useState("");
  const [editLabelEn, setEditLabelEn] = useState("");
  const [editOrder, setEditOrder] = useState(0);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/article-categories");
    const data = (await res.json()) as { categories?: Category[] };
    return data.categories ?? [];
  }, []);

  useEffect(() => {
    fetchCategories().then((c) => { setCategories(c); setLoading(false); });
  }, [fetchCategories]);

  async function create() {
    if (!slug || !labelTh || !labelEn) return;
    setSaving(true);
    const res = await fetch("/api/admin/article-categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, labelTh, labelEn, order }),
    });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      alert(d.error === "slug_taken" ? "Slug นี้ถูกใช้แล้ว" : d.error);
      setSaving(false);
      return;
    }
    setSlug(""); setLabelTh(""); setLabelEn(""); setOrder(0);
    setCategories(await fetchCategories());
    setSaving(false);
  }

  async function save(id: string) {
    await fetch(`/api/admin/article-categories/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ labelTh: editLabelTh, labelEn: editLabelEn, order: editOrder }),
    });
    setEditId(null);
    setCategories(await fetchCategories());
  }

  async function remove(id: string) {
    if (!confirm("ลบหมวดหมู่นี้? บทความในหมวดนี้จะถูก unlink")) return;
    await fetch(`/api/admin/article-categories/${id}`, { method: "DELETE" });
    setCategories(await fetchCategories());
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>หมวดหมู่บทความ</h1>

      {/* Create form */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>เพิ่มหมวดหมู่ใหม่</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>Slug</label>
            <input className="w-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. basics" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>ชื่อ (TH)</label>
            <input className="w-input" value={labelTh} onChange={(e) => setLabelTh(e.target.value)} placeholder="พื้นฐาน" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>Label (EN)</label>
            <input className="w-input" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} placeholder="Basics" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>ลำดับ</label>
            <input className="w-input" type="number" value={order} onChange={(e) => setOrder(+e.target.value)} style={{ width: 70 }} />
          </div>
          <button className="w-btn w-btn-primary" onClick={create} disabled={saving} style={{ height: 42 }}>
            {saving ? "..." : "เพิ่ม"}
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ ...CARD }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline)", textAlign: "left" }}>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Slug</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>ชื่อ (TH)</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Label (EN)</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>ลำดับ</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <td style={{ padding: "10px 12px" }}>{cat.slug}</td>
                <td style={{ padding: "10px 12px" }}>
                  {editId === cat.id ? (
                    <input className="w-input" value={editLabelTh} onChange={(e) => setEditLabelTh(e.target.value)} style={{ height: 34 }} />
                  ) : cat.labelTh}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {editId === cat.id ? (
                    <input className="w-input" value={editLabelEn} onChange={(e) => setEditLabelEn(e.target.value)} style={{ height: 34 }} />
                  ) : cat.labelEn}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {editId === cat.id ? (
                    <input className="w-input" type="number" value={editOrder} onChange={(e) => setEditOrder(+e.target.value)} style={{ width: 60, height: 34 }} />
                  ) : cat.order}
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 8 }}>
                  {editId === cat.id ? (
                    <>
                      <button className="w-btn w-btn-primary" onClick={() => save(cat.id)} style={{ height: 32, fontSize: 13 }}>บันทึก</button>
                      <button className="w-btn w-btn-ghost" onClick={() => setEditId(null)} style={{ height: 32, fontSize: 13 }}>ยกเลิก</button>
                    </>
                  ) : (
                    <>
                      <button
                        className="w-btn w-btn-ghost"
                        onClick={() => { setEditId(cat.id); setEditLabelTh(cat.labelTh); setEditLabelEn(cat.labelEn); setEditOrder(cat.order); }}
                        style={{ height: 32, fontSize: 13 }}
                      >
                        แก้ไข
                      </button>
                      <button className="w-btn w-btn-ghost" onClick={() => remove(cat.id)} style={{ height: 32, fontSize: 13, color: "#e53e3e" }}>ลบ</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
