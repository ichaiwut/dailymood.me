import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { InsightsShell } from "@/components/insights-shell";


export default async function InsightsPage() {
  const { userId, tier } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <InsightsShell tier={tier} />;
}
