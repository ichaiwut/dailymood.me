type GtagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

export function trackEvent({ action, category, label, value }: GtagEvent) {
  gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ── Page views ──

export function trackPageView(path: string) {
  gtag("event", "page_view", { page_path: path });
}

// ── Auth ──

export function trackSignUp(method: "google" | "email") {
  gtag("event", "sign_up", { method });
}

export function trackLogin(method: "google" | "email") {
  gtag("event", "login", { method });
}

// ── Mood logging ──

export function trackMoodLog(source: "quick" | "smart_log" | "edit") {
  trackEvent({ action: "mood_log", category: "engagement", label: source });
}

export function trackAiAnalyze(type: "nlp" | "vision") {
  trackEvent({ action: "ai_analyze", category: "engagement", label: type });
}

export function trackVoiceInput() {
  trackEvent({ action: "voice_input", category: "engagement" });
}

// ── Feature usage ──

export function trackFeatureUse(feature: string) {
  trackEvent({ action: "feature_use", category: "engagement", label: feature });
}

export function trackCalendarView(view: "calendar" | "timeline") {
  trackEvent({ action: "calendar_view", category: "engagement", label: view });
}

export function trackInsightsView() {
  trackEvent({ action: "insights_view", category: "engagement" });
}

export function trackStatsView(period: string) {
  trackEvent({ action: "stats_view", category: "engagement", label: period });
}

export function trackShareInsight() {
  trackEvent({ action: "share_insight", category: "engagement" });
}

export function trackExportData() {
  trackEvent({ action: "export_data", category: "engagement" });
}

// ── Conversion funnel ──

export function trackPricingView() {
  trackEvent({ action: "pricing_view", category: "conversion" });
}

export function trackPlanSelect(plan: "monthly" | "yearly") {
  trackEvent({ action: "plan_select", category: "conversion", label: plan });
}

export function trackCheckoutStart(plan: "monthly" | "yearly") {
  trackEvent({ action: "begin_checkout", category: "conversion", label: plan });
}

export function trackCheckoutSuccess() {
  gtag("event", "purchase", { currency: "THB", value: 0 });
  trackEvent({ action: "checkout_success", category: "conversion" });
}

export function trackUpgradeClick(source: string) {
  trackEvent({ action: "upgrade_click", category: "conversion", label: source });
}

// ── Entry actions ──

export function trackEntryDelete() {
  trackEvent({ action: "entry_delete", category: "engagement" });
}

// ── Ask AI ──

export function trackAskAiMessage() {
  trackEvent({ action: "ask_ai_message", category: "engagement" });
}

// ── Conversion funnel (continued) ──

export function trackCheckoutCancelled() {
  trackEvent({ action: "checkout_cancelled", category: "conversion" });
}

// ── Premium gating ──

export function trackPremiumGate(feature: string) {
  trackEvent({ action: "premium_gate_hit", category: "conversion", label: feature });
}
