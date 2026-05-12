import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { StatsShell } from "@/components/stats-shell";


export default async function StatsPage() {
  const { userId, tier, moodPack, iconFormat } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <StatsShell tier={tier} moodPack={moodPack} iconFormat={iconFormat} />;
}
