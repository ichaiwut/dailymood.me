import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { StatsShell } from "@/components/stats-shell";

export const runtime = "edge";

export default async function StatsPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <StatsShell />
      </div>
    </main>
  );
}
