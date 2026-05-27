import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WelcomeNewUserShell } from "@/components/welcome-new-user-shell";

export default async function WelcomePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const db = getDb();
  const [user] = await db
    .select({
      name: users.name,
      welcomeShownAt: users.welcomeShownAt,
      trialActivatedAt: users.trialActivatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.welcomeShownAt) redirect("/");

  const firstName = user?.name?.split(" ")[0]?.slice(0, 14) || null;
  const hasUsedTrial = user?.trialActivatedAt !== null;

  return <WelcomeNewUserShell firstName={firstName} hasUsedTrial={hasUsedTrial} />;
}
