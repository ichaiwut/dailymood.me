import { auth } from "@/lib/auth";
import { getSessionInfo } from "@/lib/tier";
import { Link } from "@/i18n/navigation";
import { TopBarClient } from "./topbar-client";
import { BrandMark } from "./brand-mark";
import { TrialBanner } from "./trial-banner";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";

export async function TopBar() {
  const session = await auth();
  const { moodPack, iconFormat } = await getSessionInfo();

  let avatarUrl: string | null = session?.user?.image ?? null;
  let trialBannerMode: "countdown" | "none" = "none";
  let trialDaysLeft = 0;
  let trialWarning = false;
  let tier: "free" | "premium" = "free";

  if (session?.user?.id) {
    try {
      const db = getDb();
      const [row] = await db
        .select({ imageKey: users.imageKey, image: users.image, trialActivatedAt: users.trialActivatedAt, trialEndsAt: users.trialEndsAt, stripeSubscriptionId: users.stripeSubscriptionId, isPremium: users.isPremium })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      if (row?.imageKey) {
        avatarUrl = await getSignedReadUrl(row.imageKey);
      } else if (row?.image) {
        avatarUrl = row.image;
      }

      // Canonical tier (matches getSessionInfo): premium if stripe-active OR in active trial.
      const inAppTrialActive = !!row?.trialEndsAt && row.trialEndsAt.getTime() > Date.now();
      if (row?.isPremium === true || inAppTrialActive) tier = "premium";

      const stripeActive = row?.isPremium === true && !!row?.stripeSubscriptionId;
      // Only the countdown (active-trial) banner lives here now. The trial OFFER
      // is the dismissible TrialPromoBar in the layout (with one-click activate),
      // so we no longer render an "activate" banner here — it double-stacked.
      if (!stripeActive && row?.trialEndsAt && row.trialEndsAt.getTime() > Date.now()) {
        const msLeft = row.trialEndsAt.getTime() - Date.now();
        trialBannerMode = "countdown";
        trialDaysLeft = Math.max(1, Math.ceil(msLeft / 86_400_000));
        trialWarning = trialDaysLeft <= 3;
      }
    } catch {
      // fall back to session image
    }
  }

  return (
    <>
      {session?.user ? (
        <>
          {trialBannerMode === "countdown" && (
            <TrialBanner mode="countdown" daysLeft={trialDaysLeft} isWarning={trialWarning} />
          )}
          <TopBarClient
            name={session.user.name ?? null}
            image={avatarUrl}
            email={session.user.email ?? null}
            tier={tier}
            moodPack={moodPack}
            iconFormat={iconFormat}
          />
        </>
      ) : (
        <header className="w-topbar">
          <div className="w-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <DMLogo />
            <Link
              href="/login"
              className="w-btn w-btn-primary"
              style={{ height: 36 }}
            >
              Sign in
            </Link>
          </div>
        </header>
      )}
    </>
  );
}

function DMLogo() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "var(--ink)" }}>
      <BrandMark size={28} />
      <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>DailyMood</span>
    </span>
  );
}
