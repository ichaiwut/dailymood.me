import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { TopBar } from "@/components/topbar";
import { BottomNav } from "@/components/bottom-nav";

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <TopBar />
      {children}
      <BottomNav />
    </NextIntlClientProvider>
  );
}
