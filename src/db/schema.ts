import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  passwordHash: text("password_hash"), // null for OAuth-only users
  image: text("image"),
  locale: text("locale").default("en"),
  isPremium: integer("is_premium", { mode: "boolean" }).notNull().default(false),
  // selected mood-icon pack (free: only DEFAULT_MOOD_PACK; premium: any from MOOD_PACKS)
  moodPack: text("mood_pack").notNull().default("set_486038"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(), // email
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
  type: text("type", { enum: ["email_verify", "password_reset"] }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.identifier, t.token] }),
  identifierTypeIdx: index("verification_tokens_identifier_type_idx").on(t.identifier, t.type),
}));

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const moodTypes = sqliteTable("mood_types", {
  id: text("id").primaryKey(),
  // userId NULL = system default; non-null = custom (premium only)
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  label: text("label").notNull(),
  labelTh: text("label_th"),
  color: text("color").notNull(),
  order: integer("order").notNull().default(0),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
}, (t) => ({
  userIdx: index("mood_types_user_idx").on(t.userId),
}));

export const moodEntries = sqliteTable("mood_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moodTypeId: text("mood_type_id").notNull().references(() => moodTypes.id),
  note: text("note"),
  imageKey: text("image_key"), // R2 object key; null if no image
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  sentiment: real("sentiment"), // -1..1, null if not analyzed
  aiSource: text("ai_source", { enum: ["manual", "nlp", "vision", "nlp+vision"] })
    .notNull()
    .default("manual"),
  date: text("date").notNull(), // YYYY-MM-DD (local) for fast filtering
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  userDateIdx: index("mood_entries_user_date_idx").on(t.userId, t.date),
  userCreatedIdx: index("mood_entries_user_created_idx").on(t.userId, t.createdAt),
}));

// Daily AI usage counter per user (for free-tier rate limit)
export const aiUsage = sqliteTable("ai_usage", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  nlpCount: integer("nlp_count").notNull().default(0),
  visionCount: integer("vision_count").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.date] }),
}));

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(), // `${endpoint}:${ip}` (or `${endpoint}:${email}`)
  count: integer("count").notNull().default(0),
  resetAt: integer("reset_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type MoodType = typeof moodTypes.$inferSelect;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type AiUsage = typeof aiUsage.$inferSelect;
