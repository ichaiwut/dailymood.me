import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { EntryDetail } from "@/components/entry-detail";


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

  return <EntryDetail id={id} pack={moodPack} iconFormat={iconFormat} />;
}
