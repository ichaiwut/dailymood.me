import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { AskAiShell } from "@/components/ask-ai-shell";

export default async function AskAiPage() {
  const { userId, tier } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <AskAiShell tier={tier} />;
}
