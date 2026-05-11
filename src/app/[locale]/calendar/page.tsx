import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { CalendarShell } from "@/components/calendar-shell";

export const runtime = "edge";

export default async function CalendarPage() {
  const locale = await getLocale();
  const { userId, tier, moodPack, iconFormat } = await getSessionInfo();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <CalendarShell tier={tier} pack={moodPack} iconFormat={iconFormat} />
      </div>
    </main>
  );
}
