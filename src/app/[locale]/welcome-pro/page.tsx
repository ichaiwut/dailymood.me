import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/tier";
import { WelcomeProShell } from "@/components/welcome-pro-shell";

export default async function WelcomeProPage() {
  const { userId, tier, isTrialing } = await getSessionInfo();
  if (!userId) redirect("/login");
  if (tier !== "premium") redirect("/");

  return <WelcomeProShell source={isTrialing ? "trial" : "stripe"} />;
}
