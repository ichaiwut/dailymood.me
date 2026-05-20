import { getSessionInfo } from "@/lib/tier";
import { ArticleDetailShell } from "@/components/article-detail-shell";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await getSessionInfo();
  const { slug } = await params;
  return <ArticleDetailShell slug={slug} isGuest={!userId} />;
}
