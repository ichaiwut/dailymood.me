import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { EditEntryShell } from "@/components/edit-entry-shell";

export const runtime = "edge";

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

  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <EditEntryShell id={id} pack={moodPack} iconFormat={iconFormat} />
      </div>
    </main>
  );
}
