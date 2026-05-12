import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { ProfileSettingsShell } from "@/components/profile-settings-shell";


export default async function ProfileSettingsPage() {
  const { userId, tier } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <ProfileSettingsShell isPremium={tier === "premium"} />;
}
