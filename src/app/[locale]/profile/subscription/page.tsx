import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { SubscriptionShell } from "@/components/subscription-shell";


export default async function SubscriptionPage() {
  const { userId } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <SubscriptionShell />;
}
