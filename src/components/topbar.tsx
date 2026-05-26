import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { TopBarClient } from "./topbar-client";
import { TrialBanner } from "./trial-banner";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSignedReadUrl } from "@/lib/r2";

export async function TopBar() {
  const session = await auth();

  let avatarUrl: string | null = session?.user?.image ?? null;
  let trialBannerMode: "activate" | "countdown" | "none" = "none";
  let trialDaysLeft = 0;
  let trialWarning = false;

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

      const stripeActive = row?.isPremium === true && !!row?.stripeSubscriptionId;
      if (!stripeActive && !row?.isPremium) {
        if (!row?.trialActivatedAt) {
          trialBannerMode = "activate";
        } else if (row?.trialEndsAt) {
          const msLeft = row.trialEndsAt.getTime() - Date.now();
          if (msLeft > 0) {
            trialBannerMode = "countdown";
            trialDaysLeft = Math.max(1, Math.ceil(msLeft / 86_400_000));
            trialWarning = trialDaysLeft <= 3;
          }
        }
      }
    } catch {
      // fall back to session image
    }
  }

  return (
    <>
      {session?.user ? (
        <>
          {trialBannerMode === "activate" && (
            <TrialBanner mode="activate" />
          )}
          {trialBannerMode === "countdown" && (
            <TrialBanner mode="countdown" daysLeft={trialDaysLeft} isWarning={trialWarning} />
          )}
          <TopBarClient
            name={session.user.name ?? null}
            image={avatarUrl}
            email={session.user.email ?? null}
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
      <svg width={26} height={26} viewBox="0 0 32 32">
        <defs>
          <linearGradient id="dmlg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FCA45B" /><stop offset=".5" stopColor="#FBA0A0" /><stop offset="1" stopColor="#A673F1" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#dmlg)" />
        <circle cx="12" cy="14" r="1.6" fill="#1A1320" />
        <circle cx="20" cy="14" r="1.6" fill="#1A1320" />
        <path d="M 11 20 Q 16 24 21 20" stroke="#1A1320" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em" }}>DailyMood</span>
    </span>
  );
}
