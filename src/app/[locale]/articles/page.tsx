import { getSessionInfo } from "@/lib/tier";
import { ArticlesShell } from "@/components/articles-shell";

export default async function ArticlesPage() {
  const { userId } = await getSessionInfo();
  return <ArticlesShell isGuest={!userId} />;
}
