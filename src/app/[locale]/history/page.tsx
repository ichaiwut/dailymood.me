import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export const runtime = "edge";

export default async function HistoryPage() {
  const locale = await getLocale();
  redirect({ href: "/calendar", locale });
}
