import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";


export default async function HistoryPage() {
  const locale = await getLocale();
  redirect({ href: "/calendar", locale });
}
