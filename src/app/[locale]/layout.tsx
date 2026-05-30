import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { auth } from "@/lib/auth";
import { TopBar } from "@/components/topbar";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { GuestEntryClaim } from "@/components/guest-entry-claim";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, session] = await Promise.all([getMessages(), auth()]);
  const isLoggedIn = !!session?.user;

  let showChrome = isLoggedIn;
  if (isLoggedIn && session?.user?.id) {
    const db = getDb();
    const [u] = await db.select({ welcomeShownAt: users.welcomeShownAt }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!u?.welcomeShownAt) showChrome = false;
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <GuestEntryClaim loggedIn={isLoggedIn} />
        {showChrome ? (
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
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
