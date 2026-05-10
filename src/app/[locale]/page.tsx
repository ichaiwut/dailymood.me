import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { HomeShell } from "@/components/home-shell";

export const runtime = "edge";

export default async function Home() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const { tier, moodPack, hidePreview } = await getSessionInfo();

  return (
    <main className="flex-1 px-5 pb-16">
      <div className="mx-auto w-full max-w-[768px]">
        <HomeShell tier={tier} pack={moodPack} hidePreview={hidePreview} />
      </div>
    </main>
  );
}
