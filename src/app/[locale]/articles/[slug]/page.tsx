import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getSessionInfo } from "@/lib/tier";
import { getDb } from "@/lib/cf";
import { articles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";
import { ArticleDetailShell } from "@/components/article-detail-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const db = getDb();

  const [row] = await db
    .select({
      titleTh: articles.titleTh,
      titleEn: articles.titleEn,
      excerptTh: articles.excerptTh,
      excerptEn: articles.excerptEn,
      coverImageKey: articles.coverImageKey,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.published, true)))
    .limit(1);

  if (!row) return { title: "Article not found" };

  const title = locale === "th" ? row.titleTh : row.titleEn;
  const description = locale === "th" ? row.excerptTh : row.excerptEn;
  const coverUrl = row.coverImageKey
    ? await getSignedReadUrl(row.coverImageKey)
    : undefined;
  const canonical = `https://my.dailymood.me/${locale}/articles/${slug}`;
  const keywords = (row.tags as string[] | null)?.join(", ") || undefined;

  return {
    title: `${title} — Dailymood`,
    description,
    keywords,
    authors: [{ name: "Dailymood" }],
    publisher: "Dailymood",
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: "Dailymood",
      locale: locale === "th" ? "th_TH" : "en_US",
      ...(row.publishedAt && { publishedTime: new Date(row.publishedAt).toISOString() }),
      ...(coverUrl && { images: [{ url: coverUrl, width: 1600, height: 873 }] }),
    },
    twitter: {
      card: coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(coverUrl && { images: [coverUrl] }),
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await getSessionInfo();
  const { slug } = await params;
  return <ArticleDetailShell slug={slug} isGuest={!userId} />;
}
