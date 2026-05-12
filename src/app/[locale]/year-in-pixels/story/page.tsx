import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { YearStoryShell } from "@/components/year-story-shell";

export default async function YearStoryPage() {
  const locale = await getLocale();
  const { userId, tier, moodPack, iconFormat } = await getSessionInfo();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <YearStoryShell tier={tier} pack={moodPack} iconFormat={iconFormat} />;
}
