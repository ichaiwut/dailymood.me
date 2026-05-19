"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Article {
  id: string;
  slug: string;
  titleTh: string;
  titleEn: string;
  categoryId: string | null;
  published: boolean;
  publishedAt: string | null;
  readingTimeMinutes: number;
  createdAt: string;
}

interface Category {
  id: string;
  labelTh: string;
  labelEn: string;
}

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  border: "1.5px solid var(--hairline)",
  borderRadius: 16,
  padding: 24,
};

export function AdminArticlesShell() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [artRes, catRes] = await Promise.all([
      fetch("/api/admin/articles"),
      fetch("/api/admin/article-categories"),
    ]);
    const artData = (await artRes.json()) as { articles?: Article[] };
    const catData = (await catRes.json()) as { categories?: Category[] };
    return { articles: artData.articles ?? [], categories: catData.categories ?? [] };
  }, []);

  useEffect(() => {
    fetchAll().then(({ articles: a, categories: c }) => {
      setArticles(a);
      setCategories(c);
      setLoading(false);
    });
  }, [fetchAll]);

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    const { articles: a } = await fetchAll();
    setArticles(a);
  }

  async function remove(id: string) {
    if (!confirm("ลบบทความนี้?")) return;
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    const { articles: a } = await fetchAll();
    setArticles(a);
  }

  const catMap = new Map(categories.map((c) => [c.id, c]));

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>บทความ ({articles.length})</h1>
        <Link href="/admin/articles/new" className="w-btn w-btn-primary" style={{ textDecoration: "none" }}>
          + สร้างบทความ
        </Link>
      </div>

      <div style={{ ...CARD }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline)", textAlign: "left" }}>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>ชื่อบทความ</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>หมวดหมู่</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>สถานะ</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>อ่าน</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>สร้าง</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => {
              const cat = a.categoryId ? catMap.get(a.categoryId) : null;
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <Link href={`/admin/articles/${a.id}`} style={{ color: "var(--purple)", fontWeight: 600 }}>
                      {a.titleTh}
                    </Link>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{a.slug}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>{cat?.labelTh ?? "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background: a.published ? "#C6F6D5" : "var(--surface-2)",
                      color: a.published ? "#22543D" : "var(--ink-3)",
                    }}>
                      {a.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>{a.readingTimeMinutes} min</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--ink-3)" }}>
                    {new Date(a.createdAt).toLocaleDateString("th-TH")}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="w-btn w-btn-ghost" onClick={() => togglePublish(a.id, a.published)} style={{ height: 30, fontSize: 12 }}>
                        {a.published ? "Unpublish" : "Publish"}
                      </button>
                      <button className="w-btn w-btn-ghost" onClick={() => remove(a.id)} style={{ height: 30, fontSize: 12, color: "#e53e3e" }}>
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {articles.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--ink-3)", padding: 32 }}>ยังไม่มีบทความ</p>
        )}
      </div>
    </div>
  );
}
