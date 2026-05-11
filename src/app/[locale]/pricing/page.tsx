import { getLocale } from "next-intl/server";
import { getSessionInfo } from "@/lib/tier";
import { PricingShell } from "@/components/pricing-shell";


export default async function PricingPage() {
  const { tier } = await getSessionInfo();
  const locale = await getLocale();

  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <PricingShell tier={tier} />
      </div>
    </main>
  );
}
