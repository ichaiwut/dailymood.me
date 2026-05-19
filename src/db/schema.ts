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
  bio: text("bio"),
  accentColor: text("accent_color"),
  hidePreview: boolean("hide_preview").notNull().default(false),
  anonymousInsights: boolean("anonymous_insights").notNull().default(true),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderTime: text("reminder_time").notNull().default("21:00"),
  reminderDays: text("reminder_days").notNull().default("1,2,3,4,5"),
  aiCoachEnabled: boolean("ai_coach_enabled").notNull().default(false),
  weeklyDigestEnabled: boolean("weekly_digest_enabled").notNull().default(false),
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

export type User = typeof users.$inferSelect;
export type MoodType = typeof moodTypes.$inferSelect;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type AiUsage = typeof aiUsage.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type ArticleCategory = typeof articleCategories.$inferSelect;
export type ArticleBookmark = typeof articleBookmarks.$inferSelect;
