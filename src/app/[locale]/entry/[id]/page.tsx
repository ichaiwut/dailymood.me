import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { EntryDetail } from "@/components/entry-detail";

export const runtime = "edge";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const locale = await getLocale();
  const { userId, moodPack, iconFormat } = await getSessionInfo();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  const { id } = await params;

  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <EntryDetail id={id} pack={moodPack} iconFormat={iconFormat} />
      </div>
    </main>
  );
}
