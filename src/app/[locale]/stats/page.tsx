import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { StatsShell } from "@/components/stats-shell";

export const runtime = "edge";

export default async function StatsPage() {
  const { userId, tier } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <StatsShell tier={tier} />
      </div>
    </main>
  );
}
