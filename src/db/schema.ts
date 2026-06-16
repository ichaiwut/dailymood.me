import { pgTable, text, integer, real, primaryKey, index, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  passwordHash: text("password_hash"),
  image: text("image"),
  imageKey: text("image_key"),
  locale: text("locale").default("en"),
  isPremium: boolean("is_premium").notNull().default(false),
  moodPack: text("mood_pack").notNull().default("set_486038"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  planInterval: text("plan_interval"),
  subscriptionStatus: text("subscription_status"),
  // Which channel granted the active premium: "stripe" (web), "iap" (App Store /
  // Play via RevenueCat), or null (legacy/comped/admin-granted). The IAP reconcile +
  // webhook only ever downgrade users whose source is "iap" — so a RevenueCat call
  // that finds no entitlement can never strip premium from a Stripe or comped user.
  premiumSource: text("premium_source"),
  // For IAP-granted premium only: which store the subscription lives in, so the app
  // can deep-link "manage/cancel" to the right place ("apple" | "google" | null).
  iapStore: text("iap_store"),
  trialActivatedAt: timestamp("trial_activated_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  welcomeShownAt: timestamp("welcome_shown_at"),
  marketingOptOut: boolean("marketing_opt_out").notNull().default(false),
  trialPromoSentAt: timestamp("trial_promo_sent_at"),
  bio: text("bio"),
  accentColor: text("accent_color"),
  hidePreview: boolean("hide_preview").notNull().default(false),
  anonymousInsights: boolean("anonymous_insights").notNull().default(true),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderTime: text("reminder_time").notNull().default("21:00"),
  reminderDays: text("reminder_days").notNull().default("1,2,3,4,5"),
  aiCoachEnabled: boolean("ai_coach_enabled").notNull().default(false),
  weeklyDigestEnabled: boolean("weekly_digest_enabled").notNull().default(false),
  // Idempotency guards for the daily/weekly email cron jobs — prevent duplicate
  // sends if the scheduler fires a job more than once per period (double tick,
  // retry, or a future second instance).
  lastAiCoachSentAt: text("last_ai_coach_sent_at"), // ICT date "YYYY-MM-DD" of last AI-coach email
  lastDigestWeekKey: text("last_digest_week_key"),  // isoWeekKey of last weekly digest sent
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  type: text("type", { enum: ["email_verify", "password_reset"] }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.identifier, t.token] }),
  identifierTypeIdx: index("verification_tokens_identifier_type_idx").on(t.identifier, t.type),
}));

export const accounts = pgTable("accounts", {
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

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

// Long-lived refresh tokens for the native mobile app (Bearer auth). The web uses
// NextAuth session cookies; mobile clients can't, so they hold an access JWT
// (short-lived, stateless) + a refresh token stored here. We keep only the SHA-256
// hash of the raw token. Rotation: each refresh revokes the old row and issues a
// new one; replaying a revoked row signals theft, so we revoke the whole user's set.
export const mobileRefreshTokens = pgTable("mobile_refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  device: text("device"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
}, (t) => ({
  userIdx: index("mobile_refresh_tokens_user_idx").on(t.userId),
}));

// Expo push notification tokens — one row per device install. `token` is unique:
// re-registering the same device (e.g. after logging in as a different user) moves
// the row to the new user. Deleted on logout (DELETE /api/notifications/register)
// or pruned when Expo reports DeviceNotRegistered.
export const deviceTokens = pgTable("device_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: text("platform"), // "ios" | "android"
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  lastUsedAt: timestamp("last_used_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  userIdx: index("device_tokens_user_idx").on(t.userId),
}));

export const moodTypes = pgTable("mood_types", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  label: text("label").notNull(),
  labelTh: text("label_th"),
  color: text("color").notNull(),
  order: integer("order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  iconKey: text("icon_key"),
}, (t) => ({
  userIdx: index("mood_types_user_idx").on(t.userId),
}));

export const moodEntries = pgTable("mood_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moodTypeId: text("mood_type_id").notNull().references(() => moodTypes.id),
  note: text("note"),
  imageKey: text("image_key"),
  tags: jsonb("tags").$type<string[]>().default([]),
  sentiment: real("sentiment"),
  aiSummary: text("ai_summary"),
  aiSource: text("ai_source").notNull().default("manual"),
  activityId: text("activity_id").references(() => activities.id),
  location: text("location"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  userDateIdx: index("mood_entries_user_date_idx").on(t.userId, t.date),
  userCreatedIdx: index("mood_entries_user_created_idx").on(t.userId, t.createdAt),
}));

export const aiUsage = pgTable("ai_usage", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  nlpCount: integer("nlp_count").notNull().default(0),
  visionCount: integer("vision_count").notNull().default(0),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  estimatedCostThb: real("estimated_cost_thb").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.date] }),
}));

export const calendarAiCache = pgTable("calendar_ai_cache", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  yearMonth: text("year_month").notNull(),
  result: jsonb("result").$type<CalendarAiResult>().notNull(),
  entryCount: integer("entry_count").notNull().default(0),
  generatedAt: timestamp("generated_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.yearMonth] }),
}));

export const insightsAiCache = pgTable("insights_ai_cache", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekKey: text("week_key").notNull(),
  result: jsonb("result").$type<InsightsAiResult>().notNull(),
  entryCount: integer("entry_count").notNull().default(0),
  generatedAt: timestamp("generated_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.weekKey] }),
}));

export const suggestionFeedback = pgTable("suggestion_feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekKey: text("week_key").notNull(),
  suggestionTitle: text("suggestion_title").notNull(),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  userWeekIdx: index("suggestion_feedback_user_week_idx").on(t.userId, t.weekKey),
}));

export const feedbacks = pgTable("feedbacks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  type: text("type"),
  rating: integer("rating"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const userAchievements = pgTable("user_achievements", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.badgeId] }),
}));

export const moodPacks = pgTable("mood_packs", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  premium: boolean("premium").notNull().default(false),
  iconFormat: text("icon_format").notNull().default("svg"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
});

// Guest mood analyses from the public landing page. A guest analyzes their mood
// without an account; the result is parked here keyed by an opaque token. After
// they log in, the token is redeemed (see /api/guest/claim) to create their first
// real mood_entries row, then the row is marked claimed. Rows are short-lived.
export const guestEntries = pgTable("guest_entries", {
  token: text("token").primaryKey(),
  moodTypeId: text("mood_type_id").notNull(),
  note: text("note"),
  tags: jsonb("tags").$type<string[]>().default([]),
  sentiment: real("sentiment"),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  expiresAt: timestamp("expires_at").notNull(),
  claimedAt: timestamp("claimed_at"),
});

export const yearAiCache = pgTable("year_ai_cache", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  year: text("year").notNull(),
  result: jsonb("result").$type<YearAiResult>().notNull(),
  entryCount: integer("entry_count").notNull().default(0),
  generatedAt: timestamp("generated_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.year] }),
}));

export const forecastCache = pgTable("forecast_cache", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetDate: text("target_date").notNull(),
  result: jsonb("result").$type<ForecastResult>().notNull(),
  inputHash: text("input_hash").notNull(),
  generatedAt: timestamp("generated_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.targetDate] }),
}));

export interface ForecastResult {
  predictedMood: string;
  confidence: number;
  reasoning: string;
  factors: { direction: "+" | "-"; label: string }[];
  miniTrend: number[];
}

export interface YearAiResult {
  summary: string;
  summaryShort: string;
  bestQuarter: string;
  hardestPeriod: string;
  yearTheme: string;
}

export interface InsightsAiResult {
  headline: string;
  previewHeadline: string;
  summary: string;
  patterns: {
    title: string;
    description: string;
    tag: "pattern" | "correlation" | "alert";
    miniVizData?: number[];
  }[];
  suggestion: { title: string; description: string } | null;
}

export interface CalendarAiResult {
  summary: string;
  summaryFirstSentence: string;
  highlights: {
    bestDay: { date: string; emoji: string } | null;
    hardDay: { date: string; emoji: string } | null;
    topTag: string | null;
  };
  patterns: {
    type: "best" | "recurring" | "anomaly";
    dates: string[];
    title: string;
    explanation: string;
    icon: string;
  }[];
}

export interface AskAiResult {
  answer: string;
  matchingDates: string[];
}

export const askAiThreads = pgTable("ask_ai_threads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  lastMessageAt: timestamp("last_message_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  userIdx: index("ask_ai_threads_user_idx").on(t.userId),
}));

export const askAiMessages = pgTable("ask_ai_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull().references(() => askAiThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sourcesJson: jsonb("sources_json").$type<AskAiSource[]>(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  threadIdx: index("ask_ai_messages_thread_idx").on(t.threadId),
}));

export interface AskAiSource {
  kind: "entry" | "tag" | "pattern";
  ref: string;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: AskAiSource[];
  entriesUsed: number;
}

export const articleCategories = pgTable("article_categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  labelTh: text("label_th").notNull(),
  labelEn: text("label_en").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  categoryId: text("category_id").references(() => articleCategories.id, { onDelete: "set null" }),
  titleTh: text("title_th").notNull(),
  titleEn: text("title_en").notNull(),
  excerptTh: text("excerpt_th").notNull(),
  excerptEn: text("excerpt_en").notNull(),
  bodyTh: text("body_th").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  keyTakeawayTh: text("key_takeaway_th"),
  keyTakeawayEn: text("key_takeaway_en"),
  coverImageKey: text("cover_image_key"),
  tone: text("tone").notNull().default("peach"),
  tags: jsonb("tags").$type<string[]>().default([]),
  viewCount: integer("view_count").notNull().default(0),
  readingTimeMinutes: integer("reading_time_minutes").notNull().default(3),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  slugIdx: index("articles_slug_idx").on(t.slug),
  categoryIdx: index("articles_category_idx").on(t.categoryId),
  publishedIdx: index("articles_published_idx").on(t.published, t.publishedAt),
}));

export const articleBookmarks = pgTable("article_bookmarks", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: text("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.articleId] }),
}));

// Post-read mood reaction — one row per user per article (their latest pick).
// Powers the "AI learns which content helps you" signal on article detail.
export const articleReactions = pgTable("article_reactions", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: text("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  moodTypeId: text("mood_type_id").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.articleId] }),
  articleIdx: index("article_reactions_article_idx").on(t.articleId),
}));

export const journalPromptCache = pgTable("journal_prompt_cache", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moodId: text("mood_id").notNull(),
  dateKey: text("date_key").notNull(),
  locale: text("locale").notNull(),
  prompt: text("prompt").notNull(),
  generatedAt: timestamp("generated_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.moodId, t.dateKey, t.locale] }),
}));

export const flashbackCache = pgTable("flashback_cache", {
  entryId: text("entry_id").notNull().references(() => moodEntries.id, { onDelete: "cascade" }).primaryKey(),
  result: jsonb("result").$type<{ message: string; pastDate: string; pastNote: string }>().notNull(),
  generatedAt: timestamp("generated_at").notNull().$defaultFn(() => new Date()),
});

export interface ChartAnnotation {
  dateKey: string;
  type: "anomaly_drop" | "anomaly_spike" | "best" | "worst" | "tag_correlation";
  importance: number;
  labelTh: string;
  labelEn: string;
  tagRefs: string[];
}

export interface ChartAnnotationsResult {
  annotations: ChartAnnotation[];
}

export const chartAnnotationsCache = pgTable("chart_annotations_cache", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  periodKey: text("period_key").notNull(),
  result: jsonb("result").$type<ChartAnnotationsResult>().notNull(),
  entryCount: integer("entry_count").notNull().default(0),
  generatedAt: timestamp("generated_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.periodKey] }),
}));

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  label: text("label").notNull(),
  labelTh: text("label_th"),
  order: integer("order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  userIdx: index("activities_user_idx").on(t.userId),
}));

export const personalEvents = pgTable("personal_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  labelTh: text("label_th"),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  emoji: text("emoji").notNull().default("🎉"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
}, (t) => ({
  userIdx: index("personal_events_user_idx").on(t.userId),
}));

export const holidayCache = pgTable("holiday_cache", {
  year: text("year").notNull(),
  countryCode: text("country_code").notNull().default("TH"),
  data: jsonb("data").$type<HolidayCacheEntry[]>().notNull(),
  fetchedAt: timestamp("fetched_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.year, t.countryCode] }),
}));

export interface HolidayCacheEntry {
  date: string;
  name: string;
  localName: string;
}

export interface SpecialDay {
  date: string;
  type: "holiday" | "personal";
  label: string;
  labelTh?: string;
  emoji: string;
  id?: string;
}

export type Activity = typeof activities.$inferSelect;
export type PersonalEvent = typeof personalEvents.$inferSelect;
export type User = typeof users.$inferSelect;
export type MoodType = typeof moodTypes.$inferSelect;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type MobileRefreshToken = typeof mobileRefreshTokens.$inferSelect;
export type AiUsage = typeof aiUsage.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type ArticleCategory = typeof articleCategories.$inferSelect;
export type ArticleBookmark = typeof articleBookmarks.$inferSelect;
