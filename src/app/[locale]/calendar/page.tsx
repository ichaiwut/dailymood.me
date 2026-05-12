import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { CalendarShell } from "@/components/calendar-shell";


export default async function CalendarPage() {
  const locale = await getLocale();
  const { userId, tier, moodPack, iconFormat } = await getSessionInfo();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <CalendarShell tier={tier} pack={moodPack} iconFormat={iconFormat} />;
}
