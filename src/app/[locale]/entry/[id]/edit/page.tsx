import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { EditEntryShell } from "@/components/edit-entry-shell";


export default async function EditEntryPage({
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

  return <EditEntryShell id={id} pack={moodPack} iconFormat={iconFormat} />;
}
