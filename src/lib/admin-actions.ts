"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/cf";
import { users, moodEntries, feedbacks } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { requireAdminAction } from "@/lib/admin-auth";
import { deleteObject } from "@/lib/r2";

export async function togglePremium(userId: string, value: boolean) {
  await requireAdminAction();
  const db = getDb();
  await db.update(users).set({ isPremium: value }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  await requireAdminAction();
  const db = getDb();
  const images = await db
    .select({ key: moodEntries.imageKey })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), isNotNull(moodEntries.imageKey)));
  try {
    await Promise.all(images.filter((r) => r.key).map((r) => deleteObject(r.key!)));
  } catch {
    // R2 cleanup is best-effort; orphaned objects can be cleaned later
  }
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function deleteEntry(entryId: string) {
  await requireAdminAction();
  const db = getDb();
  const [entry] = await db
    .select({ imageKey: moodEntries.imageKey })
    .from(moodEntries)
    .where(eq(moodEntries.id, entryId))
    .limit(1);
  if (entry?.imageKey) await deleteObject(entry.imageKey);
  await db.delete(moodEntries).where(eq(moodEntries.id, entryId));
  revalidatePath("/admin/entries");
}

export async function deleteFeedback(feedbackId: string) {
  await requireAdminAction();
  const db = getDb();
  await db.delete(feedbacks).where(eq(feedbacks.id, feedbackId));
  revalidatePath("/admin/feedback");
}
