import { getLocale } from "next-intl/server";
import { getSessionInfo } from "@/lib/tier";
import { PricingShell } from "@/components/pricing-shell";


export default async function PricingPage() {
  const { tier, trialActivatedAt } = await getSessionInfo();
  const locale = await getLocale();

  return <PricingShell tier={tier} hasUsedTrial={trialActivatedAt !== null} />;
}
