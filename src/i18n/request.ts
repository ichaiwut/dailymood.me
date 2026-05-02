import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const messages: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("../../messages/en.json") as Promise<{ default: Record<string, unknown> }>,
  th: () => import("../../messages/th.json") as Promise<{ default: Record<string, unknown> }>,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "th")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await messages[locale]()).default,
  };
});
