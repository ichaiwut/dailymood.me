import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { ArticleReactionsShell } from "@/components/article-reactions-shell";

export default async function ArticleReactionsPage() {
  const { userId } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <ArticleReactionsShell />;
}
