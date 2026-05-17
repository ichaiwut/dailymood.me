import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { HomeShell } from "@/components/home-shell";
import { getDb } from "@/lib/cf";
import { moodTypes } from "@/db/schema";
import { asc, eq, isNull, or } from "drizzle-orm";


export default async function Home() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const { userId, tier, moodPack, iconFormat, hidePreview } = await getSessionInfo();

  const db = getDb();
  const allMoods = userId
    ? await db.select().from(moodTypes).where(or(isNull(moodTypes.userId), eq(moodTypes.userId, userId))).orderBy(asc(moodTypes.isDefault), asc(moodTypes.order))
    : [];
  const customMoods = allMoods.filter((m) => !m.isDefault).map((m) => ({
    id: m.id, emoji: m.emoji, label: m.label, labelTh: m.labelTh, color: m.color, iconKey: m.iconKey,
  }));

  return (
    <HomeShell tier={tier} pack={moodPack} iconFormat={iconFormat} hidePreview={hidePreview} initialCustomMoods={customMoods} />
  );
}
