import { auth } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { users, moodPacks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_MOOD_PACK, isValidPack } from "@/lib/moods";

export type Tier = "guest" | "free" | "premium";

export interface SessionInfo {
  userId: string | null;
  tier: Tier;
  moodPack: string;
  iconFormat: string;
  hidePreview: boolean;
  isTrialing: boolean;
  trialDaysLeft: number | null;
  trialWarning: boolean;
  trialActivatedAt: Date | null;
}

const GUEST_SESSION: SessionInfo = {
  userId: null, tier: "guest", moodPack: DEFAULT_MOOD_PACK, iconFormat: "svg",
  hidePreview: false, isTrialing: false, trialDaysLeft: null, trialWarning: false, trialActivatedAt: null,
};

export async function getSessionInfo(): Promise<SessionInfo> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return GUEST_SESSION;

  const db = getDb();
  const [row] = await db
    .select({
      isPremium: users.isPremium,
      moodPack: users.moodPack,
      hidePreview: users.hidePreview,
      stripeSubscriptionId: users.stripeSubscriptionId,
      trialActivatedAt: users.trialActivatedAt,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const now = new Date();
  const stripeActive = row?.isPremium === true;
  const inAppTrialActive = !!row?.trialEndsAt && row.trialEndsAt.getTime() > now.getTime();
  const effectivePremium = stripeActive || inAppTrialActive;

  let isTrialing = false;
  let trialDaysLeft: number | null = null;
  let trialWarning = false;

  if (inAppTrialActive && !stripeActive) {
    isTrialing = true;
    const msLeft = row!.trialEndsAt!.getTime() - now.getTime();
    trialDaysLeft = Math.max(1, Math.ceil(msLeft / 86_400_000));
    trialWarning = trialDaysLeft <= 3;
  }

  const tier: Tier = effectivePremium ? "premium" : "free";
  let pack = DEFAULT_MOOD_PACK;
  let iconFormat = "svg";

  if (row?.moodPack && isValidPack(row.moodPack) && row.moodPack !== DEFAULT_MOOD_PACK) {
    const [packRow] = await db
      .select({ iconFormat: moodPacks.iconFormat, premium: moodPacks.premium })
      .from(moodPacks)
      .where(eq(moodPacks.id, row.moodPack))
      .limit(1);
    if (packRow && (!packRow.premium || tier === "premium")) {
      pack = row.moodPack;
      if (packRow.iconFormat) iconFormat = packRow.iconFormat;
    }
  }

  return {
    userId, tier, moodPack: pack, iconFormat, hidePreview: !!row?.hidePreview,
    isTrialing, trialDaysLeft, trialWarning, trialActivatedAt: row?.trialActivatedAt ?? null,
  };
}

export class TierError extends Error {
  constructor(public requiredTier: Tier, public currentTier: Tier) {
    super(`Requires ${requiredTier} tier, current: ${currentTier}`);
  }
}

const ORDER: Record<Tier, number> = { guest: 0, free: 1, premium: 2 };

export function meetsTier(current: Tier, min: Tier): boolean {
  return ORDER[current] >= ORDER[min];
}

export function requireTier(current: Tier, min: Tier): void {
  if (!meetsTier(current, min)) throw new TierError(min, current);
}
