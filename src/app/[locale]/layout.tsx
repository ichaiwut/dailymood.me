import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { auth } from "@/lib/auth";
import { TopBar } from "@/components/topbar";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, session] = await Promise.all([getMessages(), auth()]);
  const isLoggedIn = !!session?.user;

  return (
    <NextIntlClientProvider messages={messages}>
      {isLoggedIn ? (
        <>
          <TopBar />
          <main className="w-container main-content" style={{ flex: 1, position: "relative", zIndex: 0 }}>
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
        </>
      ) : (
        <>{children}</>
      )}
    </NextIntlClientProvider>
  );
}
