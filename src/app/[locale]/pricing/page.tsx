import { getLocale } from "next-intl/server";
import { getSessionInfo } from "@/lib/tier";
import { PricingShell } from "@/components/pricing-shell";


export default async function PricingPage() {
  const { tier } = await getSessionInfo();
  const locale = await getLocale();

  return <PricingShell tier={tier} />;
}
