import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { HomeShell } from "@/components/home-shell";


export default async function Home() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const { tier, moodPack, iconFormat, hidePreview } = await getSessionInfo();

  return (
    <HomeShell tier={tier} pack={moodPack} iconFormat={iconFormat} hidePreview={hidePreview} />
  );
}
