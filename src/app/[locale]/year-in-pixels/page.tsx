import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { YearInPixelsShell } from "@/components/year-in-pixels-shell";

export default async function YearInPixelsPage() {
  const locale = await getLocale();
  const { userId, tier, moodPack, iconFormat } = await getSessionInfo();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <YearInPixelsShell tier={tier} pack={moodPack} iconFormat={iconFormat} />;
}
