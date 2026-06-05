import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { TopBar } from "@/components/topbar";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { GuestEntryClaim } from "@/components/guest-entry-claim";
import { TrialPromoBar } from "@/components/trial-promo-bar";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, session, locale] = await Promise.all([getMessages(), auth(), getLocale()]);
  const isLoggedIn = !!session?.user;

  let showChrome = isLoggedIn;
  let showPromo = false;
  let tier: "free" | "premium" = "free";
  if (isLoggedIn && session?.user?.id) {
    const db = getDb();
    const [u] = await db
      .select({ welcomeShownAt: users.welcomeShownAt, isPremium: users.isPremium, trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (!u?.welcomeShownAt) showChrome = false;
    const trialActive = !!u?.trialEndsAt && u.trialEndsAt.getTime() > Date.now();
    showPromo = !u?.isPremium && !trialActive;
    // Canonical tier (matches getSessionInfo): premium if stripe-active OR in active trial.
    if (u?.isPremium === true || trialActive) tier = "premium";
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <GuestEntryClaim loggedIn={isLoggedIn} />
        {showChrome ? (
          <>
            {showPromo && <TrialPromoBar locale={locale} />}
            <TopBar />
            <main className="w-container main-content" style={{ flex: 1, position: "relative", zIndex: 0 }}>
              {children}
            </main>
            <SiteFooter />
            <BottomNav tier={tier} />
          </>
        ) : (
          <>{children}</>
        )}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
