"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { optimizeImage } from "@/lib/client-image";

interface Category {
  id: string;
  slug: string;
  labelTh: string;
  labelEn: string;
}

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline)",
  borderRadius: 16,
  padding: 24,
};

export function AdminArticleEditorShell({ articleId }: { articleId: string }) {
  const isNew = articleId === "new";
  const router = useRouter();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [slug, setSlug] = useState("");
  const [titleTh, setTitleTh] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [excerptTh, setExcerptTh] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [bodyTh, setBodyTh] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [published, setPublished] = useState(false);
  const [tone, setTone] = useState("peach");
  const [tagsStr, setTagsStr] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : articleId);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/article-categories");
    const data = (await res.json()) as { categories?: Category[] };
    setCategories(data.categories ?? []);
  }, []);

  useEffect(() => {
    fetchCategories();
    if (!isNew) {
      fetch(`/api/admin/articles/${articleId}`)
        .then((r) => r.json() as Promise<{ article?: { slug: string; titleTh: string; titleEn: string; excerptTh: string; excerptEn: string; bodyTh: string; bodyEn: string; categoryId: string | null; published: boolean; tone: string; tags: string[] } }>)
        .then((data) => {
          const a = data.article;
          if (!a) return;
          setSlug(a.slug);
          setTitleTh(a.titleTh);
          setTitleEn(a.titleEn);
          setExcerptTh(a.excerptTh);
          setExcerptEn(a.excerptEn);
          setBodyTh(a.bodyTh);
          setBodyEn(a.bodyEn);
          setCategoryId(a.categoryId ?? "");
          setPublished(a.published);
          setTone(a.tone ?? "peach");
          setTagsStr((a.tags ?? []).join(", "));
          setLoading(false);
        });
    }
  }, [articleId, isNew, fetchCategories]);

  async function save() {
    if (!slug || !titleTh || !titleEn || !excerptTh || !excerptEn) {
      alert("กรุณากรอกข้อมูลให้ครบ (slug, title, excerpt)");
      return;
    }
    setSaving(true);

    if (isNew && !savedId) {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, titleTh, titleEn, excerptTh, excerptEn, bodyTh, bodyEn, categoryId: categoryId || null, published, tone, tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean) }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        alert(data.error === "slug_taken" ? "Slug นี้ถูกใช้แล้ว" : data.error);
        setSaving(false);
        return;
      }
      setSavedId(data.id ?? null);
      setSaving(false);
      router.push(`/admin/articles/${data.id}`);
    } else {
      const id = savedId ?? articleId;
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titleTh, titleEn, excerptTh, excerptEn, bodyTh, bodyEn, categoryId: categoryId || null, published, tone, tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean) }),
      });
      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        alert(errData.error);
      }
      setSaving(false);
    }
  }

  async function uploadCover(file: File) {
    const id = savedId ?? articleId;
    if (!id || id === "new") {
      alert("บันทึกบทความก่อนอัปโหลดรูปปก");
      return;
    }
    const optimized = await optimizeImage(file);
    const fd = new FormData();
    fd.append("cover", optimized);
    const res = await fetch(`/api/admin/articles/${id}/cover`, { method: "POST", body: fd });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      alert(err.error ?? "อัปโหลดรูปปกไม่สำเร็จ");
      return;
    }
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(optimized));
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>
          {isNew ? "สร้างบทความใหม่" : `แก้ไข: ${titleTh}`}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="w-btn w-btn-ghost" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "แก้ไข" : "Preview"}
          </button>
          <button className="w-btn w-btn-primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div style={{ ...CARD }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{titleTh}</h2>
            <ArticleBody body={bodyTh || bodyEn} />
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left column — metadata */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>ข้อมูลพื้นฐาน</h3>

              <div>
                <label style={labelStyle}>Slug</label>
                <input className="w-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-article-slug" disabled={!isNew} />
                {!isNew && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Slug แก้ไขไม่ได้หลังสร้าง</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>ชื่อ (TH)</label>
                  <input className="w-input" value={titleTh} onChange={(e) => setTitleTh(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Title (EN)</label>
                  <input className="w-input" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>คำอธิบาย (TH)</label>
                  <textarea className="w-textarea" rows={2} value={excerptTh} onChange={(e) => setExcerptTh(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Excerpt (EN)</label>
                  <textarea className="w-textarea" rows={2} value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>หมวดหมู่</label>
                  <select className="w-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">— ไม่มี —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.labelTh} / {c.labelEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>สถานะ</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginTop: 8 }}>
                    <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                    Published
                  </label>
                </div>
              </div>

              {/* Tone + Tags */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Tone (สีประจำบทความ)</label>
                  <select className="w-input" value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option value="peach">Peach 🍑</option>
                    <option value="lavender">Lavender 💜</option>
                    <option value="mint">Mint 🌿</option>
                    <option value="yellow">Yellow 🌻</option>
                    <option value="blue">Blue 💧</option>
                    <option value="purple">Purple ✨</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tags (คั่นด้วย comma)</label>
                  <input className="w-input" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="สุขภาพจิต, ดูแลตัวเอง, CBT" />
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label style={labelStyle}>รูปปก</label>
                {coverPreview && (
                  <img src={coverPreview} alt="Cover preview" style={{ width: "100%", borderRadius: 12, marginBottom: 8, maxHeight: 200, objectFit: "cover" }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
                  disabled={!savedId}
                />
                {!savedId && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>บันทึกก่อนอัปโหลดรูปปก</span>}
              </div>
            </div>
          </div>

          {/* Right column — body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>เนื้อหา (Markdown)</h3>
              <div>
                <label style={labelStyle}>เนื้อหา (TH)</label>
                <textarea
                  className="w-textarea"
                  rows={16}
                  value={bodyTh}
                  onChange={(e) => setBodyTh(e.target.value)}
                  placeholder="เขียน Markdown ที่นี่..."
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Body (EN)</label>
                <textarea
                  className="w-textarea"
                  rows={16}
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  placeholder="Write Markdown here..."
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--ink-3)",
  marginBottom: 4,
};
