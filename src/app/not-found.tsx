import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { NotFoundPage } from "@/components/not-found-page";

export default async function RootNotFound() {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotFoundPage />
    </NextIntlClientProvider>
  );
}
