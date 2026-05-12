import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { AchievementsShell } from "@/components/achievements-shell";


export default async function AchievementsPage() {
  const { userId } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <AchievementsShell />;
}
