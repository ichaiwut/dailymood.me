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
}

export async function getSessionInfo(): Promise<SessionInfo> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { userId: null, tier: "guest", moodPack: DEFAULT_MOOD_PACK, iconFormat: "svg", hidePreview: false };

  const db = getDb();
  const [row] = await db
    .select({ isPremium: users.isPremium, moodPack: users.moodPack, hidePreview: users.hidePreview })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const tier: Tier = row?.isPremium ? "premium" : "free";
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

  return { userId, tier, moodPack: pack, iconFormat, hidePreview: !!row?.hidePreview };
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
